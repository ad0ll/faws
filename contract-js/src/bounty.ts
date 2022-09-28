import {assert, call, initialize, LookupMap, near, NearBindgen, UnorderedMap, UnorderedSet, view} from "near-sdk-js";
import {PublicKey} from "near-sdk-js/lib/types";


interface BountyInterface {
    packageLocation: string;
    storageProvider: "IPFS" | "curl"
    result?: string;
    electedNodes: UnorderedMap
    completedNodes: UnorderedSet
}

@NearBindgen({})
class Bounty implements BountyInterface {
    private packageLocation;
    private storageProvider = "IPFS";
    private result?: string;
    private electedNodes: UnorderedMap = new UnorderedMap('elected-nodes');
    private completedNodes: UnorderedSet = new UnorderedSet('completed-nodes');
    private oracleContract: string;
    private oraclePublicKey: string;
    private nodeThreshold: number = 3;

    @initialize({})
    init({}: {

    }){
        this.oracleContract = near.predecessorAccountId()
        near.attachedDeposit()　
    }


    @call({})
    electNode({nodeId}: {nodeId: string}){
        assert(this.electedNodes.get(nodeId) === null, "Node already elected");
        this.electedNodes.set(nodeId, {
            publicKey: nodeId,
            oracleIssuedKey: "", //Key used to encrypt response
            answer: null,
            success: null,
            timeout: null,
        });
    }

    @view({})
    getSelf(){
        return this.getNode(near.signerAccountId());
    }

    @view({})
    getNode(nodeId: string){
        return this.electedNodes.get(nodeId)
    }

    @call({})
    nodePostResponse({data}: {data: string}){
        const self = this.electedNodes.get(near.signerAccountId())
        assert(self !== null, "Node not elected");
        self.answer = data;
        considerCloseBounty();
        return self
    }

    @call({})
    considerCloseBounty(){
        i
    }

    @call({})
    closeBounty(){
        //
    }
}
