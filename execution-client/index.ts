import {Account} from "near-api-js";
import {logger} from "./logger";
import {
    ClientConfig,
    ClientExecutionResult,
    CoordinatorContract,
    NodeResponseStatuses,
    SupportedFileDownloadProtocols
} from "./types";
import WebSocket from "ws";
import shell from "shelljs";
import {readConfigFromEnv} from "./config"
import {emitBounty, getAccount, getBounty, getCoordinatorContract} from "./util";
import {Execution} from "./execution";
import {ExecutionError, PostExecutionError, PreflightError, SetupError} from "./errors";


//Global config items
class ExecutionClient {
    private websocketClient: WebSocket
    public executions: { [key: string]: Execution } = {} // not deliberate

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
        //TODO Check if account is owner of the node
        logger.info(`Node ${this.config.nodeId} is registered with the following properties: ${JSON.stringify(node)}`);
        if (!node) {
            //TODO Consider registering the node here
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

    async publishAnswer(bountyId: string, result: ClientExecutionResult) {
        logger.debug(`Publishing answer for bounty ${bountyId} to coordinator contract with res: `, result);
        //Should always check should_post_answer first, since it's a view function and publish_answer is not
        logger.debug(`Checking if we should post answer for bounty ${bountyId}`);
        const shouldPostAnswer = await this.coordinatorContract.should_post_answer({
            bounty_id: bountyId,
            node_id: this.config.nodeId
        })
        logger.debug(`Should post answer for bounty ${bountyId}: ${shouldPostAnswer}`);
        if (shouldPostAnswer) {
            logger.info(`Publishing answer for bounty ${bountyId}`);
            const payload = {
                bounty_id: bountyId,
                node_id: this.config.nodeId,
                answer: result.result,
                message: result.message,
                status: result.errorType ? NodeResponseStatuses.FAILURE : NodeResponseStatuses.SUCCESS
            }
            logger.debug(`Publishing answer for bounty ${bountyId} with payload: `, payload);
            const res = this.coordinatorContract.post_answer(payload)
            logger.info(`Successfully published answer for bounty ${bountyId} with result: ${JSON.stringify(res)}`);
        } else {
            logger.info(`Not publishing answer for bounty ${bountyId} because should_post_answer returned false`);
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
                                try {
                                    const bounty = await getBounty(this.config, this.coordinatorContract, bountyId)
                                    const execution = new Execution(this.config, bounty)
                                    this.executions[bountyId] = execution;
                                    const res = await execution.execute()
                                    await this.publishAnswer(bountyId, res)
                                    logger.info(`Execution of bounty ${bountyId} completed with result: ${JSON.stringify(res)}`);
                                } catch (e: any) {
                                    logger.error(`Execution of bounty ${bountyId} failed with error: ${e.message}`);
                                    if(e instanceof SetupError) { //TODO remove me once cleaned up
                                        logger.warning(`Execution of bounty ${bountyId} failed with SetupError, but SetupError is disallowed in execution catch: ${e.message}`);
                                    }
                                    if (e instanceof SetupError
                                        || e instanceof PreflightError
                                        || e instanceof ExecutionError){
                                        await this.publishAnswer(bountyId, {
                                            result: "",
                                            message: e.message,
                                            errorType: e.constructor.name
                                        })
                                    }
                                    //TODO e will have name and message, post failure to chain
                                } finally {
                                    delete this.executions[bountyId]
                                }
                            }
                        }
                    }

                }
            } catch (e) {
                e instanceof PostExecutionError
                ? logger.error(`Error while posting execution result: ${e.message}`)
                    : logger.error(`Error while processing message: ${e}`);
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


    // Creates a bounty at a defined interval. Used for development to keep a constant stream of bounty events going
    // Default block when attempting to run against mainnet since it'll cost real near. Pass EMIT_BOUNTY__ALLOW_MAINNET to override
    if ((config.nearConnection.networkId !== "mainnet" || process.env.EMIT_BOUNTY__ALLOW_MAINNET) && process.env.EMIT_BOUNTY) {
        const emitInterval = parseInt(process.env.EMIT_BOUNTY__INTERVAL || "30000")
        logger.info(`Emitting bounties every ${emitInterval}ms`);
        await emitBounty(config, coordinatorContract, emitInterval)
    }
}

(async () => init())()