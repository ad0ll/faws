use std::collections::HashMap;
use std::mem::size_of_val;
use std::fmt::Display;
use near_sdk::{AccountId, Balance, env, Gas, near_bindgen, Promise, require};
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{UnorderedMap};
use near_sdk::env::{attached_deposit, block_timestamp, block_timestamp_ms, current_account_id, predecessor_account_id, signer_account_id, storage_byte_cost, storage_usage, used_gas};
use near_sdk::serde::{Serialize, Deserialize};
use near_units::{parse_gas, parse_near};

#[derive(BorshDeserialize, BorshSerialize, Deserialize, Serialize, Eq, PartialEq, Debug)]
#[serde(crate = "near_sdk::serde")]
pub enum SupportedDownloadProtocols {
    IPFS,
    HTTPS,
    GIT,
    EMPTY
}
impl Display for SupportedDownloadProtocols {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SupportedDownloadProtocols::IPFS => write!(f, "ipfs"),
            SupportedDownloadProtocols::HTTPS => write!(f, "https"),
            SupportedDownloadProtocols::GIT => write!(f, "git"),
            SupportedDownloadProtocols::EMPTY => write!(f, "EMPTY"),
        }
    }
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Eq, PartialEq, Debug, Default)]
#[serde(crate = "near_sdk::serde")]
pub struct NodeResponse {
    pub solution: String,
    pub timestamp: u64,
    pub gas_used: Gas,
}
#[near_bindgen]
impl NodeResponse {
    pub fn new_node_response(solution: String, timestamp: u64, gas_used: Gas) -> Self {
        Self {
            solution,
            timestamp,
            gas_used,
        }
    }
}
//TODO using an enum for file_download_protocol breaks serialization
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct Bounty{
    pub id: AccountId,
    pub owner_id: AccountId, // Signer who created the bounty. Used for auth.
    pub coordinator_id: AccountId, // Coordinator who created the bounty. Used for auth and verification.
    pub file_location: String, //URL/CID. Support ipfs, git, https initially
    // pub file_download_protocol: SupportedDownloadProtocols, //ipfs, git, https
    pub file_download_protocol: SupportedDownloadProtocols, //ipfs, git, https
    pub success: bool, // True if we accepted responses from a minimum of ${threshold} nodes. False on error or cancel.
    pub complete: bool, // True the bounty is done processing.
    pub cancelled: bool, // True if the bounty was cancelled.
    pub threshold: u64, // Min number of nodes that must have consensus to complete the bounty
    pub total_nodes: u64, // Total nodes to process bounty. If > threshold, bounty allows for some failures.
    pub bounty_created: u64, //UTC timestamp for when bounty was created
    pub network_required: bool, // True if the bounty's execution requires network access. Does not block downloading files for the bounty.
    pub amt_storage: Balance, //Unused storage is refunded to the owner once the contract is closed
    pub amt_node_reward: Balance, //Total payout to the nodes.
    // pub result: String,
    // pub elected_nodes: LookupMap<AccountId, String>, //TODO: How can we make this private?
    pub elected_nodes: Vec<AccountId>, //TODO: How can we make this private? //TODO Could be LookupSet
    pub answers: UnorderedMap<AccountId, NodeResponse>, //TODO: How can we make this private?
}

impl PartialEq<Self> for Bounty {
    fn eq(&self, other: &Self) -> bool {
        return self.id == other.id
            && self.owner_id == other.owner_id
            && self.coordinator_id == other.coordinator_id
            && self.file_location == other.file_location
            && self.file_download_protocol == other.file_download_protocol
            && self.success == other.success
            && self.complete == other.complete
            && self.cancelled == other.cancelled
            && self.threshold == other.threshold
            && self.total_nodes == other.total_nodes
            && self.bounty_created == other.bounty_created
            && self.network_required == other.network_required
            && self.amt_storage == other.amt_storage
            && self.amt_node_reward == other.amt_node_reward
            && self.elected_nodes == other.elected_nodes
            && self.answers.len() == other.answers.len(); //TODO: Make this a real comparison
    }
}

impl Default for Bounty {
    fn default() -> Self {
        Self {
            id: "bounty-id".to_string().parse().unwrap(),
            owner_id: "bounty-owner".to_string().parse().unwrap(),
            coordinator_id: "bounty-coordinator".to_string().parse().unwrap(),
            file_location: "".to_string(),
            file_download_protocol: SupportedDownloadProtocols::EMPTY,
            success: false,
            complete: false,
            cancelled: false,
            threshold: 0,
            total_nodes: 0,
            bounty_created: block_timestamp_ms(),
            network_required: false,
            amt_storage: 0,
            amt_node_reward: 0,
            elected_nodes: Vec::new(),
            answers: UnorderedMap::new("bounty-answers".to_string().as_bytes()),
        }
    }
}
#[near_bindgen]
impl Bounty {
    #[init]
    #[payable]
    #[private] // Only allow creating bounties through coordinator
    pub fn new_bounty(name: String, id: AccountId, file_location: String, file_download_protocol: SupportedDownloadProtocols, threshold: u64, total_nodes: u64, network_required: bool, amt_storage: Balance, amt_node_reward: Balance) -> Self {
        Self {
            id,
            owner_id: signer_account_id(),
            coordinator_id: predecessor_account_id(), //predecessor_account_id OR whatever the user specifies
            file_location,
            file_download_protocol,
            success: false,
            complete: false,
            cancelled: false,
            threshold,
            total_nodes,
            bounty_created: block_timestamp_ms(),
            // result: "".to_string(),
            // elected_nodes: UnorderedSet::new(format!("{}-elected", name).to_string().as_bytes()),
            elected_nodes: Vec::new(),
            answers: UnorderedMap::new(format!("{}-answers", name).to_string().as_bytes()),
            // storage_used: 0,
            network_required,
            amt_storage, // Unused storage is refunded to the creator once the contract is closed
            amt_node_reward, // If the bounty is completed, nodes will be reimbursed for spent gas. If it's completed AND successful, nodes get full reward
        }
    }

    //View function to check amount left for storage to see if the publish_answer function is likely to succeed
    //Publish answer costs the node gas, even if we attempt to refund then, so we should check if there's enough budget left
    pub fn get_status(&self) -> String {
        if !self.complete {
            return "incomplete".to_string();
        } else if self.cancelled {
            return "cancelled".to_string();
        } else if self.success {
            return "success".to_string();
        }
        //complete && !cancelled && !success
        return "failed".to_string();
    }

    pub fn publish_answer(&mut self, answer: String) {
        // used_gas()
        require!(self.complete == false, "Bounty is complete, no more answers can be published");
        require!(!self.elected_nodes.contains(&signer_account_id()), "You are not an elected node");
        require!(self.answers.get(&signer_account_id()).is_none(), "You have already submitted an answer");
        // Node has to pay for the transaction + storage, but this is refunded to them later
        //TODO Must check that we have enough storage left to store the answer
        let node_response = NodeResponse::new_node_response(answer.clone(),
                                                            block_timestamp(),
                                                            used_gas());
        let estimated_storage = storage_byte_cost() * size_of_val(&node_response) as u128;
        //If we hit this, the node has to pay gas. Wondering if we can frontload storage estimates in create_bounty to prevent it from being created if it doesn't have enough storage
        require!(estimated_storage < self.amt_storage, "Not enough storage left to store answer");
        self.answers.insert(&signer_account_id(), &NodeResponse::new_node_response(answer.clone(), block_timestamp(), used_gas()));
        if self.answers.len() >= self.threshold {
            //TODO Check for outliers and remove them. This should put answers under threshold when anamolies are removed
            self.close(false, false);
            //Reinsert record with updated gas for closing node
            self.answers.insert(&signer_account_id(), &NodeResponse::new_node_response(answer.clone(), block_timestamp(), used_gas()));
        }

        //Don't return anything so we don't consume any more gas
    }

    // View function that returns yes, no, maybe for the client to check if they should spend gas to publish an answer
    // TODO maybe not currently implemented
    pub fn should_post_answer(&self, node_id: AccountId) -> String { //Return as string so we can return "maybe" later
        return if self.complete {
            "no".to_string() //
        } else if !self.elected_nodes.contains(&node_id) {
            "no".to_string() // You aren't an elected node
        } else if !self.answers.get(&node_id).is_some() {
            "no".to_string() // You have already posted an answer
        } else {
            "yes".to_string()
        }
    }

    pub fn cancel(&mut self) {
        require!(self.complete == false, "Bounty is already complete");
        require!(self.cancelled == false, "Bounty is already cancelled");
        require!(self.owner_id == signer_account_id() || signer_account_id() == current_account_id(), "Only the owner or the oracle can cancel the bounty");
        self.close(false, true);
    }

    pub fn close(&mut self, failed: bool, cancelled: bool) -> Promise {
        require!(self.owner_id == signer_account_id() || self.coordinator_id == current_account_id(), "Only the owner of the bounty or the coordinator can close it");
        if failed {
            self.success = false;
            self.complete = true;
        } else if self.cancelled {
            self.complete = true;
            self.success = false;
            self.cancelled = true
        } else {
            self.complete = true;
            self.success = true;
        }

        let storage_used = storage_byte_cost() * size_of_val(&self) as u128;

        //TODO we want to skim a very small amount of the storage cost for the coordinator, maybe 1-2% with a cap to cover storage contingencies in the future
        let mut main_promise: Promise = Promise::new(self.owner_id.clone()).transfer(self.amt_storage - storage_used); //Storage refund promise
        for (node_id, node_response) in &self.answers{
            if !self.cancelled{
                let reward_promise = Promise::new(node_id.clone()).transfer(self.amt_node_reward/self.answers.len() as u128);
                main_promise = main_promise.then(reward_promise);
            }
            else { //When cancelled, nodes are refunded for gas
                // let gas_promise = Promise::new(node_id.clone()).transfer(parse_near!(node_response.gas_used));
                // main_promise = main_promise.then(gas_promise);
            }
        }
        return main_promise;
        //TODO refund storage to bounty creator
        //TODO Pay nodes (do this w/ batch transaction)
    }

    #[payable]
    pub fn add_storage_deposit(&mut self) -> Promise {
        require!(self.owner_id == signer_account_id() || self.coordinator_id == current_account_id(), "Only the owner of the bounty or the coordinator can add to the deposit");
        self.amt_storage += attached_deposit();
        return Promise::new(self.coordinator_id.clone()).transfer(attached_deposit());
    }

    #[payable]
    pub fn add_node_reward_deposit(&mut self) -> Promise {
        require!(self.owner_id == signer_account_id() || self.coordinator_id == current_account_id(), "Only the owner of the bounty or the coordinator can add to the deposit");
        self.amt_node_reward += attached_deposit();
        return Promise::new(self.coordinator_id.clone()).transfer(attached_deposit());
    }


    //Dumps the result as {$value: $number_of_nodes_with_value}, requiring the bounty creator to manually verify the result
    pub fn get_result(&self) -> HashMap<String, u8> {
        let mut res: HashMap<String, u8> = HashMap::new();
        for (_, value) in self.answers.iter() {
            if !res.contains_key(&value.solution.clone()){
                res.insert(value.solution.clone(), res.get(&value.solution.clone()).unwrap() + 1);
            } else {
                res.insert(value.solution.clone(), 1);
            }
        }
        return res
    }
}
