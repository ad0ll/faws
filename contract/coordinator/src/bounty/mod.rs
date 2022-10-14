use std::collections::HashMap;
use std::mem::size_of_val;
use std::fmt::{Display, Formatter};
use near_sdk::{AccountId, Balance, Gas, log, near_bindgen, Promise, require};
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{UnorderedMap};
use near_sdk::env::{attached_deposit, block_timestamp, block_timestamp_ms, current_account_id, predecessor_account_id, signer_account_id, storage_byte_cost, used_gas};
use near_sdk::serde::{Serialize, Deserialize};


#[derive(BorshDeserialize, BorshSerialize, Deserialize, Serialize, Eq, PartialEq, Debug, Clone)]
#[serde(crate = "near_sdk::serde")]
pub enum SupportedDownloadProtocols {
    IPFS,
    HTTPS,
    GIT,
    EMPTY
}
impl Display for SupportedDownloadProtocols {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            SupportedDownloadProtocols::IPFS => write!(f, "ipfs"),
            SupportedDownloadProtocols::HTTPS => write!(f, "https"),
            SupportedDownloadProtocols::GIT => write!(f, "git"),
            SupportedDownloadProtocols::EMPTY => write!(f, "EMPTY"),
        }
    }
}
#[derive(BorshDeserialize, BorshSerialize, Deserialize, Serialize, Eq, PartialEq, Debug, Clone)]
#[serde(crate = "near_sdk::serde")]
pub enum NodeResponseStatus {
    SUCCESS,
    FAILURE,
    EMPTY
}
impl Display for NodeResponseStatus{
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self{
            NodeResponseStatus::SUCCESS => write!(f, "SUCCESS"),
            NodeResponseStatus::FAILURE => write!(f, "FAILURE"),
            NodeResponseStatus::EMPTY => write!(f, "EMPTY"),
        }
    }
}

#[derive(BorshDeserialize, BorshSerialize, Deserialize, Serialize, Eq, PartialEq, Debug, Clone)]
#[serde(crate = "near_sdk::serde")]
pub enum BountyStatus {
    Pending,
    Failed,
    Success,
    Cancelled,
}
impl Display for BountyStatus{
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self{
            BountyStatus::Pending => write!(f, "PENDING"),
            BountyStatus::Failed => write!(f, "FAILED"),
            BountyStatus::Success => write!(f, "SUCCESS"),
            BountyStatus::Cancelled => write!(f, "Cancelled"),
        }
    }
}



#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Eq, PartialEq, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct NodeResponse {
    pub solution: String,
    pub timestamp: u64,
    pub gas_used: Gas,
    pub status: NodeResponseStatus,
}

#[near_bindgen]
impl NodeResponse {
    #[init]
    pub fn new_node_response(solution: String, timestamp: u64, gas_used: Gas, status: NodeResponseStatus) -> Self {
        Self {
            solution,
            timestamp,
            gas_used,
            status
        }
    }
}

// TODO Add a timeout to a bounty
/*
Hey Amit, follow up from earlier, I
./build.sh builds the image for a wasm target. You can deploy it with local-near dev-deploy ./target/wasm32-unknown-unknown/release/coordinator. Integration tests have the right path for deploying the contract w/ near_workspaces
deploy.sh doesn't work/haven't tested it, same with localnet-deploy.sh
helper.sh has a dump of some local commands that I've been using if you need it for reference
You can get a completely new contract state by deleting the neardev directory
Feel free to add in new types and properties, storage is cheap.  https://docs.near.org/concepts/storage/data-storage#big-o-notation-big-o-notation-1 has all the map and lookup types for reference. TL;DR LookupSet/Map are slightly faster than UnorderedSet/Map, but give you no iteration.
integration tests all almost work (just the last one breaks on should_post_answer) and are good references for how to interact with the contract.
If you can get integrations tests to work, near_workspace makes sure you always have a fresh network and fresh contract deployment every run and eliminates the need to run the indexer (required to test using the cli)
 */
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct Bounty{
    pub id: AccountId,
    pub owner_id: AccountId, // Signer who created the bounty. Used for auth.
    pub coordinator_id: AccountId, // Coordinator who created the bounty. Used for auth and verification.
    pub file_location: String, //URL/CID. Support ipfs, git, https initially
    pub file_download_protocol: SupportedDownloadProtocols, //ipfs, git, https
    pub success: bool, // True if we accepted responses from a minimum of ${threshold} nodes. False on error or cancel.
    pub complete: bool, // True the bounty is done processing.
    pub cancelled: bool, // True if the bounty was cancelled.
    pub min_nodes: u64, // Min number of nodes that must have consensus to complete the bounty
    pub total_nodes: u64, // Total nodes to process bounty. If > threshold, bounty allows for some failures.
    pub bounty_created: u64, //UTC timestamp for when bounty was created
    pub network_required: bool, // True if the bounty's execution requires network access. Does not block downloading files for the bounty.
    pub gpu_required: bool, // True if the bounty's execution requires GPU compute
    pub amt_storage: Balance, //Unused storage is refunded to the owner once the contract is closed
    pub amt_node_reward: Balance, //Total payout to the nodes.
    pub timeout_seconds: u64, // Bounty timeout in seconds. If 0, no timeout.
    // pub result: String, //TODO This was going to be the single, definitive result. Need to summarize all the responses.
    pub elected_nodes: Vec<AccountId>, //TODO: How can we make this private? //TODO Unrelated to <-, this could be/should be UnorderedSet or merged below with answers
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
            && self.min_nodes == other.min_nodes
            && self.total_nodes == other.total_nodes
            && self.timeout_seconds == other.timeout_seconds
            && self.bounty_created == other.bounty_created
            && self.network_required == other.network_required
            && self.gpu_required == other.gpu_required
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
            min_nodes: 0,
            total_nodes: 0,
            timeout_seconds: 30,
            bounty_created: block_timestamp_ms(),
            network_required: false,
            gpu_required: false,
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
    pub fn new_bounty(name: String, id: AccountId, file_location: String, file_download_protocol: SupportedDownloadProtocols, min_nodes: u64, total_nodes: u64, timeout_seconds: u64, network_required: bool, gpu_required: bool, amt_storage: u128, amt_node_reward: u128) -> Self {
        Self {
            id,
            owner_id: signer_account_id(),
            coordinator_id: predecessor_account_id(), //predecessor_account_id OR whatever the user specifies
            file_location,
            file_download_protocol,
            success: false,
            complete: false,
            cancelled: false,
            min_nodes,
            total_nodes,
            timeout_seconds,
            bounty_created: block_timestamp_ms(),
            // result: "".to_string(),
            // elected_nodes: UnorderedSet::new(format!("{}-elected", name).to_string().as_bytes()),
            elected_nodes: Vec::new(),
            answers: UnorderedMap::new(format!("{}-answers", name).to_string().as_bytes()),
            // storage_used: 0,
            network_required,
            gpu_required,
            amt_storage, // Unused storage is refunded to the creator once the contract is closed
            amt_node_reward, // If the bounty is completed, nodes will be reimbursed for spent gas. If it's completed AND successful, nodes get full reward
        }
    }

    //View function to check amount left for storage to see if the publish_answer function is likely to succeed
    //Publish answer costs the node gas, even if we attempt to refund then, so we should check if there's enough budget left
    #[private]
    pub fn get_status(&self) -> BountyStatus {
        log!("Fetching bounty status...");
        if !self.complete {
            log!("Bounty is 'pending'");
            //TODO This shouldn't check for just answers, it should check for successful answers
            return BountyStatus::Pending;
        } else if self.cancelled {
            log!("Bounty is 'cancelled'");
            return BountyStatus::Cancelled;
        } else if self.success {
            log!("Bounty is 'success'");
            return BountyStatus::Success;
        }
        log!("Bounty is 'failed'");
        return BountyStatus::Failed;
    }

    #[private]
    pub fn publish_answer(&mut self, node_id: AccountId, answer: String, status: NodeResponseStatus) {

        require!(self.complete == false, "Bounty is complete, no more answers can be published");
        require!(self.elected_nodes.contains(&node_id), "You are not an elected node");
        require!(self.answers.get(&node_id).is_none(), "You have already submitted an answer");
        log!("Publishing answer from {} (owner: {}). Answer: {}, Status: {}", &node_id, signer_account_id(), answer, status);

        let node_response = NodeResponse::new_node_response(answer.clone(),
                                                            block_timestamp(),
                                                            used_gas(),
        status.clone());
        let estimated_storage = storage_byte_cost() * size_of_val(&node_response) as u128;
        let used_storage = storage_byte_cost() * size_of_val(&self) as u128;
        //If we hit this, the node has to pay gas. Wondering if we can front-load storage estimates in create_bounty to prevent it from being created if it doesn't have enough storage
        log!("Estimated storage cost for answer {}, bounty has used {}, has {} left", estimated_storage, used_storage, self.amt_storage - used_storage);
        require!(estimated_storage < (self.amt_storage), "Not enough storage left to store answer");
        self.answers.insert(&node_id, &NodeResponse::new_node_response(answer.clone(), block_timestamp(), used_gas(), status.clone()));
       log!("Finished publishing answer for {}, checking if enough nodes have responded to close the bounty ({}/{})...", &node_id, self.answers.len(), self.min_nodes);
        for (check_node_id, node_response) in self.answers.iter() {
            log!("Node {} responded with answer {}, status {}", check_node_id, node_response.solution, node_response.status);
        }
        //TODO Analyze answers here
        if self.answers.len() >= self.min_nodes {
            log!("Bounty has enough answers to be considered complete");
            //TODO Analyze answers here
            self.close(false, false);
            //Reinsert record with updated gas for closing node
        }
    }

    // TODO maybe not currently implemented
    // View function that returns yes, no, maybe for the client to check if they should spend gas to publish an answer
    #[private]
    pub fn should_publish_answer(&self, node_id: AccountId) -> String { //Return as string so we can return "maybe" later
        if self.complete {
            log!("Should not publish, bounty is complete");
            return "no".to_string();
        } else if self.cancelled { //Bounty should never be cancelled without being complete, but have this as a safeguard
            log!("Should not publish, bounty is cancelled");
            return "no".to_string();
        } else if !self.elected_nodes.contains(&node_id) {
            log!("Should not publish, you are not an elected node");
            return "no".to_string(); // You aren't an elected node
        } else if self.answers.get(&node_id).is_some() {
            log!("Should not publish, you have already submitted an answer");
            return "no".to_string(); // You have already posted an answer
        }
        //TODO Should check if we have enough successful answers and return no if we're evaluating them
        log!("Should publish, you are elected, the bounty isn't complete, and have not submitted an answer");
        return "yes".to_string();
    }

    #[private]
    pub fn cancel(&mut self) {
        log!("Cancelling bounty");
        require!(self.complete == false, "Bounty is already complete");
        require!(self.cancelled == false, "Bounty is already cancelled");
        self.close(false, true);
    }

    //TODO This function can be broken into multiple parts, update bounty status, analyze answers, refund bounty storage, pay nodes
    #[private]
    pub fn close(&mut self, failed: bool, cancelled: bool) -> Promise {
        log!("Closing bounty");
        require!(self.owner_id == signer_account_id() || self.coordinator_id == current_account_id(), "Only the owner of the bounty or the coordinator can close it");
        if failed {
            self.success = false;
            self.complete = true;
        } else if cancelled {
            self.complete = true;
            self.success = false;
            self.cancelled = true
        } else {
            self.complete = true;
            self.success = true;
        }

        //TODO Check for outliers and remove them. This should put answers under threshold when anomalies are removed
        // TODO Refund the node calling this function for gas, since it's more expensive than just posting an answer
        log!("Bounty closed with the following flags: complete: {}, success: {}, cancelled: {}", self.complete, self.success, self.cancelled);

        let storage_used = storage_byte_cost() * size_of_val(&self) as u128;
        log!("Bounty used {} storage", storage_used);

        //TODO we want to skim a very small amount of the storage cost for the coordinator, maybe 1-2% with a cap to cover storage contingencies in the future
        let mut main_promise: Promise = Promise::new(self.owner_id.clone()).transfer(self.amt_storage - storage_used); //Storage refund promise
        for (node_id, _node_response) in &self.answers{
            //TODO only reward confirmed nodes
            if !self.cancelled{
                let reward_promise = Promise::new(node_id.clone())
                    .transfer(self.amt_node_reward/self.answers.len() as u128);
                main_promise = main_promise.then(reward_promise);
            }
            else {
                let answer = self.answers.get(&node_id);
                if answer.is_some(){
                    let gas_used = answer.unwrap().gas_used;
                    log!("TODO: Refunding node {} for gas used posting their answer {:?}", node_id, gas_used);
                    //TODO (Med-pri) refund storage to bounty creator
                    // let refund_promise = Promise::new(node_id.clone())
                        // .transfer(parse_near!(format!("{:?}", gas_used) as str)); //TODO idk what I'm doing
                    // main_promise = main_promise.then(refund_promise);
                } else {
                    log!("No answer found for node {}, no need to reimburse gas", node_id);
                }
                // main_promise = main_promise.then(gas_promise);
            }
        }
        return main_promise;
    }

    #[payable]
    #[private]
    pub fn bounty_add_storage_deposit(&mut self) -> Promise {
        require!(self.owner_id == signer_account_id() || self.coordinator_id == current_account_id(), "Only the owner of the bounty or the coordinator can add to the deposit");
        self.amt_storage += attached_deposit();
        return Promise::new(self.coordinator_id.clone()).transfer(attached_deposit());
    }

    #[payable]
    #[private]
    pub fn bounty_add_node_reward_deposit(&mut self) -> Promise {
        require!(self.owner_id == signer_account_id() || self.coordinator_id == current_account_id(), "Only the owner of the bounty or the coordinator can add to the deposit");
        self.amt_node_reward += attached_deposit();
        return Promise::new(self.coordinator_id.clone()).transfer(attached_deposit());
    }


    //Dumps the result as {$value: $number_of_nodes_with_value}, requiring the bounty creator to manually verify the result
    #[private]
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
