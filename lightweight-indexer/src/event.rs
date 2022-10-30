use crate::ExecutionOutcomeStatus;

#[derive(Clone, Debug)]
pub struct Event {
    pub block_height: i128,
    pub block_hash: String,
    pub block_timestamp: i128,
    pub block_epoch_id: String,
    pub receipt_id: String,
    pub log_index: i32,
    pub predecessor_id: String,
    pub account_id: String,
    pub status: ExecutionOutcomeStatus,
    pub event: String,
}
