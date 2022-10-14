import {log} from "./logger";
import {Bounty, InternalResultStatuses, NodeResponse, Result, SupportedFileDownloadProtocols} from "./types";
import {BOUNTY_STORAGE_LOCATION, NODE_ID} from "./index";
import {execSync} from "child_process";
import shell from "shelljs";
import path from "path";
import * as fs from "fs";
import os from "os";
import {mkdirSync} from "fs";
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
    bounty_created: 0,
    amt_storage: BigInt(10000000000000000000),
    amt_node_reward: BigInt(10000000000000000000),
    elected_nodes: [NODE_ID],
    answers: {  }
}

// Using one of https, git, or ipfs, download the file to BOUNTY_STORAGE_LOCATION
export const downloadFile = async (file_location: string, file_download_protocol: SupportedFileDownloadProtocols, dest: string): Promise<string> => {
    if(!fs.existsSync(dest)) throw new Error(`could not find bounty storage location: ${dest}`)//TODO Preflight error

    const executionPath = path.join(dest, "execution-files")
    const dockerfilePath = path.join(executionPath, "Dockerfile")

    try{
        log.debug(`creating execution directory: ${executionPath}`)
        fs.mkdirSync(executionPath, {recursive: true})
        shell.cd(executionPath)
        if(file_download_protocol === "git") {
            const res = shell.exec(`git clone ${file_location} ${executionPath}/`);
            if(res.code !== 0) throw new Error(`git clone failed: ${res.stderr}`)
        } else if(file_download_protocol === "ipfs") {
            //TODO Support IPFS
            log.error("IPFS not yet supported")
            throw new Error("IPFS not yet supported") //TODO Preflight error
        } else if(file_download_protocol === "http") {
            const filename = path.basename(file_location);
            const res = shell.exec(`curl --output-dir ${executionPath} -O ${file_location}`)
            if(res.code !== 0) throw new Error(`downloading file with curl/http failed: ${res.stderr}`)
            if(filename.endsWith(".zip")){
                const unzipRes = shell.exec(`unzip ${filename}`)
                if(unzipRes.code !== 0) throw new Error(`unzipping file failed: ${unzipRes.stderr}`)
            } else if (filename.endsWith(".tar.gz")) {
                const untarRes = shell.exec(`tar  ${filename}`)
                if(untarRes.code !== 0) throw new Error(`unzipping file failed: ${untarRes.stderr}`)
            }
            //TODO Support TAR
        } else {
            throw new Error(`Invalid file download protocol: ${file_download_protocol}`) //TODO Preflight error
        }
        //Get files in dest, should contain only one file, and that file should be
        if(!fs.existsSync(dockerfilePath)) throw new Error(`Could not find dockerfile at expected location: ${dockerfilePath}`)//TODO Preflight error
        return dockerfilePath
    } finally {
         shell.popd();
    }
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
    const bounty = exampleBounty;
    // const bounty: Bounty = await coordinatorContract.get_bounty({ bounty_id: bountyId });
    if(!bounty){
        return genResult("ERROR", `${bountyId} not found`)
    }
    log.debug(`Bounty data: ${JSON.stringify(bounty)}`)
    const {file_location, file_download_protocol, elected_nodes} = bounty;
    const localStoragePath = path.join(BOUNTY_STORAGE_LOCATION, bountyId);


    //TODO Initialize a sandbox
    log.debug(`Downloading bounty file at ${file_location} using protocol ${file_download_protocol}`)
    const dockerfilePath = await downloadFile(file_location, file_download_protocol, localStoragePath);
    // Download package to host
    // Run dockerfile
    // Get output from dockerfile
    
    return {
        solution: "",
        status: "SUCCESS"
    }
}
