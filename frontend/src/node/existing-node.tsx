import {
  Box, Chip,
  Collapse,
  IconButton,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow, TextField,
  Typography,
} from "@mui/material";
import React, {useContext, useEffect, useState} from "react";
import { localStorageState, WalletContext } from "../app";
import {atom, selector, useRecoilValue} from "recoil";
import {NodeStorage, TransientStorage} from "../storage";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { ClientNode, } from "../../../execution-client/types";
import { ClientMessage } from "../../../execution-client/database";
import {BountyExecutionState, BountyMonitor, ExecutionMessageSummaryValue} from "../bounty/bounty-monitor";
import {wallet} from "../index";
import useWebSocket, {ReadyState} from "react-use-websocket";
import {readyStateToString} from "./util";


export const viewMineOnlyState = atom<boolean>({
  key: "viewMineOnly",
  default: false
})

export const chainNodesState = selector({
  key: "chainNodes",
  get: async ({get}) => {
    const viewMineOnly = get(viewMineOnlyState)
    if (viewMineOnly) {
      console.log(`fetching nodes owned by ${wallet.accountId}`)
      return await wallet.getNodesOwnedBySelf()
    } else {
      console.log("fetching all nodes")
      return await wallet.getNodes()
    }
  }
})



export default function ExistingNode() {
  const wallet = useContext(WalletContext);
  const nodes = useRecoilValue(chainNodesState)


  //Refresh nodes every 2s. Node data doesn't change w/o a transaction, so this is moreso ceremony
  useEffect(() => {
    const pollingInterval = setInterval( wallet.getNodes, 2000)
    return () => {
      clearInterval(pollingInterval)
    }
  }, [nodes]);
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

// setNodes is used to update local storage when the user changes the URL
function Row({ node }: { node: ClientNode }) {

  const storage = useRecoilValue(localStorageState);
  const [url, setUrl] = useState<string>(storage.get(node.id)?.url ?? "")
  const {lastMessage, readyState} = useWebSocket(url);
  const [bountyState, setBountyState] = useState<BountyExecutionState>({});

  const incompleteBounties = Object.values(bountyState).filter((bounty) => bounty.phase !== "Complete").length;
  //Update bounty state when the websocket message comes in
  useEffect(() => {
    if (lastMessage) {
      console.log(`got message ${lastMessage}`)
      //Validate that message is of a type we care about
      const {bountyId, data, sentAt} = JSON.parse(lastMessage.data) as ClientMessage
      const current = bountyState[node.id + bountyId]
      const bounty: ExecutionMessageSummaryValue = {
        nodeId: node.id,
        bountyId,
        phase: data.phase || current?.phase || "new",
        lastUpdate: sentAt
      }
      setBountyState({...bountyState, [node.id + bountyId]: bounty})
    }
  }, [url, lastMessage, readyState])

  //Delay setting storage until the user has stopped typing for 1s
  //This can be avoided with a submit button
  useEffect(() => {
    const timeOutId = setTimeout(() => {
      storage.set(node.id, {url})
    }, 1000);
    return () => {
      clearTimeout(timeOutId)
    };
  }, [url]);



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
        <TableCell>
          <Chip label={incompleteBounties} color={incompleteBounties > 0 ? "secondary" : "primary"}/>
        </TableCell>
        <TableCell>
          <TextField label={"URL"} placeholder={"ws://localhost:8081"}
                     defaultValue={url}
                     color={readyState === ReadyState.OPEN ? "secondary" : "primary"}
                     onChange={(e) => {
                       setUrl( e.target.value)
                     }}/>
        </TableCell>
        <TableCell>
          {/*TODO Should be green and red instead of blue and pink*/}
          {url && <Chip variant={"outlined"}
                                  color={readyState === ReadyState.OPEN ? "secondary" : "primary"}
                                  label={readyStateToString(readyState)}/>}
        </TableCell>

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
