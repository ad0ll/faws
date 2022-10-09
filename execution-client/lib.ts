import {log} from "./logger";
import {Bounty, Result} from "./types";

const COORDINATOR_CONTRACT_ID = process.env.COORDINATOR_CONTRACT_ID  || "dev-1665283011588-97304367585179";

//TODO check that received event is valid
export const validateMessage = (message: string) => {
}
export const executeBounty: (bountyId: string) => Promise<Result> = async (bountyId: string) => {
    
    log.debug(`Downloading bounty data for: ${bountyId}`)
    
    // @ts-ignore
    const bounty: Bounty = await coordinatorContract.get_bounty({ bounty_id: bountyId });
    if(!bounty){
        return {
            solution: "",
            status: "ERROR",
            message: `Bounty ${bountyId} not found`
        }
    }
    log.debug(`Bounty data: ${JSON.stringify(bounty)}`)
    
    log.debug(`Downloading bounty file at ${bounty.file_location} using protocol ${bounty.file_download_protocol}`)
    // Download package to host
    // Run dockerfile
    // Get output from dockerfile
    
    return {
        solution: "",
        status: "SUCCESS"
    }
}
