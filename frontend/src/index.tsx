import React from "react";
import App from "./App";
import { Wallet } from "./common/near-wallet";
import { Contract } from "./common/near-interface";
import ReactDOM from "react-dom/client";

const reactRoot = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

// create the Wallet and the Contract
const contractId = process.env.CONTRACT_NAME;
const wallet = new Wallet({ contractId });
const contract = new Contract({ wallet });

window.onload = () => {
  wallet
    .startUp()
    .then((isSignedIn: boolean) => {
      reactRoot.render(
        <App isSignedIn={isSignedIn} contract={contract} wallet={wallet} />
      );
    })
    .catch((e) => {
      reactRoot.render(
        <div style={{ color: "red" }}>
          Error: <code>{e.message}</code>
        </div>
      );
      console.error(e);
    });
};
