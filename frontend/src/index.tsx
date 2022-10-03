import React from "react";
import App from "./App";
import { Wallet } from "./common/near-wallet";
import { Contract } from "./common/near-interface";
import ReactDOM from "react-dom/client";
import { createTheme, ThemeProvider } from "@mui/material";

const reactRoot = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

// create the Wallet and the Contract
const contractId = process.env.CONTRACT_NAME;
const wallet = new Wallet({ contractId });
const contract = new Contract({ wallet });

const theme = createTheme({
  palette: {
    primary: {
      main: "#efefef",
    },
    secondary: {
      main: "#555",
    },
  },
});

window.onload = () => {
  wallet
    .startUp()
    .then((isSignedIn: boolean) => {
      reactRoot.render(
        <ThemeProvider theme={theme}>
          <App isSignedIn={isSignedIn} contract={contract} wallet={wallet} />
        </ThemeProvider>
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
