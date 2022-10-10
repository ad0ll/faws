import {exec} from "child_process";
import * as nearAPI from "near-api-js";
import winston from "winston";
import {Account, connect, Contract, WalletConnection} from "near-api-js";
import {log} from "./logger";
import {ChunkHash} from "near-api-js/lib/providers/provider";
import {executeBounty} from "./lib";
import os from "os"
import path from "path"
import {Bounty, NodeResponse} from "./types";
import WebSocket from "ws";


//config items
const WEBSOCKET_URL = process.env.WEBSOCKET_URL || 'ws://localhost:7071';
const UNIVERSAL_TIMEOUT = process.env.UNIVERSAL_TIMEOUT || 30000;
const ACCOUNT_ID= process.env.ACCOUNT_ID || "test1.test.near";
const NODE_ID = process.env.NODE_ID || "acheivement3.node.dev-1665283011588-97304367585179";
const ACCEPT_NETWORK_WORKLOADS = process.env.ACCEPT_NETWORK_WORKLOADS || true;
const ACCEPT_GPU_WORKLOADS = process.env.ACCEPT_GPU_WORKLOADS || true;
const COORDINATOR_CONTRACT_ID = process.env.COORDINATOR_CONTRACT_ID  || "dev-1665283011588-97304367585179";
const BOUNTY_STORAGE_LOCATION = process.env.BOUNTY_STORAGE_DIR || path.join(process.cwd(), "bounties");
const { keyStores } = nearAPI;
//TODO We probably want to do a browser key store
// const keyStore = new keyStores.BrowserLocalStorageKeyStore(); //Needed because we have to sign transactions
const CREDENTIALS_DIR = process.env.CREDENTIALS_DIR || path.join(os.homedir(), ".near-credentials",);
const keyStore = new keyStores.UnencryptedFileSystemKeyStore(CREDENTIALS_DIR);

const connectionConfig = {
    networkId:  process.env.NEAR_NETWORK_ID || "localnet",
    keyStore,
    nodeUrl:  process.env.NEAR_NODE_URL || "http://0.0.0.0:3030",
    walletUrl: process.env.NEAR_WALLET_URL || "http://0.0.0.0/wallet", // Default isn't a real url
    helperUrl: process.env.NEAR_HELPER_URL || "http://0.0.0.0/helper", // Default isn't a real url
    explorerUrl: process.env.NEAR_EXPLORER_URL || "http://0.0.0.0/helper", // Default isn't a real url
};

//Global config items
export let account: Account;
export let coordinatorContract: CoordinatorContract;

// TODO check with team member about how to get the account
const bootstrapNear = async () => {
    const nearConnection = await connect(connectionConfig);
    account = await nearConnection.account(ACCOUNT_ID);
    log.info(`Connected to NEAR account: ${account.accountId}, balance: ${await account.getAccountBalance()}`);
    log.info(`Checking if node is registered...`)
    // create wallet connection
    // const walletConnection = new WalletConnection(nearConnection, "bounty-executor");

}

type CoordinatorContract = Contract & {
    get_bounty:  ({bounty_id}: {bounty_id: string}) => Promise<Bounty>;
    should_publish_answer: ({bounty_id, node_id}: {bounty_id: string, node_id: string}) => Promise<boolean>;
    get_node: ({account_id}: {account_id: string}) => Promise<any>; //TODO should return node instead
    get_answer: ({bounty_id,}: {bounty_id: string}) => Promise<NodeResponse>;
    publish_answer: ({bounty_id, node_id, result}: {bounty_id: string, node_id: string, result: NodeResponse}) => Promise<void>;
}
const getCoordinatorContract = (): CoordinatorContract => {
    log.info(`Connecting to coordinator contract at ${COORDINATOR_CONTRACT_ID}`);
    let contract = new Contract(
        account, // the account object that is connecting
        COORDINATOR_CONTRACT_ID, // the contract id
        {
            // make sure the ContractCoordinator type matches the contrac
            viewMethods: ["get_bounty", "should_publish_answer", "get_node", "get_result"], // view methods do not change state but usually return a value
            changeMethods: ["publish_answer"], // change methods modify state
        }
    );
    return contract as CoordinatorContract;
}

const bootstrapNode = async () => {
    log.info("Fetching node info from coordinator contract");
    const node = await coordinatorContract.get_node({account_id: NODE_ID});
    log.info(`Node ${NODE_ID} is registered with the following properties: ${JSON.stringify(node)}`);
    if(!node) {
        log.error(`Node ${NODE_ID} is not registered with the coordinator contract (${COORDINATOR_CONTRACT_ID})`);
        process.exit(1);
    }
    //TODO If node isn't registered, we could register it here
    /*
        TODO Check software installed on node. Should have:
        git
        curl
        docker
        unzip
        tar

        Not technically required but recommended:
        wget
        python3
        docker-compose
     */
}

(async () => {
    await bootstrapNear()
    coordinatorContract = getCoordinatorContract()
    await bootstrapNode()

})()

const client = new WebSocket(WEBSOCKET_URL);

client.onopen = () => {
    log.info(`Listening for bounties on ${WEBSOCKET_URL}`);
    client.send(JSON.stringify({
        "filter": [{
            "event": {
                "event": "bounty_created"
            }
        }],
        // "fetch_past_events": true,
        "secret": "execution_client"
    }), () => {
        log.info("Subscribed to bounty_created events")
    });
}
client.on('message', async (data) => {
    try {
        console.log("Got event")
        // console.log(data.toString())
        console.log("Parsing event")
        const message = JSON.parse(data.toString())
        console.log("parsed")
        log.debug(`Received message: `, message);
        if (message.events) {
            for (const eventData of message.events) {
        
                if (eventData.event.event === "bounty_created") {
                    const bountyData = eventData.event.data;
                    const bountyId = bountyData.bounty_id;
                    log.info(`Received bounty_created event for ${bountyId}. Checking if we're elected...`);
                    if (bountyData.node_ids.includes(NODE_ID)) {
                        log.info(`We're elected! Executing bounty ${bountyId}...`);
                        const res = await executeBounty(bountyId);
                        if (res.status === "ERROR") {
                            log.error(`Error executing bounty ${bountyId}`, res.message);
                        } else if (res.status === "UNELECTED") {
                            log.debug(`We're not elected for bounty ${bountyId}.`);
                        } else if (res.status === "FAILURE") {
                            log.info(`Finished executing the bounty, but the bounty failed to execute: ${bountyId}`, res.message);
                        } else if (res.status === "UNIMPLEMENTED") {
                            log.info(`Encountered an unimplemented feature ${res.message}: ${bountyId}!`);
                        } else if (res.status === "TIMEOUT") {
                            log.info(`Bounty timed out: ${bountyId}!`);
                        } else if (res.status === "SUCCESS") {
                            log.info(`Successfully executed the bounty: ${bountyId}`);
                        } else {
                            log.info(`Received unknown status from bounty execution ${bountyId}, ${res.status}`, res.message);
                        }
                    }
                }
            }
        
        }
    } catch (e) {
        log.error(`Error processing message: ${e}`);
    }
});
client.onerror = (error) => {
    log.error(`WebSocket error: `, error);
}
