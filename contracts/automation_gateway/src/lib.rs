#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, Address, Env, Vec,
};

#[contracttype]
#[derive(Clone, Debug)]
pub struct Agent {
    pub address: Address,
    pub permissions: Vec<u32>,
    pub registered_at: u64,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Agent(Address),
}

#[contract]
pub struct AutomationGatewayContract;

#[contractimpl]
impl AutomationGatewayContract {
    pub fn initialize(env: Env, admin: Address) {
        env.storage().persistent().set(&DataKey::Admin, &admin);
    }

    pub fn register_agent(env: Env, admin: Address, agent: Address, permissions: Vec<u32>) {
        admin.require_auth();

        let stored_admin: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic!("Not initialized"));
        if admin != stored_admin {
            panic!("Insufficient permissions");
        }

        if env
            .storage()
            .persistent()
            .has(&DataKey::Agent(agent.clone()))
        {
            panic!("Agent already registered");
        }

        let agent_info = Agent {
            address: agent.clone(),
            permissions,
            registered_at: env.ledger().timestamp(),
        };

        env.storage()
            .persistent()
            .set(&DataKey::Agent(agent), &agent_info);
    }

    pub fn remove_agent(env: Env, admin: Address, agent: Address) {
        admin.require_auth();

        let stored_admin: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic!("Not initialized"));
        if admin != stored_admin {
            panic!("Insufficient permissions");
        }

        if !env
            .storage()
            .persistent()
            .has(&DataKey::Agent(agent.clone()))
        {
            panic!("Agent not found");
        }

        env.storage()
            .persistent()
            .remove(&DataKey::Agent(agent));
    }

    pub fn is_authorized(env: Env, agent: Address, permission: u32) -> bool {
        let agent_info: Option<Agent> = env
            .storage()
            .persistent()
            .get(&DataKey::Agent(agent));
        match agent_info {
            Some(a) => a.permissions.iter().any(|p| p == permission),
            None => false,
        }
    }

    pub fn get_agent(env: Env, agent: Address) -> Option<Agent> {
        env.storage().persistent().get(&DataKey::Agent(agent))
    }

    pub fn get_admin(env: Env) -> Option<Address> {
        env.storage().persistent().get(&DataKey::Admin)
    }
}
