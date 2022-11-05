import { Button, FormControl, FormGroup, Grid, TextField } from "@mui/material";
import * as React from "react";
import { Wallet } from "../common/near-wallet";
import { Node } from "./types";
import {COORDINATOR_ID} from "../coordinator/Coordinator";

export default function RegisterNode({
  wallet,
  handleClose,
}: {
  wallet: Wallet;
  handleClose: () => void;
}) {
  const [state, setState] = React.useState({
    name: "",
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
    registerNode(wallet, state);
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

async function registerNode(wallet: Wallet, node: Node) {
  const args = {
    name: node.name,
  };
  //TODO replace with wallet.registerNode
  return await wallet.callMethod({
    contractId: COORDINATOR_ID,
    method: "register_node",
    args,
  });
}
