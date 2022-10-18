import {ClientConfig} from "./types";
import path from "path";
import os from "os";
import assert from "assert";
import * as nearAPI from "near-api-js";
import {logger} from "./logger";


// Sets up the global config object and does some basic validation
// Items prefixed with NEAR_ are for NEAR api config, anything else is client config
export const readConfigFromEnv = (): ClientConfig => {
    const {
        WEBSOCKET_URL = 'ws://localhost:7071', //TODO Default should be mainnet or testnet
        UNIVERSAL_TIMEOUT = BigInt(300000), // TODO Reject bounties that have a timeout > this value.?
        ACCOUNT_ID = "test1.test.near", //TODO bad dummy value, should be required
        NODE_ID = "achievement3.node.dev-1665283011588-97304367585179", //TODO bad dummy value, should be required
        ACCEPT_NETWORK_WORKLOADS = true,
        ACCEPT_GPU_WORKLOADS = false,
        BOUNTY_STORAGE_DIR = path.join(os.homedir(), ".local/bounty_data/$BOUNTY_ID"),
        COORDINATOR_CONTRACT_ID = "dev-1665283011588-97304367585179",
        DOCKER_CONTAINER_NAME_FORMAT = "bounty-$BOUNTY_ID",
        DOCKER_IMAGE_NAME_FORMAT = "$BOUNTY_ID",
        NEAR_CREDENTIALS_DIR,
        NEAR_NETWORK_ID = "localnet",
        NEAR_NODE_URL = "http://0.0.0.0:3030", //TODO not a real URL, should point to testnet
        NEAR_WALLET_URL = "http://0.0.0.0/wallet", //TODO not a real URL, should point to testnet
        NEAR_HELPER_URL = "http://0.0.0.0/helper", //TODO not a real URL, should point to testnet
        STORAGE_DOCKER_PRUNE_SYSTEM_EACH_RUN = "false",
        STORAGE_DOCKER_PRUNE_IMAGES_EACH_RUN = "false",
        STORAGE_DOCKER_REMOVE_EXECUTION_CONTAINER_EACH_RUN = "true",
        STORAGE_DOCKER_REMOVE_EXECUTION_IMAGE_EACH_RUN = "true",
    } = process.env;
    logger.info("Bootstrapping client configuration from environment"); /*?*/
    //Set up credentials for near connection
    const {keyStores} = nearAPI;
    const credentialsDir = NEAR_CREDENTIALS_DIR || path.join(os.homedir(), ".near-credentials",);
    const keyStore = new keyStores.UnencryptedFileSystemKeyStore(credentialsDir);

    //Create the config object, defaults are assigned when reading envvars
    const config: ClientConfig = {
        websocketUrl: WEBSOCKET_URL,
        universalTimeout: BigInt(UNIVERSAL_TIMEOUT),
        accountId: ACCOUNT_ID,
        nodeId: NODE_ID,
        acceptNetworkWorkloads: ACCEPT_NETWORK_WORKLOADS === "true",
        acceptGpuWorkloads: ACCEPT_GPU_WORKLOADS === "true",
        bountyStorageDir: BOUNTY_STORAGE_DIR?.replace("$NODE_ID", NODE_ID),
        coordinatorContractId: COORDINATOR_CONTRACT_ID,
        containerNameFormat: DOCKER_CONTAINER_NAME_FORMAT?.replace("$NODE_ID", NODE_ID),
        imageNameFormat: DOCKER_IMAGE_NAME_FORMAT?.replace("$NODE_ID", NODE_ID),
        nearConnection: {
            networkId: NEAR_NETWORK_ID,
            keyStore,
            nodeUrl: NEAR_NODE_URL,
            walletUrl: NEAR_WALLET_URL,
            helperUrl: NEAR_HELPER_URL,
        },
        storage: {
            dockerPurgeImagesAfterRun: STORAGE_DOCKER_PRUNE_IMAGES_EACH_RUN === "true",
            dockerPurgeSystemAfterRun: STORAGE_DOCKER_PRUNE_SYSTEM_EACH_RUN === "true",
            dockerRemoveContainerAfterRun:  STORAGE_DOCKER_REMOVE_EXECUTION_CONTAINER_EACH_RUN !== "true",
            dockerRemoveExecutionImageAfterRun: STORAGE_DOCKER_REMOVE_EXECUTION_IMAGE_EACH_RUN !== "false" // Default true,
        }
    }
    console.log(config) /*?*/

    logger.debug(`Validating specific configuration elements`); //?
    assert(config.bountyStorageDir.includes("$BOUNTY_ID"), "The $BOUNTY_ID placeholder must appear in BOUNTY_STORAGE_DIR to avoid collisions")
    assert(config.universalTimeout > BigInt(0), "UNIVERSAL_TIMEOUT must be greater than 0")
    logger.debug("Finished bootstrapping client configuration:", config); /*?*/
    return config

}