#![no_std]

use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, Symbol, Vec};

// Import standard token client to handle Stellar stablecoins (like USDC or XLM wrapper)
use soroban_sdk::token;

#[contract]
pub struct CirculoContract;

#[contractimpl]
impl CirculoContract {
    /// Initializes the rotating savings circle with config parameters using a composite key
    pub fn initialize(
        env: Env,
        circle_id: u128,
        creator: Address,
        contribution_amount: i128,
        collateral_amount: i128,
        interval_seconds: u64,
        members: Vec<Address>,
    ) {
        let key_creator = (symbol_short!("creator"), circle_id);
        if env.storage().instance().has(&key_creator) {
            panic!("already initialized");
        }
        if contribution_amount <= 0 || collateral_amount <= 0 || interval_seconds == 0 {
            panic!("invalid configuration");
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
            .set(&(symbol_short!("members"), circle_id), &members);
        env.storage()
            .instance()
            .set(&(symbol_short!("status"), circle_id), &symbol_short!("draft"));
    }

    /// Returns the current circle state (e.g. 'draft', 'active')
    pub fn status(env: Env, circle_id: u128) -> Symbol {
        env.storage()
            .instance()
            .get(&(symbol_short!("status"), circle_id))
            .unwrap_or(symbol_short!("draft"))
    }

    /// Activates the rotating savings circle (only executable by creator)
    pub fn activate(env: Env, circle_id: u128, admin: Address) {
        let key_creator = (symbol_short!("creator"), circle_id);
        let creator: Address = env.storage().instance().get(&key_creator).unwrap();
        admin.require_auth();

        if admin != creator {
            panic!("only creator can activate");
        }

        env.storage()
            .instance()
            .set(&(symbol_short!("status"), circle_id), &symbol_short!("active"));
    }

    /// Returns true if the circle has been initialized on-chain
    pub fn is_initialized(env: Env, circle_id: u128) -> bool {
        env.storage().instance().has(&(symbol_short!("creator"), circle_id))
    }

    /// Allows a member to post their dynamically calculated collateral on-chain.
    /// The contract computes the required amount as: (N - k) * A
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
        if status != symbol_short!("draft") {
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

        let contribution_amount: i128 = env
            .storage()
            .instance()
            .get(&(symbol_short!("contrib"), circle_id))
            .unwrap();

        let num_members = members.len();
        // Mathematical Model: required_collateral = (N - k) * A
        let required_collateral = ((num_members - payout_round) as i128) * contribution_amount;

        if required_collateral > 0 {
            member.require_auth();

            // Create standard token client for transfer execution
            let token_client = token::Client::new(&env, &token_id);

            // Pull funds directly from member address to this contract's address
            token_client.transfer(&member, &env.current_contract_address(), &required_collateral);
        }
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

        let contribution_amount: i128 = env
            .storage()
            .instance()
            .get(&(symbol_short!("contrib"), circle_id))
            .unwrap();

        member.require_auth();

        // Create standard token client for transfer execution
        let token_client = token::Client::new(&env, &token_id);

        // Pull funds directly from member address to this contract's address
        token_client.transfer(&member, &env.current_contract_address(), &contribution_amount);
    }

    /// Moves the accumulated round pool amount straight from the smart contract escrow balance
    /// directly to the designated round recipient address in a single atomic operation.
    pub fn execute_payout(
        env: Env,
        circle_id: u128,
        admin: Address,
        token_id: Address,
        recipient: Address,
    ) {
        let status: Symbol = env
            .storage()
            .instance()
            .get(&(symbol_short!("status"), circle_id))
            .unwrap_or(symbol_short!("draft"));
        if status != symbol_short!("active") {
            panic!("circle is not active");
        }

        let creator: Address = env.storage().instance().get(&(symbol_short!("creator"), circle_id)).unwrap();
        admin.require_auth();
        if admin != creator {
            panic!("only creator can execute payout");
        }

        let members: Vec<Address> = env
            .storage()
            .instance()
            .get(&(symbol_short!("members"), circle_id))
            .unwrap();
        
        let contribution_amount: i128 = env
            .storage()
            .instance()
            .get(&(symbol_short!("contrib"), circle_id))
            .unwrap();

        // Calculate total pool = N * A
        let total_pool = (members.len() as i128) * contribution_amount;

        // Create standard token client for transfer execution
        let token_client = token::Client::new(&env, &token_id);

        // Transfer funds directly from this contract's escrow address to the recipient
        token_client.transfer(&env.current_contract_address(), &recipient, &total_pool);
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
    /// collateral slice `(N - k) * A`.
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

        let num_members = members.len();
        let collateral_slice = ((num_members - payout_round) as i128) * contribution_amount;
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
            .unwrap_or(0)
    }

    /// Cancels the circle on-chain, preventing any further round contributions or payouts.
    /// Transitions status to "cancelled" which unlocks collateral refunds for all members.
    pub fn cancel_circle(env: Env, circle_id: u128, admin: Address) {
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
        if status == Symbol::new(&env, "cancelled") {
            panic!("already cancelled");
        }

        env.storage()
            .instance()
            .set(&(symbol_short!("status"), circle_id), &Symbol::new(&env, "cancelled"));
    }

    /// Allows a member to claim their posted collateral refund back if the circle is cancelled.
    pub fn claim_refund(env: Env, circle_id: u128, member: Address, token_id: Address) {
        let key_creator = (symbol_short!("creator"), circle_id);
        if !env.storage().instance().has(&key_creator) {
            panic!("circle is not initialized");
        }

        let status: Symbol = env
            .storage()
            .instance()
            .get(&(symbol_short!("status"), circle_id))
            .unwrap_or(symbol_short!("draft"));
        if status != Symbol::new(&env, "cancelled") {
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
        let payout_round = index + 1;

        let key_refunded = (Symbol::new(&env, "refunded"), circle_id, member.clone());
        if env.storage().instance().has(&key_refunded) {
            panic!("already refunded");
        }

        let contribution_amount: i128 = env
            .storage()
            .instance()
            .get(&(symbol_short!("contrib"), circle_id))
            .unwrap();

        let num_members = members.len();
        // Mathematical Model: collateral_to_refund = (N - k) * A, minus anything
        // that was slashed for a missed contribution (issue #4).
        let collateral_slice = ((num_members - payout_round) as i128) * contribution_amount;
        let slashed: i128 = env
            .storage()
            .instance()
            .get(&(Symbol::new(&env, "slashed"), circle_id, member.clone()))
            .unwrap_or(0);
        let collateral_to_refund = collateral_slice - slashed;

        if collateral_to_refund > 0 {
            member.require_auth();

            // Checks-Effects-Interactions: mark as refunded before transferring
            env.storage().instance().set(&key_refunded, &true);

            // Return the collateral to the member's wallet address
            let token_client = token::Client::new(&env, &token_id);
            token_client.transfer(&env.current_contract_address(), &member, &collateral_to_refund);
        }
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

        token_admin_client.mint(&creator, &1000);
        token_admin_client.mint(&member, &1000);
        assert_eq!(token.balance(&creator), 1000);
        assert_eq!(token.balance(&member), 1000);

        env.mock_all_auths();
        client.initialize(
            &circle_id,
            &creator,
            &600,
            &600,
            &86_400,
            &vec![&env, creator.clone(), member.clone()],
        );

        // Creator posts collateral (k = 1, N = 2, required = (2 - 1) * 600 = 600)
        client.post_collateral(&circle_id, &creator, &token_address);
        assert_eq!(token.balance(&creator), 400);
        assert_eq!(token.balance(&contract_id), 600);

        // Member posts collateral (k = 2, N = 2, required = (2 - 2) * 600 = 0)
        client.post_collateral(&circle_id, &member, &token_address);
        assert_eq!(token.balance(&member), 1000);

        client.activate(&circle_id, &creator);

        // Member pays contribution round (600)
        client.contribute(&circle_id, &member, &token_address);
        assert_eq!(token.balance(&member), 400);
        assert_eq!(token.balance(&contract_id), 1200);

        // Execute payout to designated recipient (N * A = 2 * 600 = 1200)
        let recipient = Address::generate(&env);
        client.execute_payout(&circle_id, &creator, &token_address, &recipient);
        assert_eq!(token.balance(&contract_id), 0);
        assert_eq!(token.balance(&recipient), 1200);
    }

    #[test]
    fn slashed_collateral_stays_in_pool_and_is_not_refunded() {
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
        token_admin_client.mint(&creator, &10_000);

        env.mock_all_auths();
        client.initialize(
            &circle_id,
            &creator,
            &600,
            &600,
            &86_400,
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

        // Cancel and attempt a refund: only 1200 - 600 = 600 comes back.
        client.cancel_circle(&circle_id, &creator);
        client.claim_refund(&circle_id, &creator, &token_address);
        assert_eq!(token.balance(&creator), 9_400);
        // The slashed 600 remains in the escrow/pool.
        assert_eq!(token.balance(&contract_id), 600);
    }
}
