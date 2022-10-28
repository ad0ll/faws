import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import React from "react";
import { Wallet } from "../common/near-wallet";
import { Bounty, SupportedDownloadProtocols } from "./types";

export default function CreateBounty({
  wallet,
  handleClose,
}: {
  wallet: Wallet;
  handleClose: () => void;
}) {
  const [state, setState] = React.useState({
    name: "",
    fileLocation: "",
    fileDownloadProtocol: "" as typeof SupportedDownloadProtocols[number],
    threshold: 0,
    totalNodes: 0,
    networkRequired: false,
    gpuRequired: false,
    amtStorage: 0,
    amtNodeReward: 0,
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;
    setState({
      ...state,
      [event.target.name]: value,
    });
  };

  const handleSubmit = () => {
    createBounty(wallet, state);
    handleClose();
  };

  return (
    <>
      <Grid container rowSpacing={1} spacing={4}>
        <Grid item xs={6}>
          <FormGroup>
            <FormControl margin="normal">
              <TextField
                fullWidth
                id="outlined-basic"
                label="Name"
                variant="outlined"
                size="small"
                name="name"
                onChange={handleChange}
              />
            </FormControl>
            <FormControl margin="normal">
              <TextField
                fullWidth
                id="outlined-basic"
                label="File Location"
                variant="outlined"
                size="small"
                name="fileLocation"
                onChange={handleChange}
              />
            </FormControl>
            <FormControl size="small" margin="normal">
              <InputLabel id="file-download-protocol-select-label">
                File Download Protocol
              </InputLabel>
              <Select
                labelId="file-download-protocol-select-label"
                id="file-download-protocol-select"
                label="File Download Protocol"
                onChange={handleChange}
                size="small"
                name="fileDownloadProtocol"
              >
                {SupportedDownloadProtocols.map((protocol) => (
                  <MenuItem value={protocol}>{protocol}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl margin="normal">
              <TextField
                fullWidth
                id="outlined-basic"
                label="Threshold"
                variant="outlined"
                size="small"
                name="threshold"
                onChange={handleChange}
              />
            </FormControl>
            <FormControl margin="normal">
              <TextField
                fullWidth
                id="outlined-basic"
                label="Total Nodes"
                variant="outlined"
                size="small"
                name="totalNodes"
                onChange={handleChange}
              />
            </FormControl>
          </FormGroup>
        </Grid>
        <Grid item xs={6}>
          <FormGroup>
            <FormControl margin="normal">
              <TextField
                fullWidth
                id="outlined-basic"
                label="Storage Amount"
                variant="outlined"
                size="small"
                placeholder="Storage in KB"
                name="amtStorage"
                onChange={handleChange}
              />
            </FormControl>
            <FormControl margin="normal">
              <TextField
                fullWidth
                id="outlined-basic"
                label="Reward Amount"
                variant="outlined"
                size="small"
                placeholder="Reward in NEAR"
                name="amtNodeReward"
                onChange={handleChange}
              />
            </FormControl>
            <FormControl margin="normal">
              <TextField
                fullWidth
                id="outlined-basic"
                label="Bounty Timeout"
                variant="outlined"
                size="small"
                name="timeout"
                onChange={handleChange}
              />
            </FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  name="networkRequired"
                  onChange={handleChange}
                  checked={state.networkRequired}
                />
              }
              label="Network Required"
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="gpuRequired"
                  onChange={handleChange}
                  checked={state.gpuRequired}
                />
              }
              label="GPU Required"
            />
          </FormGroup>
        </Grid>
      </Grid>
      <FormGroup>
        <FormControl margin="normal">
          <Button variant="contained" onClick={handleSubmit}>
            Create
          </Button>
        </FormControl>
      </FormGroup>
    </>
  );
}

const THIRTY_TGAS = "30000000000000";
const NO_DEPOSIT = "0";

// TODO: Load address of our contract
async function createBounty(wallet: Wallet, bounty: Bounty) {
  console.log(JSON.stringify(bounty));
  const args = {
    name: bounty.name,
    id: "",
    file_location: bounty.fileLocation,
    file_download_protocol: bounty.fileDownloadProtocol,
    min_nodes: bounty.threshold,
    total_nodes: bounty.totalNodes,
    timeout_seconds: bounty.timeout,
    network_required: bounty.networkRequired,
    gpu_required: bounty.gpuRequired,
    amt_storage: bounty.amtStorage,
    amt_node_reward: bounty.amtNodeReward,
  };
  return await wallet.callMethod("", "new_bounty", args);
}
