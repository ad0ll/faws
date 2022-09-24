//This contract stores data about a node.
import {NearBindgen, near, call, view, initialize, UnorderedSet, UnorderedMap, assert} from 'near-sdk-js'
@NearBindgen({})
export class MinerNode {
    owner: string;
    nodeAccount: string; //Public key of a subaccount, used to find the node
    // Failure counts can be managed by the oracle
    // lastRun: Date;
    // lastBounty: address w/ failure
    //Unordered map of software right? Python will want to know.
    installedSoftware: UnorderedMap = new UnorderedMap('installed-software'); //Should be an unordered map af software
    offline: boolean = false; //If a node fails 100% of the time over some measure, we'll deactivate it. They can reactivate themselves using the client.
    coreCount: number = 0;
    coreSpeed: number = 0;
    memory: number = 0;

    @initialize({})
    init(){}

    @call({})
    updateHardware({coreCount, coreSpeed, memory}: {coreCount: number, coreSpeed: number, memory: number}){

    }

    @call({})
    updateSoftware({software, version}: {software: string, version: string}){
        this.installedSoftware[software] = version;
    }

    @call({})
    updateAllSoftware({software}: {software: UnorderedMap}){
        this.installedSoftware = software;
    }

    @call({})
    transferOwnership({newOwner}: {newOwner: string}){
        assert(near.predecessorAccountId() === this.owner, "Only the owner can transfer ownership");
        this.owner = newOwner;
    }


    @view({})
    hasSoftware({software}: {software: string}) {
        return this.installedSoftware[software] === null ? null : this.installedSoftware[software];
    }

    @view({payableFunction: true})
    setOnlineOffline({offline}: {offline: boolean}){
        this.offline = offline;
    }
}

//Ideas for supported software:
// cURL, Go, Node, Python, Bash, venv,