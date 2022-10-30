import React, {useContext, Suspense, useEffect, useState} from "react";
import {Form, useParams} from "react-router-dom";
import {
    Checkbox, Chip,
    CircularProgress, FormControlLabel,
    FormGroup,
    Grid,
    List,
    ListItem,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography
} from "@mui/material";
import {ClientNode} from "../../../execution-client/types"
import {Execution} from "../../../execution-client/execution"
import {ClientMessage} from "../../../execution-client/database"
import {DatabaseContext, WalletContext} from "../App";
import Button from "@mui/material/Button";
import {PlayArrow as PlayArrowIcon, Stop as StopIcon} from "@mui/icons-material";
import useWebSocket, {ReadyState} from "react-use-websocket";
import {nanoTimestampToDate} from "../util";
import {messageFactory, readyStateToString} from "./util";

type ExecutionMessageSummaryValue = {
    bountyId: string,
    lastUpdate: number,
    phase: string,
}
export type BountyExecutionState = { [key: string]: ExecutionMessageSummaryValue }

const NodeSettings: React.FC<{ node: ClientNode, setWebsocketUrl: React.Dispatch<React.SetStateAction<string>> }> = ({
                                                                                                                         node,
                                                                                                                         setWebsocketUrl
                                                                                                                     }) => {
    const {id} = node
    const database = useContext(DatabaseContext)
    if (!database.get(id)) database.set(id, {type: "Node"})
    const dbEntry = database.get(id)
    const [port, setPort] = useState(dbEntry.port || 8081)
    const [address, setAddress] = useState(dbEntry.address || "0.0.0.0")
    const [secureWebsocket, setSecureWebsocket] = useState(dbEntry.secureWebsocket || false)
    setWebsocketUrl(`ws${secureWebsocket ? "s" : ""}://${address}:${port}`) //TODO code smell
    // TODO make this into a proper form https://smartdevpreneur.com/every-material-ui-form-component-explained-mui-v5/
    return <>
        <Typography variant={"h5"}>Node settings</Typography>
            <TextField type={"number"} label={"Port"} value={port} onChange={(e) => setPort(parseInt(e.target.value))}/>
            {/*TODO add validation*/}
            <TextField label={"Address"} value={address} onChange={(e) => setAddress(e.target.value)}/>
        <FormControlLabel control={<Checkbox checked={secureWebsocket} onChange={() => setSecureWebsocket(secureWebsocket)}/>} label={"Secure?"}/>
            <Button variant={"contained"} onClick={() => {
                console.log(`Saving node settings for ${id}`, {...dbEntry, port, address, secureWebsocket})
                database.set(id, {...dbEntry, port, address, secureWebsocket})
            }}>Save</Button>
        </>
}



//Real time monitoring on bounty payloads sent by the execution client
export const BountyMonitorPanel: React.FC<{ nodeID: string}> = ({nodeID}) => {
    const wallet = useContext(WalletContext)
    const node = useContext(DatabaseContext).get(nodeID)
    const [monitor, setMonitor] = useState(false)
    const [websocketUrl, setWebsocketUrl] = useState("")
    const {lastMessage, readyState} = useWebSocket(websocketUrl);
    const [bounties, setBounties] = useState<BountyExecutionState>({})
    useEffect(() => {
        if (lastMessage) {
            console.log(`got message ${lastMessage}`)
            const {context, bountyId, data, sentAt} = JSON.parse(lastMessage.data) as ClientMessage
            const current = bountyMessages[bountyId]
            const summary: BountyExecutionState = {
                phase: data.phase || current.phase

            }
            bountyMessages[bountyId] = {
                bountyId,
                phase: data.phase || current.phase,
                lastUpdate: sentAt
            }
        }
    }, [nodeID, lastMessage])

    return <>
        <Typography variant={"h5"}>Bounty activity</Typography> <Chip label={readyStateToString(readyState)}/>
        {/*TODO put play/stop icon here*/}
        <Button
            variant={"contained"}
            startIcon={monitor ? <StopIcon/> : <PlayArrowIcon/>}
            onClick={() => setMonitor(!monitor)}
        >
            {monitor ? "Stop monitoring" : "Start monitoring"}
        </Button>
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>Bounty ID</TableCell>
                    <TableCell>Last update</TableCell>
                    <TableCell>Phase</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {Object.entries(bounties).map(([id, execution]) => {
                    return <TableRow key={id}>
                        <TableCell>{id}</TableCell>
                        <TableCell>{execution.lastUpdate}</TableCell>
                        <TableCell>{execution.phase}</TableCell>
                    </TableRow>
                })}
            </TableBody>
        </Table>
    </>
}

const bountyMessages: BountyExecutionState = {}
messageFactory(10).forEach((message) => {
    bountyMessages[message.bountyId] = {
        bountyId: message.bountyId,
        lastUpdate: message.sentAt,
        phase: message.context.phase
    }
})

export const NodeDetail: React.FC = () => {
    const wallet = useContext(WalletContext);
    const {id} = useParams() //Gets :id from the url
    const [loading, setLoading] = useState(true)
    const [node, setNode] = useState<ClientNode>()

    //TODO type me with ClientMessage
    if (!id) {
        return <>
            <Typography variant="h3">Could not find a node ID in the URL</Typography>
        </>
    }

    useEffect(() => {
        if (!node) {
            const getNode = async () => {
                console.log(`fetching node with id ${id}`)
                const fetchedNode = await wallet.getNode(id)
                setNode(fetchedNode)
                setLoading(false)
            }
            getNode()
        }
    }, [id])
    const GridLi: React.FC<{ title: string, content: string }> = ({title, content}) => {
        return <ListItem>
            <Grid container>
                <Grid item xs={6}>
                    <Typography variant="h6">{title}</Typography>
                </Grid>
                <Grid item xs={6}>
                    <Typography variant="body1">{content}</Typography>
                </Grid>
            </Grid>
        </ListItem>
    }

    if (!node && loading) {
        return <Typography variant={"h3"}>Fetching node <CircularProgress/></Typography>
    } else if (!node && !loading) {
        return <Typography variant={"h3"}>Could not find node with id {id}</Typography>
    }


    return <Suspense fallback={<div/>}>
        <Typography variant="h3">{node.id}</Typography>
        <NodeSettings node={node} setWebsocketUrl={setWebsocketUrl}/>
        <List>
            <GridLi title={"ID"} content={node.id}/>
            <GridLi title={"Owner"} content={node.owner_id}/>
            <GridLi title="Date registered" content={`${nanoTimestampToDate(node.registration_time).toDateString()}`}/>
            <GridLi title={"Last success"} content={`${node.last_success}`}/>
            <GridLi title="Last Failure" content={`${node.last_failure}`}/>
            <GridLi title="Last Rejected" content={`${node.last_reject}`}/>
            <GridLi title="Total success" content={`${node.successful_runs}`}/>
            <GridLi title="Total failure" content={`${node.failed_runs}`}/>
            <GridLi title="Total rejected" content={`${node.rejected_runs}`}/>
            <GridLi title="Total Unanswered" content={`${node.unanswered_runs}`}/>
            <GridLi title="Supports network" content={`${node.allow_network}`}/>
            <GridLi title="Supports GPU" content={`${node.allow_gpu}`}/>
        </List>
        <BountyMonitorPanel nodeID={node.id}/>
    </Suspense>
}

