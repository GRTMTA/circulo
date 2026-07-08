#![no_std]

use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, Symbol, Vec};

#[contract]
pub struct CirculoContract;

#[contractimpl]
impl CirculoContract {
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

    pub fn status(env: Env) -> Symbol {
        env.storage()
            .instance()
            .get(&symbol_short!("status"))
            .unwrap_or(symbol_short!("draft"))
    }

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
}
