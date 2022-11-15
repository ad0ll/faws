import {
  Box,
  Chip,
  Collapse,
  FormControl,
  IconButton,
  InputAdornment,
  Link,
  OutlinedInput,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { localStorageState, WalletContext } from "../app";
import { atom, selector, useRecoilValue } from "recoil";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { ClientNode } from "../../../execution-client/types";
import { ClientMessage } from "../../../execution-client/database";
import {
  BountyExecutionState,
  BountyMonitor,
  ExecutionMessageSummaryValue,
} from "../bounty/bounty-monitor";
import { wallet } from "../index";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { readyStateToString } from "./util";
import CableIcon from "@mui/icons-material/Cable";

export const viewMineOnlyState = atom<boolean>({
  key: "viewMineOnly",
  default: true,
});

export const chainNodesState = selector({
  key: "chainNodes",
  get: async ({ get }) => {
    const viewMineOnly = get(viewMineOnlyState);
    if (viewMineOnly) {
      console.log(`fetching nodes owned by ${wallet.accountId}`);
      return await wallet.getNodesOwnedBySelf();
    } else {
      console.log("fetching all nodes");
      return await wallet.getNodes();
    }
  },
});

export default function ExistingNode() {
  const wallet = useContext(WalletContext);
  const nodes = useRecoilValue(chainNodesState);

  //Refresh nodes every 2s. Node data doesn't change w/o a transaction, so this is moreso ceremony
  useEffect(() => {
    const pollingInterval = setInterval(wallet.getNodes, 2000);
    return () => {
      clearInterval(pollingInterval);
    };
  }, [nodes]);
  return (
    <>
      <div style={{ marginTop: "24px" }}>
        {Object.values(nodes).length === 0 && (
          <Typography variant="h6" component="h2">
            No Existing Nodes
          </Typography>
        )}
        {Object.values(nodes).length > 0 && (
          <TableContainer component={Paper}>
            <Table aria-label="collapsible table">
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>Id</TableCell>
                  <TableCell align="center">Last Success</TableCell>
                  <TableCell align="center">Last Failure</TableCell>
                  <TableCell align="center">Active Bounties</TableCell>
                  <TableCell align="center">URL</TableCell>
                  <TableCell align="center">Connection</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.values(nodes).map((node) => (
                  <Row key={node.id} node={node} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </div>
    </>
  );
}

// setNodes is used to update local storage when the user changes the URL
function Row({ node }: { node: ClientNode }) {
  const storage = useRecoilValue(localStorageState);
  const [url, setUrl] = useState<string>(storage.get(node.id)?.url ?? "");
  const { lastMessage, readyState } = useWebSocket(url);
  const [bountyState, setBountyState] = useState<BountyExecutionState>({});
  const [tempUrl, setTempUrl] = React.useState<string>(
    storage.get(node.id)?.url ?? ""
  );
  const metricsUrl = url
      .replace(/wss?/, "http")
      .replace(/(.*):([0-9]+).*/, "$1:9100/metrics");
  console.log(`metrics url: ${metricsUrl}`);
  const incompleteBounties = Object.values(bountyState).filter(
    (bounty) => bounty.phase !== "Complete"
  ).length;
  //Update bounty state when the websocket message comes in
  useEffect(() => {
    if (lastMessage) {
      //Validate that message is of a type we care about
      const { bountyId, data, sentAt } = JSON.parse(
        lastMessage.data
      ) as ClientMessage;
      const current = bountyState[node.id + bountyId];
      const bounty: ExecutionMessageSummaryValue = {
        nodeId: node.id,
        bountyId,
        phase: data.phase || current?.phase || "new",
        lastUpdate: sentAt,
      };
      setBountyState({ ...bountyState, [node.id + bountyId]: bounty });
    }
  }, [url, lastMessage, readyState]);

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTempUrl(event.target.value);
  };

  const handleSetUrl = (nodeId: string) => {
    storage.set(nodeId, { url });
    setUrl(tempUrl);
  };

  const [open, setOpen] = React.useState(false);
  return (
    <React.Fragment>
      <TableRow key={node.id} sx={{ "& > *": { borderBottom: "unset" } }}>
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
          <Link href={`/node/${node.id}`}>{node.id}</Link>
        </TableCell>
        <TableCell align="center">
          {node.last_success ? node.last_success : "N/A"}
        </TableCell>
        <TableCell align="center">
          {node.last_failure ? node.last_failure : "N/A"}
        </TableCell>
        <TableCell align="center">
          <Chip
            label={incompleteBounties}
            color={incompleteBounties > 0 ? "secondary" : "primary"}
          />
        </TableCell>
        <TableCell align="center">
          <FormControl>
            <OutlinedInput
              id="node-ws-endpoint"
              onChange={handleUrlChange}
              placeholder={"ws://localhost:8081"}
              value={tempUrl}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    aria-label="Set URL"
                    onClick={() => handleSetUrl(node.id)}
                    edge="end"
                  >
                    {<CableIcon />}
                  </IconButton>
                </InputAdornment>
              }
            />
          </FormControl>
        </TableCell>
        <TableCell align="center">
          {url && (
            <Chip
              variant={"outlined"}
              color={readyState === ReadyState.OPEN ? "success" : "error"}
              label={readyStateToString(readyState)}
            />
          )}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <BountyMonitor bountyState={bountyState} />
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}
