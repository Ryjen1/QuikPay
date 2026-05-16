#![no_std]
//! PayrollStream
//! -------------
//! Manages time-based wage streams between employers and workers.
//!
//! All actual XLM custody and movement lives in the PayrollVault contract.
//! This contract is the only authorized caller of PayrollVault's
//! `add_liability`, `reduce_liability`, and `pay_worker` entrypoints.
//!
//! Lifecycle
//! ─────────
//! * create_stream(...)  – locks `total_amount` of employer balance as liability
//! * withdraw(...)       – pays accrued wages to worker, reduces liability
//! * cancel_stream(...)  – releases remaining locked liability back to employer

use soroban_sdk::{
    contract, contractclient, contracterror, contractimpl, contracttype,
    panic_with_error, Address, Env, Symbol, Vec,
};

// ─── External vault interface ────────────────────────────────────────────────

#[contractclient(name = "PayrollVaultClient")]
pub trait PayrollVaultInterface {
    fn add_liability(env: Env, employer: Address, amount: i128);
    fn reduce_liability(env: Env, employer: Address, amount: i128);
    fn pay_worker(env: Env, employer: Address, worker: Address, amount: i128);
    fn get_available(env: Env, employer: Address) -> i128;
}

// ─── Storage & types ─────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, Debug)]
#[repr(u32)]
pub enum StreamStatus {
    Active = 0,
    Canceled = 1,
    Completed = 2,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Stream {
    pub id: u64,
    pub employer: Address,
    pub worker: Address,
    pub token: Address,
    pub rate: i128,
    pub cliff_ts: u64,
    pub start_ts: u64,
    pub end_ts: u64,
    pub total_amount: i128,
    pub withdrawn_amount: i128,
    pub last_withdrawal_ts: u64,
    pub status: u32,
    pub created_at: u64,
    pub closed_at: u64,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Vault,
    Stream(u64),
    StreamCounter,
    EmployerStreams(Address),
    WorkerStreams(Address),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    InvalidAmount = 3,
    InvalidTimeRange = 4,
    StartInPast = 5,
    StreamNotFound = 6,
    NotEmployer = 7,
    NotWorker = 8,
    StreamClosed = 9,
    BeforeCliff = 10,
    NothingWithdrawable = 11,
}

#[contract]
pub struct PayrollStreamContract;

#[contractimpl]
impl PayrollStreamContract {
    /// Initialize with admin + the PayrollVault contract address this stream
    /// contract should drive.
    pub fn initialize(env: Env, admin: Address, vault: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic_with_error!(&env, Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Vault, &vault);
        env.storage().persistent().set(&DataKey::StreamCounter, &0u64);
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic_with_error!(&env, Error::NotInitialized))
    }

    pub fn get_vault(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Vault)
            .unwrap_or_else(|| panic_with_error!(&env, Error::NotInitialized))
    }

    // ───────────────────────────────────────────────────────────────────────
    // create_stream – locks `total_amount` into vault liability for employer
    // ───────────────────────────────────────────────────────────────────────

    pub fn create_stream(
        env: Env,
        employer: Address,
        worker: Address,
        token: Address,
        rate: i128,
        amount: i128,
        start_ts: u64,
        end_ts: u64,
    ) -> u64 {
        employer.require_auth();

        if rate <= 0 || amount <= 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }
        if start_ts >= end_ts {
            panic_with_error!(&env, Error::InvalidTimeRange);
        }

        let current_ts = env.ledger().timestamp();
        if start_ts < current_ts {
            panic_with_error!(&env, Error::StartInPast);
        }

        // Reserve funds in the vault for this stream
        let vault_addr = Self::get_vault(env.clone());
        let vault = PayrollVaultClient::new(&env, &vault_addr);
        vault.add_liability(&employer, &amount);

        let counter: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::StreamCounter)
            .unwrap_or(0);
        let stream_id = counter + 1;
        env.storage()
            .persistent()
            .set(&DataKey::StreamCounter, &stream_id);

        let stream = Stream {
            id: stream_id,
            employer: employer.clone(),
            worker: worker.clone(),
            token,
            rate,
            cliff_ts: start_ts,
            start_ts,
            end_ts,
            total_amount: amount,
            withdrawn_amount: 0,
            last_withdrawal_ts: 0,
            status: 0,
            created_at: current_ts,
            closed_at: 0,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Stream(stream_id), &stream);

        let mut employer_streams: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::EmployerStreams(employer.clone()))
            .unwrap_or_else(|| Vec::new(&env));
        employer_streams.push_back(stream_id);
        env.storage()
            .persistent()
            .set(&DataKey::EmployerStreams(employer.clone()), &employer_streams);

        let mut worker_streams: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::WorkerStreams(worker.clone()))
            .unwrap_or_else(|| Vec::new(&env));
        worker_streams.push_back(stream_id);
        env.storage()
            .persistent()
            .set(&DataKey::WorkerStreams(worker.clone()), &worker_streams);

        env.events().publish(
            (Symbol::new(&env, "stream"), Symbol::new(&env, "created")),
            (stream_id, employer, worker, amount),
        );

        stream_id
    }

    // ───────────────────────────────────────────────────────────────────────
    // cancel_stream – releases remaining (unwithdrawn) liability back to employer
    // ───────────────────────────────────────────────────────────────────────

    pub fn cancel_stream(env: Env, stream_id: u64, employer: Address) {
        employer.require_auth();

        let mut stream: Stream = env
            .storage()
            .persistent()
            .get(&DataKey::Stream(stream_id))
            .unwrap_or_else(|| panic_with_error!(&env, Error::StreamNotFound));

        if stream.employer != employer {
            panic_with_error!(&env, Error::NotEmployer);
        }
        if stream.status != 0 {
            panic_with_error!(&env, Error::StreamClosed);
        }

        let remaining = stream.total_amount - stream.withdrawn_amount;
        if remaining > 0 {
            let vault_addr = Self::get_vault(env.clone());
            let vault = PayrollVaultClient::new(&env, &vault_addr);
            vault.reduce_liability(&employer, &remaining);
        }

        let current_ts = env.ledger().timestamp();
        stream.status = 1;
        stream.closed_at = current_ts;
        env.storage()
            .persistent()
            .set(&DataKey::Stream(stream_id), &stream);

        env.events().publish(
            (Symbol::new(&env, "stream"), Symbol::new(&env, "canceled")),
            (stream_id, employer, remaining),
        );
    }

    // ───────────────────────────────────────────────────────────────────────
    // withdraw – pays accrued wages to worker via vault.pay_worker
    // ───────────────────────────────────────────────────────────────────────

    pub fn withdraw(env: Env, worker: Address, stream_id: u64, amount: i128) {
        worker.require_auth();
        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }

        let mut stream: Stream = env
            .storage()
            .persistent()
            .get(&DataKey::Stream(stream_id))
            .unwrap_or_else(|| panic_with_error!(&env, Error::StreamNotFound));

        if stream.worker != worker {
            panic_with_error!(&env, Error::NotWorker);
        }
        if stream.status != 0 {
            panic_with_error!(&env, Error::StreamClosed);
        }

        let current_ts = env.ledger().timestamp();
        if current_ts < stream.cliff_ts {
            panic_with_error!(&env, Error::BeforeCliff);
        }

        let effective_ts = if current_ts > stream.end_ts {
            stream.end_ts
        } else {
            current_ts
        };
        let elapsed = effective_ts.saturating_sub(stream.start_ts);
        let total_earned = (elapsed as i128) * stream.rate;
        // Don't exceed the stream's allocated total
        let total_earned = if total_earned > stream.total_amount {
            stream.total_amount
        } else {
            total_earned
        };
        let claimable = total_earned - stream.withdrawn_amount;

        let withdraw_amount = if amount > claimable {
            claimable
        } else {
            amount
        };

        if withdraw_amount <= 0 {
            panic_with_error!(&env, Error::NothingWithdrawable);
        }

        // Move funds via the vault — this transfers real XLM to the worker
        // and decrements both the employer's balance and liability.
        let vault_addr = Self::get_vault(env.clone());
        let vault = PayrollVaultClient::new(&env, &vault_addr);
        vault.pay_worker(&stream.employer, &worker, &withdraw_amount);

        stream.withdrawn_amount += withdraw_amount;
        stream.last_withdrawal_ts = current_ts;

        if current_ts >= stream.end_ts && stream.withdrawn_amount >= stream.total_amount {
            stream.status = 2;
            stream.closed_at = current_ts;
        }

        env.storage()
            .persistent()
            .set(&DataKey::Stream(stream_id), &stream);

        env.events().publish(
            (Symbol::new(&env, "stream"), Symbol::new(&env, "withdrawn")),
            (stream_id, worker, withdraw_amount, stream.token),
        );
    }

    // ───────────────────────────────────────────────────────────────────────
    // Read views
    // ───────────────────────────────────────────────────────────────────────

    pub fn get_withdrawable(env: Env, stream_id: u64) -> i128 {
        let stream: Option<Stream> = env.storage().persistent().get(&DataKey::Stream(stream_id));
        match stream {
            Some(s) => {
                if s.status != 0 {
                    return 0;
                }
                let current_ts = env.ledger().timestamp();
                if current_ts < s.cliff_ts {
                    return 0;
                }
                let effective_ts = if current_ts > s.end_ts {
                    s.end_ts
                } else {
                    current_ts
                };
                let elapsed = effective_ts.saturating_sub(s.start_ts);
                let total_earned = (elapsed as i128) * s.rate;
                let total_earned = if total_earned > s.total_amount {
                    s.total_amount
                } else {
                    total_earned
                };
                let claimable = total_earned - s.withdrawn_amount;
                if claimable < 0 {
                    0
                } else {
                    claimable
                }
            }
            None => 0,
        }
    }

    pub fn get_stream(env: Env, stream_id: u64) -> Option<Stream> {
        env.storage().persistent().get(&DataKey::Stream(stream_id))
    }

    pub fn get_streams_by_worker(env: Env, worker: Address) -> Vec<u64> {
        env.storage()
            .persistent()
            .get(&DataKey::WorkerStreams(worker))
            .unwrap_or_else(|| Vec::new(&env))
    }

    pub fn get_streams_by_employer(env: Env, employer: Address) -> Vec<u64> {
        env.storage()
            .persistent()
            .get(&DataKey::EmployerStreams(employer))
            .unwrap_or_else(|| Vec::new(&env))
    }
}
