import "regenerator-runtime/runtime";

import NavBar from "./common/nav-bar";
import Home from "./home/home";
import Coordinator from "./coordinator/Coordinator";
import { Wallet } from "./common/near-wallet";
import Bounty from "./bounty/bounty";
import {BrowserRouter, createBrowserRouter, Route, RouterProvider, Routes} from "react-router-dom";
import React from "react";
import { NodeDetail } from "./node/NodeDetail";
import { NodeList } from "./node/NodeList";
import { ErrorBoundary } from "react-error-boundary";
import { TransientStorage } from "./storage";
import { atom } from "recoil";
import Node from "./node/node";

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
  return (

      <ErrorBoundary
          fallbackRender={({ error, resetErrorBoundary }) => (
              <div role="alert">
                  Something went wrong:
                  <pre>{error.message}</pre>
                  <button onClick={resetErrorBoundary}>Try again</button>
              </div>
          )}
      >
    <WalletContext.Provider value={wallet}>


        <BrowserRouter>


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
                <React.Suspense fallback={<div>Loading...</div>}>

                <Routes>
                <Route path="/" element={<Home isSignedIn={isSignedIn} />} />
                <Route path="/bounty" element={<Bounty />} />
                <Route path="/coordinator" element={<Coordinator />} />
                    <Route path="/node/:id" element={<NodeDetail />} />
                <Route path="/node" element={<Node />} />
            </Routes>
                </React.Suspense>

            </main>

        </BrowserRouter>

    </WalletContext.Provider>
      </ErrorBoundary>

  );
}
