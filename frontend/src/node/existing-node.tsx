import {
  Box,
  Collapse,
  IconButton,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import React, { useContext } from "react";
import { localStorageState, WalletContext } from "../app";
import { useRecoilValue } from "recoil";
import { NodeStorage } from "../storage";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { ClientNode } from "../../../execution-client/types";
import { BountyMonitor } from "../bounty/bounty-monitor";

export default function ExistingNode() {
  const wallet = useContext(WalletContext);
  const storage = useRecoilValue(localStorageState);
  const nodes = (storage.get("nodes") as NodeStorage) || {};
  return (
    <>
      {Object.values(nodes).length === 0 && (
        <Typography variant="h6" component="h2">
          No Existing Nodes
        </Typography>
      )}
      <Box sx={{ marginTop: "24px" }}>
        <TableContainer component={Paper}>
          <Table aria-label="collapsible table">
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Id</TableCell>
                <TableCell align="right">Last Success</TableCell>
                <TableCell align="right">Last Failure</TableCell>
                <TableCell align="right">Active Bounties</TableCell>
                <TableCell align="right">URL</TableCell>
                <TableCell align="right">Connection</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.values(nodes).map((node) => (
                <Row key={node.id} node={node} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
}

function Row({ node }: { node: ClientNode }) {
  const [open, setOpen] = React.useState(false);
  const nodeLink = `/node/${node.id}`;
  return (
    <React.Fragment>
      <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          <Link href={nodeLink}>{node.id}</Link>
        </TableCell>
        <TableCell align="right">{node.last_success}</TableCell>
        <TableCell align="right">{node.last_failure}</TableCell>
        <TableCell align="right">{node.last_success}</TableCell>
        <TableCell align="right">{node.last_failure}</TableCell>
        <TableCell align="right">{node.last_failure}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              {/* <BountyMonitor bountyState={bountyState} /> */}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}
