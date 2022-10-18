use std::collections::HashMap;
use std::mem::size_of_val;

use near_sdk::{AccountId, Balance, env, log, near_bindgen, Promise, require};
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::UnorderedMap;
use near_sdk::env::{attached_deposit, block_timestamp, current_account_id, log_str, signer_account_id, storage_byte_cost};
use near_sdk::serde::{Deserialize, Serialize};

use crate::bounty::{Bounty, BountyStatus, NodeResponse, NodeResponseStatus, SupportedDownloadProtocols};
use crate::events::{BountyCreatedLog, EventLog, EventLogVariant};
use crate::node::Node;

// pub const STORAGE_COST: Balance = parse_near!("1 N");
pub const STORAGE_COST: Balance = 1_000_000_000_000_000_000_000;
//1 NEAR
// pub const MIN_STORAGE: Balance = parse_near!("1 N");
pub const MIN_STORAGE: Balance = 1_000_000_000_000_000_000_000;
//1 NEAR
pub const MIN_REWARD: Balance = 10_000_000_000_000_000_000;
// 0.01 NEAR
pub const DEFAULT_NODE_OWNER_ID: &str = "default-node.test.near";
pub const DEFAULT_BOUNTY_OWNER_ID: &str = "default-bounty.test.near";
pub const EVENT_STANDARD_NAME: &str = "NEP-297";
pub const EVENT_STANDARD_SPEC: &str = "1.0.0";
pub const BOUNTY_CREATED_EVENT_NAME: &str = "BountyCreated";
pub const BOUNTY_COMPLETED_EVENT_NAME: &str = "BountyCompleted";


#[derive(BorshDeserialize, BorshSerialize, Deserialize, Serialize, Eq, PartialEq, Debug, Clone)]
#[serde(crate = "near_sdk::serde")]
pub enum PayoutStrategy {
    SuccessfulNodes, //If min_nodes+ succeeds, only successful nodes should get paid
    FailedNodes, //If min_nodes+ fails, only failed nodes should get paid
    AllAnsweredNodes, //If a bounty is cancelled, all nodes should get paid
}

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
        require!(self.nodes.get(&node_id).is_none(), format!("Node already registered: {}", node_id.clone()));
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
        self.node_queue.retain(|x| x != &account_id);
        //This is O(N) which hurts and could be avoided by changing the node queue to an UnorderedSet
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

        let seed = env::random_seed()[0];
        //TODO Random seed may have security vulnerabilities. This is a risk we will likely have to take, but should read docs
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
                // let key = self.node_queue.swap_remove(random_node); // O(1) by replacing removed with last element
                key = self.node_queue.swap_remove(random_node as usize);
                // Remove node to eliminate possibility of collisions
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
            event: EventLogVariant::BountyCreated(BountyCreatedLog {
                bounty_id: bounty_key.clone(),
                node_ids: bounty.elected_nodes.clone(),
                message: None,
            }),
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

    //View function to fetch an answer that can only be run after the bounty has been completed
    pub fn get_answer(&self, bounty_id: AccountId, node_id: AccountId) -> NodeResponse {
        let bounty = self.bounties.get(&bounty_id).unwrap_or_else(|| panic!("Bounty {} does not exist", bounty_id));
        require!(bounty.status != BountyStatus::Pending, "You can only view answers of bounties that are complete or cancelled. Use call_get_answer if you need to get the answer for an inflight bounty.");
        let _node = self.nodes.get(&node_id).unwrap_or_else(|| panic!("Node {} does not exist", node_id));
        let answer = bounty.answers.get(&node_id).unwrap_or_else(|| panic!("Node {} has not submitted an answer for bounty {}", node_id, bounty_id));
        return answer;
    }

    // Paid version of get_answer that requires gas to run (due to signer_account_id())
    // Currently this is only used in tests
    pub fn call_get_answer(&self, bounty_id: AccountId, node_id: AccountId) -> NodeResponse {
        log!("Getting answer for bounty {bounty_id} from node {node_id}");
        let bounty = self.bounties.get(&bounty_id).unwrap_or_else(|| panic!("Bounty {} does not exist", bounty_id));
        require!(bounty.status == BountyStatus::Pending, "This function can only be used on pending bounties. Since this bounty is closed, use 'get_answer' instead");
        require!(bounty.elected_nodes.contains(&node_id), "Node is not elected for this bounty");
        let node = self.nodes.get(&node_id).unwrap_or_else(|| panic!("Node {} does not exist", node_id));
        log!("Checking whether signer is either the owner of the node, or the coordinator");
        require!(signer_account_id() == current_account_id() //Coordinator contract
            || signer_account_id() == node.owner_id, "Only the node owner or the coordinator contract can retrieve a node's answer from a pending bounty");
        log!("node is either the owner or the coordinator, checking elected nodes");
        let answer = bounty.answers.get(&node_id).unwrap_or_else(|| panic!("Node {} has not submitted an answer for bounty {}", node_id, bounty_id));
        return answer;
    }

    pub fn cancel_bounty(&mut self, bounty_id: AccountId) {
        let bounty = self.bounties.get(&bounty_id).unwrap_or_else(|| panic!("Bounty {} does not exist", bounty_id));
        require!(bounty.status == BountyStatus::Pending, "Bounty must be pending to be cancelled");
        self.close_bounty(&bounty_id, PayoutStrategy::AllAnsweredNodes);
    }


    pub fn should_post_answer(&self, bounty_id: AccountId, node_id: AccountId) -> bool {
        log!("Checking if node {} should post answer for bounty {}", node_id, bounty_id);
        let bounty = self.bounties.get(&bounty_id).unwrap_or_else(|| panic!("Bounty {} does not exist", bounty_id));
        let node = self.nodes.get(&node_id).unwrap_or_else(|| panic!("Node {} does not exist", node_id));
        //Below is commented out because it requires gas. Evaluating how to keep this data private before moving forward.
        // require!(signer_account_id() == current_account_id() //Coordinator contract
        //     || signer_account_id() == bounty.owner_id //Bounty owner
        //     || signer_account_id() == node.owner_id, "Only the bounty owner, node owner, or the coordinator contract can check if they should post an answer");
        // require!(bounty.elected_nodes.contains(&node_id), "Node is not elected for this bounty");
        // if signer_account_id() == bounty.owner_id {
        //     require!(bounty.get_status() != BountyStatus::Pending, "Bounty must be complete for bounty owner to get answer");
        // }
        return bounty.should_publish_answer(&node.id) == "yes";
    }


    //TODO This function can be broken into multiple parts, update bounty status, analyze answers, refund bounty storage, pay nodes
    pub fn post_answer(&mut self, bounty_id: AccountId, node_id: AccountId, answer: String, message: String, status: NodeResponseStatus) -> NodeResponse {
        log!("Posting answer for bounty {:?}", bounty_id);
        let mut bounty = self.bounties.get(&bounty_id.clone()).unwrap_or_else(|| panic!("Bounty {} does not exist", bounty_id));
        let mut node = self.nodes.get(&node_id).unwrap_or_else(|| panic!("Node {} does not exist", bounty_id));
        require!(signer_account_id() == node.owner_id, "Only the node owner can post an answer");
        require!(bounty.status == BountyStatus::Pending, "Bounty is complete, no more answers can be published");
        require!(bounty.elected_nodes.contains(&node_id), "You are not an elected node");
        require!(bounty.answers.get(&node_id).is_none(), "You have already submitted an answer");
        log!("Publishing answer from {} (owner: {}). Answer: {}, Timestamp: {}, Status: {}", &node_id, signer_account_id(), answer, block_timestamp(), status);

        let node_response = NodeResponse::new_node_response(answer, message, status.clone());
        let estimated_storage = storage_byte_cost() * size_of_val(&node_response) as u128;
        let used_storage = storage_byte_cost() * size_of_val(&self) as u128;
        //If we hit this, the node has to pay gas. Wondering if we can front-load storage estimates in create_bounty to prevent it from being created if it doesn't have enough storage
        log!("Estimated storage cost for answer {}, bounty has used {}, has {} left", estimated_storage, used_storage, bounty.amt_storage - used_storage);
        require!(estimated_storage < (bounty.amt_storage), "Not enough storage left to store answer");
        bounty.answers.insert(&node_id, &node_response);
        bounty.unanswered_nodes.remove(&node_id);
        if status == NodeResponseStatus::SUCCESS {
            node.successful_runs += 1;
            node.last_success = block_timestamp();
            bounty.successful_nodes.insert(&node_id);
        } else if status == NodeResponseStatus::FAILURE {
            //TODO Tick node's failure count
            node.failed_runs += 1;
            node.last_failure = block_timestamp();
            bounty.failed_nodes.insert(&node_id);
        } else {
            panic!("Encountered unexpected node status {}, can't determine the state of the bounty", status);
        }
        self.nodes.insert(&node_id, &node); // Node had failure or success ticked, so update it now.


        if bounty.successful_nodes.len() >= bounty.min_nodes {
            log!("Bounty is complete, at least {} nodes have responded successfully. Closing bounty now.", bounty.min_nodes);
            bounty.status = BountyStatus::Success;
            self.bounties.insert(&bounty_id, &bounty); //Sloppy, but we need to update the bounty since close_bounty needs current data
            self.close_bounty(&bounty_id, PayoutStrategy::SuccessfulNodes);
        } else if bounty.failed_nodes.len() >= bounty.min_nodes {
            log!("Bounty is complete but failed because the number of failed nodes has exceeded the min number of nodes required for success");
            bounty.status = BountyStatus::Failed;
            self.bounties.insert(&bounty_id, &bounty); //Sloppy, but we need to update the bounty since close_bounty needs current data
            self.close_bounty(&bounty_id, PayoutStrategy::FailedNodes);
        } else {
            log!("bounty does not have enough answers to be considered complete");
        }
        // After changing the nested vec (bounty.bounties) we MUST reinsert it into the map (self.bounties) to register the change in storage.
        self.bounties.insert(&bounty_id, &bounty);
        return node_response;
    }

    #[private]
    pub fn close_bounty(&mut self, bounty_id: &AccountId, payout_strategy: PayoutStrategy) -> Promise {

        // If you make the below mutable, please make sure to re-insert it into the coordinator at the end
        let bounty = self.bounties.get(&bounty_id).unwrap_or_else(|| panic!("Bounty {} does not exist (close_bounty)", bounty_id));
        require!(bounty.owner_id == signer_account_id() || bounty.coordinator_id == current_account_id(), "Only the owner of the bounty or the coordinator can close it");
        log!("Closing bounty {}", bounty_id);


        // TODO Check for outliers and remove them. This should put answers under threshold when anomalies are removed
        // TODO Refund the node calling this function for gas, since it's more expensive than just posting an answer

        log!("Marking unanswered nodes");
        for node_id in bounty.unanswered_nodes.iter() {
            log!("Node {} did not respond to bounty {}", node_id, bounty.id);
            let node_option = self.nodes.get(&node_id);
            if node_option.is_none() {
                log!("Node {} does not exist, can't mark unanswered", node_id);
                continue;
            }
            let mut node = node_option.unwrap();
            node.unanswered_runs += 1;
            self.nodes.insert(&node_id, &node);
        }


        let storage_used = storage_byte_cost() * size_of_val(&bounty) as u128;
        log!("Bounty used {} storage, will refund {} or {} deposit", storage_used, bounty.amt_storage - storage_used, bounty.amt_storage);

        //TODO we want to skim a very small amount of the storage cost for the coordinator, maybe 1-2% with a cap to cover storage contingencies in the future
        let mut main_promise = Promise::new(bounty.owner_id.clone()).transfer(bounty.amt_storage - storage_used); //Storage refund promise


        let payout_per_node = match payout_strategy {
            PayoutStrategy::AllAnsweredNodes => bounty.amt_storage / bounty.answers.len() as u128,
            PayoutStrategy::FailedNodes => bounty.amt_storage / bounty.failed_nodes.len() as u128,
            PayoutStrategy::SuccessfulNodes => bounty.amt_storage / bounty.successful_nodes.len() as u128,
        };
        // bounty.amt_node_reward / bounty.answers.len() as u128; //Mutable because if a node has been deleted, we'll increase the payout for non-deleted nodes

        let mut additional_bounty_refund: Balance = 0; //If a node was deleted before the payout, refund the bounty owner the amount that was supposed to be paid to the deleted node

        let target_collection = match payout_strategy {
            PayoutStrategy::FailedNodes => bounty.failed_nodes.as_vector(),
            PayoutStrategy::SuccessfulNodes => bounty.successful_nodes.as_vector(),
            PayoutStrategy::AllAnsweredNodes => bounty.answers.keys_as_vector(),
        };
        for node_id in target_collection.iter() {
            // If the node posted an ACCEPTED answer, they should get paid whether or not the bounty was cancelled.
            // Currently we don't have a function to detect and decline answers
            let node_option = self.nodes.get(&node_id);
            if node_option.is_none() {
                log!("Node {} does not exist, can't attempt refund", node_id);
                additional_bounty_refund += payout_per_node;
                continue;
            }
            let node = node_option.unwrap();
            let node_response_option = bounty.answers.get(&node_id);
            if node_response_option.is_none() {
                log!("Node {} was recorded as having an answer, but could not find it in bounty {}. Can't attempt refund", node_id, bounty.id);
                additional_bounty_refund += payout_per_node;
                continue;
            }
            let node_response = node_response_option.unwrap();
            if payout_strategy == PayoutStrategy::AllAnsweredNodes || (payout_strategy == PayoutStrategy::SuccessfulNodes && node_response.status == NodeResponseStatus::SUCCESS){
                log!("paying {} reward of {}", node_id, payout_per_node);
                let reward_promise = Promise::new(node.owner_id)
                    .transfer(payout_per_node);
                main_promise = main_promise.then(reward_promise);
            } else {
                log!("The bounty succeeded, but node w/ ID {} failed. {} does not receive a payout for this bounty,", node_id, payout_per_node);
            }
        }
        if additional_bounty_refund > 0 {
            log!("Refunding bounty owner {} for payout to deleted nodes", additional_bounty_refund);
            main_promise = main_promise.then(Promise::new(bounty.owner_id.clone()).transfer(additional_bounty_refund));
        }
        return main_promise;
    }

    // Returns a map of {Solution: Number of nodes with solution}
    // Probably not the most optimal way to render the resut
    pub fn get_bounty_result(&self, bounty_id: AccountId) -> HashMap<String, u8> {
        let bounty = self.bounties.get(&bounty_id).unwrap_or_else(|| panic!("Bounty {} does not exist", bounty_id));
        require!(bounty.status != BountyStatus::Pending, "Bounty must be complete or cancelled to get result");
        return bounty.get_result();
    }

    #[payable]
    pub fn add_storage_deposit(&mut self, bounty_id: AccountId) {
        require!(self.bounties.get(&bounty_id).is_some(), "Bounty does not exist");
        let mut bounty = self.bounties.get(&bounty_id).unwrap();
        bounty.bounty_add_storage_deposit();
    }

    #[payable]
    pub fn add_node_reward_deposit(&mut self, bounty_id: AccountId) {
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
    fn can_mark_node_offline() {
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


