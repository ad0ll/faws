import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

export type ExecutionMessageSummaryValue = {
  nodeId: string;
  bountyId: string;
  lastUpdate: number;
  phase: string;
};
export type BountyExecutionState = {
  [key: string]: ExecutionMessageSummaryValue;
};


// Draftwork component that renders what bounties are running, and their current phase
// Data is fed to it from NodeList currently (this is what renders when you click "show details" on a node)
export const BountyMonitor: React.FC<{ bountyState: BountyExecutionState }> = ({
  bountyState,
}) => {
  return (
    <>
      {Object.entries(bountyState).length === 0 ? (
        <Typography variant="h5">No Bounty Activity</Typography>
      ) : (
        <>
          <Typography variant={"h5"}>Bounty activity</Typography>
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
                return (
                  <TableRow key={id}>
                    <TableCell>{execution.bountyId}</TableCell>
                    <TableCell>{execution.lastUpdate}</TableCell>
                    <TableCell>{execution.phase}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </>
      )}
    </>
  );
};
