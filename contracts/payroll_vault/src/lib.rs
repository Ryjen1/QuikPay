#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Env, Symbol,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Balance,
    Liability,
}

#[contract]
pub struct PayrollVaultContract;

#[contractimpl]
impl PayrollVaultContract {
    /// Initialize the vault with an admin address
    pub fn initialize(env: Env, admin: Address) {
        env.storage().persistent().set(&DataKey::Admin, &admin);
    }

    /// Deposit XLM into the vault (simplified - no token parameter needed)
    pub fn deposit(env: Env, from: Address, amount: i128) {
        from.require_auth();

        if amount <= 0 {
            panic!("Invalid amount");
        }

        // Update balance in storage first
        let current: i128 = env.storage().persistent().get(&DataKey::Balance).unwrap_or(0);
        env.storage()
            .persistent()
            .set(&DataKey::Balance, &(current + amount));

        // Emit deposit event
        env.events().publish(
            (Symbol::new(&env, "vault"), Symbol::new(&env, "deposit")),
            (from, amount),
        );
    }

    /// Withdraw XLM from the vault (admin only)
    pub fn withdraw(env: Env, admin: Address, amount: i128, to: Address) {
        admin.require_auth();

        if amount <= 0 {
            panic!("Invalid amount");
        }

        let stored_admin: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic!("Not initialized"));
        if admin != stored_admin {
            panic!("Insufficient permissions");
        }

        let current: i128 = env.storage().persistent().get(&DataKey::Balance).unwrap_or(0);

        if current < amount {
            panic!("Insufficient balance");
        }

        let liability: i128 = env.storage().persistent().get(&DataKey::Liability).unwrap_or(0);
        let available = current - liability;
        if amount > available {
            panic!("Insufficient balance");
        }

        env.storage()
            .persistent()
            .set(&DataKey::Balance, &(current - amount));

        env.events().publish(
            (Symbol::new(&env, "vault"), Symbol::new(&env, "withdraw")),
            (admin, amount, to),
        );
    }

    /// Add a liability to reserve funds for a stream
    pub fn add_liability(env: Env, amount: i128) {
        if amount <= 0 {
            panic!("Invalid amount");
        }

        let current_balance: i128 = env.storage().persistent().get(&DataKey::Balance).unwrap_or(0);
        let current_liability: i128 = env.storage().persistent().get(&DataKey::Liability).unwrap_or(0);

        let new_liability = current_liability + amount;

        if new_liability > current_balance {
            panic!("Insufficient balance");
        }

        env.storage()
            .persistent()
            .set(&DataKey::Liability, &new_liability);
    }

    /// Reduce a liability when a stream completes or is cancelled
    pub fn reduce_liability(env: Env, amount: i128) {
        if amount <= 0 {
            panic!("Invalid amount");
        }

        let current_liability: i128 = env.storage().persistent().get(&DataKey::Liability).unwrap_or(0);

        if current_liability < amount {
            panic!("Insufficient balance");
        }

        env.storage()
            .persistent()
            .set(&DataKey::Liability, &(current_liability - amount));
    }

    /// Check if vault has sufficient balance for an operation
    pub fn check_solvency(env: Env, required: i128) -> bool {
        if required <= 0 {
            return true;
        }
        let balance: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Balance)
            .unwrap_or(0);
        balance >= required
    }

    /// Get total balance
    pub fn get_balance(env: Env) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Balance)
            .unwrap_or(0)
    }

    /// Get total liability
    pub fn get_liability(env: Env) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Liability)
            .unwrap_or(0)
    }

    /// Get available balance (balance - liability)
    pub fn get_available_balance(env: Env) -> i128 {
        let balance: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Balance)
            .unwrap_or(0);
        let liability: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Liability)
            .unwrap_or(0);
        balance.saturating_sub(liability)
    }
}
