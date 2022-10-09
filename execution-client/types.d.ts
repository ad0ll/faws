
// Answer as stored in the Coordinator
export type NodeResponse = {
    solution: string,
    timestamp: string,
    gas_used: BigInt,
    status: "SUCCESS" | "FAILURE"
}

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
export type Result = {
    status: "SUCCESS" | "FAILURE" | "UNELECTED" | "ERROR" | "TIMEOUT" //These statuses are for the user, the bounty's answer/excecution status is posted to the contract
    solution: string,
    message?: string, //Optional field for an error or other message, gets dumped in index
}