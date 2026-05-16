#![no_std]
//! PayrollVault
//! ------------
//! Per-employer treasury vault for QuikPay.
//!
//! Each employer (depositor) gets a segregated balance inside this contract.
//! Funds are held by the contract itself (custodian of the XLM SAC) — not by
//! any off-chain hot wallet. Employers can deposit at any time and withdraw
//! their own available balance (balance minus liability locked into streams).
//!
//! The PayrollStream contract is recorded as an authorized caller; only it
//! can move funds between employer balances and worker accounts via
//! `add_liability` / `reduce_liability` / `pay_worker`.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, token,
    Address, Env, Symbol,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// Admin address (set on `initialize`)
    Admin,
    /// Stellar Asset Contract address for the token held by this vault
    /// (native XLM SAC on testnet/mainnet)
    Token,
    /// Address of the authorized PayrollStream contract
    StreamContract,
    /// Per-employer deposited balance (in stroops)
    Balance(Address),
    /// Per-employer liability locked into active streams (in stroops)
    Liability(Address),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    InvalidAmount = 4,
    InsufficientBalance = 5,
    InsufficientAvailable = 6,
    InsufficientLiability = 7,
}

#[contract]
pub struct PayrollVaultContract;

#[contractimpl]
impl PayrollVaultContract {
    /// Initialize the vault.
    ///
    /// * `admin`            – privileged address (can rotate stream contract)
    /// * `token`            – Stellar Asset Contract address for the asset
    ///                        this vault holds (e.g., native XLM SAC)
    /// * `stream_contract`  – address of the PayrollStream contract that is
    ///                        allowed to lock/unlock liabilities and pay workers
    pub fn initialize(env: Env, admin: Address, token: Address, stream_contract: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic_with_error!(&env, Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage()
            .instance()
            .set(&DataKey::StreamContract, &stream_contract);
    }

    /// Update the authorized stream contract address. Admin only.
    pub fn set_stream_contract(env: Env, new_stream_contract: Address) {
        let admin = Self::require_admin(&env);
        admin.require_auth();
        env.storage()
            .instance()
            .set(&DataKey::StreamContract, &new_stream_contract);
    }

    // ──────────────────────────────────────────────────────────────────────
    // User-facing: deposit & withdraw against caller's own balance
    // ──────────────────────────────────────────────────────────────────────

    /// Deposit `amount` (stroops) into the caller's vault balance.
    /// Transfers real tokens from `from` → this contract.
    pub fn deposit(env: Env, from: Address, amount: i128) {
        from.require_auth();
        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }

        // Move real tokens in
        let token_addr = Self::require_token(&env);
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&from, &env.current_contract_address(), &amount);

        // Bump per-employer balance
        let key = DataKey::Balance(from.clone());
        let current: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        env.storage().persistent().set(&key, &(current + amount));

        env.events().publish(
            (Symbol::new(&env, "vault"), Symbol::new(&env, "deposit")),
            (from, amount),
        );
    }

    /// Withdraw `amount` from the caller's own available balance.
    /// Available = balance − liability (funds locked into active streams).
    /// Transfers real tokens from this contract → caller.
    pub fn withdraw(env: Env, employer: Address, amount: i128) {
        employer.require_auth();
        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }

        let bal_key = DataKey::Balance(employer.clone());
        let liab_key = DataKey::Liability(employer.clone());
        let balance: i128 = env.storage().persistent().get(&bal_key).unwrap_or(0);
        let liability: i128 = env.storage().persistent().get(&liab_key).unwrap_or(0);
        let available = balance - liability;
        if amount > available {
            panic_with_error!(&env, Error::InsufficientAvailable);
        }

        // Move real tokens out
        let token_addr = Self::require_token(&env);
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&env.current_contract_address(), &employer, &amount);

        env.storage().persistent().set(&bal_key, &(balance - amount));

        env.events().publish(
            (Symbol::new(&env, "vault"), Symbol::new(&env, "withdraw")),
            (employer, amount),
        );
    }

    // ──────────────────────────────────────────────────────────────────────
    // Stream-contract-only: lock/unlock liabilities & pay workers
    // ──────────────────────────────────────────────────────────────────────

    /// Lock `amount` of `employer`'s balance as liability for a new stream.
    /// Callable only by the registered PayrollStream contract.
    pub fn add_liability(env: Env, employer: Address, amount: i128) {
        Self::require_stream_caller(&env);
        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }

        let bal_key = DataKey::Balance(employer.clone());
        let liab_key = DataKey::Liability(employer.clone());
        let balance: i128 = env.storage().persistent().get(&bal_key).unwrap_or(0);
        let liability: i128 = env.storage().persistent().get(&liab_key).unwrap_or(0);

        let new_liability = liability + amount;
        if new_liability > balance {
            panic_with_error!(&env, Error::InsufficientBalance);
        }

        env.storage().persistent().set(&liab_key, &new_liability);
    }

    /// Reduce `employer`'s liability by `amount` (e.g. on stream cancel).
    /// Callable only by the registered PayrollStream contract.
    pub fn reduce_liability(env: Env, employer: Address, amount: i128) {
        Self::require_stream_caller(&env);
        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }

        let liab_key = DataKey::Liability(employer.clone());
        let liability: i128 = env.storage().persistent().get(&liab_key).unwrap_or(0);
        if amount > liability {
            panic_with_error!(&env, Error::InsufficientLiability);
        }

        env.storage().persistent().set(&liab_key, &(liability - amount));
    }

    /// Pay `worker` `amount` out of `employer`'s vault.
    /// Decrements both balance and liability by `amount`.
    /// Callable only by the registered PayrollStream contract.
    pub fn pay_worker(env: Env, employer: Address, worker: Address, amount: i128) {
        Self::require_stream_caller(&env);
        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }

        let bal_key = DataKey::Balance(employer.clone());
        let liab_key = DataKey::Liability(employer.clone());
        let balance: i128 = env.storage().persistent().get(&bal_key).unwrap_or(0);
        let liability: i128 = env.storage().persistent().get(&liab_key).unwrap_or(0);

        if amount > balance {
            panic_with_error!(&env, Error::InsufficientBalance);
        }
        if amount > liability {
            panic_with_error!(&env, Error::InsufficientLiability);
        }

        // Move real tokens to worker
        let token_addr = Self::require_token(&env);
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&env.current_contract_address(), &worker, &amount);

        env.storage().persistent().set(&bal_key, &(balance - amount));
        env.storage().persistent().set(&liab_key, &(liability - amount));

        env.events().publish(
            (Symbol::new(&env, "vault"), Symbol::new(&env, "pay_worker")),
            (employer, worker, amount),
        );
    }

    // ──────────────────────────────────────────────────────────────────────
    // Read views (per-employer)
    // ──────────────────────────────────────────────────────────────────────

    pub fn get_balance(env: Env, employer: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Balance(employer))
            .unwrap_or(0)
    }

    pub fn get_liability(env: Env, employer: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Liability(employer))
            .unwrap_or(0)
    }

    pub fn get_available(env: Env, employer: Address) -> i128 {
        let balance: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Balance(employer.clone()))
            .unwrap_or(0);
        let liability: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Liability(employer))
            .unwrap_or(0);
        balance - liability
    }

    pub fn get_admin(env: Env) -> Address {
        Self::require_admin(&env)
    }

    pub fn get_token(env: Env) -> Address {
        Self::require_token(&env)
    }

    pub fn get_stream_contract(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::StreamContract)
            .unwrap_or_else(|| panic_with_error!(&env, Error::NotInitialized))
    }

    // ──────────────────────────────────────────────────────────────────────
    // Internal helpers
    // ──────────────────────────────────────────────────────────────────────

    fn require_admin(env: &Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic_with_error!(env, Error::NotInitialized))
    }

    fn require_token(env: &Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Token)
            .unwrap_or_else(|| panic_with_error!(env, Error::NotInitialized))
    }

    /// Enforces that the immediate caller is the registered stream contract
    /// and that it has authorized this invocation (cross-contract auth).
    fn require_stream_caller(env: &Env) {
        let stream: Address = env
            .storage()
            .instance()
            .get(&DataKey::StreamContract)
            .unwrap_or_else(|| panic_with_error!(env, Error::NotInitialized));
        stream.require_auth();
    }
}
