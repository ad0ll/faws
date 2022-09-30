use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::serde::{Deserialize, Deserializer, Serialize};
use near_sdk::{AccountId, Balance, env, log, near_bindgen, Promise, serde};
use near_sdk::collections::{UnorderedMap};

// use near_sdk::collections::{UnorderedMap, UnorderedSet};
// Define the default message
const DEFAULT_MESSAGE: &str = "Hello";

// struct gpu {
//     brand: String,
//     architecture: String,
//     cores: u128,
//     memory: u128,
// }
// Define the contract structure



pub const STORAGE_COST: Balance = 1_000_000_000_000_000_000_000; //1.1 NEAR
pub const MIN_STORAGE: Balance = 1_000_000_000_000_000_000_000; //1.1 NEAR


//TODO This struct should be considered when calculating the storage fee.
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct NodeMetadata {
    pub owner_pk: String, //TODO this should be a public key
    pub account_pk: String, //TODO this should be a public key
    pub last_run: u64,
    pub last_success: u64,
    pub last_failure: u64,
    pub successful_runs: u64,
    pub failed_runs: u64,
}

#[near_bindgen]
impl NodeMetadata{
    pub fn new(owner_pk: String, account_pk: String) -> Self {
        Self {
            owner_pk,
            account_pk,
            last_run: 0,
            last_success: 0,
            last_failure: 0,
            successful_runs: 0,
            failed_runs: 0,
        }
    }

}

impl Default for NodeMetadata {
    fn default() -> Self {
        Self {
            owner_pk: "".to_string(),
            account_pk: "".to_string(),
            last_run: 0,
            last_success: 0,
            last_failure: 0,
            successful_runs: 0,
            failed_runs: 0,
        }
    }
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
// #[serde(crate = "near_sdk::serde")]
pub struct Coordinator {
    pub nodes: UnorderedMap<AccountId, NodeMetadata>,
    pub offline_nodes: UnorderedMap<AccountId, NodeMetadata>, //Offline nodes are moved here, and can be moved back when the node owner themselves brings it back online
    // pub bounties: Map<Bounty, NodeMetadata>,
}


// Define the default, which automatically initializes the contract
impl Default for Coordinator{
    fn default() -> Self{
        Self{
            nodes: UnorderedMap::new("coordinator.nodes".as_bytes().to_vec()),
            offline_nodes: UnorderedMap::new("coordinator.offline_nodes".as_bytes().to_vec()),
        }
    }
}

// Implement the contract structure
#[near_bindgen]
impl Coordinator {

    #[init]
    #[private] // Public - but only callable by env::current_account_id()
    pub fn init() -> Self {
        assert!(!env::state_exists(), "Already initialized");
        Self {
            nodes: UnorderedMap::new("coordinator.nodes".as_bytes()), //TODO Official docs show b"string" instead of "string".to_bytes(), but my linter was yelling at me
            offline_nodes: UnorderedMap::new("coordinator.offline_nodes".as_bytes()),
        }
    }

    pub fn get_node_len(&self) -> u64{
        return self.nodes.len();
    }
    pub fn get_offline_node_len(&self) -> u64{
        return self.offline_nodes.len();
    }

    pub fn get_node(&self, account_id: AccountId) -> NodeMetadata{
        return  self.nodes.get(&account_id).unwrap();
    }

    pub fn get_node_full(&self, account_id: AccountId) -> NodeMetadata{
        // TODO fetch node from account_id and return full data from the coordinator and the node itself
        return  self.nodes.get(&account_id).unwrap();
    }

    pub fn register_node(&self, name: String) -> AccountId{
        let current_id = env::current_account_id();
        let account_id: AccountId = format!("{}.node.{}",name,&current_id.to_string()).parse().unwrap();
        let metadata = NodeMetadata::new(env::signer_account_id().to_string(), account_id.to_string());
        Promise::new(account_id.clone())
            .create_account()
            .transfer(MIN_STORAGE);
            // .deploy_contract(include_bytes!("../target/node.wasm").to_vec());
        // log!("{}", metadata);
        return account_id.clone();
    }

    #[private]
    pub fn add_node(&mut self, account_id: AccountId, node_metadata: NodeMetadata) -> NodeMetadata{
        return self.nodes.insert(&account_id,   &node_metadata).unwrap_or_default();
    }

    pub fn toggle_node_offline(&mut self, account_id: AccountId, offline: bool) -> NodeMetadata {
        // assert(env::signer_account_id() === )
        //TODO Check if account_id is account of signer_id or if signer_id is the coordinator
        let removed: NodeMetadata;
        if offline {
            log!("Moving node {account_id} to offline");
            removed = self.nodes.remove(&account_id).unwrap_or_default();
            self.offline_nodes.insert(&account_id, &removed);
        } else {
            log!("Bringing node {account_id} online");
            removed = self.offline_nodes.remove(&account_id).unwrap_or_default();
            self.nodes.insert(&account_id, &removed);
        }
        return removed;
    }


}






/*
 * The rest of this file holds the inline tests for the code above
 * Learn more about Rust tests: https://doc.rust-lang.org/book/ch11-01-writing-tests.html
 */
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn get_default_greeting() {
        let mut contract = Coordinator::default();
        let account_id: AccountId = "test".parse().unwrap();
        let owner_pk= "owner_pk".to_string();
        let account_pk= "account_pk".to_string();
        let account = NodeMetadata::new(owner_pk.clone(), account_pk.clone());
        assert_eq!(contract.get_node_len(), 0);
        assert_eq!(contract.get_offline_node_len(), 0);
        contract.add_node(account_id.clone(), account);
        assert_eq!(contract.get_node_len(), 1);
        //ASSERT E
        let res = contract.get_node(account_id.clone());
        assert_eq!(res.owner_pk, owner_pk);
        assert_eq!(res.account_pk,account_pk);
        contract.toggle_node_offline(account_id.clone(), true);
        assert_eq!(contract.get_node_len(), 0);
        assert_eq!(contract.get_offline_node_len(), 1);

        // this test did not call set_greeting so should return the default "Hello" greeting
        // assert_eq!(
        //     contract.get_offline(),
        //     false
        // );
    }

}
