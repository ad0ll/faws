import {log} from "./logger";
import {Bounty, InternalResultStatuses, NodeResponse, Result} from "./types";

const COORDINATOR_CONTRACT_ID = process.env.COORDINATOR_CONTRACT_ID  || "dev-1665283011588-97304367585179";

//TODO check that received event is valid
export const validateMessage = (message: string) => {
}

export const genResult = (status: InternalResultStatuses, message: string): Result => ({
    solution: "",
    status,
    message
})

const exampleBounty: Bounty = {
    id: "example-bounty",
    owner_id: "example-owner",
    coordinator_id: "example-coordinator",
    file_location: "git@github.com:ad0ll/docker-hello-world.git",
    file_download_protocol: "git",
    success: false,
    complete: false,
    cancelled: false,
    min_nodes: 2,
    total_nodes: 5,
    network_required: true,
    gpu_required: false,
    amt_storage: 100000000000,
    amt_node_reward: 1000000000,
    elected_nodes: string[],
    answers: { [key: string]: NodeResponse }
}

// Using one of https, git, or ipfs, download the file to BOUNTY_STORAGE_LOCATION
export const downloadFile = async (file_location: string, file_download_protocol: string) => {
    // See https://stackoverflow.com/questions/41938718/how-to-download-files-using-axios
    switch (file_download_protocol) {
        case "https":
            //TODO
            break
        case "git":
            //TODO
        case "ipfs":
            //TODO
            break
    }
    //TODO
}
// Take zip/tar path and unpack. Return path to unpacked directory.
export const unpackFile = async (filePath: string): Promise<string> => {
    //TODO
    // If downloaded file is actually a dir (such as when doing git clone), do nothing
    // Check if ext is zip, tar, or tar.gz
    // If zip, unzip. If tar, untar
    return ""
}

// Check if there is a dockerfile at the root
export const verifyFileStructure = async (unpackedPath: string) => {
    // TODO
    //
}

export const executeBounty = async (bountyId: string): Promise<Result> => {
    log.debug(`Downloading bounty data for: ${bountyId}`)
    
    // @ts-ignore
    const bounty: Bounty = await coordinatorContract.get_bounty({ bounty_id: bountyId });
    if(!bounty){
        return genResult("ERROR", `${bountyId} not found`)
    }
    log.debug(`Bounty data: ${JSON.stringify(bounty)}`)
    const {file_location, file_download_protocol, elected_nodes} = bounty;


    log.debug(`Downloading bounty file at ${file_location} using protocol ${file_download_protocol}`)

    // Download package to host
    // Run dockerfile
    // Get output from dockerfile
    
    return {
        solution: "",
        status: "SUCCESS"
    }
}
