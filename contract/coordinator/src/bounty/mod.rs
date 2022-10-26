use std::collections::HashMap;
use std::fmt::{Display, Formatter};

use near_sdk::{AccountId, Balance, log, near_bindgen};
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{UnorderedMap, UnorderedSet};
use near_sdk::env::{block_timestamp, block_timestamp_ms, predecessor_account_id, signer_account_id};
use near_sdk::serde::{Deserialize, Deserializer, Serialize, Serializer};
use near_sdk::serde::de::{Error, MapAccess, Visitor};
use near_sdk::serde::ser::SerializeStruct;

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
    pub status: BountyStatus,
    // Pending, Failed, Success, Cancelled
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
    pub elected_nodes: Vec<AccountId>,
    //TODO This can be an unordered set, UnorderedSet.as_vec should be free
    //TODO: How can we make this private? //TODO Unrelated to <-, this could be/should be UnorderedSet or merged below with answers
    pub answers: UnorderedMap<AccountId, NodeResponse>,
    //TODO: How can we make this private?
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

impl<'de> Deserialize<'de> for Bounty {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
        where
            D: Deserializer<'de>,
    {
        struct BountyVisitor;

        impl<'de> Visitor<'de> for BountyVisitor {
            type Value = Bounty;

            fn expecting(&self, formatter: &mut Formatter) -> std::fmt::Result {
                formatter.write_str("struct Bounty")
            }

            fn visit_map<V>(self, mut map: V) -> Result<Bounty, V::Error>
                where
                    V: MapAccess<'de>,
            {
                let mut id = None;
                let mut owner_id = None;
                let mut coordinator_id = None;
                let mut file_location = None;
                let mut file_download_protocol = None;
                let mut status = None;
                let mut min_nodes = None;
                let mut total_nodes = None;
                let mut bounty_created = None;
                let mut network_required = None;
                let mut gpu_required = None;
                let mut amt_storage = None;
                let mut amt_node_reward = None;
                let mut timeout_seconds = None;
                let mut elected_nodes = None;

                while let Some(key) = map.next_key()? {
                    match key {
                        "id" => {
                            if id.is_some() {
                                return Err(Error::duplicate_field("id"));
                            }
                            id = Some(map.next_value()?);
                        }
                        "owner_id" => {
                            if owner_id.is_some() {
                                return Err(Error::duplicate_field("owner_id"));
                            }
                            owner_id = Some(map.next_value()?);
                        }
                        "coordinator_id" => {
                            if coordinator_id.is_some() {
                                return Err(Error::duplicate_field("coordinator_id"));
                            }
                            coordinator_id = Some(map.next_value()?);
                        }
                        "file_location" => {
                            if file_location.is_some() {
                                return Err(Error::duplicate_field("file_location"));
                            }
                            file_location = Some(map.next_value()?);
                        }
                        "file_download_protocol" => {
                            if file_download_protocol.is_some() {
                                return Err(Error::duplicate_field("file_download_protocol"));
                            }
                            file_download_protocol = Some(map.next_value()?);
                        }
                        "status" => {
                            if status.is_some() {
                                return Err(Error::duplicate_field("status"));
                            }
                            status = Some(map.next_value()?);
                        }
                        "min_nodes" => {
                            if min_nodes.is_some() {
                                return Err(Error::duplicate_field("min_nodes"));
                            }
                            min_nodes = Some(map.next_value()?);
                        }
                        "total_nodes" => {
                            if total_nodes.is_some() {
                                return Err(Error::duplicate_field("total_nodes"));
                            }
                            total_nodes = Some(map.next_value()?);
                        }
                        "bounty_created" => {
                            if bounty_created.is_some() {
                                return Err(Error::duplicate_field("bounty_created"));
                            }
                            bounty_created = Some(map.next_value()?);
                        }
                        "network_required" => {
                            if network_required.is_some() {
                                return Err(Error::duplicate_field("network_required"));
                            }
                            network_required = Some(map.next_value()?);
                        }
                        "gpu_required" => {
                            if gpu_required.is_some() {
                                return Err(Error::duplicate_field("gpu_required"));
                            }
                            gpu_required = Some(map.next_value()?);
                        }
                        "amt_storage" => {
                            if amt_storage.is_some() {
                                return Err(Error::duplicate_field("amt_storage"));
                            }
                            amt_storage = Some(map.next_value()?);
                        }
                        "amt_node_reward" => {
                            if amt_node_reward.is_some() {
                                return Err(Error::duplicate_field("amt_node_reward"));
                            }
                            amt_node_reward = Some(map.next_value()?);
                        }
                        "timeout_seconds" => {
                            if timeout_seconds.is_some() {
                                return Err(Error::duplicate_field("timeout_seconds"));
                            }
                            timeout_seconds = Some(map.next_value()?);
                        }
                        "elected_nodes" => {
                            if elected_nodes.is_some() {
                                return Err(Error::duplicate_field("elected_nodes"));
                            }
                            elected_nodes = Some(map.next_value()?);
                        }
                        _ => {}
                    }
                }
                let id = id.ok_or_else(|| Error::missing_field("id"))?;
                let owner_id = owner_id.ok_or_else(|| Error::missing_field("owner_id"))?;
                let coordinator_id = coordinator_id.ok_or_else(|| Error::missing_field("coordinator_id"))?;
                let file_location = file_location.ok_or_else(|| Error::missing_field("file_location"))?;
                let file_download_protocol = file_download_protocol.ok_or_else(|| Error::missing_field("file_download_protocol"))?;
                let status = status.ok_or_else(|| Error::missing_field("status"))?;
                let min_nodes = min_nodes.ok_or_else(|| Error::missing_field("min_nodes"))?;
                let total_nodes = total_nodes.ok_or_else(|| Error::missing_field("total_nodes"))?;
                let bounty_created = bounty_created.ok_or_else(|| Error::missing_field("bounty_created"))?;
                let network_required = network_required.ok_or_else(|| Error::missing_field("network_required"))?;
                let gpu_required = gpu_required.ok_or_else(|| Error::missing_field("gpu_required"))?;
                let amt_storage = amt_storage.ok_or_else(|| Error::missing_field("amt_storage"))?;
                let amt_node_reward = amt_node_reward.ok_or_else(|| Error::missing_field("amt_node_reward"))?;
                let timeout_seconds = timeout_seconds.ok_or_else(|| Error::missing_field("timeout_seconds"))?;
                let elected_nodes = elected_nodes.ok_or_else(|| Error::missing_field("elected_nodes"))?;
                return Ok(Bounty {
                    id,
                    owner_id,
                    coordinator_id,
                    file_location,
                    file_download_protocol,
                    status,
                    min_nodes,
                    total_nodes,
                    bounty_created,
                    network_required,
                    gpu_required,
                    amt_storage,
                    amt_node_reward,
                    timeout_seconds,
                    elected_nodes,
                    answers: UnorderedMap::new(format!("{}-answers", "test").to_string().as_bytes()),
                    failed_nodes: UnorderedSet::new(format!("{}-failed", "test").to_string().as_bytes()),
                    successful_nodes: UnorderedSet::new(format!("{}-successful", "test").to_string().as_bytes()),
                    unanswered_nodes: UnorderedSet::new(format!("{}-unanswered", "test").to_string().as_bytes()),
                });
            }
        }
        const FIELDS: &'static [&'static str] = &["id", "owner_id", "coordinator_id", "file_location", "file_download_protocol", "status", "min_nodes", "total_nodes", "bounty_created", "network_required", "gpu_required", "amt_storage", "amt_node_reward", "timeout_seconds", "elected_nodes"];
        deserializer.deserialize_struct("Bounty", FIELDS, BountyVisitor)
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
    pub fn new_bounty(id: AccountId, file_location: String, file_download_protocol: SupportedDownloadProtocols, min_nodes: u64, total_nodes: u64, timeout_seconds: u64, network_required: bool, gpu_required: bool, amt_storage: u128, amt_node_reward: u128) -> Self {
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
            answers: UnorderedMap::new(format!("{}-answers", "test").to_string().as_bytes()),
            failed_nodes: UnorderedSet::new(format!("{}-failed", "test").to_string().as_bytes()),
            successful_nodes: UnorderedSet::new(format!("{}-successful", "test").to_string().as_bytes()),
            unanswered_nodes: UnorderedSet::new(format!("{}-unanswered", "test").to_string().as_bytes()),
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
