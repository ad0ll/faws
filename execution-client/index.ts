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

const WEBSOCKET_URL = process.env.WEBSOCKET_URL || 'ws://localhost:7071';
const UNIVERSAL_TIMEOUT = process.env.UNIVERSAL_TIMEOUT || 30000;
const ACCOUNT_ID= process.env.ACCOUNT_ID || "test1.test.near";
const NODE_ID = process.env.NODE_ID || "acheivement3.node.dev-1665283011588-97304367585179";
const ACCEPT_NETWORK_WORKLOADS = process.env.ACCEPT_NETWORK_WORKLOADS || true;
const ACCEPT_GPU_WORKLOADS = process.env.ACCEPT_GPU_WORKLOADS || true;
const COORDINATOR_CONTRACT_ID = process.env.COORDINATOR_CONTRACT_ID  || "dev-1665283011588-97304367585179";
const { keyStores } = nearAPI;

//TODO We probably want to do a browser key store
// const keyStore = new keyStores.BrowserLocalStorageKeyStore(); //Needed because we have to sign transactions
const CREDENTIALS_DIR = process.env.CREDENTIALS_DIR || path.join(os.homedir(), ".near-credentials",);
const keyStore = new keyStores.UnencryptedFileSystemKeyStore(CREDENTIALS_DIR);

const connectionConfig = {
    networkId:  process.env.NEAR_NETWORK_ID || "localnet",
    keyStore,
    nodeUrl:  process.env.NEAR_NODE_URL || "http://localhost:3030",
    walletUrl: process.env.NEAR_WALLET_URL || "http://localhost/wallet", // Default isn't a real url
    helperUrl: process.env.NEAR_HELPER_URL || "http://localhost/helper", // Default isn't a real url
    explorerUrl: process.env.NEAR_EXPLORER_URL || "http://localhost/helper", // Default isn't a real url
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

    //TODO how can we avoid the below?
    // walletConnection.requestSignIn(
    //     "example-contract.testnet", // contract requesting access
    //     "Example App", // optional title
    //     "http://YOUR-URL.com/success", // optional redirect URL on success
    //     "http://YOUR-URL.com/failure" // optional redirect URL on failure
    // );
    // account = await walletConnection.account();
    // accountId = walletConnection.getAccountId();
}

type CoordinatorContract = Contract & {
    get_bounty:  ({bounty_id}: {bounty_id: string}) => Promise<Bounty>;
    should_publish_answer: ({bounty_id, node_id}: {bounty_id: string, node_id: string}) => Promise<boolean>;
    get_node: ({node_id}: {node_id: string}) => Promise<any>; //TODO should return node instead
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
    const node = await coordinatorContract.get_node({node_id: NODE_ID});
    log.info(`Node ${NODE_ID} is registered with the following properties: ${JSON.stringify(node)}`);
    if(!node) {
        log.error(`Node ${NODE_ID} is not registered with the coordinator contract (${COORDINATOR_CONTRACT_ID})`);
        process.exit(1);
    }
}




type EventWrapper<EventData> = {
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


const client = new WebSocket(WEBSOCKET_URL);


(async () => {
    await bootstrapNear()
    coordinatorContract = getCoordinatorContract()
    await bootstrapNode()

})

client.onopen = () => {
    log.info(`Listening for bounties on ${WEBSOCKET_URL}`);
    client.send(JSON.stringify({
        "filter": [{
            "event": {
                "event": "bounty_created"
            }
        }],
        "secret": "secret"
    }), () => {
        log.info("Subscribed to bounty_created events")
    });
}
client.onerror = (error) => {
    log.error(`WebSocket error: `, error);
client.onmessage = (event) => {
    log.debug(`Received event: `, event);
    const data = event.data;
    console.log(data);
    // MessageEvent<BountyCreatedEvent>
    // event.data?.events?.forEach( async (eventData) => {
    //   log.debug(`Received event: ${JSON.stringify(eventData)}`);
    //   if (eventData.event.event === "bounty_created") {
    //       const bountyData = eventData.event.data;
    //       log.info(`Received bounty_created event for ${bountyData.bounty_id}. Checking if we're elected...`);
    //       if (bountyData.node_ids.includes(NODE_ID)) {
    //           log.info(`We're elected! Executing bounty ${bountyData.bounty_id}...`);
    //           const res = await executeBounty(bountyData.bounty_id);
    //           if(res.status === "ERROR"){
    //               log.error(`Error executing bounty ${bountyData.bounty_id}: ${res.message}`);
    //           } else if(res.status === "UNELECTED"){
    //               log.debug(`We're not elected for bounty ${bountyData.bounty_id}.`);
    //           } else if(res.status === "FAILURE"){
    //               log.info(`Finished executing the bounty, but the bounty failed to execute: ${bountyData.bounty_id}!`);
    //           } else if(res.status === "TIMEOUT"){
    //               log.info(`Bounty timed out: ${bountyData.bounty_id}!`);
    //           } else if(res.status === "SUCCESS"){
    //               log.info(`Successfully executed the bounty: ${bountyData.bounty_id}`);
    //           } else {
    //               log.info(`Received unknown status from bounty execution ${bountyData.bounty_id}: ${res.status}`);
    //           }
    //       }
    //   }
    // })
    log.debug(`Received message from server`);
}

}

