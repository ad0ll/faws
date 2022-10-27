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
  Typography,
} from "@mui/material";
import React from "react";
import { Wallet } from "../common/near-wallet";
import { SupportedDownloadProtocols } from "./types";

export default function CreateBounty({ wallet }: { wallet: Wallet }) {
  const [protocol, setProtocol] = React.useState("");

  const handleChange = (event: SelectChangeEvent) => {
    setProtocol(event.target.value as string);
  };

  return (
    <>
      <Typography variant="h5">Create Bounty</Typography>
      <FormGroup>
        <FormControl margin="normal">
          <TextField
            fullWidth
            id="outlined-basic"
            label="Name"
            variant="outlined"
            size="small"
          />
        </FormControl>
        <FormControl margin="normal">
          <TextField
            fullWidth
            id="outlined-basic"
            label="File Location"
            variant="outlined"
            size="small"
          />
        </FormControl>
        <FormControl size="small" margin="normal">
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
          />
        </FormControl>
        <FormControl margin="normal">
          <TextField
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
        <FormControl margin="normal">
          <TextField
            fullWidth
            id="outlined-basic"
            label="Storage Amount"
            variant="outlined"
            size="small"
            placeholder="Storage in KB"
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
          />
        </FormControl>
        <FormControl margin="normal">
          <Button variant="contained">Create</Button>
        </FormControl>
      </FormGroup>
    </>
  );
}
