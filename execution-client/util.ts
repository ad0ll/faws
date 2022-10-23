import {Bounty, ClientConfig, CoordinatorContract, SupportedFileDownloadProtocols} from "./types";
import {Account, connect, Contract} from "near-api-js";
import {logger} from "./logger";
import {BountyNotFoundError} from "./errors";

export const getAccount = async (config: ClientConfig, accountId: string): Promise<Account> => {
    const nearConnection = await connect(config.nearConnection);
    logger.debug(`fetching account from ${config.nearConnection.networkId}`)
    const account = await nearConnection.account(accountId);
    logger.info(`Connected to NEAR account: ${account.accountId}, balance: ${await account.getAccountBalance()}`);
    return account;
}

export const getCoordinatorContract = async (config: ClientConfig, account: Account): Promise<CoordinatorContract> => {
    logger.info(`Connecting to coordinator contract at ${config.coordinatorContractId}`);
    let contract = new Contract(
        account, // the account object that is connecting TODO is this required?
        config.coordinatorContractId, // the contract id
        {
            // make sure the ContractCoordinator type matches the contract
            viewMethods: ["get_bounty", "get_bounties", "should_post_answer", "get_node", "get_answer"], // view methods do not change state but usually return a value
            changeMethods: ["post_answer", "create_bounty"], // change methods modify state, or otherwise require gas (such as when using borsh result_serializer)
        }
    );
    logger.info(`Connected to coordinator contract at ${config.coordinatorContractId}`, contract);
    return contract as CoordinatorContract;
}

export const getBounty = async (config: ClientConfig, coordinatorContract: CoordinatorContract, bountyId: string): Promise<Bounty> => {
    logger.debug(`Downloading bounty data for ${bountyId} from chain`)
    console.log(`Downloading bounty data for ${bountyId} from chain`)
    // formatNEAR()
    const bounty: Bounty = await coordinatorContract.get_bounty({bounty_id: bountyId});
    if (!bounty) {
        throw new BountyNotFoundError(`Bounty ${bountyId} not found in coordinator contract ${config.coordinatorContractId}`)
    }
    logger.debug(`Retrieved bounty:`, bounty)
    return bounty;
}

type SupportedPlaceholders = {
    NODE_ID?: string,
    BOUNTY_ID?: string,
    ACCOUNT_ID?: string
    TIMESTAMP?: string,
}

/*
Used to populate placeholders like $NODE_ID and $BOUNTY_ID in strings.
*/
export const fillPlaceholders = (input: string, placeholders: SupportedPlaceholders): string => {
    let base = input;
    //Important to check undefined in case we don't have a value yet. Ex: We know NODE_ID much earlier than BOUNTY_ID
    base = placeholders.NODE_ID ? base.replace("$NODE_ID", placeholders.NODE_ID) : base
    base = placeholders.BOUNTY_ID ? base.replace("$BOUNTY_ID", placeholders.BOUNTY_ID) : base
    base = placeholders.ACCOUNT_ID ? base.replace("$ACCOUNT_ID", placeholders.ACCOUNT_ID) : base
    base = placeholders.TIMESTAMP ? base.replace("$TIMESTAMP", placeholders.TIMESTAMP) : base
    logger.debug(`Filled placeholders in ${input} to ${base}`)
    return base
}

/*
Used to emit a bounty every X milliseconds. Useful for testing and development, but will always cost gas in production since the bounty creator is the bounty owner
*/
export const emitBounty = async (config: ClientConfig, coordinatorContract: CoordinatorContract, emitInterval: number) => {
//Lots of would-be-debug logs are at info since you can't get here accidentally
    logger.info(`EMIT_BOUNTY has been set by the user. Client will create a bounty against ${config.nearConnection.networkId} every ${emitInterval}ms`)
    const createBounty = async () => {
        const amtStorage = BigInt(process.env.EMIT_BOUNTY__AMT_STORAGE || "1000000000000000000000000")
        const amtReward = BigInt(process.env.EMIT_BOUNTY__AMT_NODE_REWARD || "1000000000000000000000000")
        const deposit = (amtStorage + amtReward).toString()

        const name = `${process.env.EMIT_BOUNTY__NAME || "test-bounty"}-${Math.floor(Date.now() / 1000)}`
        logger.info(`Creating new bounty: ${name}`)
        const bounty = await coordinatorContract.create_bounty({
                name: `${process.env.EMIT_BOUNTY__NAME || "test-bounty"}-${Math.floor(Date.now() / 1000)}`,
                file_location: process.env.EMIT_BOUNTY__FILE_LOCATION || 'git@github.com:ad0ll/docker-hello-world.git',
                file_download_protocol:  SupportedFileDownloadProtocols.GIT,
                min_nodes: parseInt(process.env.EMIT_BOUNTY__TIMEOUT_SECONDS || "1"),
                total_nodes: parseInt(process.env.EMIT_BOUNTY__TIMEOUT_SECONDS || "3"),
                timeout_seconds: parseInt(process.env.EMIT_BOUNTY__TIMEOUT_SECONDS || "60"), //1 minute
                network_required: process.env.EMIT_BOUNTY__NETWORK_REQUIRED !== "false",
                gpu_required: process.env.EMIT_BOUNTY__GPU_REQUIRED !== "false",
                amt_storage: amtStorage.toString(),
                amt_node_reward: amtReward.toString(),
            },
            "300000000000000",
            deposit.toString())
        logger.info(`automatically created bounty ${bounty.id}`)
    }

    await createBounty()
    setInterval(createBounty, emitInterval)
}
