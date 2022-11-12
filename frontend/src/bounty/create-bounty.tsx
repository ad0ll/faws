import {
  Alert,
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
import React, { useContext } from "react";
import {
  Bounty,
  SupportedFileDownloadProtocols,
} from "../../../execution-client/types";
import { localStorageState, WalletContext } from "../app";
import { useRecoilValue } from "recoil";

export default function CreateBounty({
  handleClose,
}: {
  handleClose: () => void;
}) {
  const wallet = useContext(WalletContext);
  const storage = useRecoilValue(localStorageState);
  const [error, setError] = React.useState("");
  const [state, setState] = React.useState<Bounty>({
    amt_node_reward: "",
    amt_storage: "",
    answers: {},
    bounty_created: 0,
    build_args: [],
    cancelled: false,
    complete: false,
    coordinator_id: "",
    elected_nodes: [],
    file_download_protocol: "" as SupportedFileDownloadProtocols,
    file_location: "",
    gpu_required: false,
    id: "",
    min_nodes: 0,
    network_required: true,
    owner_id: "",
    runtime_args: [],
    status: undefined,
    total_nodes: 0,
    timeout_seconds: 60,
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

  const validateBounty = (bounty: Bounty): string => {
    const nodesCount = storage.get("nodesCount");

    if (!bounty.file_location) {
      return "File location is required";
    }
    if (!bounty.file_download_protocol) {
      return "File download protocol is required";
    }
    if (!bounty.min_nodes) {
      return "Threshold is required";
    }
    if (!bounty.total_nodes) {
      return "Total nodes is required";
    }
    if (!bounty.amt_storage) {
      return "Storage is required";
    }
    if (!bounty.amt_node_reward) {
      return "Reward is required";
    }
    if (bounty.min_nodes === 0) {
      return "Threshold set to 0";
    }
    if (bounty.total_nodes === 0) {
      return "Total nodes set to 0";
    }
    if (bounty.min_nodes > bounty.total_nodes) {
      return "Threshold set greater than total nodes.";
    }
    if (bounty.total_nodes > Number(nodesCount)) {
      return "Total nodes set higher than total nodes available.";
    }
    return "";
  };

  const handleSubmit = async () => {
    try {
      const tempError = validateBounty(state);
      setError(tempError);
      if (!tempError) {
        await wallet.createBounty(state);
        handleClose();
      }
    } catch (e: any) {}
  };

  return (
    <>
      {error && (
        <Alert severity="error" variant="outlined" sx={{ marginTop: "16px" }}>
          {error}
        </Alert>
      )}
      <Grid container rowSpacing={1} spacing={4}>
        <Grid item xs={6}>
          <FormGroup>
            <FormControl margin="normal">
              <TextField
                required
                fullWidth
                id="file-location"
                label="File Location"
                variant="outlined"
                size="small"
                name="file_location"
                onChange={handleChange}
                error={!state.file_location}
              />
            </FormControl>
            <FormControl size="small" margin="normal">
              <InputLabel
                required
                id="file-download-protocol-select-label"
                error={!state.file_download_protocol}
              >
                File Download Protocol
              </InputLabel>
              <Select
                required
                labelId="file-download-protocol-select-label"
                id="file-download-protocol"
                label="File Download Protocol"
                onChange={handleChange}
                size="small"
                name="file_download_protocol"
                value={state.file_download_protocol}
                error={!state.file_download_protocol}
              >
                {Object.values(SupportedFileDownloadProtocols).map(
                  (protocol) => (
                    <MenuItem key={protocol} value={protocol}>
                      {protocol}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>
            <FormControl margin="normal">
              <TextField
                required
                fullWidth
                id="threshold"
                label="Threshold"
                variant="outlined"
                size="small"
                name="min_nodes"
                onChange={handleChange}
                error={!state.min_nodes}
              />
            </FormControl>
            <FormControl margin="normal">
              <TextField
                required
                fullWidth
                id="total-nodes"
                label="Total Nodes"
                variant="outlined"
                size="small"
                name="total_nodes"
                onChange={handleChange}
                error={!state.total_nodes}
              />
            </FormControl>
          </FormGroup>
        </Grid>
        <Grid item xs={6}>
          <FormGroup>
            <FormControl margin="normal">
              <TextField
                required
                fullWidth
                id="storage"
                label="Storage (NEAR)"
                variant="outlined"
                size="small"
                placeholder="Storage in KB"
                name="amt_storage"
                onChange={handleChange}
                error={!state.amt_storage}
              />
            </FormControl>
            <FormControl margin="normal">
              <TextField
                required
                fullWidth
                id="reward"
                label="Reward (NEAR)"
                variant="outlined"
                size="small"
                placeholder="Reward in NEAR"
                name="amt_node_reward"
                onChange={handleChange}
                error={!state.amt_node_reward}
              />
            </FormControl>
            <FormControl margin="normal">
              <TextField
                fullWidth
                id="timeout-seconds"
                label="Bounty Timeout"
                variant="outlined"
                size="small"
                name="timeout_seconds"
                onChange={handleChange}
                value={state.timeout_seconds}
              />
            </FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  name="network_required"
                  onChange={handleChange}
                  checked={state.network_required}
                />
              }
              label="Network Required"
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="gpu_required"
                  onChange={handleChange}
                  checked={state.gpu_required}
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
