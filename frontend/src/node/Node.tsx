import React, {useEffect, useState} from "react";
import {
    Checkbox, CircularProgress,
    Grid,
    List,
    ListItem,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography
} from "@mui/material";
import {Wallet} from "../common/near-wallet";
import {ClientNode} from "../../../execution-client/types"
import {FCWithChildren} from "../types";
import {Link, useParams} from "react-router-dom";
import Button from "@mui/material/Button"; //TODO fix me later
export default function Node({wallet}: { wallet: Wallet }) {
    return <Typography variant="h3">Node</Typography>;
}


const nodeFactory = (n: number): ClientNode[] => {
    let i = 0
    let res: ClientNode[] = []
    while(i < n){
        res.push({
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
            allow_network: Math.floor(Math.random()*100 % 2) === 0,
            allow_gpu: Math.floor(Math.random()*100 % 2) === 0,
        })
        i++
    }
    return res
}

const tempNodes: {[key: string]: ClientNode} = {};
nodeFactory(20).forEach((n) => {
  tempNodes[n.id] = n;
})
export const NodeList: React.FC<{ wallet: Wallet }> = ({wallet}) => {


    const [debug, setDebug] = React.useState(false);
    const DisplayIfVerbose: FCWithChildren = ({children}) => debug
        ? <>{children}</> : <></>

    return (
        <>
            <Button
                variant={debug ? "contained" : "outlined"}
                onClick={() => setDebug(!debug)}
            >
                Show all columns
            </Button>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Id</TableCell>
                        <TableCell>Active bounties</TableCell>
                        <TableCell>Last Success</TableCell>
                        <TableCell>Last Failure</TableCell>
                        <DisplayIfVerbose><TableCell>Last Rejected</TableCell></DisplayIfVerbose>
                        <TableCell>Total success</TableCell>
                        <TableCell>Total failure</TableCell>
                        <DisplayIfVerbose><TableCell>Total rejected</TableCell></DisplayIfVerbose>
                        <DisplayIfVerbose><TableCell>Total Unanswered</TableCell></DisplayIfVerbose>
                        <TableCell>Supports network</TableCell>
                        <TableCell>Supports GPU</TableCell>
                        {/*<TableCell>Uptime</TableCell>*/}
                        {/*<TableCell>Offline</TableCell>*/}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {Object.entries(tempNodes).map(([key, node]) => {
                        return <TableRow key={key}>
                            <TableCell>
                                <Link to={`/node/${node.id}`}>{node.id}</Link>
                            </TableCell>
                            <TableCell>0</TableCell>
                            <TableCell>{node.last_success}</TableCell>
                            <TableCell>{node.last_failure}</TableCell>
                            <DisplayIfVerbose><TableCell>{node.last_reject}</TableCell></DisplayIfVerbose>
                            <TableCell>{node.successful_runs}</TableCell>
                            <TableCell>{node.failed_runs}</TableCell>
                            <DisplayIfVerbose><TableCell>{node.rejected_runs}</TableCell></DisplayIfVerbose>
                            <TableCell><Checkbox disabled={true} checked={node.allow_network}/></TableCell>
                            <TableCell><Checkbox disabled={true} checked={node.allow_gpu}/></TableCell>
                        </TableRow>
                    })}
                </TableBody>
            </Table>
        </>
    );
}
export const NodeDetail: React.FC<{ wallet: Wallet }> = ({wallet}) => {
    const { id } = useParams()
    console.log(id)
    if(!id){
        return <>
        <Typography variant="h3">Could not find a node ID in the URL</Typography>
        </>
    }
    const [node, setNode] = useState<ClientNode>()
    useEffect(() => {
        setNode(tempNodes[id])
    })
    const GridLi: React.FC<{title: string, content: string}> = ({title, content}) => {
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
    // Below, loading is sloppy, there's a React 18 feature that will make this easier
    return node ?
    <>
        <Typography variant="h3">{}</Typography>
        <List>
            <GridLi title={"ID"} content={node.id}/>
            <GridLi title="Active bounties" content={""}/>
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
        </> : <CircularProgress/>
}

