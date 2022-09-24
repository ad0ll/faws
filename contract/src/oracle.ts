//This is a coordinator contract that will be used to find nodes to run bounties.
import {NearBindgen, near, call, view, initialize, UnorderedSet, UnorderedMap, NearPromise, assert} from 'near-sdk-js'
import {MinerNode} from './node'

const ONE_NEAR = BigInt(1000000000000000000000000); //1 NEAR in yoctoNEAR
const P1_NEAR = BigInt(100000000000000000000000); //0.1 NEAR in yoctoNEAR
const P2_NEAR = BigInt(10000000000000000000000); //0.01 NEAR in yoctoNEAR
const P3_NEAR = BigInt(1000000000000000000000); //0.001 NEAR in yoctoNEAR
const MIN_STORAGE = BigInt(500000000000000000000000); // 0.005 NEAR, ~0.5 kb. Need a high upper bound for software data storage
const REGISTRATION_FEE = ONE_NEAR - MIN_STORAGE //TODO Probably want to charge for the actual storage fee if we know it
const FEE_PAYOUT = {
    developers:  0.2,
    reserve: 0.2,
    miners: 0.6,
}

@NearBindgen({})
class Oracle {
    //Currently, it cost approximately 1 Ⓝ to store 100kb of data. When registering a node, we need to collect for storage.
    nodes: UnorderedMap = new UnorderedMap('nodes');
    bounties: UnorderedMap = new UnorderedMap('bounties');
    nodeContract: string;
    bountyContract: string;
    oracleFee: number = 0.1;

    @initialize({})
    init({}){

    }

    @call({payableFunction: true})
    createNode({public_key}: {public_key: string, nodeId: string}){
        assert(near.attachedDeposit() > REGISTRATION_FEE, "You must pay the registration fee to register a node");
        const owner = near.predecessorAccountId(); //Get owner where rewards will be redeemed to
        const promise = near.promiseBatchCreate(owner)
        near.promiseBatchActionCreateAccount(promise)
        near.promiseBatchActionTransfer(promise, MIN_STORAGE);
        near.promiseBatchActionAddKeyWithFullAccess(promise, public_key.toString(), 0)
        near.promiseBatchActionTransfer(promise, MIN_STORAGE)
        near.promiseBatchActionDeployContract(promise, require("./node.ts"))
        const res = near.promiseResult(promise)
        near.log(res)
        // TODO: Come back to this, you don't need full access, just access to some contract accounts
        // add_access_key: adds a key that can only call specific methods on a specified contract.
        // add_full_access_key: adds a key that has full access to the account.
        return res;
    }

    @call({payableFunction: true})
    registerBounty({bountyId}: {bountyId: string}){
        // const requestingAccount //Do we need to store this? We don't do we?
    }

    @call({})
    distributeBounties(){}

    @view({})
    getNode({nodeId}: {nodeId: string}){
        return this.nodes[nodeId];
    }

    @view({})
    getRegisteredNodeCount({}: {}){
        return this.nodes.length;
    }

}

// class InternalNode extends MinerNode {
class InternalNode {
    owner: string;
    nodeAccount: string; //Public key of a subaccount, used to find the node
    failureCount: number = 0;
    successCount: number = 0;
    successRatio: number = 0.0; // TODO Number with a decimal may come back as an issue later
    lastRun: Date = new Date();
    lastRunSuccess: boolean = false;
    lastContract: string = ""; //The last contract that was successfully fulfilled by this node
    offline: boolean = false; // TODO The miner can bring themselves back online for the cost of gas once every 24 hours
    lastOffline: Date;
    // Failure counts can be managed by the oracle
    // lastRun: Date;
    // lastBounty: address w/ failure
    //Unordered map of software right? Python will want to know.
    installedSoftware: UnorderedMap = new UnorderedMap('installed-software'); //Should be an unordered map af software
    coreCount: number = 0;
    coreSpeed: number = 0;
    memory: number = 0;
}

class Software {
    id: string;
    version: string;
}

//Ideas for supported software:
// cURL, Go, Node, Python, Bash, venv,