import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  TextField,
} from "@mui/material";
import React, { useContext } from "react";
import { WalletContext } from "../app";

export default function RegisterNode({
  handleClose,
}: {
  handleClose: () => void;
}) {
  const wallet = useContext(WalletContext);
  const [state, setState] = React.useState({
    name: "",
    allow_network: false,
    allow_gpu: false,
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

  const handleSubmit = async () => {
    await wallet.registerNode(state.name, state.allow_network, state.allow_gpu);
    handleClose();
  };

  return (
    <>
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
        <FormControlLabel
          control={
            <Checkbox
              name="allow_network"
              onChange={handleChange}
              checked={state.allow_network}
            />
          }
          label="Network Required"
        />
        <FormControlLabel
          control={
            <Checkbox
              name="allow_gpu"
              onChange={handleChange}
              checked={state.allow_gpu}
            />
          }
          label="GPU Required"
        />
      </FormGroup>
      <FormGroup>
        <FormControl margin="normal">
          <Button variant="contained" onClick={handleSubmit}>
            Register
          </Button>
        </FormControl>
      </FormGroup>
    </>
  );
}
