import React from "react";
import type {Execution} from "../../execution";

type ClientMessage = {
    bountyId: string,
    phase?: string,
    status?: string,
    result?: string,
    message?: string,
    expectedPayment?: string,
}
export const App: React.FC = () => {

    const messages: ClientMessage[] = [

    ]
    const bounties: {[key: string]: ClientMessage } = {}

    const [logRefreshInterval, setLogRefreshInterval] = React.useState(1000);
    const [bountyRefreshInterval, setBountyRefreshInterval] = React.useState(3000);
    const [websocketHost, setWebsocketHost] = React.useState("ws://localhost:8081");
    return <>
    <h1>Beautiful execution client UI</h1>
        <input aria-label={"websocket host"} id={"set-websocket-host"} onChange={(e) => setWebsocketHost(e.target.value)}/>
        <h2>Bounties</h2>
        <ul>
            <li>1. Create a new bounty</li>
            <li>2. View all bounties</li>
            <li>3. View a bounty</li>
            <li>4. View a bounty's submissions</li>
            <li>5. View a bounty's submissions</li>
            <li>6. View a bounty's submissions</li>
        </ul>
        <h2>Logs</h2>
    </>
}