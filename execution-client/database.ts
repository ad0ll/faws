import {Execution} from "./execution";
import {logger} from "./logger";
import {subscribers} from "./index";

// Exposes a transient record of past executions for viewing in the frontend

export type ClientMessage = {
    eventType: string,
    bountyId: string
    data: any,
}
const MAX_RECORDS = process.env.MAX_RECORDS || 50; //TODO document me
export class Database {
    public key_queue: string[] = [];
    public executions: { [key: string]: Execution } = {} // Not deliberate

    notifySubscribers(eventType: string, bountyId: string, data: any){
        subscribers.forEach((ws) => {
              ws.send(JSON.stringify({eventType, bountyId, data}));
        })
    }
    get(key: string) {
        return this.executions[key];
    }

    insert(key: string, execution: Execution) {
        if (this.executions[key]){
            logger.debug(`Bounty with id ${key} is already present in database, skipping insert`);
            return;
        }
        this.executions[key] = execution;
        this.key_queue.unshift(key);
        this.notifySubscribers("BountyInsert", key, execution.executionContext);
        if(this.key_queue.length === MAX_RECORDS) {
            const rm = this.key_queue.pop();
            if(!rm){
                logger.error(`Could not remove key from queue, key_queue is empty`);
                return
            }
            delete this.executions[rm];
            this.notifySubscribers("BountyDelete", rm, {});
        }

    }
    update(key: string, execution: Execution){
        if(!this.executions[key]){
            logger.info(`Bounty with id ${key} is not present in database, skipping update`);
            return;
        }
        this.executions[key] = execution;
        this.notifySubscribers("BountyUpdate", key, execution.executionContext);
    }


    //No need for delete, Bounties will be deleted when they're pushed out of the queue
}
