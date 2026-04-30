#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, Address, Env, Vec,
};

#[contracttype]
#[derive(Clone, Debug)]
pub struct WorkerProfile {
    pub wallet: Address,
    pub employer: Address,
    pub preferred_token: Address,
    pub active: bool,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Worker(Address),
    EmployerWorkers(Address),
}

#[contract]
pub struct WorkforceRegistryContract;

#[contractimpl]
impl WorkforceRegistryContract {
    pub fn initialize(env: Env, admin: Address) {
        env.storage().persistent().set(&DataKey::Admin, &admin);
    }

    pub fn register_worker(env: Env, employer: Address, worker: Address, preferred_token: Address) {
        employer.require_auth();

        if env
            .storage()
            .persistent()
            .has(&DataKey::Worker(worker.clone()))
        {
            panic!("Worker already registered");
        }

        let profile = WorkerProfile {
            wallet: worker.clone(),
            employer: employer.clone(),
            preferred_token,
            active: false,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Worker(worker.clone()), &profile);

        let mut workers: Vec<Address> = env
            .storage()
            .persistent()
            .get(&DataKey::EmployerWorkers(employer.clone()))
            .unwrap_or_else(|| Vec::new(&env));
        workers.push_back(worker);
        env.storage()
            .persistent()
            .set(&DataKey::EmployerWorkers(employer), &workers);
    }

    pub fn set_stream_active(env: Env, employer: Address, worker: Address, active: bool) {
        employer.require_auth();

        let mut profile: WorkerProfile = env
            .storage()
            .persistent()
            .get(&DataKey::Worker(worker.clone()))
            .unwrap_or_else(|| panic!("Worker not found"));

        if profile.employer != employer {
            panic!("Insufficient permissions");
        }

        profile.active = active;
        env.storage()
            .persistent()
            .set(&DataKey::Worker(worker), &profile);
    }

    pub fn remove_worker(env: Env, employer: Address, worker: Address) {
        employer.require_auth();

        let profile: WorkerProfile = env
            .storage()
            .persistent()
            .get(&DataKey::Worker(worker.clone()))
            .unwrap_or_else(|| panic!("Worker not found"));

        if profile.employer != employer {
            panic!("Insufficient permissions");
        }

        env.storage()
            .persistent()
            .remove(&DataKey::Worker(worker.clone()));

        let mut workers: Vec<Address> = env
            .storage()
            .persistent()
            .get(&DataKey::EmployerWorkers(employer.clone()))
            .unwrap_or_else(|| Vec::new(&env));
        let idx = workers.iter().position(|w| w == worker.clone());
        if let Some(i) = idx {
            workers.remove(i as u32);
        }
        env.storage()
            .persistent()
            .set(&DataKey::EmployerWorkers(employer), &workers);
    }

    pub fn get_worker(env: Env, worker: Address) -> Option<WorkerProfile> {
        env.storage().persistent().get(&DataKey::Worker(worker))
    }

    pub fn is_registered(env: Env, worker: Address) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::Worker(worker))
    }

    pub fn get_workers_by_employer(env: Env, employer: Address) -> Vec<Address> {
        env.storage()
            .persistent()
            .get(&DataKey::EmployerWorkers(employer))
            .unwrap_or_else(|| Vec::new(&env))
    }
}
