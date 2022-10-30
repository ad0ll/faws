import "regenerator-runtime/runtime";

import NavBar from "./common/NavBar";
import Home from "./home/Home";
import Coordinator from "./coordinator/Coordinator";
import {Wallet} from "./common/near-wallet";
import {Contract} from "./common/near-interface";
import Bounty from "./bounty/Bounty";
import {createBrowserRouter, RouterProvider} from 'react-router-dom'
import React, {createContext} from "react";
import {NodeDetail} from "./node/NodeDetail";
import {NodeList} from "./node/NodeList";
import {ErrorBoundary} from "react-error-boundary";
import {LocalStorageValue, Storage} from "./storage";


export const WalletContext = createContext<Wallet>(null);
export default function App({
                                isSignedIn,
                                wallet,
                            }: {
    isSignedIn: boolean;
    contract: Contract;
    wallet: Wallet;
}) {
    const router = createBrowserRouter([
        {
            path: "/",
            element: <Home/>
        },
        {
            path: "/bounty",
            element: <Bounty/>
        },
        {
            path: "/coordinator",
            element: <Coordinator/>
        },
        {
            path: "/node",
            element: <NodeList/>
        },
        {
            path: "/node/:id",
            element: <NodeDetail/>
        }
    ]);
    return (
            <WalletContext.Provider value={wallet}>
                <NavBar isSignedIn={isSignedIn} wallet={wallet}/>
                <main
                    style={{marginTop: "16px", marginLeft: "32px", marginRight: "32px"}}
                >
                    <ErrorBoundary
                        fallbackRender={({error, resetErrorBoundary}) => (
                            <div role="alert">
                                <p>Something went wrong:</p>
                                <pre>{error.message}</pre>
                                <button onClick={resetErrorBoundary}>Try again</button>
                            </div>
                        )}>
                        <RouterProvider router={router}/>
                    </ErrorBoundary>
                </main>
            </WalletContext.Provider>
    )
        ;
}
