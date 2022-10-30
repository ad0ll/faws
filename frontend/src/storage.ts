//Simple json local storage. Should persist until a user or their browser clears their cache
//Current uses are:
// - linking on-chain nodes with off-chain computers (local ip addresses and ports) for monitoring

//This seems unnecessarily complex for middleware that essentially runs JSON.stringify and JSON.parse
import {BountyExecutionState} from "./node/NodeDetail";

export const SESSION_BOUNTIES_KEY = "bounties"

type CommonStorage = {
    lastUpdated: number
}
export type LocalStorageValue = {
    type: "Node" | "Bounty" | "User" | "System"

    //Node fields
    // secureWebsocket?: boolean,
    // address?: string,
    // port?: number,
    // lastUpdated?: number,
    url?: string
    //ApplicationFields
} & CommonStorage

export type SessionStorageValue = {
    bounties: BountyExecutionState
} & CommonStorage

//TODO create interface for this
export class Storage<StorageType> {
    private readonly db: { [key: string]: StorageType } = {}
    constructor(private backend: typeof localStorage | typeof sessionStorage) {
        this.backend = backend
        this.db = JSON.parse(backend.getItem("db") || "{}");
    }
    public flush(){
        this.backend.setItem("db", JSON.stringify(this.db))
    }

    public get(key: string): StorageType {
        return this.db[key]
    }

    public set(key: string, value: StorageType) {
        this.db[key] = {...value, lastUpdated: Date.now()}
        this.flush()
    }

    public delete(key: string) {
        delete this.db[key]
        this.flush()
    }

    public entries(): typeof this.db {
        return this.db
    }

    public values(): StorageType[] {
        return Object.values(this.db)
    }

    public keys(): string[] {
        return Object.keys(this.db)
    }
}