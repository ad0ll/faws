import {Account} from "near-api-js";
import {logger} from "./logger";
import {ClientConfig, CoordinatorContract, ClientExecutionResult} from "./types";
import WebSocket from "ws";
import shell from "shelljs";
import {readConfigFromEnv} from "./config"
import {getAccount, getBounty, getCoordinatorContract} from "./util";
import {Execution} from "./lib";


//Global config items
class ExecutionClient {
    private websocketClient: WebSocket
    public executions: {[key: string]: Execution} = {} // not deliberate

    constructor(public account: Account,
                public coordinatorContract: CoordinatorContract,
                // public node: Node, TODO should probably get the node
                public config: ClientConfig,
    ) {
        this.websocketClient = new WebSocket(this.config.websocketUrl);
    }

    async initialize() {
        await this.validateNode()
        this.addWebsocketListeners()
    }


    // Checks if the node has all the required software installed
    async validateNode() {
        logger.info("Fetching node info from coordinator contract");
        const node = await this.coordinatorContract.get_node({account_id: this.config.nodeId});
        logger.info(`Node ${this.config.nodeId} is registered with the following properties: ${JSON.stringify(node)}`);
        if (!node) {
            logger.error(`Node ${this.config.nodeId} is not registered with the coordinator contract (${this.config.coordinatorContractId})`);
            process.exit(1);
        }

        const missingSoftware = [];
        shell.which("docker") || missingSoftware.push("docker is not installed");
        shell.which("git") || missingSoftware.push("git is not installed");
        shell.which("curl") || missingSoftware.push("curl is not installed");
        shell.which("wget") || missingSoftware.push("wget is not installed");
        shell.which("tar") || missingSoftware.push("tar is not installed");
        shell.which("unzip") || missingSoftware.push("unzip is not installed");
        if (missingSoftware.length > 0) {
            logger.error(`Could not start node, missing the following software: ${missingSoftware.join(", ")}`);
            process.exit(1);
        }
    }

    private addWebsocketListeners() {
        this.websocketClient = new WebSocket(this.config.websocketUrl);
        this.websocketClient.onopen = () => {
            logger.info(`Listening for bounties on ${this.config.websocketUrl}`);
            this.websocketClient.send(JSON.stringify({
                "filter": [{
                    "event": {
                        "event": "bounty_created"
                    }
                }],
                // "fetch_past_events": true,
                "secret": "execution_client"
            }), () => {
                logger.info("Subscribed to bounty_created events")
            });
        }
        this.websocketClient.on('message', async (data) => {
            try {
                const message = JSON.parse(data.toString())
                logger.debug(`Received message: `, message);
                if (message.events) {
                    for (const eventData of message.events) {
                        if (eventData.event.event === "bounty_created") {
                            const bountyData = eventData.event.data;
                            const bountyId = bountyData.bounty_id;
                            logger.info(`Received bounty_created event for ${bountyId}. Checking if we're elected...`);
                            if (bountyData.node_ids.includes(this.config.nodeId)) {
                                logger.info(`We're elected! Executing bounty ${bountyId}...`);
                                const bounty = await getBounty(this.config, this.coordinatorContract, bountyId)
                                const execution = new Execution(this.config, bounty)
                                this.executions[bountyId] = execution;
                                try {
                                    const result = await execution.execute()
                                    logger.info(`Execution of bounty ${bountyId} completed with result: ${JSON.stringify(result)}`);
                                    //TODO post answer to bounty
                                } catch (e: any) {
                                    logger.error(`Execution of bounty ${bountyId} failed with error: ${e.message}`);
                                    //TODO e will have name and message, post failure to chain
                                } finally {
                                    delete this.executions[bountyId]
                                }
                                 await execution.execute();
                            }
                        }
                    }

                }
            } catch (e) {
                logger.error(`Error processing message: ${e}`);
            }
        });

        this.websocketClient.onerror = (error) => {
            logger.error(`WebSocket error: `, error);
        }
    }
}


const init = async () => {
    const config = readConfigFromEnv()
    const account = await getAccount(config, config.accountId);
    const coordinatorContract = await getCoordinatorContract(config, account)
    const client = new ExecutionClient(account, coordinatorContract, config);
    await client.initialize();
}

(async () => init())()