use chrono::Utc;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, LookupSet, UnorderedMap, UnorderedSet};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{log, near_bindgen, AccountId, Balance, Gas};
use near_sdk::env::{current_account_id, predecessor_account_id, signer_account_id};

pub const STORAGE_COST: Balance = 1_000_000_000_000_000_000_000;
//1.1 NEAR
pub const MIN_STORAGE: Balance = 1_000_000_000_000_000_000_000;
//1.1 NEAR
pub const TGAS: u64 = 1_000_000_000_000;
pub const DEFAULT_NODE_OWNER_ID: &str = "default-node.test.near";
pub const DEFAULT_BOUNTY_OWNER_ID: &str = "default-bounty.test.near";


// May be possible to incentivize higher rewards by having an ordered vector of bounties
const MIN_REWARD: Balance = 1_000_000_000_000_000_000_000;

enum SupportedDownloadProtocols {
    IPFS,
    HTTPS,
    GIT,
}
//TODO using an enum for file_download_protocol breaks serialization
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct Bounty{
    pub owner_id: AccountId, // Signer who created the bounty. Used for auth.
    pub coordinator_id: AccountId, // Coordinator who created the bounty. Used for auth and verification.
    pub file_location: String, //URL/CID. Support ipfs, git, https initially
    // pub file_download_protocol: SupportedDownloadProtocols, //ipfs, git, https
    pub file_download_protocol: String, //ipfs, git, https
    pub success: bool, // True if we accepted responses from a minimum of ${threshold} nodes. False on error or cancel.
    pub complete: bool, // True the bounty is done processing.
    pub threshold: u64, // Min number of nodes that must have consensus to complete the bounty
    pub total_nodes: u64, // Total nodes to process bounty. If > threshold, bounty allows for some failures.
    pub bounty_created: i64, //UTC timestamp for when bounty was created
    pub network_required: bool, // True if the bounty's execution requires network access. Does not block downloading files for the bounty.
    pub amt_storage: Balance, //Unused storage is refunded to the owner once the contract is closed
    pub amt_node_reward: Balance, //Total payout to the nodes.
    pub result: String,
    // pub elected_nodes: LookupMap<AccountId, String>, //TODO: How can we make this private?
    pub elected_nodes: Vec<AccountId>, //TODO: How can we make this private? //TODO Could be LookupSet
    pub answers: UnorderedMap<AccountId, String>, //TODO: How can we make this private?
}

#[near_bindgen]
impl Bounty {
    #[init]
    #[private]
    #[payable]
    pub fn new(name: String, file_location: String, file_download_protocol: String, threshold: u64, total_nodes: u64, network_required: bool, amt_storage: Balance, amt_node_reward: Balance) -> Self {
        Self {
            owner_id: signer_account_id(),
            coordinator_id: predecessor_account_id(), //predecessor_account_id OR whatever the user specifies
            file_location,
            file_download_protocol,
            success: false,
            complete: false,
            threshold,
            total_nodes,
            bounty_created: Utc::now().timestamp(),
            result: "".to_string(),
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
    // }
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
        assert!(self.complete == false, "Bounty is complete, no more answers can be published");
        assert!(!self.elected_nodes.contains(&signer_account_id()), "You are not an elected node");
        assert!(self.answers.get(&signer_account_id()).is_none(), "You have already submitted an answer");
        assert!(self.answers.len() < self.threshold, "Node is not accepting any more answers"); //Client should sleep then recheck if they get this message
        // Node has to pay for the transaction + storage, but this is refunded to them later

        // Pay for storage using bounty deposit
        self.answers.insert(&signer_account_id(), &result);
        // check_complete(self);
        // elected_nodes.delete(signer_account_id());
        // elected_nodes.insert(signer_account_id(), env::used_gas());
        self.result = result;
    }
}
