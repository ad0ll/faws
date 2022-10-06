use std::fmt;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{near_bindgen, AccountId, Balance};

pub const STORAGE_COST: Balance = 1_000_000_000_000_000_000_000;
//1.1 NEAR
pub const MIN_STORAGE: Balance = 1_000_000_000_000_000_000_000;
//1.1 NEAR
pub const TGAS: u64 = 1_000_000_000_000;
pub const DEFAULT_NODE_OWNER_ID: &str = "default-node.test.near";
pub const DEFAULT_BOUNTY_OWNER_ID: &str = "default-bounty.test.near";

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Eq, PartialEq, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct Gpu {
    pub brand: String,
    pub architecture: String,
    pub cores: u128,
    pub memory: u128,
}

//TODO This struct should be considered when calculating the storage fee.
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Eq, PartialEq, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct Node {
    pub owner_id: AccountId,
    pub last_run: u64,
    pub last_success: u64,
    pub last_failure: u64,
    pub successful_runs: u64,
    pub failed_runs: u64,
    pub gpus: Vec<Gpu>,
}

#[near_bindgen]
impl Node {
    pub fn new(owner_id: AccountId) -> Self {
        Self {
            owner_id,
            last_run: 0,
            last_success: 0,
            last_failure: 0,
            successful_runs: 0,
            failed_runs: 0,
            gpus: Vec::new(),
        }
    }
}

impl Default for Node {
    fn default() -> Self {
        Self {
            owner_id: DEFAULT_NODE_OWNER_ID.parse().unwrap(),
            last_run: 0,
            last_success: 0,
            last_failure: 0,
            successful_runs: 0,
            failed_runs: 0,
            gpus: Vec::new(),
        }
    }
}

impl fmt::Display for Node {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        //TODO get gpu printing
        write!(f, "Node {{ owner_id: {}, last_run: {}, last_success: {}, last_failure: {}, successful_runs: {}, failed_runs: {}, GPUS_LOL}}", self.owner_id, self.last_run, self.last_success, self.last_failure, self.successful_runs, self.failed_runs)
    }
}
