#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Env, Symbol, Vec,
};
use quikpay_common::QuikPayHelpers;

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
    Stream(u64),
    StreamCounter,
    EmployerStreams(Address),
    WorkerStreams(Address),
}

#[contract]
pub struct PayrollStreamContract;

#[contractimpl]
impl PayrollStreamContract {
    pub fn initialize(env: Env, admin: Address) {
        env.storage().persistent().set(&DataKey::Admin, &admin);
        env.storage().persistent().set(&DataKey::StreamCounter, &0u64);
    }

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
            panic!("Invalid amount");
        }

        if start_ts >= end_ts {
            panic!("Invalid time range");
        }

        let current_ts = env.ledger().timestamp();
        if start_ts < current_ts {
            panic!("Start time in past");
        }

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
            .set(&DataKey::EmployerStreams(employer), &employer_streams);

        let mut worker_streams: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::WorkerStreams(worker.clone()))
            .unwrap_or_else(|| Vec::new(&env));
        worker_streams.push_back(stream_id);
        env.storage()
            .persistent()
            .set(&DataKey::WorkerStreams(worker), &worker_streams);

        stream_id
    }

    pub fn cancel_stream(env: Env, stream_id: u64, employer: Address) {
        employer.require_auth();

        let mut stream: Stream = env
            .storage()
            .persistent()
            .get(&DataKey::Stream(stream_id))
            .unwrap_or_else(|| panic!("Stream not found"));

        if stream.employer != employer {
            panic!("Not employer");
        }

        if stream.status != 0 {
            panic!("Stream closed");
        }

        let current_ts = env.ledger().timestamp();
        stream.status = 1;
        stream.closed_at = current_ts;
        env.storage()
            .persistent()
            .set(&DataKey::Stream(stream_id), &stream);
    }

    pub fn withdraw(env: Env, worker: Address, stream_id: u64, amount: i128) {
        worker.require_auth();

        if amount <= 0 {
            panic!("Invalid amount");
        }

        let mut stream: Stream = env
            .storage()
            .persistent()
            .get(&DataKey::Stream(stream_id))
            .unwrap_or_else(|| panic!("Stream not found"));

        if stream.worker != worker {
            panic!("Not worker");
        }

        if stream.status != 0 {
            panic!("Stream closed");
        }

        let current_ts = env.ledger().timestamp();
        if current_ts < stream.cliff_ts {
            panic!("Invalid cliff");
        }

        let effective_ts = if current_ts > stream.end_ts {
            stream.end_ts
        } else {
            current_ts
        };
        let elapsed = effective_ts.saturating_sub(stream.start_ts);
        let total_earned = (elapsed as i128) * stream.rate;
        let claimable = total_earned - stream.withdrawn_amount;

        let withdraw_amount = if amount > claimable {
            claimable
        } else {
            amount
        };

        if withdraw_amount <= 0 {
            panic!("No withdrawable amount");
        }

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
