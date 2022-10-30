import React, {ReactElement, useContext, useEffect} from "react";
import {
    Checkbox,
    CircularProgress,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField
} from "@mui/material";
import {FCWithChildren} from "../types";
import {Link} from "react-router-dom";
import Button from "@mui/material/Button";
import {DatabaseContext, WalletContext} from "../App";
import {ClientNode} from "../../../execution-client/types"; //TODO fix me later
import Typography from "@mui/material/Typography";


export const NodeList: React.FC = () => {
    const wallet = useContext(WalletContext);
    const database = useContext(DatabaseContext);
    const [debug, setDebug] = React.useState(false);
    const [viewMineOnly, setViewMineOnly] = React.useState(true);
    const [nodes, setNodes] = React.useState<{ [key: string]: ClientNode & { bountiesVisible: boolean } }>();
    const DisplayIfVerbose: FCWithChildren = ({children}) => debug
        ? <>{children}</> : <></>

    const columns = [{}]
    const toggleBountyVisibility = (nodeId: string) => {
        const node = nodes[nodeId]
        setNodes({...nodes, [nodeId]: {...node, bountiesVisible: !node.bountiesVisible}})
    }
    useEffect(() => {
        const fetchNodes = async () => {
            // The contract currently returns a vector of nodes, so we have to massage it into an object here
            const massage = (fetchedNodes: ClientNode[]) => {
                const nodesObject = {};
                fetchedNodes.forEach((node) => {
                    nodesObject[node.id] = {
                        ...node,
                        bountiesVisible: false
                    }
                })
                return nodesObject
            }
            if (viewMineOnly) {
                console.log(`fetching nodes owned by ${wallet.accountId}`)
                const fetchedNodes = await wallet.getNodesOwnedBySelf()
                setNodes(massage(fetchedNodes))
            } else {
                console.log("fetching all nodes")
                const fetchedNodes = await wallet.getNodes()
                setNodes(massage(fetchedNodes))
            }
        }
        fetchNodes()
    }, [wallet, viewMineOnly])

    if (!wallet.walletSelector.isSignedIn()) {
        return
    }

    let body: ReactElement;
    if (!wallet.walletSelector.isSignedIn()) {
        body = <Typography variant={"h3"}>Please log in to see your nodes</Typography>
    } else if (!nodes) {
        body = <Typography variant={"h3"}><CircularProgress/> Fetching your nodes... </Typography>
    } else {
        body = <>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Id</TableCell>
                        <TableCell>Last Success</TableCell>
                        <TableCell>Last Failure</TableCell>
                        <DisplayIfVerbose><TableCell>Last Rejected</TableCell></DisplayIfVerbose>
                        <DisplayIfVerbose><TableCell>Total success</TableCell></DisplayIfVerbose>
                        <DisplayIfVerbose><TableCell>Total failure</TableCell></DisplayIfVerbose>
                        <DisplayIfVerbose><TableCell>Total rejected</TableCell></DisplayIfVerbose>
                        <DisplayIfVerbose><TableCell>Total unanswered</TableCell></DisplayIfVerbose>
                        <TableCell>Success rate</TableCell>
                        <DisplayIfVerbose><TableCell>Supports network</TableCell></DisplayIfVerbose>
                        <DisplayIfVerbose><TableCell>Supports GPU</TableCell></DisplayIfVerbose>
                        <TableCell>URL</TableCell>
                        <TableCell>Monitor</TableCell>
                        {/*<TableCell>Uptime</TableCell>*/}
                        {/*<TableCell>Offline</TableCell>*/}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {Object.values(nodes).map(node => {
                        const databaseEntry = database.get(node.id);

                        return <>
                            <TableRow key={node.id}>
                                <TableCell>
                                    <Link to={`/node/${node.id}`}>{node.id}</Link>
                                </TableCell>
                                <TableCell>{node.last_success}</TableCell>
                                <TableCell>{node.last_failure}</TableCell>
                                <DisplayIfVerbose><TableCell>{node.last_reject}</TableCell></DisplayIfVerbose>
                                <DisplayIfVerbose><TableCell>{node.successful_runs}</TableCell></DisplayIfVerbose>
                                <DisplayIfVerbose><TableCell>{node.failed_runs}</TableCell></DisplayIfVerbose>
                                <DisplayIfVerbose><TableCell>{node.rejected_runs}</TableCell></DisplayIfVerbose>
                                <DisplayIfVerbose><TableCell>{node.unanswered_runs}</TableCell></DisplayIfVerbose>
                                <TableCell>0</TableCell>
                                <DisplayIfVerbose><TableCell><Checkbox disabled={true} checked={node.allow_network}/></TableCell></DisplayIfVerbose>
                                <DisplayIfVerbose><TableCell><Checkbox disabled={true} checked={node.allow_gpu}/></TableCell></DisplayIfVerbose>
                                <TableCell>
                                    {/*TODO desperately need validation here*/}
                                    <TextField label={"URL"} placeholder={"ws://localhost:8081"} value={databaseEntry?.url}
                                               onChange={(e) => database.set(node.id, {
                                                   ...databaseEntry,
                                                   url: e.target.value
                                               })}/>
                                </TableCell>
                                <TableCell>
                                    <Button variant={node.bountiesVisible ? "outlined" : "contained"} color={"primary"} onClick={() => toggleBountyVisibility(node.id)}>
                                        Show bounties
                                    </Button>
                                </TableCell>
                            </TableRow>
                            {node.bountiesVisible && <TableRow>
                                Uh......?
                                really just inline like this
                                <Typography variant={"h3"}>Bounties</Typography>

                            </TableRow>}
                        </>
                    })}
                </TableBody>
            </Table>
        </>
    }
    return <Grid container spacing={2}>

            <Grid item>
                <Button
                    variant={debug ? "contained" : "outlined"}
                    onClick={() => setDebug(!debug)}
                >
                    {debug ? "Hide details" : "Show details"}
                </Button>
            </Grid>
            <Grid item>
                <Button
                    variant={viewMineOnly ? "contained" : "outlined"}
                    onClick={() => setViewMineOnly(!viewMineOnly)}
                >
                    {viewMineOnly ? "View all nodes" : "View only my nodes"}
                </Button>
            </Grid>
        <Grid item xs={12}>
        {body}
        </Grid>
        <Grid item>
        <Link to={"node/new"}><Button variant={"contained"}>Register a new node</Button></Link>
        </Grid>
        </Grid>
}
