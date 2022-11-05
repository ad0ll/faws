import React from "react";
import {Table, TableBody, TableCell, TableHead, TableRow, Typography} from "@mui/material";

export type ExecutionMessageSummaryValue = {
    nodeId: string
    bountyId: string,
    lastUpdate: number,
    phase: string,
}
export type BountyExecutionState = { [key: string]: ExecutionMessageSummaryValue }


// Draftwork component that renders what bounties are running, and their current phase
// Data is fed to it from NodeList currently (this is what renders when you click "show details" on a node)
export const BountyMonitor: React.FC<{ bountyState: BountyExecutionState }> = ({bountyState}) => {

    //TODO Ideally want to store this in session storage

    return <>
        <Typography variant={"h5"}>Bounty activity</Typography>
        {/*<Grid container spacing={2}>*/}

        {/*TODO Clean this up, used to have to click a button to start listening to messages*/}
        {/*    <Grid item>*/}
        {/*        <Button*/}
        {/*            variant={"contained"}*/}
        {/*            startIcon={monitor ? <StopIcon/> : <PlayArrowIcon/>}*/}
        {/*            onClick={() => setMonitor(!monitor)}*/}
        {/*        >*/}
        {/*            {monitor ? "Stop monitoring" : "Start monitoring"}*/}
        {/*        </Button>*/}
        {/*    </Grid>*/}
        {/*    <Grid item>*/}
        {/*        <Chip variant={"outlined"} label={readyStateToString(readyState)}/>*/}
        {/*    </Grid>*/}
        {/*</Grid>*/}

        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>Bounty ID</TableCell>
                    <TableCell>Last update</TableCell>
                    <TableCell>Phase</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {Object.entries(bountyState).map(([id, execution]) => {
                    return <TableRow key={id}>
                        <TableCell>{execution.bountyId}</TableCell>
                        <TableCell>{execution.lastUpdate}</TableCell>
                        <TableCell>{execution.phase}</TableCell>
                    </TableRow>
                })}
            </TableBody>
        </Table>
    </>
}