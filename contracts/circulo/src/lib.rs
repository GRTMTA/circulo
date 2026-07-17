#![no_std]

use soroban_sdk::{contract, contractevent, contractimpl, symbol_short, Address, Env, Symbol, Vec};

// Import standard token client to handle Stellar stablecoins (like USDC or XLM wrapper)
use soroban_sdk::token;

/// Keeps collateral requirements and the bounded on-chain settlement loop
/// practical for an MVP while still allowing a circle to run for a year at a
/// monthly cadence.
const MAX_CYCLE_COUNT: u32 = 12;

#[contract]
pub struct CirculoContract;

/// A compact, indexable event containing the complete current dissolution vote state.
///
/// The event is emitted for proposal creation, every YES/NO vote, and successful
/// completion. A NO vote therefore creates an authoritative event with zero YES
/// votes and `active` status, allowing clients to recover from a reset without
/// reading private contract storage.
#[contractevent(data_format = "vec")]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DissolutionProgress {
    #[topic]
    pub circle_id: u128,
    pub member: Address,
    pub approve: bool,
    pub yes_votes: u32,
    pub required_votes: u32,
    pub status: Symbol,
}

#[contractimpl]
impl CirculoContract {
    fn proposed_dissolution_status(env: &Env) -> Symbol {
        Symbol::new(env, "proposed_dissolution")
    }

    fn cancelled_status(env: &Env) -> Symbol {
        Symbol::new(env, "cancelled")
    }

    fn dissolved_status(env: &Env) -> Symbol {
        Symbol::new(env, "dissolved")
    }

    fn remember_token(env: &Env, circle_id: u128, token_id: &Address) {
        let key = (symbol_short!("asset"), circle_id);
        if let Some(existing) = env.storage().instance().get::<_, Address>(&key) {
            if existing != *token_id {
                panic!("token does not match circle asset");
            }
        } else {
            env.storage().instance().set(&key, token_id);
        }
    }

    fn stored_token(env: &Env, circle_id: u128) -> Option<Address> {
        env.storage()
            .instance()
            .get(&(symbol_short!("asset"), circle_id))
    }

    /// The collateral must cover every contribution still owed after the
    /// member's first payout. With C complete rotations and N members, there
    /// are N*C total rounds; a member in first-cycle payout slot k owes
    /// `(N*C - k)` future contributions.
    fn collateral_slice(member_index: u32, total_rounds: u32, contribution: i128) -> i128 {
        (total_rounds - (member_index + 1)) as i128 * contribution
    }

    fn stored_total_rounds(env: &Env, circle_id: u128, member_count: u32) -> u32 {
        // Defaulting to one rotation keeps read-only compatibility for circles
        // created by earlier deployments. New circles always persist `rounds`.
        env.storage()
            .instance()
            .get(&(symbol_short!("rounds"), circle_id))
            .unwrap_or(member_count)
    }

    fn transfer(env: &Env, token_id: &Address, recipient: &Address, amount: i128) {
        if amount > 0 {
            token::Client::new(env, token_id).transfer(
                &env.current_contract_address(),
                recipient,
                &amount,
            );
        }
    }

    fn transfer_optional(env: &Env, token_id: &Option<Address>, recipient: &Address, amount: i128) {
        if amount > 0 {
            let token = token_id
                .clone()
                .unwrap_or_else(|| panic!("circle asset is not recorded"));
            Self::transfer(env, &token, recipient, amount);
        }
    }

    fn publish_dissolution_progress(
        env: &Env,
        circle_id: u128,
        member: Address,
        approve: bool,
        yes_votes: u32,
        required_votes: u32,
        status: Symbol,
    ) {
        DissolutionProgress {
            circle_id,
            member,
            approve,
            yes_votes,
            required_votes,
            status,
        }
        .publish(env);
    }

    /// Initializes the rotating savings circle with config parameters using a composite key
    pub fn initialize(
        env: Env,
        circle_id: u128,
        creator: Address,
        contribution_amount: i128,
        collateral_amount: i128,
        interval_seconds: u64,
        cycle_count: u32,
        members: Vec<Address>,
    ) {
        let key_creator = (symbol_short!("creator"), circle_id);
        if env.storage().instance().has(&key_creator) {
            panic!("already initialized");
        }
        if contribution_amount <= 0
            || collateral_amount <= 0
            || interval_seconds == 0
            || cycle_count == 0
            || cycle_count > MAX_CYCLE_COUNT
        {
            panic!("invalid configuration");
        }
        if members.is_empty() {
            panic!("circle must have at least one member");
        }
        let total_rounds = members
            .len()
            .checked_mul(cycle_count)
            .unwrap_or_else(|| panic!("total round count overflow"));
        let mut member_index = 0;
        while member_index < members.len() {
            let member = members.get(member_index).unwrap();
            if members.first_index_of(&member) != Some(member_index) {
                panic!("circle roster contains duplicate member");
            }
            member_index += 1;
        }
        if members.first_index_of(&creator).is_none() {
            panic!("creator must be a circle member");
        }
        creator.require_auth();

        env.storage().instance().set(&key_creator, &creator);
        env.storage()
            .instance()
            .set(&(symbol_short!("contrib"), circle_id), &contribution_amount);
        env.storage()
            .instance()
            .set(&(symbol_short!("collat"), circle_id), &collateral_amount);
        env.storage()
            .instance()
            .set(&(symbol_short!("interval"), circle_id), &interval_seconds);
        env.storage()
            .instance()
            .set(&(symbol_short!("cycles"), circle_id), &cycle_count);
        env.storage()
            .instance()
            .set(&(symbol_short!("rounds"), circle_id), &total_rounds);
        env.storage()
            .instance()
            .set(&(symbol_short!("members"), circle_id), &members);
        env.storage().instance().set(
            &(symbol_short!("status"), circle_id),
            &symbol_short!("draft"),
        );
    }

    /// Returns the current circle state (e.g. 'draft', 'active')
    pub fn status(env: Env, circle_id: u128) -> Symbol {
        env.storage()
            .instance()
            .get(&(symbol_short!("status"), circle_id))
            .unwrap_or(symbol_short!("draft"))
    }

    /// Activates the rotating savings circle (only executable by creator).
    /// Sets the round counter to 1 so contributions and payouts are tracked
    /// per round on-chain.
    pub fn activate(env: Env, circle_id: u128, admin: Address) {
        let key_creator = (symbol_short!("creator"), circle_id);
        let creator: Address = env.storage().instance().get(&key_creator).unwrap();
        admin.require_auth();

        if admin != creator {
            panic!("only creator can activate");
        }

        let status: Symbol = env
            .storage()
            .instance()
            .get(&(symbol_short!("status"), circle_id))
            .unwrap_or(symbol_short!("draft"));
        if status != symbol_short!("draft") && status != symbol_short!("pending") {
            panic!("circle is not pending activation");
        }

        env.storage().instance().set(
            &(symbol_short!("status"), circle_id),
            &symbol_short!("active"),
        );
        // Round 1 begins at activation.
        env.storage()
            .instance()
            .set(&(symbol_short!("round"), circle_id), &1u32);
    }

    /// Returns the current 1-indexed round (0 before activation).
    pub fn current_round(env: Env, circle_id: u128) -> u32 {
        env.storage()
            .instance()
            .get(&(symbol_short!("round"), circle_id))
            .unwrap_or(0u32)
    }

    /// Returns the number of full roster rotations configured at creation.
    pub fn cycle_count(env: Env, circle_id: u128) -> u32 {
        env.storage()
            .instance()
            .get(&(symbol_short!("cycles"), circle_id))
            .unwrap_or(1)
    }

    /// Returns all rounds in the agreement, including repeated rotations.
    pub fn total_rounds(env: Env, circle_id: u128) -> u32 {
        let members: Vec<Address> = env
            .storage()
            .instance()
            .get(&(symbol_short!("members"), circle_id))
            .unwrap_or_else(|| Vec::new(&env));
        Self::stored_total_rounds(&env, circle_id, members.len())
    }

    /// Returns true if `member` has already contributed for `round`.
    pub fn is_paid(env: Env, circle_id: u128, round: u32, member: Address) -> bool {
        env.storage()
            .instance()
            .get(&(symbol_short!("paid"), circle_id, round, member))
            .unwrap_or(false)
    }

    /// Returns true if the circle has been initialized on-chain
    pub fn is_initialized(env: Env, circle_id: u128) -> bool {
        env.storage()
            .instance()
            .has(&(symbol_short!("creator"), circle_id))
    }

    /// Allows a member to post their dynamically calculated collateral on-chain.
    /// The contract computes the required amount as: ((N * C) - k) * A
    /// and pulls exactly that amount from the member's wallet.
    pub fn post_collateral(env: Env, circle_id: u128, member: Address, token_id: Address) {
        let key_creator = (symbol_short!("creator"), circle_id);
        if !env.storage().instance().has(&key_creator) {
            panic!("circle is not initialized");
        }

        let status: Symbol = env
            .storage()
            .instance()
            .get(&(symbol_short!("status"), circle_id))
            .unwrap_or(symbol_short!("draft"));
        if status != symbol_short!("draft") && status != symbol_short!("pending") {
            panic!("collateral can only be posted during draft state");
        }

        let members: Vec<Address> = env
            .storage()
            .instance()
            .get(&(symbol_short!("members"), circle_id))
            .unwrap();

        let index = members.first_index_of(&member).unwrap_or_else(|| {
            panic!("not a circle member");
        });
        let payout_round = index + 1; // 1-indexed round position (k)

        let key_posted = (symbol_short!("posted"), circle_id, member.clone());
        if env.storage().instance().get(&key_posted).unwrap_or(false) {
            panic!("collateral already posted");
        }
        member.require_auth();
        Self::remember_token(&env, circle_id, &token_id);

        let contribution_amount: i128 = env
            .storage()
            .instance()
            .get(&(symbol_short!("contrib"), circle_id))
            .unwrap();

        let total_rounds = Self::stored_total_rounds(&env, circle_id, members.len());
        let required_collateral = Self::collateral_slice(
            payout_round - 1,
            total_rounds,
            contribution_amount,
        );

        if required_collateral > 0 {
            // Create standard token client for transfer execution
            let token_client = token::Client::new(&env, &token_id);

            // Pull funds directly from member address to this contract's address
            token_client.transfer(
                &member,
                &env.current_contract_address(),
                &required_collateral,
            );
        }

        // Record even a zero-value slice (the final payout position), so a
        // member cannot call post_collateral twice to alter the escrow state.
        env.storage().instance().set(&key_posted, &true);
    }

    /// Pulls the regular round contribution amount from the member's wallet address.
    pub fn contribute(env: Env, circle_id: u128, member: Address, token_id: Address) {
        let key_creator = (symbol_short!("creator"), circle_id);
        if !env.storage().instance().has(&key_creator) {
            panic!("circle is not initialized");
        }

        let status: Symbol = env
            .storage()
            .instance()
            .get(&(symbol_short!("status"), circle_id))
            .unwrap_or(symbol_short!("draft"));
        if status != symbol_short!("active") {
            panic!("circle is not active");
        }

        let members: Vec<Address> = env
            .storage()
            .instance()
            .get(&(symbol_short!("members"), circle_id))
            .unwrap();
        if !members.contains(&member) {
            panic!("not a circle member");
        }

        member.require_auth();
        Self::remember_token(&env, circle_id, &token_id);

        let round: u32 = env
            .storage()
            .instance()
            .get(&(symbol_short!("round"), circle_id))
            .unwrap_or(0u32);

        // Prevent double payment within the same round.
        let key_paid = (symbol_short!("paid"), circle_id, round, member.clone());
        if env.storage().instance().get(&key_paid).unwrap_or(false) {
            panic!("already contributed this round");
        }

        let contribution_amount: i128 = env
            .storage()
            .instance()
            .get(&(symbol_short!("contrib"), circle_id))
            .unwrap();

        // Create standard token client for transfer execution
        let token_client = token::Client::new(&env, &token_id);

        // Pull funds directly from member address to this contract's address
        token_client.transfer(
            &member,
            &env.current_contract_address(),
            &contribution_amount,
        );

        // Record the contribution for this round.
        env.storage().instance().set(&key_paid, &true);
    }

    /// Executes the payout for the current round. The recipient is derived
    /// on-chain from the locked payout order. The order repeats every roster
    /// length, so round R pays member `(R - 1) mod N`, not
    /// supplied by the caller, so the creator cannot redirect funds. Requires
    /// every member to have contributed for the round, then advances the round
    /// (or completes the circle after the final round).
    ///
    /// The caller is an authenticated executor, not necessarily the creator.
    /// This lets a server-side relayer submit a payout after all contributions
    /// are verified, while the contract continues to enforce every payout
    /// invariant and prevents arbitrary recipients or amounts.
    pub fn execute_payout(env: Env, circle_id: u128, executor: Address, token_id: Address) -> Address {
        let status: Symbol = env
            .storage()
            .instance()
            .get(&(symbol_short!("status"), circle_id))
            .unwrap_or(symbol_short!("draft"));
        if status != symbol_short!("active") {
            panic!("circle is not active");
        }

        executor.require_auth();

        Self::remember_token(&env, circle_id, &token_id);

        let members: Vec<Address> = env
            .storage()
            .instance()
            .get(&(symbol_short!("members"), circle_id))
            .unwrap();

        let round: u32 = env
            .storage()
            .instance()
            .get(&(symbol_short!("round"), circle_id))
            .unwrap_or(0u32);

        let num_members = members.len();
        let total_rounds = Self::stored_total_rounds(&env, circle_id, num_members);
        if round < 1 || round > total_rounds {
            panic!("no active round to pay out");
        }

        // Every member must have contributed for this round before payout.
        let mut i: u32 = 0;
        while i < num_members {
            let m = members.get(i).unwrap();
            let paid: bool = env
                .storage()
                .instance()
                .get(&(symbol_short!("paid"), circle_id, round, m))
                .unwrap_or(false);
            if !paid {
                panic!("not all members have contributed this round");
            }
            i += 1;
        }

        // Recipient order loops for each configured cycle.
        let recipient = members.get((round - 1) % num_members).unwrap();

        let contribution_amount: i128 = env
            .storage()
            .instance()
            .get(&(symbol_short!("contrib"), circle_id))
            .unwrap();

        // Total pool = N * A
        let total_pool = (num_members as i128) * contribution_amount;

        let token_client = token::Client::new(&env, &token_id);
        token_client.transfer(&env.current_contract_address(), &recipient, &total_pool);

        // Advance the round, or complete the circle after every configured
        // roster rotation has finished and return remaining collateral.
        if round == total_rounds {
            env.storage().instance().set(
                &(symbol_short!("status"), circle_id),
                &Symbol::new(&env, "completed"),
            );
            Self::execute_completion_refunds(&env, circle_id);
        } else {
            env.storage()
                .instance()
                .set(&(symbol_short!("round"), circle_id), &(round + 1));
        }

        recipient
    }

    /// Slashes a defaulting member's collateral slice and keeps it in the pool.
    ///
    /// This is the default-protection mechanism (issue #4). When a member misses
    /// a contribution and the grace period has passed, the creator applies the
    /// slash. Because collateral was already pulled into the contract's escrow at
    /// `post_collateral` time, "slashing" means the forfeited amount simply stays
    /// in the escrow (added to the pool) and is permanently marked non-refundable
    /// for that member, so `claim_refund` can never return it.
    ///
    /// `slash_percentage` is 0..=100 and is applied to the member's posted
    /// collateral slice `((N * C) - k) * A`.
    pub fn slash_collateral(
        env: Env,
        circle_id: u128,
        admin: Address,
        member: Address,
        slash_percentage: u32,
    ) -> i128 {
        let key_creator = (symbol_short!("creator"), circle_id);
        if !env.storage().instance().has(&key_creator) {
            panic!("circle is not initialized");
        }

        let creator: Address = env.storage().instance().get(&key_creator).unwrap();
        admin.require_auth();
        if admin != creator {
            panic!("only creator can slash");
        }

        let status: Symbol = env
            .storage()
            .instance()
            .get(&(symbol_short!("status"), circle_id))
            .unwrap_or(symbol_short!("draft"));
        if status != symbol_short!("active") {
            panic!("circle is not active");
        }

        if slash_percentage > 100 {
            panic!("invalid slash percentage");
        }

        let members: Vec<Address> = env
            .storage()
            .instance()
            .get(&(symbol_short!("members"), circle_id))
            .unwrap();

        let index = members.first_index_of(&member).unwrap_or_else(|| {
            panic!("not a circle member");
        });
        let payout_round = index + 1;

        if !env
            .storage()
            .instance()
            .get(&(symbol_short!("posted"), circle_id, member.clone()))
            .unwrap_or(false)
        {
            panic!("member has not posted collateral");
        }

        // The member must actually be in default: they have not contributed for
        // the current round. This makes slashing rule-driven, not discretionary.
        let round: u32 = env
            .storage()
            .instance()
            .get(&(symbol_short!("round"), circle_id))
            .unwrap_or(0u32);
        let paid_current: bool = env
            .storage()
            .instance()
            .get(&(symbol_short!("paid"), circle_id, round, member.clone()))
            .unwrap_or(false);
        if paid_current {
            panic!("member has paid the current round; nothing to slash");
        }

        // A member can only be slashed once.
        let key_slashed = (Symbol::new(&env, "slashed"), circle_id, member.clone());
        if env.storage().instance().has(&key_slashed) {
            panic!("member already slashed");
        }

        let contribution_amount: i128 = env
            .storage()
            .instance()
            .get(&(symbol_short!("contrib"), circle_id))
            .unwrap();

        let total_rounds = Self::stored_total_rounds(&env, circle_id, members.len());
        let collateral_slice = Self::collateral_slice(
            payout_round - 1,
            total_rounds,
            contribution_amount,
        );
        let slashed_amount = collateral_slice * (slash_percentage as i128) / 100;

        // Mark the member's collateral as forfeited so it can never be refunded.
        // The funds already live in escrow, so they remain part of the pool.
        env.storage().instance().set(&key_slashed, &slashed_amount);

        slashed_amount
    }

    /// Returns the amount slashed from a member (0 if never slashed).
    pub fn slashed_amount(env: Env, circle_id: u128, member: Address) -> i128 {
        env.storage()
            .instance()
            .get(&(Symbol::new(&env, "slashed"), circle_id, member))
            .unwrap_or(0i128)
    }

    fn execute_cancel_refunds(env: &Env, circle_id: u128) {
        let members: Vec<Address> = env
            .storage()
            .instance()
            .get(&(symbol_short!("members"), circle_id))
            .unwrap();
        let contribution: i128 = env
            .storage()
            .instance()
            .get(&(symbol_short!("contrib"), circle_id))
            .unwrap();
        let member_count = members.len();
        let total_rounds = Self::stored_total_rounds(env, circle_id, member_count);
        let token_id = Self::stored_token(env, circle_id);

        let mut i = 0;
        while i < member_count {
            let member = members.get(i).unwrap();
            let key_refunded = (symbol_short!("refunded"), circle_id, member.clone());
            if env.storage().instance().has(&key_refunded) {
                panic!("collateral already refunded");
            }

            // Cancellation is only possible before activation, so no collateral
            // has been slashed and the full ((N * C) - k) * A slice is refundable.
            let posted: bool = env
                .storage()
                .instance()
                .get(&(symbol_short!("posted"), circle_id, member.clone()))
                .unwrap_or(false);
            let amount = if posted {
                Self::collateral_slice(i, total_rounds, contribution)
            } else {
                0
            };
            env.storage().instance().set(&key_refunded, &true);
            Self::transfer_optional(env, &token_id, &member, amount);
            i += 1;
        }
    }

    /// Once the final round of every configured cycle has paid out, no future
    /// obligations remain. Return each member's unslashed locked collateral in
    /// the same transaction that marks the circle completed.
    fn execute_completion_refunds(env: &Env, circle_id: u128) {
        let members: Vec<Address> = env
            .storage()
            .instance()
            .get(&(symbol_short!("members"), circle_id))
            .unwrap();
        let contribution: i128 = env
            .storage()
            .instance()
            .get(&(symbol_short!("contrib"), circle_id))
            .unwrap();
        let total_rounds = Self::stored_total_rounds(env, circle_id, members.len());
        let token_id = Self::stored_token(env, circle_id);

        let mut i = 0;
        while i < members.len() {
            let member = members.get(i).unwrap();
            let posted: bool = env
                .storage()
                .instance()
                .get(&(symbol_short!("posted"), circle_id, member.clone()))
                .unwrap_or(false);
            let key_refunded = (symbol_short!("refunded"), circle_id, member.clone());
            if posted && !env.storage().instance().has(&key_refunded) {
                let slashed: i128 = env
                    .storage()
                    .instance()
                    .get(&(symbol_short!("slashed"), circle_id, member.clone()))
                    .unwrap_or(0);
                let slice = Self::collateral_slice(i, total_rounds, contribution);
                if slashed < 0 || slashed > slice {
                    panic!("invalid slashed collateral");
                }
                env.storage().instance().set(&key_refunded, &true);
                Self::transfer_optional(env, &token_id, &member, slice - slashed);
            }
            i += 1;
        }
    }

    fn cancel_impl(env: Env, circle_id: u128, admin: Address) {
        let key_creator = (symbol_short!("creator"), circle_id);
        if !env.storage().instance().has(&key_creator) {
            panic!("circle is not initialized");
        }
        let creator: Address = env.storage().instance().get(&key_creator).unwrap();
        admin.require_auth();
        if admin != creator {
            panic!("only creator can cancel");
        }

        let status: Symbol = env
            .storage()
            .instance()
            .get(&(symbol_short!("status"), circle_id))
            .unwrap_or(symbol_short!("draft"));
        if status != symbol_short!("draft") && status != symbol_short!("pending") {
            panic!("cannot unilaterally cancel active circle");
        }

        env.storage().instance().set(
            &(symbol_short!("status"), circle_id),
            &Self::cancelled_status(&env),
        );
        Self::execute_cancel_refunds(&env, circle_id);
    }

    /// Cancels a DRAFT/PENDING circle and immediately returns every posted
    /// collateral slice. This endpoint is deliberately unavailable after activation.
    pub fn cancel_pool(env: Env, circle_id: u128, creator: Address) {
        Self::cancel_impl(env, circle_id, creator);
    }

    /// Backwards-compatible alias for older clients. New clients should call
    /// `cancel_pool`, which documents the escrow behavior explicitly.
    pub fn cancel_circle(env: Env, circle_id: u128, admin: Address) {
        Self::cancel_impl(env, circle_id, admin);
    }

    /// Legacy pull-based refund endpoint for cancelled circles that were created
    /// before automatic cancellation refunds. New cancellation calls mark all
    /// members as refunded in the same transaction, so this will reject a second
    /// withdrawal rather than allowing a double spend.
    pub fn claim_refund(env: Env, circle_id: u128, member: Address, token_id: Address) {
        let status: Symbol = env
            .storage()
            .instance()
            .get(&(symbol_short!("status"), circle_id))
            .unwrap_or(symbol_short!("draft"));
        if status != Self::cancelled_status(&env) {
            panic!("circle is not cancelled");
        }

        let members: Vec<Address> = env
            .storage()
            .instance()
            .get(&(symbol_short!("members"), circle_id))
            .unwrap();
        let index = members.first_index_of(&member).unwrap_or_else(|| {
            panic!("not a circle member");
        });
        if !env
            .storage()
            .instance()
            .get(&(symbol_short!("posted"), circle_id, member.clone()))
            .unwrap_or(false)
        {
            panic!("member has not posted collateral");
        }
        let key_refunded = (symbol_short!("refunded"), circle_id, member.clone());
        if env.storage().instance().has(&key_refunded) {
            panic!("already refunded");
        }

        member.require_auth();
        Self::remember_token(&env, circle_id, &token_id);
        let contribution: i128 = env
            .storage()
            .instance()
            .get(&(symbol_short!("contrib"), circle_id))
            .unwrap();
        let total_rounds = Self::stored_total_rounds(&env, circle_id, members.len());
        let amount = Self::collateral_slice(index, total_rounds, contribution)
            - env
                .storage()
                .instance()
                .get(&(symbol_short!("slashed"), circle_id, member.clone()))
                .unwrap_or(0i128);
        env.storage().instance().set(&key_refunded, &true);
        Self::transfer(&env, &token_id, &member, amount);
    }

    /// Opens a unanimous dissolution vote. The creator has no direct deletion
    /// path once the circle is ACTIVE.
    pub fn propose_dissolution(env: Env, circle_id: u128, creator: Address) {
        let key_creator = (symbol_short!("creator"), circle_id);
        if !env.storage().instance().has(&key_creator) {
            panic!("circle is not initialized");
        }
        let stored_creator: Address = env.storage().instance().get(&key_creator).unwrap();
        creator.require_auth();
        if creator != stored_creator {
            panic!("only creator can propose dissolution");
        }

        let status: Symbol = env
            .storage()
            .instance()
            .get(&(symbol_short!("status"), circle_id))
            .unwrap_or(symbol_short!("draft"));
        if status != symbol_short!("active") {
            panic!("only active circles can be dissolved");
        }

        let proposal_number: u32 = env
            .storage()
            .instance()
            .get(&(symbol_short!("proposal"), circle_id))
            .unwrap_or(0u32)
            .checked_add(1)
            .unwrap_or_else(|| panic!("dissolution proposal counter overflow"));
        env.storage()
            .instance()
            .set(&(symbol_short!("proposal"), circle_id), &proposal_number);
        env.storage()
            .instance()
            .set(&(symbol_short!("yes"), circle_id), &0u32);
        env.storage().instance().set(
            &(symbol_short!("status"), circle_id),
            &Self::proposed_dissolution_status(&env),
        );

        let required_votes: u32 = env
            .storage()
            .instance()
            .get::<_, Vec<Address>>(&(symbol_short!("members"), circle_id))
            .unwrap()
            .len();
        Self::publish_dissolution_progress(
            &env,
            circle_id,
            creator,
            false,
            0,
            required_votes,
            Self::proposed_dissolution_status(&env),
        );
    }

    /// Records one authenticated member vote. A NO vote immediately rejects the
    /// proposal and restores ACTIVE. A unanimous YES invokes distribution in the
    /// same transaction; no later actor can alter the result.
    pub fn cast_dissolution_vote(env: Env, circle_id: u128, member: Address, approve: bool) {
        let status: Symbol = env
            .storage()
            .instance()
            .get(&(symbol_short!("status"), circle_id))
            .unwrap_or(symbol_short!("draft"));
        if status != Self::proposed_dissolution_status(&env) {
            panic!("no active dissolution proposal");
        }

        let members: Vec<Address> = env
            .storage()
            .instance()
            .get(&(symbol_short!("members"), circle_id))
            .unwrap();
        if members.first_index_of(&member).is_none() {
            panic!("not a circle member");
        }
        member.require_auth();

        let proposal_number: u32 = env
            .storage()
            .instance()
            .get(&(symbol_short!("proposal"), circle_id))
            .unwrap();
        let key_vote = (
            symbol_short!("vote"),
            circle_id,
            proposal_number,
            member.clone(),
        );
        if env.storage().instance().has(&key_vote) {
            panic!("member already voted");
        }
        env.storage().instance().set(&key_vote, &approve);

        let required_votes = members.len();
        if !approve {
            env.storage().instance().set(
                &(symbol_short!("status"), circle_id),
                &symbol_short!("active"),
            );
            env.storage()
                .instance()
                .remove(&(symbol_short!("yes"), circle_id));
            Self::publish_dissolution_progress(
                &env,
                circle_id,
                member,
                false,
                0,
                required_votes,
                symbol_short!("active"),
            );
            return;
        }

        let yes_votes: u32 = env
            .storage()
            .instance()
            .get(&(symbol_short!("yes"), circle_id))
            .unwrap_or(0u32)
            .checked_add(1)
            .unwrap_or_else(|| panic!("dissolution vote counter overflow"));
        env.storage()
            .instance()
            .set(&(symbol_short!("yes"), circle_id), &yes_votes);

        if yes_votes == required_votes {
            env.storage().instance().set(
                &(symbol_short!("status"), circle_id),
                &Self::dissolved_status(&env),
            );
            Self::execute_fair_distribution(&env, circle_id);
            Self::publish_dissolution_progress(
                &env,
                circle_id,
                member,
                true,
                yes_votes,
                required_votes,
                Self::dissolved_status(&env),
            );
        } else {
            Self::publish_dissolution_progress(
                &env,
                circle_id,
                member,
                true,
                yes_votes,
                required_votes,
                Self::proposed_dissolution_status(&env),
            );
        }
    }

    /// Fairly settles the escrow in one atomic transaction.
    ///
    /// For each roster position k, collateral is `((N * C) - k) * A`. Positions with
    /// `k < current_round` already received their payout and contribute their
    /// entire still-locked slice to the communal pool. Unpaid members first get
    /// their own unslashed collateral back. The remaining pool also includes
    /// forfeited collateral and contributions made in the unfinished round.
    ///
    /// The remaining pool is allocated pro-rata by each unpaid member's actual
    /// number of recorded contributions, not simply by roster position. Amounts
    /// are integer token units: floor division is used, then one unit at a time
    /// is assigned in roster order so every unit is accounted for. If the pool is
    /// larger than the unpaid claims, the residual is returned pro-rata to paid
    /// recipients by their locked collateral weight.
    fn execute_fair_distribution(env: &Env, circle_id: u128) {
        let members: Vec<Address> = env
            .storage()
            .instance()
            .get(&(symbol_short!("members"), circle_id))
            .unwrap();
        let round: u32 = env
            .storage()
            .instance()
            .get(&(symbol_short!("round"), circle_id))
            .unwrap_or(0);
        let member_count = members.len();
        let total_rounds = Self::stored_total_rounds(env, circle_id, member_count);
        if round == 0 || round > total_rounds {
            panic!("invalid dissolution round");
        }
        let contribution: i128 = env
            .storage()
            .instance()
            .get(&(symbol_short!("contrib"), circle_id))
            .unwrap();
        let token_id = Self::stored_token(env, circle_id);

        let mut unpaid_members: Vec<Address> = Vec::new(env);
        let mut unpaid_targets: Vec<i128> = Vec::new(env);
        let mut paid_members: Vec<Address> = Vec::new(env);
        let mut paid_collateral: Vec<i128> = Vec::new(env);
        let mut total_paid_collateral = 0i128;
        let mut forfeited_unpaid = 0i128;
        let mut current_round_contributions = 0i128;

        let mut i = 0;
        while i < member_count {
            let member = members.get(i).unwrap();
            let slice = Self::collateral_slice(i, total_rounds, contribution);
            let slashed: i128 = env
                .storage()
                .instance()
                .get(&(symbol_short!("slashed"), circle_id, member.clone()))
                .unwrap_or(0);
            if slashed < 0 || slashed > slice {
                panic!("invalid slashed collateral");
            }

            let paid_current_round: bool = env
                .storage()
                .instance()
                .get(&(symbol_short!("paid"), circle_id, round, member.clone()))
                .unwrap_or(false);
            if paid_current_round {
                current_round_contributions = current_round_contributions
                    .checked_add(contribution)
                    .unwrap_or_else(|| panic!("contribution total overflow"));
            }

            let posted: bool = env
                .storage()
                .instance()
                .get(&(symbol_short!("posted"), circle_id, member.clone()))
                .unwrap_or(false);

            if i + 1 < round {
                // Paid recipients forfeit all collateral still locked. A
                // previously slashed amount is already part of this slice.
                if posted {
                    paid_members.push_back(member.clone());
                    paid_collateral.push_back(slice);
                    total_paid_collateral = total_paid_collateral
                        .checked_add(slice)
                        .unwrap_or_else(|| panic!("collateral total overflow"));
                }
            } else {
                unpaid_members.push_back(member.clone());
                let mut contribution_count = 0i128;
                let mut contribution_round = 1u32;
                while contribution_round <= round {
                    let paid: bool = env
                        .storage()
                        .instance()
                        .get(&(
                            symbol_short!("paid"),
                            circle_id,
                            contribution_round,
                            member.clone(),
                        ))
                        .unwrap_or(false);
                    if paid {
                        contribution_count += 1;
                    }
                    contribution_round += 1;
                }
                unpaid_targets.push_back(
                    contribution_count
                        .checked_mul(contribution)
                        .unwrap_or_else(|| panic!("unpaid target overflow")),
                );
                forfeited_unpaid = forfeited_unpaid
                    .checked_add(slashed)
                    .unwrap_or_else(|| panic!("forfeited collateral overflow"));
            }

            // Mark every member as settled before any token interaction. This
            // also prevents the legacy claim_refund endpoint from double paying.
            env.storage()
                .instance()
                .set(&(symbol_short!("refunded"), circle_id, member), &true);
            i += 1;
        }

        // Return each unpaid member's own unslashed locked collateral first.
        let mut u = 0;
        while u < unpaid_members.len() {
            let member = unpaid_members.get(u).unwrap();
            let index = members.first_index_of(&member).unwrap();
            let slice = Self::collateral_slice(index, total_rounds, contribution);
            let slashed: i128 = env
                .storage()
                .instance()
                .get(&(symbol_short!("slashed"), circle_id, member.clone()))
                .unwrap_or(0);
            let posted: bool = env
                .storage()
                .instance()
                .get(&(symbol_short!("posted"), circle_id, member.clone()))
                .unwrap_or(false);
            if posted {
                Self::transfer_optional(env, &token_id, &member, slice - slashed);
            }
            u += 1;
        }

        // The communal pool consists of paid members' locked collateral,
        // forfeited unpaid collateral, and contributions trapped in the current
        // unfinished round. Prior-round contributions have already been paid out.
        let pool = total_paid_collateral
            .checked_add(forfeited_unpaid)
            .and_then(|value| value.checked_add(current_round_contributions))
            .unwrap_or_else(|| panic!("distribution pool overflow"));
        let mut total_target = 0i128;
        let mut t = 0;
        while t < unpaid_targets.len() {
            total_target = total_target
                .checked_add(unpaid_targets.get(t).unwrap())
                .unwrap_or_else(|| panic!("target total overflow"));
            t += 1;
        }

        let payout_pool = if pool < total_target {
            pool
        } else {
            total_target
        };
        let mut allocated = 0i128;
        if payout_pool > 0 && total_target > 0 {
            let mut index = 0;
            while index < unpaid_members.len() {
                let target = unpaid_targets.get(index).unwrap();
                let amount = payout_pool
                    .checked_mul(target)
                    .unwrap_or_else(|| panic!("pro-rata multiplication overflow"))
                    / total_target;
                Self::transfer_optional(
                    env,
                    &token_id,
                    &unpaid_members.get(index).unwrap(),
                    amount,
                );
                allocated += amount;
                index += 1;
            }
        }

        // Assign integer-division remainder to unpaid members in roster order.
        let mut remainder = payout_pool - allocated;
        let mut index = 0;
        while remainder > 0 && index < unpaid_members.len() {
            let target = unpaid_targets.get(index).unwrap();
            if target > 0 {
                Self::transfer_optional(env, &token_id, &unpaid_members.get(index).unwrap(), 1);
                remainder -= 1;
            }
            index += 1;
            if index == unpaid_members.len() && remainder > 0 {
                index = 0;
            }
        }

        let leftover = pool - payout_pool;
        if leftover > 0 && !paid_members.is_empty() && total_paid_collateral > 0 {
            let mut paid_allocated = 0i128;
            let mut p = 0;
            while p < paid_members.len() {
                let weight = paid_collateral.get(p).unwrap();
                let amount = leftover
                    .checked_mul(weight)
                    .unwrap_or_else(|| panic!("paid pro-rata multiplication overflow"))
                    / total_paid_collateral;
                Self::transfer_optional(env, &token_id, &paid_members.get(p).unwrap(), amount);
                paid_allocated += amount;
                p += 1;
            }
            // Any integer remainder is harmlessly returned to the first paid
            // recipient; this makes the transfer sum exactly equal to `leftover`.
            let paid_remainder = leftover - paid_allocated;
            if paid_remainder > 0 {
                Self::transfer_optional(
                    env,
                    &token_id,
                    &paid_members.get(0).unwrap(),
                    paid_remainder,
                );
            }
        } else if leftover > 0 && !unpaid_members.is_empty() {
            // This branch is reachable only when there are no paid recipients
            // (for example, a round-one forfeiture). Avoid leaving assets trapped.
            let share = leftover / unpaid_members.len() as i128;
            let mut extra = leftover % unpaid_members.len() as i128;
            let mut u2 = 0;
            while u2 < unpaid_members.len() {
                let amount = share
                    + if extra > 0 {
                        extra -= 1;
                        1
                    } else {
                        0
                    };
                Self::transfer_optional(env, &token_id, &unpaid_members.get(u2).unwrap(), amount);
                u2 += 1;
            }
        }
    }

    /// Returns `(YES votes, required votes)` for the current proposal. The
    /// frontend primarily uses `DissolutionProgress` events so it can update
    /// without trusting a cached database row.
    pub fn dissolution_votes(env: Env, circle_id: u128) -> (u32, u32) {
        let members: Vec<Address> = env
            .storage()
            .instance()
            .get(&(symbol_short!("members"), circle_id))
            .unwrap_or_else(|| Vec::new(&env));
        let status: Symbol = env
            .storage()
            .instance()
            .get(&(symbol_short!("status"), circle_id))
            .unwrap_or(symbol_short!("draft"));
        let yes_votes = if status == Self::proposed_dissolution_status(&env)
            || status == Self::dissolved_status(&env)
        {
            env.storage()
                .instance()
                .get(&(symbol_short!("yes"), circle_id))
                .unwrap_or(0)
        } else {
            0
        };
        (yes_votes, members.len())
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, vec, Env};

    #[test]
    fn initializes_as_draft_then_activates() {
        let env = Env::default();
        let contract_id = env.register(CirculoContract, ());
        let client = CirculoContractClient::new(&env, &contract_id);
        let creator = Address::generate(&env);
        let member = Address::generate(&env);
        let circle_id = 999u128;

        env.mock_all_auths();

        client.initialize(
            &circle_id,
            &creator,
            &10_0000000,
            &5_0000000,
            &86_400,
            &1u32,
            &vec![&env, creator.clone(), member],
        );

        assert_eq!(client.status(&circle_id), symbol_short!("draft"));

        client.activate(&circle_id, &creator);

        assert_eq!(client.status(&circle_id), symbol_short!("active"));
    }

    #[test]
    fn test_contribute_and_payout() {
        let env = Env::default();
        let contract_id = env.register(CirculoContract, ());
        let client = CirculoContractClient::new(&env, &contract_id);

        let creator = Address::generate(&env);
        let member = Address::generate(&env);
        let circle_id = 12345u128;

        let token_admin = Address::generate(&env);
        let token_address = env.register_stellar_asset_contract(token_admin.clone());
        let token = token::Client::new(&env, &token_address);
        let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

        env.mock_all_auths();

        token_admin_client.mint(&creator, &10_000);
        token_admin_client.mint(&member, &10_000);

        client.initialize(
            &circle_id,
            &creator,
            &600,
            &600,
            &86_400,
            &1u32,
            &vec![&env, creator.clone(), member.clone()],
        );

        // Creator posts collateral (k = 1, N = 2, required = (2 - 1) * 600 = 600)
        client.post_collateral(&circle_id, &creator, &token_address);
        assert_eq!(token.balance(&contract_id), 600);

        // Member posts collateral (k = 2, N = 2, required = (2 - 2) * 600 = 0)
        client.post_collateral(&circle_id, &member, &token_address);

        client.activate(&circle_id, &creator);
        assert_eq!(client.current_round(&circle_id), 1);

        // Both members must contribute for round 1 before payout.
        client.contribute(&circle_id, &creator, &token_address);
        client.contribute(&circle_id, &member, &token_address);
        assert!(client.is_paid(&circle_id, &1, &creator));
        assert!(client.is_paid(&circle_id, &1, &member));

        // Payout for round 1 goes to members[0] = creator, chosen on-chain.
        // Escrow after collateral (600) + two contributions (1200) = 1800.
        let recipient = client.execute_payout(&circle_id, &creator, &token_address);
        assert_eq!(recipient, creator);
        // Round advances to 2.
        assert_eq!(client.current_round(&circle_id), 2);
    }

    #[test]
    fn multi_cycle_rotates_payouts_and_returns_collateral_after_final_round() {
        let env = Env::default();
        let contract_id = env.register(CirculoContract, ());
        let client = CirculoContractClient::new(&env, &contract_id);
        let creator = Address::generate(&env);
        let member = Address::generate(&env);
        let circle_id = 54321u128;
        let token_admin = Address::generate(&env);
        let token_address = env.register_stellar_asset_contract(token_admin.clone());
        let token = token::Client::new(&env, &token_address);
        let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

        env.mock_all_auths();
        token_admin_client.mint(&creator, &5_000);
        token_admin_client.mint(&member, &5_000);

        // Two members across two full rotations produces four total rounds.
        // The first member owes three remaining contributions after their first
        // payout; the second owes two.
        client.initialize(
            &circle_id,
            &creator,
            &100,
            &100,
            &86_400,
            &2u32,
            &vec![&env, creator.clone(), member.clone()],
        );
        assert_eq!(client.cycle_count(&circle_id), 2);
        assert_eq!(client.total_rounds(&circle_id), 4);

        client.post_collateral(&circle_id, &creator, &token_address);
        client.post_collateral(&circle_id, &member, &token_address);
        assert_eq!(token.balance(&contract_id), 500);

        client.activate(&circle_id, &creator);
        let mut round = 1u32;
        while round <= 4 {
            client.contribute(&circle_id, &creator, &token_address);
            client.contribute(&circle_id, &member, &token_address);
            let recipient = client.execute_payout(&circle_id, &creator, &token_address);
            assert_eq!(
                recipient,
                if round % 2 == 1 {
                    creator.clone()
                } else {
                    member.clone()
                }
            );
            round += 1;
        }

        assert_eq!(client.status(&circle_id), Symbol::new(&env, "completed"));
        assert_eq!(token.balance(&creator), 5_000);
        assert_eq!(token.balance(&member), 5_000);
        assert_eq!(token.balance(&contract_id), 0);
    }

    #[test]
    #[should_panic(expected = "not all members have contributed")]
    fn payout_blocked_until_all_contribute() {
        let env = Env::default();
        let contract_id = env.register(CirculoContract, ());
        let client = CirculoContractClient::new(&env, &contract_id);

        let creator = Address::generate(&env);
        let member = Address::generate(&env);
        let circle_id = 77u128;

        let token_admin = Address::generate(&env);
        let token_address = env.register_stellar_asset_contract(token_admin.clone());
        let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

        env.mock_all_auths();
        token_admin_client.mint(&creator, &10_000);
        token_admin_client.mint(&member, &10_000);

        client.initialize(
            &circle_id,
            &creator,
            &600,
            &600,
            &86_400,
            &1u32,
            &vec![&env, creator.clone(), member.clone()],
        );
        client.post_collateral(&circle_id, &creator, &token_address);
        client.post_collateral(&circle_id, &member, &token_address);
        client.activate(&circle_id, &creator);

        // Only the creator contributes; payout must fail.
        client.contribute(&circle_id, &creator, &token_address);
        client.execute_payout(&circle_id, &creator, &token_address);
    }

    #[test]
    #[should_panic(expected = "cannot unilaterally cancel active circle")]
    fn active_circle_cannot_be_cancelled_unilaterally() {
        let env = Env::default();
        let contract_id = env.register(CirculoContract, ());
        let client = CirculoContractClient::new(&env, &contract_id);

        let creator = Address::generate(&env);
        let member = Address::generate(&env);
        let circle_id = 555u128;

        let token_admin = Address::generate(&env);
        let token_address = env.register_stellar_asset_contract(token_admin.clone());
        let token = token::Client::new(&env, &token_address);
        let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

        // 3 members so the creator (k=1) has a non-zero collateral slice.
        let member_b = Address::generate(&env);

        env.mock_all_auths();
        token_admin_client.mint(&creator, &10_000);

        client.initialize(
            &circle_id,
            &creator,
            &600,
            &600,
            &86_400,
            &1u32,
            &vec![&env, creator.clone(), member.clone(), member_b.clone()],
        );

        // Creator posts collateral: (N - k) * A = (3 - 1) * 600 = 1200.
        client.post_collateral(&circle_id, &creator, &token_address);
        assert_eq!(token.balance(&creator), 8_800);
        assert_eq!(token.balance(&contract_id), 1_200);

        client.activate(&circle_id, &creator);

        // Slash 50% of the creator's 1200 slice = 600.
        let slashed = client.slash_collateral(&circle_id, &creator, &creator, &50u32);
        assert_eq!(slashed, 600);
        assert_eq!(client.slashed_amount(&circle_id, &creator), 600);

        // An active circle must use the unanimous dissolution flow.
        client.cancel_circle(&circle_id, &creator);
    }

    #[test]
    fn unanimous_dissolution_fairly_settles_collateral() {
        let env = Env::default();
        let contract_id = env.register(CirculoContract, ());
        let client = CirculoContractClient::new(&env, &contract_id);
        let creator = Address::generate(&env);
        let member_b = Address::generate(&env);
        let member_c = Address::generate(&env);
        let circle_id = 777u128;
        let token_admin = Address::generate(&env);
        let token_address = env.register_stellar_asset_contract(token_admin.clone());
        let token = token::Client::new(&env, &token_address);
        let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

        env.mock_all_auths();
        let members = vec![&env, creator.clone(), member_b.clone(), member_c.clone()];
        token_admin_client.mint(&creator, &10_000);
        token_admin_client.mint(&member_b, &10_000);
        token_admin_client.mint(&member_c, &10_000);

        client.initialize(&circle_id, &creator, &100, &100, &86_400, &1u32, &members);
        client.post_collateral(&circle_id, &creator, &token_address);
        client.post_collateral(&circle_id, &member_b, &token_address);
        client.post_collateral(&circle_id, &member_c, &token_address);
        client.activate(&circle_id, &creator);

        // Complete round one so creator is a paid recipient. The other two
        // members are unpaid recipients and each contributed one round.
        client.contribute(&circle_id, &creator, &token_address);
        client.contribute(&circle_id, &member_b, &token_address);
        client.contribute(&circle_id, &member_c, &token_address);
        client.execute_payout(&circle_id, &creator, &token_address);

        client.propose_dissolution(&circle_id, &creator);
        client.cast_dissolution_vote(&circle_id, &creator, &true);
        client.cast_dissolution_vote(&circle_id, &member_b, &true);
        client.cast_dissolution_vote(&circle_id, &member_c, &true);

        assert_eq!(client.status(&circle_id), Symbol::new(&env, "dissolved"));
        assert_eq!(token.balance(&creator), 10_000);
        assert_eq!(token.balance(&member_b), 10_000);
        assert_eq!(token.balance(&member_c), 10_000);
        assert_eq!(token.balance(&contract_id), 0);
    }

    #[test]
    fn draft_cancel_refunds_posted_collateral_atomically() {
        let env = Env::default();
        let contract_id = env.register(CirculoContract, ());
        let client = CirculoContractClient::new(&env, &contract_id);
        let creator = Address::generate(&env);
        let member = Address::generate(&env);
        let circle_id = 779u128;
        let token_admin = Address::generate(&env);
        let token_address = env.register_stellar_asset_contract(token_admin.clone());
        let token = token::Client::new(&env, &token_address);
        let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

        env.mock_all_auths();
        token_admin_client.mint(&creator, &10_000);
        token_admin_client.mint(&member, &10_000);
        client.initialize(
            &circle_id,
            &creator,
            &100,
            &100,
            &86_400,
            &1u32,
            &vec![&env, creator.clone(), member.clone()],
        );
        client.post_collateral(&circle_id, &creator, &token_address);
        client.post_collateral(&circle_id, &member, &token_address);
        client.cancel_pool(&circle_id, &creator);

        assert_eq!(client.status(&circle_id), Symbol::new(&env, "cancelled"));
        assert_eq!(token.balance(&creator), 10_000);
        assert_eq!(token.balance(&member), 10_000);
        assert_eq!(token.balance(&contract_id), 0);
    }

    #[test]
    fn no_vote_resets_dissolution_to_active() {
        let env = Env::default();
        let contract_id = env.register(CirculoContract, ());
        let client = CirculoContractClient::new(&env, &contract_id);
        let creator = Address::generate(&env);
        let member = Address::generate(&env);
        let circle_id = 778u128;

        env.mock_all_auths();
        client.initialize(
            &circle_id,
            &creator,
            &100,
            &100,
            &86_400,
            &1u32,
            &vec![&env, creator.clone(), member.clone()],
        );
        client.activate(&circle_id, &creator);
        client.propose_dissolution(&circle_id, &creator);
        client.cast_dissolution_vote(&circle_id, &member, &false);

        assert_eq!(client.status(&circle_id), symbol_short!("active"));
        assert_eq!(client.dissolution_votes(&circle_id), (0, 2));
    }
}
