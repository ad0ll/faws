import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
} from "@mui/material";
import React from "react";
import { Wallet } from "../common/near-wallet";

// name: String, id: AccountId, file_location: String, file_download_protocol: SupportedDownloadProtocols, threshold: u64, total_nodes: u64, network_required: bool, gpu_required: bool, amt_storage: u128, amt_node_reward: u128

const fileDownloadProtocols = ["IPFS", "Git", "HTTP"];

export default function CreateBounty({ wallet }: { wallet: Wallet }) {
  const [protocol, setProtocol] = React.useState("");

  const handleChange = (event: SelectChangeEvent) => {
    setProtocol(event.target.value as string);
  };

  return (
    <>
      <FormGroup>
        <FormControl>
          <TextField
            margin="normal"
            fullWidth
            id="outlined-basic"
            label="Name"
            variant="outlined"
            size="small"
          />
        </FormControl>
        <FormControl>
          <TextField
            margin="normal"
            fullWidth
            id="outlined-basic"
            label="File Location"
            variant="outlined"
            size="small"
          />
        </FormControl>
        <FormControl>
          <InputLabel id="file-download-protocol-select-label">
            File Download Protocol
          </InputLabel>
          <Select
            labelId="file-download-protocol-select-label"
            id="file-download-protocol-select"
            value={protocol}
            label="File Download Protocol"
            onChange={handleChange}
            size="small"
          >
            {fileDownloadProtocols.map((protocol) => (
              <MenuItem value={protocol}>{protocol}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <TextField
            margin="normal"
            fullWidth
            id="outlined-basic"
            label="Threshold"
            variant="outlined"
            size="small"
          />
        </FormControl>
        <FormControl>
          <TextField
            margin="normal"
            fullWidth
            id="outlined-basic"
            label="Total Nodes"
            variant="outlined"
            size="small"
          />
        </FormControl>
        <FormControlLabel
          control={<Checkbox defaultChecked />}
          label="Network Required"
        />
        <FormControlLabel
          control={<Checkbox defaultChecked />}
          label="GPU Required"
        />
        <FormControl>
          <TextField
            margin="normal"
            fullWidth
            id="outlined-basic"
            label="Storage Amount"
            variant="outlined"
            size="small"
          />
        </FormControl>
        <FormControl>
          <TextField
            margin="normal"
            fullWidth
            id="outlined-basic"
            label="Reward Amount"
            variant="outlined"
            size="small"
          />
        </FormControl>
        <FormControl>
          <Button variant="contained">Create</Button>
        </FormControl>
      </FormGroup>
    </>
  );
}
