import "regenerator-runtime/runtime";

import NavBar from "./common/nav-bar";
import Home from "./home/home";
import Coordinator from "./coordinator/Coordinator";
import { Wallet } from "./common/near-wallet";
import Bounty from "./bounty/bounty";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import React from "react";
import { NodeDetail } from "./node/NodeDetail";
import { NodeList } from "./node/NodeList";
import { ErrorBoundary } from "react-error-boundary";
import { TransientStorage } from "./storage";
import { atom } from "recoil";
import { loadData } from "./common/load-chain-data";

export const localStorageState = atom<TransientStorage>({
  key: "localStorageState",
  default: new TransientStorage(),
});

export const WalletContext = React.createContext<Wallet>(null);
export default function App({
  isSignedIn,
  wallet,
}: {
  isSignedIn: boolean;
  wallet: Wallet;
}) {
  loadData(wallet);
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home isSignedIn={isSignedIn} />,
    },
    {
      path: "/bounty",
      element: <Bounty />,
    },
    {
      path: "/coordinator",
      element: <Coordinator />,
    },
    {
      path: "/node",
      element: <NodeList />,
    },
    {
      path: "/node/:id",
      element: <NodeDetail />,
    },
  ]);
  return (
    <WalletContext.Provider value={wallet}>
      <NavBar isSignedIn={isSignedIn} />
      <main
        style={{
          maxWidth: "1536px",
          paddingLeft: "24px",
          paddingRight: "24px",
          marginLeft: "auto",
          marginRight: "auto",
          paddingTop: "24px",
        }}
      >
        <ErrorBoundary
          fallbackRender={({ error, resetErrorBoundary }) => (
            <div role="alert">
              <p>Something went wrong:</p>
              <pre>{error.message}</pre>
              <button onClick={resetErrorBoundary}>Try again</button>
            </div>
          )}
        >
          <RouterProvider router={router} />
        </ErrorBoundary>
      </main>
    </WalletContext.Provider>
  );
}
