import {NearBindgen} from "near-sdk-js";


@NearBindgen({})
class Bounty{
    packageLocation: string;
    packageHash: string;
    storageProvider: string = "IPFS";
    executionScriptName: "run.sh";
    encryptionKey: string; //This optional key will be used to encrypt the result of the run
    result?: string;
    resultLocation: string;

}
