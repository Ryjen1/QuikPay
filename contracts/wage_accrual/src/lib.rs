#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Env, Symbol,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    VaultBalance(Address), // Maps Employer -> Token -> Balance
    Accrual(Address),      // Maps Worker -> Accrual details
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct AccrualState {
    pub employer: Address,
    pub token: Address,
    pub rate_per_second: i128,
    pub start_time: u64,
    pub end_time: u64,
    pub amount_claimed: i128,
}

#[contract]
pub struct WageAccrualContract;

#[contractimpl]
impl WageAccrualContract {
    /// Deposit funds into an employer's treasury balance.
    pub fn deposit(env: Env, employer: Address, token: Address, amount: i128) {
        employer.require_auth();
        if amount <= 0 {
            panic!("Amount must be greater than zero");
        }

        // Transfer tokens from the employer to this contract
        let token_client = token::Client::new(&env, &token);
        let contract_address = env.current_contract_address();
        token_client.transfer(&employer, &contract_address, &amount);

        // Update internal balance
        let balance_key = DataKey::VaultBalance(employer.clone());
        let current_balance: i128 = env.storage().persistent().get(&balance_key).unwrap_or(0);
        env.storage()
            .persistent()
            .set(&balance_key, &(current_balance + amount));
    }

    /// Set up a time-based wage accrual for a specific worker.
    pub fn setup_accrual(
        env: Env,
        employer: Address,
        worker: Address,
        token: Address,
        rate_per_second: i128,
        start_time: u64,
        end_time: u64,
    ) {
        employer.require_auth();

        if rate_per_second <= 0 || start_time >= end_time {
            panic!("Invalid time or rate parameters");
        }

        let accrual_key = DataKey::Accrual(worker.clone());
        if env.storage().persistent().has(&accrual_key) {
            panic!("Accrual already exists for this worker");
        }

        let accrual = AccrualState {
            employer,
            token,
            rate_per_second,
            start_time,
            end_time,
            amount_claimed: 0,
        };

        env.storage().persistent().set(&accrual_key, &accrual);
    }

    /// Claim accrued wages for the authorized worker.
    pub fn claim_wages(env: Env, worker: Address) {
        worker.require_auth();

        let accrual_key = DataKey::Accrual(worker.clone());
        let mut accrual: AccrualState = env
            .storage()
            .persistent()
            .get(&accrual_key)
            .expect("No accrual found for worker");

        let current_time = env.ledger().timestamp();
        if current_time <= accrual.start_time {
            panic!("Accrual hasn't started yet");
        }

        let effective_time = if current_time > accrual.end_time {
            accrual.end_time
        } else {
            current_time
        };

        let elapsed_seconds = effective_time - accrual.start_time;
        let total_earned = (elapsed_seconds as i128) * accrual.rate_per_second;
        let claimable = total_earned - accrual.amount_claimed;

        if claimable <= 0 {
            panic!("No wages currently claimable");
        }

        // Deduct from employer's vault balance
        let balance_key = DataKey::VaultBalance(accrual.employer.clone());
        let current_balance: i128 = env
            .storage()
            .persistent()
            .get(&balance_key)
            .expect("Employer has no funds");

        if current_balance < claimable {
            panic!("Employer treasury insolvent");
        }

        env.storage()
            .persistent()
            .set(&balance_key, &(current_balance - claimable));

        // Update accrual claimed amount
        accrual.amount_claimed += claimable;
        env.storage().persistent().set(&accrual_key, &accrual);

        // Transfer funds to worker
        let token_client = token::Client::new(&env, &accrual.token);
        token_client.transfer(&env.current_contract_address(), &worker, &claimable);
    }

    /// View helper: Get current claimable amount for a worker
    pub fn get_claimable(env: Env, worker: Address) -> i128 {
        let accrual_key = DataKey::Accrual(worker);
        let accrual: Option<AccrualState> = env.storage().persistent().get(&accrual_key);
        
        match accrual {
            Some(a) => {
                let current_time = env.ledger().timestamp();
                if current_time <= a.start_time {
                    return 0;
                }
                
                let effective_time = if current_time > a.end_time {
                    a.end_time
                } else {
                    current_time
                };
                
                let elapsed_seconds = effective_time - a.start_time;
                let total_earned = (elapsed_seconds as i128) * a.rate_per_second;
                total_earned - a.amount_claimed
            },
            None => 0,
        }
    }
}
