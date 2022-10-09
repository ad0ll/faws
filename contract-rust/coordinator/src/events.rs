//TODO Update documentation in here, all pointing to NFT stuffs from where this was copied

use std::fmt;
use near_sdk::{AccountId, serde_json};

// This is heavily influenced by: https://github.com/near-examples/nft-tutorial/blob/7.events/nft-contract/src/events.rs#L1-L79
use near_sdk::serde::{Deserialize, Serialize};

/// Enum that represents the data type of the EventLog.
/// The enum can either be an NftMint or an NftTransfer.
#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "event", content = "data")]
#[serde(rename_all = "snake_case")]
#[serde(crate = "near_sdk::serde")]
#[non_exhaustive]
pub enum EventLogVariant {
    BountyCreated(BountyCreatedLog),
    BountyCompleted(BountyCompletedLog),
}

/// Interface to capture data about an event
///
/// Arguments:
/// * `standard`: name of standard e.g. nep171
/// * `version`: e.g. 1.0.0
/// * `event`: associate event data
#[derive(Serialize, Deserialize, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct EventLog {
    pub standard: String,
    pub version: String,
    // `flatten` to not have "event": {<EventLogVariant>} in the JSON, just have the contents of {<EventLogVariant>}.
    #[serde(flatten)]
    pub event: EventLogVariant,
}

impl fmt::Display for EventLog {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_fmt(format_args!(
            "EVENT_JSON:{}",
            &serde_json::to_string(self).map_err(|_| fmt::Error)?
        ))
    }
}

/// An event log to capture token minting
///
/// Arguments
/// * `bounty_id`: "bounty.id.test.near"
/// * `node_ids`: ["node.id.test.near", "node2.id.test.near"]
/// * `message`: optional message
#[derive(Serialize, Deserialize, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct BountyCreatedLog {
    pub bounty_id: AccountId,
    // pub creator_id: AccountId, //TODO Need to implement this for filtering
    pub node_ids: Vec<AccountId>,
    // pub network_required: bool, //TODO Need to implement this for filtering
    // pub gpu_required: bool, //TODO Need to implement this for filtering
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
}

//TODO Implement post answer logs

/// An event log to capture token transfer
///
/// Arguments
/// * `authorized_id`: approved account to transfer
/// * `old_owner_id`: "owner.near"
/// * `new_owner_id`: "receiver.near"
/// * `token_ids`: ["1", "12345abc"]
/// * `memo`: optional message
#[derive(Serialize, Deserialize, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct BountyCompletedLog {
    pub solution: String,
    pub success: bool,
    // pub creator_id: AccountId, //TODO We need this for filtering
    #[serde(skip_serializing_if = "Option::is_none")]
    pub nodes: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
}