import { Wallet } from "../common/near-wallet";
import React from "react";

//Different parts of the codebase use different names for the coordinator id, which we accommodate here
//TODO revert me later
// export const COORDINATOR_ID = process.env.CONTRACT_NAME || process.env.COORDINATOR_ID || "dev-1667060184697-69506898805687";
export const COORDINATOR_ID = "dev-1667060711822-88247952945269";

export default function Coordinator() {
  return <h1>Coordinator</h1>;
}
