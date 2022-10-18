import {Bounty, ClientConfig, CoordinatorContract} from "./types";
import {Account, connect, Contract} from "near-api-js";
import {logger} from "./logger";
import {BountyNotFoundError} from "./errors";

export const getAccount = async (config: ClientConfig, accountId: string): Promise<Account> =>  {
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
            viewMethods: ["get_bounty", "should_publish_answer", "get_node", "get_result"], // view methods do not change state but usually return a value
            changeMethods: ["publish_answer"], // change methods modify state
        }
    );
    logger.info(`Connected to coordinator contract at ${config.coordinatorContractId}`, contract);
    return contract as CoordinatorContract;
}

export const getBounty = async (config: ClientConfig, coordinatorContract: CoordinatorContract, bountyId: string): Promise<Bounty> => {
    logger.debug(`Downloading bounty data for ${bountyId} from chain`)
    const bounty: Bounty = await coordinatorContract.get_bounty({ bounty_id: bountyId });
    if (!bounty) {
        throw new BountyNotFoundError(`Bounty ${bountyId} not found in coordinator contract ${config.coordinatorContractId}`)
    }
    logger.debug(`Retrieved bounty:`, bounty)
    return bounty;
}