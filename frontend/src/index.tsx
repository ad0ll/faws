import App from "./app";
import { Wallet } from "./common/near-wallet";
import { Contract } from "./common/near-interface";
import ReactDOM from "react-dom/client";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { NetworkId } from "@near-wallet-selector/core";

const reactRoot = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

// create the Wallet and the Contract
const contractId = process.env.CONTRACT_NAME;
const network = process.env.NETWORK as NetworkId;
const wallet = new Wallet({
  contractId,
  network,
});
const contract = new Contract({ wallet });

const theme = createTheme({
  palette: {
    mode: "dark",
    action: {
      active: "rgb(102, 178, 255)",
    },
    background: {
      default: "rgb(0, 30, 60)",
      paper: "rgb(0, 30, 60)",
    },
    text: {
      primary: "rgb(189, 189, 189)",
      secondary: "rgb(204, 204, 204)",
    },
    divider: "rgba(194, 224, 255, 0.08)",
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(","),
  },
});

window.onload = () => {
  wallet
    .startUp()
    .then((isSignedIn: boolean) => {
      reactRoot.render(
        <ThemeProvider theme={theme}>
          <CssBaseline />
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
