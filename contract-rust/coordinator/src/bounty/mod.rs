use std::collections::HashMap;
use std::fmt::Display;
use chrono::Utc;
use near_sdk::{AccountId, Balance, near_bindgen, require};
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{UnorderedMap};
use near_sdk::env::{current_account_id, predecessor_account_id, signer_account_id};
use near_sdk::serde::{Serialize, Deserialize};

pub const STORAGE_COST: Balance = 1_000_000_000_000_000_000_000; //1.1 NEAR
pub const MIN_STORAGE: Balance = 1_000_000_000_000_000_000_000; //1.1 NEAR
pub const TGAS: u64 = 1_000_000_000_000;
pub const DEFAULT_NODE_OWNER_ID: &str = "default-node.test.near";
pub const DEFAULT_BOUNTY_OWNER_ID: &str = "default-bounty.test.near";

// May be possible to incentivize higher rewards by having an ordered vector of bounties
const MIN_REWARD: Balance = 1_000_000_000_000_000_000_000;

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


//TODO using an enum for file_download_protocol breaks serialization
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct Bounty{
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
    pub bounty_created: i64, //UTC timestamp for when bounty was created
    pub network_required: bool, // True if the bounty's execution requires network access. Does not block downloading files for the bounty.
    pub amt_storage: Balance, //Unused storage is refunded to the owner once the contract is closed
    pub amt_node_reward: Balance, //Total payout to the nodes.
    // pub result: String,
    // pub elected_nodes: LookupMap<AccountId, String>, //TODO: How can we make this private?
    pub elected_nodes: Vec<AccountId>, //TODO: How can we make this private? //TODO Could be LookupSet
    pub answers: UnorderedMap<AccountId, String>, //TODO: How can we make this private?
}

impl PartialEq<Self> for Bounty {
    fn eq(&self, other: &Self) -> bool {
        return self.owner_id == other.owner_id
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
            owner_id: "bounty-owner".to_string().parse().unwrap(),
            coordinator_id: "bounty-coordinator".to_string().parse().unwrap(),
            file_location: "".to_string(),
            file_download_protocol: SupportedDownloadProtocols::EMPTY,
            success: false,
            complete: false,
            cancelled: false,
            threshold: 0,
            total_nodes: 0,
            bounty_created: 0,
            network_required: false,
            amt_storage: 0,
            amt_node_reward: 0,
            elected_nodes: vec![],
            answers: UnorderedMap::new("bounty-answers".to_string().as_bytes()),
        }
    }
}
#[near_bindgen]
impl Bounty {
    #[init]
    #[private]
    #[payable]
    pub fn init_bounty(name: String, file_location: String, file_download_protocol: SupportedDownloadProtocols, threshold: u64, total_nodes: u64, network_required: bool, amt_storage: Balance, amt_node_reward: Balance) -> Self {

        Self {
            owner_id: signer_account_id(),
            coordinator_id: predecessor_account_id(), //predecessor_account_id OR whatever the user specifies
            file_location,
            file_download_protocol,
            success: false,
            complete: false,
            cancelled: false,
            threshold,
            total_nodes,
            bounty_created: Utc::now().timestamp(),
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
    // pub fn should_publish(&self) -> bool {
    //     self.complete && self.success
    // },
    // #[private]
    // pub fn complete_bounty(&mut self){
    //
    // }
    // pub fn is_complete(&self) -> bool {
    //     return false
    // }
    // pub fn should_publish(&self) -> bool {
    //     if self.complete || self.answers. {
    //         return false
    //     }
    //     if(self.complete && self.success){
    //         return true;
    //     }
    //     else{
    //         return false;
    //     }
    // }
    #[private]
    pub fn publish_answer(&mut self, result: String) {
        require!(self.complete == false, "Bounty is complete, no more answers can be published");
        require!(!self.elected_nodes.contains(&signer_account_id()), "You are not an elected node");
        require!(self.answers.get(&signer_account_id()).is_none(), "You have already submitted an answer");
        require!(self.answers.len() < self.threshold, "Node is not accepting any more answers"); //Client should sleep then recheck if they get this message
        // Node has to pay for the transaction + storage, but this is refunded to them later

        // Pay for storage using bounty deposit
        self.answers.insert(&signer_account_id(), &result);

        //TODO Check for outliers and remove them

        if self.answers.len() >= self.threshold {
            self.complete = true;
            self.success = true;
        }
    }
    // View function that returns yes, no, maybe.
    // Maybe instructs the client to sleep and recheck, because one of the answers could be dropped.
    // No will exit the execution with no attempt to post the answer (avoids using gas)
    // Yes will post the answer (Node pays gas, which we will try to reimburse)
    // TODO could return int, would be cheaper?
    pub fn should_post_answer(&self, node_id: AccountId) -> String {
        if self.complete {
            return "no".to_string();
        } else if !self.elected_nodes.contains(&node_id) {
            return "no".to_string();
        } else if !self.answers.get(&node_id).is_some() {
            return "no".to_string();
        } else if self.answers.len() < self.threshold {
            return "yes".to_string();
        } else {
            return "maybe".to_string();
        }
    }

    pub fn close(&mut self, failed: bool){
        require!(self.owner_id == signer_account_id() || self.coordinator_id == current_account_id(), "Only the owner of the bounty or the coordinator can close it");
        if failed {
            self.success = false;
            self.complete = true;
        } else if self.answers.len() >= self.threshold {
            self.complete = true;
            self.success = true
        } else {
            self.complete = true;
            self.success = true;
            self.cancelled = true;
        }
        //TODO: Publish bounty closd event
        //TODO: Refund storage
        //TODO: Reimburse nodes for gas
        //TODO:
        // env::log_str(&nft_mint_log.to_string());
        //
        // //calculate the required storage which was the used - initial
        // let required_storage_in_bytes = env::storage_usage() - initial_storage_usage;
        //
        // //refund any excess storage if the user attached too much. Panic if they didn't attach enough to cover the required.
        // refund_deposit(required_storage_in_bytes
    }


    //Placeholder for now. Dumps the result as {$value: $number_of_nodes_with_value}
    pub fn get_result(&self) -> HashMap<String, u8> {
        let mut res: HashMap<String, u8> = HashMap::new();
        for (_, value) in self.answers.iter() {
            if !res.contains_key(&value.clone()){
                res.insert(value.clone(), res.get(&value).unwrap() + 1);
            } else {
                res.insert(value, 1);
            }
        }
        return res
    }
}
