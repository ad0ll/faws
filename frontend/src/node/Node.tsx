import React from "react";
import { Typography } from "@mui/material";
import { Wallet } from "../common/near-wallet";

export default function Node({ wallet }: { wallet: Wallet }) {
  return <Typography variant="h3">Node</Typography>;
}
