use std::collections::HashMap;
use std::fmt::{Display, Formatter};
use std::mem::size_of_val;

use near_sdk::{AccountId, Balance, log, near_bindgen, Promise, require};
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{UnorderedMap, UnorderedSet};
use near_sdk::env::{attached_deposit, block_timestamp, block_timestamp_ms, current_account_id, predecessor_account_id, signer_account_id, storage_byte_cost};
use near_sdk::serde::{Deserialize, Serialize, Serializer};
use near_sdk::serde::ser::{SerializeSeq, SerializeStruct};
use crate::node::Node;

#[derive(BorshDeserialize, BorshSerialize, Deserialize, Serialize, Eq, PartialEq, Debug, Clone)]
#[serde(crate = "near_sdk::serde")]
pub enum SupportedDownloadProtocols {
    IPFS,
    HTTPS,
    GIT,
    EMPTY,
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
    EMPTY,
}

impl Display for NodeResponseStatus {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
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

impl Display for BountyStatus {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
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
    pub message: String,
    pub timestamp: u64,
    pub status: NodeResponseStatus,
}

#[near_bindgen]
impl NodeResponse {
    #[init]
    #[private]
    pub fn new_node_response(solution: String, message: String, status: NodeResponseStatus) -> Self {
        Self {
            solution,
            message,
            timestamp: block_timestamp(),
            status,
        }
    }
}

// TODO Add a timeout to a bounty

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct Bounty {
    pub id: AccountId,
    pub owner_id: AccountId,
    // Signer who created the bounty. Used for auth.
    pub coordinator_id: AccountId,
    // Coordinator who created the bounty. Used for auth and verification.
    pub file_location: String,
    //URL/CID. Support ipfs, git, https initially
    pub file_download_protocol: SupportedDownloadProtocols,
    pub status: BountyStatus, // Pending, Failed, Success, Cancelled
    //ipfs, git, https
    pub min_nodes: u64,
    // Min number of nodes that must have consensus to complete the bounty
    pub total_nodes: u64,
    // Total nodes to process bounty. If > threshold, bounty allows for some failures.
    pub bounty_created: u64,
    //UTC timestamp for when bounty was created
    pub network_required: bool,
    // True if the bounty's execution requires network access. Does not block downloading files for the bounty.
    pub gpu_required: bool,
    // True if the bounty's execution requires GPU compute
    pub amt_storage: Balance,
    //Unused storage is refunded to the owner once the contract is closed
    pub amt_node_reward: Balance,
    //Total payout to the nodes.
    pub timeout_seconds: u64,
    // Bounty timeout in seconds. If 0, no timeout.
    // pub result: String, //TODO This was going to be the single, definitive result. Need to summarize all the responses to get this.
    pub elected_nodes: Vec<AccountId>, //TODO This can be an unordered set, UnorderedSet.as_vec should be free
    //TODO: How can we make this private? //TODO Unrelated to <-, this could be/should be UnorderedSet or merged below with answers
    pub answers: UnorderedMap<AccountId, NodeResponse>, //TODO: How can we make this private?
    pub failed_nodes: UnorderedSet<AccountId>,
    pub successful_nodes: UnorderedSet<AccountId>,
    pub unanswered_nodes: UnorderedSet<AccountId>,
}

impl Serialize for Bounty {
fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
{
    // 3 is the number of fields in the struct.
    let mut state = serializer.serialize_struct("Bounty", 15)?;
    state.serialize_field("id", &self.id)?;
    state.serialize_field("owner_id", &self.owner_id)?;
    state.serialize_field("coordinator_id", &self.coordinator_id)?;
    state.serialize_field("file_location", &self.file_location)?;
    state.serialize_field("file_download_protocol", &self.file_download_protocol)?;
    state.serialize_field("status", &self.status)?;
    state.serialize_field("min_nodes", &self.min_nodes)?;
    state.serialize_field("total_nodes", &self.total_nodes)?;
    state.serialize_field("bounty_created", &self.bounty_created)?;
    state.serialize_field("network_required", &self.network_required)?;
    state.serialize_field("gpu_required", &self.gpu_required)?;
    state.serialize_field("amt_storage", &self.amt_storage)?;
    state.serialize_field("amt_node_reward", &self.amt_node_reward)?;
    state.serialize_field("timeout_seconds", &self.timeout_seconds)?;
    state.serialize_field("elected_nodes", &self.elected_nodes)?;

    //TODO Figure out how to serialize and add these fields
    // pub answers: UnorderedMap<AccountId, NodeResponse>, //TODO: How can we make this private?
    // pub failed_nodes: UnorderedSet<AccountId>,
    // pub successful_nodes: UnorderedSet<AccountId>,
    // pub unanswered_nodes: UnorderedSet<AccountId>,
    state.end()

}
}

// impl Serialize for UnorderedSet<AccountId>
//     where
//         AccountId: Serialize,
// {
//     fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
//         where
//             S: Serializer,
//     {
//         let mut seq = serializer.serialize_seq(Some(self.len() as usize))?;
//         for e in self {
//             seq.serialize_element(e)?;
//         }
//         seq.end()
//     }
// }


impl PartialEq<Self> for Bounty {
    fn eq(&self, other: &Self) -> bool {
        return self.id == other.id
            && self.owner_id == other.owner_id
            && self.coordinator_id == other.coordinator_id
            && self.file_location == other.file_location
            && self.file_download_protocol == other.file_download_protocol
            && self.status == other.status
            && self.min_nodes == other.min_nodes
            && self.total_nodes == other.total_nodes
            && self.timeout_seconds == other.timeout_seconds
            && self.bounty_created == other.bounty_created
            && self.network_required == other.network_required
            && self.gpu_required == other.gpu_required
            && self.amt_storage == other.amt_storage
            && self.amt_node_reward == other.amt_node_reward
            && self.elected_nodes == other.elected_nodes
            && self.answers.len() == other.answers.len() //TODO: Make this a real comparison
            && self.failed_nodes.len() == other.failed_nodes.len() //TODO: Make this a real comparison
            && self.successful_nodes.len() == other.successful_nodes.len() //TODO: Make this a real comparison
            && self.unanswered_nodes.len() == other.unanswered_nodes.len(); //TODO: Make this a real comparison
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
            status: BountyStatus::Pending,
            min_nodes: 0,
            total_nodes: 0,
            timeout_seconds: 30,
            bounty_created: block_timestamp_ms(),
            network_required: false,
            gpu_required: false,
            amt_storage: 0,
            amt_node_reward: 0,
            elected_nodes: Vec::new(),
            answers: UnorderedMap::new("bounty-answers".as_bytes().to_vec()),
            failed_nodes: UnorderedSet::new("bounty-failed-nodes".as_bytes().to_vec()),
            successful_nodes: UnorderedSet::new("bounty-successful-nodes".as_bytes().to_vec()),
            unanswered_nodes: UnorderedSet::new("bounty-unanswered-nodes".as_bytes().to_vec()),
        }
    }
}
// impl Serialize for Bounty {
//     fn serialize<S>(&self, serializer: S) -> Result<serde::ser::Ok, serde::ser::Error> where S: Serializer {
//         todo!()
//     }
// }

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
            status: BountyStatus::Pending,
            min_nodes,
            total_nodes,
            timeout_seconds,
            bounty_created: block_timestamp_ms(),
            // result: "".to_string(),
            // elected_nodes: UnorderedSet::new(format!("{}-elected", name).to_string().as_bytes()),
            elected_nodes: Vec::new(),
            answers: UnorderedMap::new(format!("{}-answers", name).to_string().as_bytes()),
            failed_nodes: UnorderedSet::new(format!("{}-failed", name).to_string().as_bytes()),
            successful_nodes: UnorderedSet::new(format!("{}-successful", name).to_string().as_bytes()),
            unanswered_nodes: UnorderedSet::new(format!("{}-unanswered", name).to_string().as_bytes()),
            // storage_used: 0,
            network_required,
            gpu_required,
            amt_storage, // Unused storage is refunded to the creator once the contract is closed
            amt_node_reward, // If the bounty is completed, nodes will be reimbursed for spent gas. If it's completed AND successful, nodes get full reward
        }
    }

    // TODO maybe not currently implemented
    // View function that returns yes, no, maybe for the client to check if they should spend gas to publish an answer
    #[private]
    pub fn should_publish_answer(&self, node_id: &AccountId) -> String { //Return as string so we can return "maybe" later
        if self.status != BountyStatus::Pending {
            log!("Should not publish, bounty is complete ({})", self.status);
            return "no".to_string();
        } else if !self.elected_nodes.contains(&node_id) {
            log!("Should not publish, {} is not an elected node", &node_id);
            return "no".to_string(); // You aren't an elected node
        } else if self.answers.get(&node_id).is_some() {
            log!("Should not publish, {} has already submitted an answer", &node_id);
            return "no".to_string(); // You have already posted an answer
        } else if self.successful_nodes.len() >= self.min_nodes {
            log!("Should not publish, we have enough successful nodes to close the bounty")
        } else if self.failed_nodes.len() >= self.min_nodes {
            log!("Should not publish, we have enough failed nodes to close the bounty")
        }
        //TODO Should check if we have enough successful answers and return no if we're evaluating them
        log!("Should publish, {} is elected, has not submitted an answer, and the bounty isn't complete", node_id);
        return "yes".to_string();
    }

    //Dumps the result as {$value: $number_of_nodes_with_value}, requiring the bounty creator to manually verify the result
    #[private]
    pub fn get_result(&self) -> HashMap<String, u8> {
        log!("Getting result for bounty {}", self.id);
        let mut res: HashMap<String, u8> = HashMap::new();
        for (_, value) in self.answers.iter() {
            if res.contains_key(&value.solution.clone()) {
                res.insert(value.solution.clone(), res.get(&value.solution.clone()).unwrap() + 1);
            } else {
                res.insert(value.solution.clone(), 1);
            }
        }
        return res;
    }
}
