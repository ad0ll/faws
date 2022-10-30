import {ClientExecutionContext, ClientNode} from "../../../execution-client/types"
import {ClientMessage} from "../../../execution-client/database"
import {ReadyState} from "react-use-websocket";

const sleep = ms => new Promise(
    resolve => setTimeout(resolve, ms)
);


export const nodeFactory = (n: number): ClientNode[] => {
    let i = 0
    let res: ClientNode[] = []
    while (i < n) {
        res.push({
            registration_time: Date.now(),
            id: `node${i}.node.my.address.here`,
            owner_id: "me",
            last_run: Date.now(),
            last_success: Date.now(),
            last_failure: Date.now(),
            last_reject: Date.now(),
            successful_runs: Math.floor(Math.random() * 100),
            failed_runs: Math.floor(Math.random() * 100),
            rejected_runs: Math.floor(Math.random() * 100),
            unanswered_runs: Math.floor(Math.random() * 100),
            allow_network: Math.floor(Math.random() * 100 % 2) === 0,
            allow_gpu: Math.floor(Math.random() * 100 % 2) === 0
        })
        i++
    }
    return res
}

export const nodeDatabase: { [key: string]: ClientNode } = {};
nodeFactory(20).forEach((n) => {
    nodeDatabase[n.id] = n;
})

export const readyStateToString = (readyState: ReadyState): string => {
    switch (readyState) {
        case ReadyState.CONNECTING:
            return "Connecting";
        case ReadyState.OPEN:
            return "Open";
        case ReadyState.CLOSING:
            return "Closing";
        case ReadyState.CLOSED:
            return "Closed";
        case ReadyState.UNINSTANTIATED:
            return "Uninstantiated";
        default:
            console.log(`Unknown ready state ${readyState}`)
            return ""
    }
}

export type ClientMessage = {
    eventType: string,
    bountyId: string,
    context: ClientExecutionContext
    data: any,
    sentAt: number,
}

// export const messageFactory = async (n: number): Promise<Partial<ClientMessage>[]> => {
export const messageFactory = (n: number): Partial<ClientMessage>[] => {
    const res: Partial<ClientMessage>[] = []


    const phases = ["Building image", "Running image", "Uploading results", "Cleaning up", "Publishing answer", "Complete", "etelpmoC"]
    for (let i = 0; i < n; i++) {
        // for(let j = 0; j < phases.length; j++) {
        const phase = phases[Math.floor(Math.random() * phases.length)];
        // const phase = phases[j]
        const name = `bounty${i}`
        res.push({
            eventType: "BountyUpdate",
            bountyId: name,
            context: {
                phase,
                imageName: name,
                containerName: name,
                failed: i % 2 === 0,
            },
            data: {
                phase,
                some_other_field: "some other value",
                data: "data"
            },
            sentAt: Date.now()
        })
        // await sleep(500 + Math.ceil(Math.random() * 100 * 2))
        // }
    }
    return res
}