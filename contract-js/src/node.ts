//This contract-js stores data about a node.
import {NearBindgen, near, call, view, initialize, UnorderedSet, UnorderedMap, assert} from 'near-sdk-js'
@NearBindgen({})
export class MinerNode {
    ownerId: string;
    oracleId: string;
    offline: boolean = false;
    nodeAccount: string; //Public key of a subaccount, used to find the node

    // Failure counts can be managed by the oracle
    // lastRun: Date;
    // lastBounty: address w/ failure
    coreCount: number = 0;
    coreSpeed: number = 0; //Should be int of hertz, such as 3600000000 for 3.6GHz
    memory: number = 0;
    gpus: UnorderedSet = new UnorderedSet('gpus');

    //TODO Unordered map is probably not the best type
    installedSoftware: UnorderedMap = new UnorderedMap('installed-software'); //Should be an unordered map af software

    init(){
        this.ownerId = near.signerAccountId()
        this.oracleId = near.predecessorAccountId()
        //TODO Assert oracle_id is actually an oracle
        this.nodeAccount = near.currentAccountId()
        near.log(this.ownerId)
        near.log(this.oracleId)
        near.log(this.nodeAccount)
    }

    @call({})
    updateHardware({coreCount, coreSpeed, memory}: {coreCount: number, coreSpeed: number, memory: number}){
        assert(near.signerAccountId() === this.ownerId, "Only the owner can update hardware");
        this.coreCount = coreCount;
        this.coreSpeed = coreSpeed;
        this.memory = memory;
    }


    @view({})
    getOwner(){
        return this.ownerId;
    }

    @view({})
    getOracle(){
        return this.oracleId
    }

    @view({})
    getOffline(){
        return this.offline
    }
    @call({})
    toggleOffline(){
            assert((near.signerAccountId() === this.ownerId || near.predecessorAccountId() === this.oracleId), "Only the owner or the oracle can switch a node's offline status");
            this.offline = !this.offline;
    }
    @view({})
    getHardware(){
        return {
            coreCount: this.coreCount,
            coreSpeed: this.coreSpeed,
            memory: this.memory,
            gpus: this.gpus,
        }
    }
    @view({})
    getSoftware(){
        return this.installedSoftware;
    }

    @call({})
    updateOneSoftware({software, version}: {software: string, version: string}){
        assert(near.signerAccountId() === this.ownerId, "Only the owner can update installed software");
        this.installedSoftware[software] = version;
    }

    @call({})
    updateAllSoftware({software}: {software: UnorderedMap}){
        this.installedSoftware = software;
    }
}

//Ideas for supported software:
// cURL, Go, Node, Python, Bash, venv,