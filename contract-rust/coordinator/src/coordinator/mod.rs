use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::UnorderedMap;
use near_sdk::{env, log, near_bindgen, AccountId, Balance, require};
use near_sdk::env::{current_account_id, log_str, signer_account_id};
use crate::bounty::{Bounty, SupportedDownloadProtocols};
use crate::node::Node;
use near_sdk::serde::{Deserialize, Serialize};
use near_units::{parse_near};
use rand::{thread_rng, Rng};
use crate::events::{BountyCreatedLog, EventLog, EventLogVariant};


pub const STORAGE_COST: Balance = parse_near!("1 N");
//1.1 NEAR
pub const MIN_STORAGE: Balance = parse_near!("1 N");
//1.1 NEAR
pub const DEFAULT_NODE_OWNER_ID: &str = "default-node.test.near";
pub const DEFAULT_BOUNTY_OWNER_ID: &str = "default-bounty.test.near";
pub const EVENT_STANDARD_NAME: &str = "NEP-297";
pub const EVENT_STANDARD_SPEC: &str = "1.0.0";


#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct Coordinator {
    pub nodes: UnorderedMap<AccountId, Node>,
    pub node_queue: Vec<AccountId>,
    pub curr_idx: usize,
    // Used for 0(1) node selection from queue
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
            offline_nodes: UnorderedMap::new("coordinator.offline_nodes".as_bytes().to_vec())
        }
    }
}

// Implement the contract structure
#[near_bindgen]
impl Coordinator {
    #[init]
    #[private] // Public - but only callable by env::current_account_id()
    pub fn init() -> Self {
        require!(!env::state_exists(), "Already initialized");
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

    pub fn get_bounty_count(&self) -> u64 {
        log!("get_node_count");
        return self.bounties.len();
    }
    pub fn get_offline_node_count(&self) -> u64 {
        return self.offline_nodes.len();
    }

    pub fn get_node(&self, account_id: AccountId) -> Node {
        return self.nodes.get(&account_id).unwrap();
    }

    //Serialize override necessary because Bounty contains an UnorderedMap
    #[result_serializer(borsh)]
    pub fn get_bounty(&self, account_id: AccountId) -> Bounty {
        return self.bounties.get(&account_id).unwrap();
    }

    //TODO This NEEDS pagination
    pub fn get_nodes(&self) -> Vec<Node> {
        let mut nodes: Vec<Node> = vec![];
        for node in self.nodes.values() {
            nodes.push(node);
        }
        return nodes;
    }

    //TODO This NEEDS pagination
    #[result_serializer(borsh)]
    pub fn get_bounties(&self) -> Vec<Bounty> {
        let mut bounties: Vec<Bounty> = vec![];
        for bounty in self.bounties.values() {
            bounties.push(bounty);
        }
        return bounties;
    }


    pub fn register_node(&mut self, name: String) -> Node {
        println!("register_node");
        let account_id: AccountId = format!("{}.node.{}", name, current_account_id().to_string())
            .parse()
            .unwrap();
        println!("account_id: {}", account_id);
        require!(self.nodes.get(&account_id).is_none(), "Node already registered");
        let metadata = Node::new(signer_account_id()); //TODO: allow network shouldn't be hardcoded
        self.nodes.insert(&account_id, &metadata);
        self.node_queue.push(account_id.clone());
        println!("finished adding node to coordinator, metadata: {}", metadata);
        return self.nodes.get(&account_id).unwrap();
    }

    pub fn remove_node(&mut self, account_id: AccountId) {
        println!("attempting to remove node with id {}", account_id);
        let node = self.nodes.get(&account_id);
        require!(!node.is_none(), "Could not find node to remove");
        require!(signer_account_id() == node.unwrap().owner_id || signer_account_id() == current_account_id(), "Only the owner of the node or the coordinator can remove it");
        self.nodes.remove(&account_id);
        log!("removed node with id {}", account_id);
    }

    pub fn set_node_offline(&mut self, account_id: AccountId, offline: bool) -> Node {
        let removed: Node;
        if offline {
            log!("Moving node {account_id} to offline");
            let node = self.nodes.get(&account_id).unwrap();
            require!(node.owner_id == signer_account_id() || signer_account_id() == current_account_id(), "Only the owner of the node or the coordinator can set it offline");
            removed = self.nodes.remove(&account_id).unwrap();
            self.offline_nodes.insert(&account_id, &removed);
        } else {
            log!("Bringing node {account_id} online");
            let node = self.offline_nodes.get(&account_id).unwrap();
            require!(node.owner_id == signer_account_id() || signer_account_id() == current_account_id(), "Only the owner of the node or the coordinator can set it offline");
            removed = self.offline_nodes.remove(&account_id).unwrap();
            self.nodes.insert(&account_id, &removed);
        }
        return removed;
    }


    // TODO refactor this to drop queue implementation in favor of random selection, since that always shuffles the queue
    // Queue selects nodes in order, then shuffles them to keep nodes moving around.
    //Random removes node from random index in O(1) by swapping the removal target with the tail prior to removal.  At the end, the removed nodes are pushed to the end (O(1) n times for each pushed node).
    pub fn create_bounty(&mut self, name: String, file_location: String, file_download_protocol: SupportedDownloadProtocols, threshold: u64, total_nodes: u64, network_required: bool, amt_storage: Balance, amt_node_reward: Balance) {
        require!(self.get_node_count() >= total_nodes, "Not enough nodes registered");
        require!(total_nodes.clone() <= self.nodes.len(), "Total nodes cannot be greater than the number of nodes available in the coordinator");
        let bounty_key: AccountId = format!("{}.bounty.{}", name, current_account_id().to_string()).parse().unwrap();
        require!(self.bounties.get(&bounty_key).is_none(), "Bounty already exists");
        // if threshold == self.node.len(){} //TODO
        let mut bounty = Bounty::init_bounty(name.clone(), file_location, file_download_protocol, threshold, total_nodes, network_required, amt_storage, amt_node_reward);
        //assert bounty owner id is signer id, important because owner_id is used for auth
        // Node election
        let mut rng = thread_rng();
        // Elect nodes using either an in-order queue or random indexes
        while bounty.elected_nodes.len() < total_nodes.clone() as usize {
            let mut key: AccountId;
            if self.node_queue.len() == 1{
                key = self.node_queue.pop().unwrap();
                println!("elected {} (only node in queue)", key);
            } else {
                let random_node = rng.gen_range(0..self.nodes.len()-1) as usize;
                println!("electing node at: {}", random_node.to_string());
                // let key = self.node_queue.swap_remove(random_node); // O(1) by replacing removed with last element
                key = self.node_queue.swap_remove(random_node); // Remove node to eliminate possibility of collisions
                println!("elected {} (was at index {})", key, random_node.to_string());
            }
            require!(!bounty.elected_nodes.contains(&key), "Node already elected");
            bounty.elected_nodes.push(key.clone());
        }

        for (_, node) in bounty.elected_nodes.iter().enumerate() {
            self.node_queue.push(node.clone());
            log!("Elected node: {}", node);
        }

        let bounty_created_log: EventLog = EventLog {
            standard: EVENT_STANDARD_NAME.to_string(),
            version: EVENT_STANDARD_SPEC.to_string(),
            event: EventLogVariant::BountyCreated(BountyCreatedLog{
                bounty_id: bounty_key.clone(),
                node_ids: bounty.elected_nodes.clone(),
                message: None
            })
        };
        log_str(&bounty_created_log.to_string());


        self.bounties.insert(&bounty_key, &bounty);
        // return bounty;
    }

    pub fn evaluate_answers(&mut self) {
        //TODO
        // Numbers can be standard deviation to drop outliers
        // Strings can be levenshtein distance, but is that going to perform well? At a minimum requires async
    }

    // O(n) shuffle where n is the number of shuffles to do.
    // Actual shuffle is O(1) because we swap the last element with the random element and push the random element at the end
    pub fn shuffle_nodes(&mut self, n: u64) {
        require!(n > 0, "n must be greater than 0");
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

    // #[test]
    // fn test_file_location_protocol() {
    //     let contract = Coordinator::default();
    //     let mut file_location = "https://ipfs.io/ipfs/Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
    //     require!(util::file_location_protocol(file_location.to_string()) == "https", "File location protocol should be https");
    //     file_location = "git@github.com:ad0ll/docker-hello-world.git";
    //     require!(util::file_location_protocol(file_location.to_string()) == "git", "File location protocol should be git");
    //     // file_location = "https://github.com/ad0ll/docker-hello-world.git";
    // }


    #[test]
    fn can_register_node() {
        let mut coordinator = Coordinator::default();
        let name = "test".to_string();
        let account_id: AccountId = format!("{}.node.{}", name, current_account_id().to_string())
            .parse()
            .unwrap();
        let node = coordinator.register_node(name);
        assert_eq!(node.owner_id, signer_account_id(), "Owner id should be current account id");
        assert_eq!(coordinator.get_node_count(), 1, "Node count should be 1");
        assert!(coordinator.nodes.get(&account_id).is_some(), "Should be able to retrieve node");
        assert!(coordinator.get_nodes().contains(&node), "Should be able to retrieve node from full listing");

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
    #[test]
    fn can_mark_node_offline(){
        let mut coordinator = Coordinator::default();
        let name = "test".to_string();
        let account_id: AccountId = format!("{}.node.{}", name, current_account_id().to_string())
            .parse()
            .unwrap();
        let node = coordinator.register_node(name);
        //TODO
    }

    #[test]
    fn can_register_bounty() {
        let mut coordinator = Coordinator::default();
        coordinator.register_node("test1".to_string());
        coordinator.register_node("test2".to_string());
        coordinator.register_node("test3".to_string());
        assert_eq!(coordinator.get_node_count(), 3, "Node count should be 3");
        let name = "test-bounty".to_string();
        let bounty = coordinator.create_bounty(
            name.clone(),
            "https://github.com/ad0ll/docker-hello-world".to_string(),
            SupportedDownloadProtocols::GIT,
            3,
            3,
            true,
            1000,
            1000,
        );
        assert_eq!(coordinator.get_bounty_count(), 1, "Bounty count should be 1");
        let bounty_key: AccountId = format!("{}.bounty.{}", name, current_account_id().to_string()).parse().unwrap();
        require!(coordinator.bounties.get(&bounty_key).is_some(), "Bounty should be retrievable");
        // require!(coordinator.get_bounties().contains(&bounty), "Bounty should be retrievable from full listing");
    }
}


