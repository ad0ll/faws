use std::collections::HashMap;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::UnorderedMap;
use near_sdk::{env, log, near_bindgen, AccountId, Balance, require};
use near_sdk::env::{attached_deposit, current_account_id, log_str, signer_account_id};
use crate::bounty::{Bounty, BountyStatus, NodeResponse, NodeResponseStatus, SupportedDownloadProtocols};
use crate::node::Node;

use crate::events::{BountyCreatedLog, EventLog, EventLogVariant};


// pub const STORAGE_COST: Balance = parse_near!("1 N");
pub const STORAGE_COST: Balance = 1_000_000_000_000_000_000_000;//1 NEAR
// pub const MIN_STORAGE: Balance = parse_near!("1 N");
pub const MIN_STORAGE: Balance = 1_000_000_000_000_000_000_000;//1 NEAR
pub const MIN_REWARD: Balance = 10_000_000_000_000_000_000;// 0.01 NEAR
pub const DEFAULT_NODE_OWNER_ID: &str = "default-node.test.near";
pub const DEFAULT_BOUNTY_OWNER_ID: &str = "default-bounty.test.near";
pub const EVENT_STANDARD_NAME: &str = "NEP-297";
pub const EVENT_STANDARD_SPEC: &str = "1.0.0";
pub const BOUNTY_CREATED_EVENT_NAME: &str = "BountyCreated";
pub const BOUNTY_COMPLETED_EVENT_NAME: &str = "BountyCompleted";


#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct Coordinator {
    pub nodes: UnorderedMap<AccountId, Node>,
    pub node_queue: Vec<AccountId>,
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
        log!("get_bounty_count");
        return self.bounties.len();
    }
    pub fn get_offline_node_count(&self) -> u64 {
        return self.offline_nodes.len();
    }

    pub fn get_node(&self, account_id: AccountId) -> Node {
        log!("get_node {}", account_id);
        return self.nodes.get(&account_id).unwrap_or_else(|| panic!("Node {} is not registered", account_id));
    }

    //Serialize override necessary because Bounty contains an UnorderedMap
    #[result_serializer(borsh)]
    pub fn get_bounty(&self, bounty_id: AccountId) -> Bounty {
        return self.bounties.get(&bounty_id).unwrap();
    }

    //TODO This NEEDS pagination, can return a huge amount of data
    //also probably not efficient
    pub fn get_nodes(&self) -> Vec<Node> {
        log!("Fetching all {} nodes", self.nodes.len());
        let mut nodes: Vec<Node> = vec![];
        for node in self.nodes.values() {
            log!("node: {:?}", node.id);
            nodes.push(node);
        }
        return nodes;
    }

    //TODO This NEEDS pagination, can return a huge amount of data
    //also probably not efficient
    #[result_serializer(borsh)]
    pub fn get_bounties(&self) -> Vec<Bounty> {
        log!("Fetching all {} bounties", self.bounties.len());
        let mut bounties: Vec<Bounty> = vec![];
        for bounty in self.bounties.values() {
            bounties.push(bounty);
        }
        return bounties;
    }


    pub fn register_node(&mut self, name: String) -> Node {
        let node_id: AccountId = format!("{}.node.{}", name, signer_account_id())
            .parse()
            .unwrap();
        log!("Registering new node, {}. Owned by: {}", node_id, signer_account_id());
        assert!(self.nodes.get(&node_id).is_none(), "Node already registered: {}", node_id.clone());
        let metadata = Node::new_node(node_id.clone());
        self.nodes.insert(&node_id, &metadata);
        self.node_queue.push(node_id.clone());
        log!("finished adding node to coordinator, data: {}", metadata);
        return self.nodes.get(&node_id).unwrap_or_else(|| panic!("Failed to get freshly registered node: {}", node_id));
    }

    //TODO Rename me to node_id
    //TODO Make sure this doesn't stall bounty indefinitely
    pub fn remove_node(&mut self, account_id: AccountId) {
        println!("attempting to remove node with id {}", account_id);
        let node = self.nodes.get(&account_id);
        require!(!node.is_none(), "Could not find node to remove");
        require!(signer_account_id() == node.unwrap().owner_id || signer_account_id() == current_account_id(), "Only the owner of the node or the coordinator can remove it");
        self.nodes.remove(&account_id);
        self.node_queue.retain(|x| x != &account_id);        //TODO, this is not ideal, but it's the only way I can think of to remove the node from the queue
        log!("removed node with id {}", account_id);
    }

    //TODO untested, also rename me to node_id
    pub fn set_node_offline(&mut self, account_id: AccountId, offline: bool) -> Node {
        let removed: Node;
        if offline {
            log!("Moving node {account_id} to offline");
            let node = self.nodes.get(&account_id).unwrap_or_else(|| panic!("Could not find node to set offline"));
            require!(node.owner_id == signer_account_id() || signer_account_id() == current_account_id(), "Only the owner of the node or the coordinator can set it offline");
            removed = self.nodes.remove(&account_id).unwrap();
            self.offline_nodes.insert(&account_id, &removed);
        } else {
            log!("Bringing node {account_id} online");
            let node = self.offline_nodes.get(&account_id).unwrap_or_else(|| panic!("Could not find node to set online"));
            require!(node.owner_id == signer_account_id() || signer_account_id() == current_account_id(), "Only the owner of the node or the coordinator can set it offline");
            removed = self.offline_nodes.remove(&account_id).unwrap();
            self.nodes.insert(&account_id, &removed);
        }
        return removed;
    }

    #[payable]
    #[result_serializer(borsh)]
    pub fn create_bounty(&mut self, name: String, file_location: String, file_download_protocol: SupportedDownloadProtocols, min_nodes: u64, total_nodes: u64, timeout_seconds: u64, network_required: bool, gpu_required: bool, amt_storage: String, amt_node_reward: String) -> Bounty {
        log!("Creating bounty {}", name);
        let amt_storage: u128 = amt_storage.parse().unwrap();
        let amt_node_reward: u128 = amt_node_reward.parse().unwrap();
        require!(attached_deposit() == amt_storage + amt_node_reward, "Attached deposit must be equal to the sum of the storage and node reward amounts");
        require!(amt_storage > MIN_STORAGE, "Refundable storage deposit must be greater than 1N");
        require!(amt_node_reward > MIN_REWARD, "Refundable storage deposit must be greater than 1N");
        require!(self.get_node_count() >= total_nodes, "Not enough nodes registered for bounty");
        require!(total_nodes.clone() <= self.nodes.len(), "Total nodes cannot be greater than the number of nodes available in the coordinator");
        let bounty_key: AccountId = format!("{}.bounty.{}", name, current_account_id().to_string()).parse().unwrap();
        require!(self.bounties.get(&bounty_key).is_none(), "Bounty already exists");
        let mut bounty = Bounty::new_bounty(name.clone(), bounty_key.clone(), file_location, file_download_protocol, min_nodes, total_nodes, timeout_seconds, network_required, gpu_required, amt_storage, amt_node_reward);
        require!(bounty.owner_id == signer_account_id(), "The bounty's owner id must be the signer"); //Cautionary check. We don't want to risk preventing the creator from cancelling the bounty to withdraw their funds

        let seed = env::random_seed()[0]; //TODO Random seed may have security vulnerabilities. This is a risk we will likely have to take, but should read docs
        log!("Seed: {}", seed);
        while bounty.elected_nodes.len() < total_nodes.clone() as usize {
            let key: AccountId;
            if self.node_queue.len() == 1 {
                key = self.node_queue.pop().unwrap();
                log!("elected {} (only node in queue)", key);
            //TODO Case for: If asking for all nodes...
            } else {
                let random_node = seed % self.node_queue.len() as u8;
                log!("electing node at: {}, node queue len {}", random_node.to_string(), self.node_queue.len());
                // let key = self.node_queue.swap_remove(random_node); // O(1) by replacing removed with last elementz
                key = self.node_queue.swap_remove(random_node as usize); // Remove node to eliminate possibility of collisions
                log!("elected {} (was at index {}), node", key, random_node.to_string());

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
        return bounty;
    }


    // O(n) shuffle where n is the number of shuffles to do.
    // Shuffle op is O(1) because we swap the last element with the random element and push the random element at the end
    pub fn shuffle_nodes(&mut self, n: u64) {
        require!(n > 0, "n must be greater than 0");
        let mut i = 0;
        let seed = env::random_seed()[0];
        while i < n {
            let random_node = seed % self.node_queue.len() as u8;
            let node = self.node_queue.swap_remove(random_node as usize);
            self.node_queue.push(node);
            i += 1;
        }
    }

    pub fn get_answer(&self, bounty_id: AccountId, node_id: AccountId) -> NodeResponse {
        log!("Getting answer for bounty {bounty_id} from node {node_id}");
        let bounty = self.bounties.get(&bounty_id).unwrap_or_else(|| panic!("Bounty {} does not exist", bounty_id));
        let node = self.nodes.get(&node_id).unwrap_or_else(|| panic!("Node {} does not exist", node_id));
        if bounty.get_status() == BountyStatus::Pending {
            require!(signer_account_id() == current_account_id() //Coordinator contract
            || signer_account_id() == node.owner_id, "Only the node owner or the coordinator contract can retrieve a node's answer from a pending bounty");
        }
        require!(bounty.elected_nodes.contains(&node_id), "Node is not elected for this bounty");
        let answer = bounty.answers.get(&node_id).unwrap_or_else(|| panic!("Node {} has not submitted an answer for bounty {}", node_id, bounty_id));
        return answer;
    }

    pub fn cancel_bounty(&self, bounty_id: AccountId){
        require!(self.bounties.get(&bounty_id).is_some(), "Bounty does not exist");
        let mut bounty = self.bounties.get(&bounty_id).unwrap();
        bounty.cancel()
    }

    pub fn should_post_answer(&self, bounty_id: AccountId, node_id: AccountId) -> bool {
        log!("Checking if node {} should post answer for bounty {}", node_id, bounty_id);
        let bounty = self.bounties.get(&bounty_id).unwrap_or_else(|| panic!("Bounty {} does not exist", bounty_id));
        let node = self.nodes.get(&node_id).unwrap_or_else(|| panic!("Node {} does not exist", node_id));
        require!(signer_account_id() == current_account_id() //Coordinator contract
            || signer_account_id() == bounty.owner_id //Bounty owner
            || signer_account_id() == node.owner_id, "Only the bounty owner, node owner, or the coordinator contract can check if they should post an answer");
        require!(bounty.elected_nodes.contains(&node_id), "Node is not elected for this bounty");
        if signer_account_id() == bounty.owner_id {
            require!(bounty.get_status() != BountyStatus::Pending, "Bounty must be complete for bounty owner to get answer");
        }
        let bounty = self.bounties.get(&bounty_id).unwrap();
        let node = self.nodes.get(&node_id).unwrap();
        return bounty.should_publish_answer(node.id) == "yes";
    }

    #[result_serializer(borsh)]
    pub fn post_answer(&self, bounty_id: AccountId, node_id: AccountId, answer: String, status: NodeResponseStatus){
        log!("Posting answer for bounty {:?}", bounty_id);
        let mut bounty = self.bounties.get(&bounty_id).unwrap_or_else(|| panic!("Bounty {} does not exist", bounty_id));
        let node = self.nodes.get(&node_id).unwrap_or_else(|| panic!("Node {} does not exist", bounty_id));
        require!(signer_account_id() == node.owner_id, "Only the node owner can post an answer");
        bounty.publish_answer(node_id, answer, status);
    }

    #[result_serializer(borsh)] //TODO Should this be private? Should only the bounty holder be able to access this?
    pub fn get_bounty_result(&self, bounty_id: AccountId) -> HashMap<String, u8> {
        require!(self.bounties.get(&bounty_id).is_some(), "Bounty does not exist");
        let bounty = self.bounties.get(&bounty_id).unwrap();
        return bounty.get_result();
    }

    #[payable]
    pub fn add_storage_deposit(&mut self, bounty_id: AccountId){
        require!(self.bounties.get(&bounty_id).is_some(), "Bounty does not exist");
        let mut bounty = self.bounties.get(&bounty_id).unwrap();
        bounty.bounty_add_storage_deposit();
    }

    #[payable]
    pub fn add_node_reward_deposit(&mut self, bounty_id: AccountId){
        require!(self.bounties.get(&bounty_id).is_some(), "Bounty does not exist");
        let mut bounty = self.bounties.get(&bounty_id).unwrap();
        bounty.bounty_add_node_reward_deposit();
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
    fn can_register_node() {
        let mut coordinator = Coordinator::default();
        let name = "test".to_string();
        let account_id: AccountId = format!("{}.node.{}", name, signer_account_id())
            .parse()
            .unwrap();
        let node = coordinator.register_node(name);
        
        assert_eq!(node.owner_id, signer_account_id(), "Owner id should be current account id");
        assert_eq!(coordinator.get_node_count(), 1, "Node count should be 1");
        assert!(coordinator.nodes.get(&account_id).is_some(), "Should be able to retrieve node");
        assert!(coordinator.get_nodes().contains(&node), "Should be able to retrieve node from full listing");
    }
    #[test]
    fn can_mark_node_offline(){
        let mut coordinator = Coordinator::default();
        let name = "test".to_string();
        let _account_id: AccountId = format!("{}.node.{}", name, current_account_id().to_string())
            .parse()
            .unwrap();
        let _node = coordinator.register_node(name);
        //TODO
    }

    // #[test]
    // fn can_register_bounty() {
    //     let mut coordinator = Coordinator::default();
    //     for x in 0..3 {
    //         coordinator.register_node(format!("test{}", x));
    //     }
    //     assert_eq!(coordinator.get_node_count(), 3, "Node count should be 3");
    //     let name = "test-bounty".to_string();
    //     let bounty = coordinator.create_bounty(
    //         name.clone(),
    //         "https://github.com/ad0ll/docker-hello-world".to_string(),
    //         SupportedDownloadProtocols::GIT,
    //         3,
    //         3,
    //         true,
    //         true,
    //         parse_near!("0.5N").to_string(),
    //         parse_near!("2N").to_string(),
    //     );
    //     assert_eq!(coordinator.get_bounty_count(), 1, "Bounty count should be 1");
    //     let bounty_key: AccountId = format!("{}.bounty.{}", name, current_account_id().to_string()).parse().unwrap();
    //     require!(coordinator.bounties.get(&bounty_key).is_some(), "Bounty should be retrievable");
    //     require!(coordinator.get_bounties().contains(&bounty), "Bounty should be retrievable from full listing");
    // }
    // #[test]
    // fn can_increase_storage_and_reward_amt() {
    //     //TODO Reduce copying and pasting by making these standalone
    //     let mut coordinator = Coordinator::default();
    //     for x in 0..3 {
    //         coordinator.register_node(format!("test{}", x));
    //     }
    //     assert_eq!(coordinator.get_node_count(), 3, "Node count should be 3");
    //     let name = "test-bounty".to_string();
    //     let bounty = coordinator.create_bounty(
    //         name.clone(),
    //         "https://github.com/ad0ll/docker-hello-world".to_string(),
    //         SupportedDownloadProtocols::GIT,
    //         3,
    //         3,
    //         true,
    //         true,
    //         parse_near!("0.5N").to_string(),
    //         parse_near!("2N").to_string(),
    //     );
    //     assert_eq!(coordinator.get_bounty_count(), 1, "Bounty count should be 1");
    //     let bounty_key: AccountId = format!("{}.bounty.{}", name, current_account_id().to_string()).parse().unwrap();
    //     require!(coordinator.bounties.get(&bounty_key).is_some(), "Bounty should be retrievable");
    //     require!(coordinator.get_bounties().contains(&bounty), "Bounty should be retrievable from full listing");
    // }
}


