#![no_std]

use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, Symbol, Vec};

// Import standard token client to handle Stellar stablecoins (like USDC or XLM wrapper)
use soroban_sdk::token;

#[contract]
pub struct CirculoContract;

#[contractimpl]
impl CirculoContract {
    /// Initializes the rotating savings circle with config parameters
    pub fn initialize(
        env: Env,
        creator: Address,
        contribution_amount: i128,
        collateral_amount: i128,
        interval_seconds: u64,
        members: Vec<Address>,
    ) {
        creator.require_auth();

        env.storage().instance().set(&symbol_short!("creator"), &creator);
        env.storage()
            .instance()
            .set(&symbol_short!("contrib"), &contribution_amount);
        env.storage()
            .instance()
            .set(&symbol_short!("collat"), &collateral_amount);
        env.storage()
            .instance()
            .set(&symbol_short!("interval"), &interval_seconds);
        env.storage().instance().set(&symbol_short!("members"), &members);
        env.storage()
            .instance()
            .set(&symbol_short!("status"), &symbol_short!("draft"));
    }

    /// Returns the current circle state (e.g. 'draft', 'active')
    pub fn status(env: Env) -> Symbol {
        env.storage()
            .instance()
            .get(&symbol_short!("status"))
            .unwrap_or(symbol_short!("draft"))
    }

    /// Activates the rotating savings circle (only executable by creator)
    pub fn activate(env: Env, admin: Address) {
        let creator: Address = env.storage().instance().get(&symbol_short!("creator")).unwrap();
        admin.require_auth();

        if admin != creator {
            panic!("only creator can activate");
        }

        env.storage()
            .instance()
            .set(&symbol_short!("status"), &symbol_short!("active"));
    }

    /// Pulls the contribution amount from the member's wallet address directly
    /// into the smart contract's unique address acting as the non-custodial escrow vault.
    pub fn contribute(env: Env, member: Address, token_id: Address, amount: i128) {
        // Enforce cryptographic authorization on the executing member
        member.require_auth();

        // Create standard token client for transfer execution
        let token_client = token::Client::new(&env, &token_id);

        // Pull funds directly from member address to this contract's address
        token_client.transfer(&member, &env.current_contract_address(), &amount);
    }

    /// Moves the accumulated round pool amount straight from the smart contract escrow balance
    /// directly to the designated round recipient address in a single atomic operation.
    pub fn execute_payout(env: Env, token_id: Address, recipient: Address, total_pool: i128) {
        // Create standard token client for transfer execution
        let token_client = token::Client::new(&env, &token_id);

        // Transfer funds directly from this contract's escrow address to the recipient
        token_client.transfer(&env.current_contract_address(), &recipient, &total_pool);
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

        env.mock_all_auths();

        client.initialize(
            &creator,
            &10_0000000,
            &5_0000000,
            &86_400,
            &vec![&env, creator.clone(), member],
        );

        assert_eq!(client.status(), symbol_short!("draft"));

        client.activate(&creator);

        assert_eq!(client.status(), symbol_short!("active"));
    }

    #[test]
    fn test_contribute_and_payout() {
        let env = Env::default();
        let contract_id = env.register(CirculoContract, ());
        let client = CirculoContractClient::new(&env, &contract_id);
        
        let creator = Address::generate(&env);
        let member = Address::generate(&env);
        
        let token_admin = Address::generate(&env);
        let token_address = env.register_stellar_asset_contract(token_admin.clone());
        let token = token::Client::new(&env, &token_address);
        let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

        token_admin_client.mint(&member, &1000);
        assert_eq!(token.balance(&member), 1000);

        env.mock_all_auths();

        // Member contributes to the contract
        client.contribute(&member, &token_address, &600);
        assert_eq!(token.balance(&member), 400);
        assert_eq!(token.balance(&contract_id), 600);

        // Execute payout to designated recipient
        let recipient = Address::generate(&env);
        client.execute_payout(&token_address, &recipient, &600);
        assert_eq!(token.balance(&contract_id), 0);
        assert_eq!(token.balance(&recipient), 600);
    }
}
