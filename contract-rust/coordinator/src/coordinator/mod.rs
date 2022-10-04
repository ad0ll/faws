use std::collections::HashMap;
use std::fmt;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::UnorderedMap;
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{env, log, near_bindgen, AccountId, Balance};
use near_sdk::env::{current_account_id, signer_account_id};
use crate::bounty::Bounty;
use crate::node::Node;
use crate::util;

use rand::{thread_rng, Rng};
use regex::Regex;
use lazy_static::lazy_static;
pub const STORAGE_COST: Balance = 1_000_000_000_000_000_000_000;
//1.1 NEAR
pub const MIN_STORAGE: Balance = 1_000_000_000_000_000_000_000;
//1.1 NEAR
pub const TGAS: u64 = 1_000_000_000_000;
pub const DEFAULT_NODE_OWNER_ID: &str = "default-node.test.near";
pub const DEFAULT_BOUNTY_OWNER_ID: &str = "default-bounty.test.near";


#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
// #[serde(crate = "near_sdk::serde")]
pub struct Coordinator {
    pub nodes: UnorderedMap<AccountId, Node>,
    pub node_queue: Vec<AccountId>,
    pub curr_idx: usize, // Used for 0(1) node selection from queue
    pub bounties: UnorderedMap<AccountId, Bounty>,
    pub offline_nodes: UnorderedMap<AccountId, Node>, //Offline nodes are moved here, and can be moved back when the node owner themselves brings it back online
    // pub bounties: Map<Bounty, NodeMetadata>,
}

// Define the default, which automatically initializes the contract
impl Default for Coordinator {
    fn default() -> Self {

        Self {
            nodes: UnorderedMap::new("coordinator.nodes".as_bytes().to_vec()),
            node_queue: Vec::new(),
            curr_idx: 0,
            bounties: UnorderedMap::new("coordinator.bounties".as_bytes().to_vec()),
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
            nodes: UnorderedMap::new("coordinator.nodes".as_bytes()),
            node_queue: Vec::new(),
            curr_idx: 0,
            bounties: UnorderedMap::new("coordinator.bounties".as_bytes()),
            offline_nodes: UnorderedMap::new("coordinator.bounties".as_bytes()),
        }
    }
    #[private]
    pub fn is_owner_or_coordinator(account_id: AccountId) -> bool { //TODO how can I invoke this function? how can I make it into a trait?
        return account_id == signer_account_id() || signer_account_id() == current_account_id();
    }


    pub fn get_node_count(&self) -> u64 {
        log!("get_node_count");
        return self.nodes.len();
    }
    pub fn get_offline_node_count(&self) -> u64 {
        return self.offline_nodes.len();
    }

    pub fn get_node(&self, account_id: AccountId) -> Node {
        return self.nodes.get(&account_id).unwrap();
    }

    pub fn get_nodes(&self) -> Vec<Node> {
        let mut nodes: Vec<Node> = vec![];
        for node in self.nodes.values() {
            nodes.push(node);
        }
        return nodes;
    }

    pub fn register_node(&mut self, name: String) -> Node {
        let account_id: AccountId = format!("{}.node.{}", name, env::current_account_id().to_string())
            .parse()
            .unwrap();
        log!("adding node with id {}", account_id);
        assert!(self.nodes.get(&account_id).is_none(), "Node already registered");
        let metadata = Node::new(env::signer_account_id(), true); //TODO: allow network shouldn't be hardcoded
        self.nodes.insert(&account_id, &metadata);
        self.node_queue.push(account_id);
        log!("finished adding node to coordinator, metadata: {}", metadata);
        return self.nodes.get(&account_id).unwrap();
    }

    pub fn remove_node(&mut self, account_id: AccountId) {
        println!("attempting to remove node with id {}", account_id);
        let node = self.nodes.get(&account_id);
        assert!(!node.is_none(), "Could not find node to remove");
        assert!(env::signer_account_id() == node.unwrap().owner_id || env::signer_account_id() == current_account_id(), "Only the owner of the node or the coordinator can remove it");
        self.nodes.remove(&account_id);
        log!("removed node with id {}", account_id);
    }

    pub fn set_node_offline(&mut self, account_id: AccountId, offline: bool) -> Node {
        let removed: Node;
        if offline {
            log!("Moving node {account_id} to offline");
            let node = self.nodes.get(&account_id).unwrap();
            assert!(node.owner_id == env::signer_account_id() || env::signer_account_id() == current_account_id(), "Only the owner of the node or the coordinator can set it offline");
            removed = self.nodes.remove(&account_id).unwrap();
            self.offline_nodes.insert(&account_id, &removed);
        } else {
            log!("Bringing node {account_id} online");
            let node = self.offline_nodes.get(&account_id).unwrap();
            assert!(node.owner_id == env::signer_account_id() || env::signer_account_id() == current_account_id(), "Only the owner of the node or the coordinator can set it offline");
            removed = self.offline_nodes.remove(&account_id).unwrap();
            self.nodes.insert(&account_id, &removed);
        }
        return removed;
    }


    // TODO refactor this to drop queue implementation in favor of random selection, since that always shuffles the queue
    // Queue selects nodes in order, then shuffles them to keep nodes moving around.
    //Random removes node from random index in O(1) by swapping the removal target with the tail prior to removal.  At the end, the removed nodes are pushed to the end (O(1) n times for each pushed node).
    pub fn create_bounty(&mut self, name: String, file_location: String, file_download_protocol: String, threshold: u64, total_nodes: u64, network_required: bool, amt_storage: Balance, amt_node_reward: Balance, election_strategy: String) {
        assert!(total_nodes.clone() <= self.nodes.len(), "Total nodes cannot be greater than the number of nodes available in the coordinator");
        // if threshold == self.node.len(){} //TODO
        let mut bounty = Bounty::new(name, file_location, file_download_protocol, threshold, total_nodes, network_required, amt_storage,  amt_node_reward);

        // Node election
        let mut rng = thread_rng();
        // Elect nodes using either an in-order queue or random indexes
        while bounty.elected_nodes.len() < total_nodes.clone() as usize {
            if election_strategy == "queue" {
                let key = &self.node_queue[self.curr_idx.clone()];
                assert!(!bounty.elected_nodes.contains(&key), "Node already elected");
                bounty.elected_nodes.push(key.clone());
                self.curr_idx += 1;
                if self.curr_idx >= self.node_queue.len() {
                    self.curr_idx = 0;
                } //TODO This doesn't work as expected
            } else {
                let random_node = rng.gen_range(0..self.nodes.len()) as usize;
                // let key = self.node_queue.swap_remove(random_node); // O(1) by replacing removed with last element
                let key = &self.node_queue.swap_remove(random_node); // Remove node to eliminate possibility of collisions
                assert!(!bounty.elected_nodes.contains(&key), "Node already elected");
                bounty.elected_nodes.push(key.clone());
            }
        }

        if election_strategy == "queue" {
            self.shuffle_nodes(total_nodes.clone());
        } else { // Put removed nodes back at the end of the queue
            for (_, node) in bounty.elected_nodes.iter().enumerate() {
                self.node_queue.push(node.clone());
                log!("Elected node: {}", node);
            }
        }
    }
    

    // O(n) shuffle where n is the number of shuffles to do.
    // Actual shuffle is O(1) because we swap the last element with the random element and push the random element at the end
    pub fn shuffle_nodes(&mut self, n: u64) {
        assert!(n > 0, "n must be greater than 0");
        let mut i = 0;
        let mut rng = thread_rng();
        while i < n {
            let src = rng.gen_range(0..self.node_queue.len());
            let node = self.node_queue.swap_remove(src);
            self.node_queue.push(node);
            i += 1;
        }
    }
}


/*
* #[cfg(not(target_arch = "wasm32"))]
* pub mod test_utils;
*/

/*
 * The rest of this file holds the inline tests for the code above
 * Learn more about Rust tests: https://doc.rust-lang.org/book/ch11-01-writing-tests.html
 */
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_file_location_protocol() {
        let contract = Coordinator::default();
        let mut file_location = "https://ipfs.io/ipfs/Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
        assert!(util::file_location_protocol(file_location.to_string()) == "https", "File location protocol should be https");
        file_location = "git@github.com:ad0ll/docker-hello-world.git";
        assert!(util::file_location_protocol(file_location.to_string()) == "git", "File location protocol should be git");
        // file_location = "https://github.com/ad0ll/docker-hello-world.git";
    }
    #[test]
    fn get_default_greeting() {
        let contract = Coordinator::default();
        // let account_id: AccountId = "test".parse().unwrap();
        // let owner_pk = "owner_pk".to_string();
        // let account_pk = "account_pk".to_string();
        // let account = NodeMetadata::new(owner_pk.clone(), account_pk.clone());
        assert_eq!(contract.get_node_count(), 0);
        assert_eq!(contract.get_offline_node_count(), 0);
        // contract.register_node(account_id.clone(), account);
        // assert_eq!(contract.get_node_len(), 1);
        //ASSERT E
        // let res = contract.get_node(account_id.clone());
        // assert_eq!(res.owner_pk, owner_pk);
        // assert_eq!(res.account_pk, account_pk);
        // contract.toggle_node_offline(account_id.clone(), true);
        // assert_eq!(contract.get_node_len(), 0);
        // assert_eq!(contract.get_offline_node_len(), 1);

        // this test did not call set_greeting so should return the default "Hello" greeting
        // assert_eq!(
        //     contract.get_offline(),
        //     false
        // );
    }
}


