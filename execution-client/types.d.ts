
// Answer as stored in the Coordinator
import {ChunkHash} from "near-api-js/lib/providers/provider";

export type NodeResponse = {
    solution: string,
    timestamp: string,
    gas_used: BigInt,
    status: "SUCCESS" | "FAILURE"
}
export type SupportedFileDownloadProtocols = "git" | "ipfs" | "http";

// Must match contract
export type Bounty = {
    id: string,
    owner_id: string,
    coordinator_id: string,
    file_location: string,
    file_download_protocol: "git" | "ipfs" | "http",
    success: boolean,
    complete: boolean,
    cancelled: boolean,
    min_nodes: number,
    total_nodes: number,
    bounty_created: number,
    network_required: boolean,
    gpu_required: boolean,
    amt_storage: BigInt,
    amt_node_reward: BigInt,
    elected_nodes: string[],
    answers: { [key: string]: NodeResponse }
}

// Internal answer from an execution that contains additional information for better UX
export type InternalResultStatuses = "SUCCESS" | "FAILURE" | "UNELECTED" | "UNIMPLEMENTED" | "ERROR" | "TIMEOUT"
export type Result = {
    status: InternalResultStatuses  //These statuses are for the user, the bounty's answer/excecution status is posted to the contract
    solution: string,
    message?: string, //Optional field for an error or other message, gets dumped in index
}


export type EventWrapper<EventData> = {
    standard: string,
    version: string,
    event: string,
    data: EventData
}
type WSEvent<EventData> = {
    secret: string,
    events: [
        {
            block_height: number,
            block_hash: ChunkHash,
            block_timestamp: number,
            block_epoch_id: ChunkHash,
            receipt_id: ChunkHash,
            log_index: number,
            predecessor_id: string,
            account_id: string,
            status: string, //TODO Should this be enum?
            event: EventWrapper<EventData>
        }
    ]
}

type BountyCreatedEventData = {
    bounty_id: string,
    node_ids: string[],
}

type BountyCreatedEvent = WSEvent<BountyCreatedEventData>