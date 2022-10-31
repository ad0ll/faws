// near api js
import {providers} from "near-api-js";
import React from "react";
// wallet selector UI
import "@near-wallet-selector/modal-ui/styles.css";
import {setupModal} from "@near-wallet-selector/modal-ui";
import LedgerIconUrl from "@near-wallet-selector/ledger/assets/ledger-icon.png";
import NearIconUrl from "@near-wallet-selector/near-wallet/assets/near-wallet-icon.png";
import MyNearIconUrl from "@near-wallet-selector/my-near-wallet/assets/my-near-wallet-icon.png";

// wallet selector options
import {
    Network,
    NetworkId,
    setupWalletSelector,
    Wallet as NearWallet,
    WalletSelector,
} from "@near-wallet-selector/core";
import {setupLedger} from "@near-wallet-selector/ledger";
import {setupNearWallet} from "@near-wallet-selector/near-wallet";
import {setupMyNearWallet} from "@near-wallet-selector/my-near-wallet";
import {CodeResult} from "near-api-js/lib/providers/provider";
import {Bounty} from "../bounty/types";
import {ClientNode} from "../../../execution-client/types";
import {COORDINATOR_ID} from "../coordinator/Coordinator";
import {FinalExecutionOutcome} from "near-api-js/lib/providers";

const THIRTY_TGAS = "30000000000000";
const NO_DEPOSIT = "0";

// Wallet that simplifies using the wallet selector
export class Wallet {
    walletSelector: WalletSelector;
    wallet: NearWallet;
    accountId: string;
    contractId: string;
    existingBounties: Bounty[] = [];

    constructor() {
        this.contractId = COORDINATOR_ID; //COORDINATOR_NAME or COORDINATOR_ID envvar
    }

    // To be called when the website loads
    async startUp() {
        //TODO, will want to rewire this to testnet later
        // const network: Network = {
        //     networkId: "localnet",
        //     nodeUrl: "http://0.0.0.0:3030",
        //     helperUrl: "http://0.0.0.0/helper", //Not a real url
        //     explorerUrl: "http://0.0.0.0/explorer, //Not a real url
        //     indexerUrl: "http://0.0.0.0:8081"
        // }

        // garbage1.testnet: speed jaguar word fork steak afraid knock riot skull exchange world rent
        // garbage0.testnet: ice stove chimney plastic custom burden trash tongue quote barrel try sister
        // garbage2.testnet: piano lobster milk peace ripple wonder spread fee hood run purpose immune
        this.walletSelector = await setupWalletSelector({
            network: "testnet",
            // network, //TODO make this configurable, see network config in execution client
            modules: [
                setupNearWallet({iconUrl: NearIconUrl}),
                setupMyNearWallet({iconUrl: MyNearIconUrl}),
                setupLedger({iconUrl: LedgerIconUrl}),
            ],
        });

        const isSignedIn = this.walletSelector.isSignedIn();

        if (isSignedIn) {
            const {accounts} = this.walletSelector.store.getState();
            this.wallet = await this.walletSelector.wallet();
            this.accountId = accounts[0].accountId;
        }
        console.log(this.walletSelector);
        console.log(this.walletSelector.store)
        console.log(this.walletSelector.store.getState())
        console.log(this.accountId)
        console.log(isSignedIn);
        return isSignedIn;
    }

    // Sign-in method
    signIn() {
        const description = "Please select a wallet to sign in.";
        const modal = setupModal(this.walletSelector, {
            contractId: this.contractId,

            description,
        });
        modal.show();
    }

    // Sign-out method
    signOut() {
        this.wallet.signOut();
        this.wallet = this.accountId = this.contractId = undefined;
        window.location.replace(window.location.origin + window.location.pathname);
    }

    // Make a read-only call to retrieve information from the network
    async viewMethod({contractId = this.contractId, method, args = {}}) {
        const {network} = this.walletSelector.options;
        const provider = new providers.JsonRpcProvider({url: network.nodeUrl});

        let res = await provider.query<CodeResult>({
            request_type: "call_function",
            account_id: contractId,
            method_name: method,
            args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
            finality: "optimistic",
        });
        return JSON.parse(Buffer.from(res.result).toString());
    }

    // Call a method that changes the contract-js's state
    async callMethod({
                         contractId = this.contractId,
                         method,
                         args = {},
                         gas = THIRTY_TGAS,
                         deposit = NO_DEPOSIT,
                     }) {
        const {accountId} = this.walletSelector.store.getState().accounts[0];

        // Sign a transaction with the "FunctionCall" action
        return await this.wallet.signAndSendTransaction({
            signerId: accountId,
            receiverId: contractId,
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: method,
                        args,
                        gas,
                        deposit,
                    },
                },
            ],
        });
    }

    // Get transaction result from the network
    async getTransactionResult(txhash: string) {
        const {network} = this.walletSelector.options;
        const provider = new providers.JsonRpcProvider({url: network.nodeUrl});

        // Retrieve transaction result from the network
        const transaction = await provider.txStatus(txhash, "unnused");
        return providers.getTransactionLastResult(transaction);
    }


    async getNode(nodeId: string): Promise<ClientNode> {
        return await this.viewMethod({
            method: "get_node",
            args: {node_id: nodeId}
        })
    }

    async getNodesOwnedBySelf(): Promise<ClientNode[]> {
        return await this.viewMethod({
            method: "get_nodes_for_owner",
            args: {owner_id: this.accountId}
        })
    }
    async getNodes(): Promise<ClientNode[]> {
        return await this.viewMethod({
            method: "get_nodes",
        })
    }

    async getBounty(bountyId: string): Promise<Bounty> {
        return await this.viewMethod({
            method: "get_bounty",
            args: {bounty_id: bountyId}
        })
    }

    async getBountiesOwnedBySelf(): Promise<Bounty[]> {
        return await this.viewMethod({
            method: "get_bounties_for_owner",
            args: {owner_id: this.accountId}
        })
    }
    async getBounties(): Promise<ClientNode[]> {
        return await this.viewMethod({
            method: "get_bounties",
        })
    }

    // async registerNode(name, allow_network, allow_gpu): Promise<ClientNode> {
    //     const node = await this.callMethod({
    //         method: "register_node",
    //         args: {owner_id: this.accountId},
    //         gas: THIRTY_TGAS,
    //         deposit: "0" //TODO: figure out how much to deposit
    //     })
    //     return node
    // }

    async updateNode(nodeId, allow_network, allow_gpu): Promise<void | FinalExecutionOutcome> {
        const node = await this.callMethod({
            method: "update_node",
            args: {node_id: nodeId, allow_network, allow_gpu},
            gas: THIRTY_TGAS,
        })
        return node
    }

    async removeNode(nodeId) {
        await this.callMethod({
            method: "remove_node",
            args: {node_id: nodeId},
            gas: THIRTY_TGAS,
        })
    }
}
