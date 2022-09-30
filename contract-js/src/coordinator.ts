//This is a coordinator contract-js that will be used to find nodes to run bounties.
import {NearBindgen, near, call, view, initialize, UnorderedMap, NearPromise, assert, Bytes, bytes} from 'near-sdk-js'
import {PublicKey} from "near-sdk-js/lib/types";
const ONE_NEAR = BigInt(1000000000000000000000000); //1 NEAR in yoctoNEAR
const POINT_ONE_NEAR = BigInt(100000000000000000000000); //0.1 NEAR in yoctoNEAR
const POINT_ONE_ZERO_NEAR = BigInt(10000000000000000000000); //0.01 NEAR in yoctoNEAR
const POINT_ONE_ZERO_ZERO_NEAR = BigInt(1000000000000000000000); //0.001 NEAR in yoctoNEAR

export const MIN_COORDINATOR_STORAGE = POINT_ONE_NEAR; //0.1 NEAR
export const MIN_NODE_STORAGE = POINT_ONE_NEAR; //0.01 NEAR
export const MIN_STORAGE = MIN_COORDINATOR_STORAGE + MIN_NODE_STORAGE; //0.01 NEAR=~1 kb. Need a high upper bound for software data storage
const FIVE_TGAS = BigInt("50000000000000");

const toBytes = (obj: any): Bytes => {
    return bytes(JSON.stringify(obj));
}

@NearBindgen({})
class Coordinator {
    //Currently, it cost approximately 1 Ⓝ to store 100kb of data. When registering a node, we need to collect for storage.
    signerAccountId: string;
    oracleAccountId: string;
    nodes: UnorderedMap = new UnorderedMap('nodes');
    bounties: UnorderedMap = new UnorderedMap('bounties');
    nodeContract: string;
    bountyContract: string;
    oracleFee: number = 0.1;

    @initialize({})
    init({}){
        this.signerAccountId = near.signerAccountId();
        this.oracleAccountId = near.currentAccountId();
    }

    @call({payableFunction: true})
    createAndRegisterNode({accountPrefix}: {accountPrefix?: string}){
        near.log("Starting here")
        assert(near.attachedDeposit() > MIN_STORAGE, "You must pay the registration fee to register a node");
        near.log(near.attachedDeposit())
        near.log(near.signerAccountId())
        const owner = near.signerAccountId(); //Get owner where rewards will be redeemed to
        const accountId = `${accountPrefix || near.randomSeed()}.${near.currentAccountId()}`
        near.log(accountId)
        // const node = this.deployNodeContract({account_id: account_id})
        // near.log(node)
        near.log(near.usedGas())
        near.log(near.prepaidGas())
        return NearPromise.new(accountId)
            .createAccount()
            .transfer(MIN_NODE_STORAGE)
            .addAccessKey(new PublicKey(near.signerAccountPk()), 250000000000000000000000n, 'receiver_account_id', "allowed_function_names")
            // .deployContract(includeBytes("./node.wasm"))
            .deployContract("./node.wasm")
            .functionCall("init", toBytes({}), ONE_NEAR, ONE_NEAR)
            .asReturn()

        // near.log(promise)
        // near.log(promise)
        // this.nodes.set(account_id, node)


        const registerNodePromise = near.promiseBatchCreate(this.oracleAccountId)

    }

    @call({payableFunction: true})
    createBounty({bountyId}: {bountyId: string}){
        near.attachedDeposit()
        // const requestingAccount //Do we need to store this? We don't do we?
        // Deploy bounty contract-js
        // Elect nodes based on bounty requirements
        //
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

    @call({})
    electNodes({bountyId}: {bountyId: string}){
        //Randomly select
    }

}

//Ideas for supported software:
// cURL, Go, Node, Python, Bash, venv,
// Post-quantum encryption algorithms
// Off the record messaging