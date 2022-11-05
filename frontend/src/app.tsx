import "regenerator-runtime/runtime";

import NavBar from "./common/nav-bar";
import Home from "./home/Home";
import Coordinator from "./coordinator/Coordinator";
import {Wallet} from "./common/near-wallet";
import Bounty from "./bounty/Bounty";
import {createBrowserRouter, RouterProvider} from 'react-router-dom'
import React from "react";
import {NodeDetail} from "./node/NodeDetail";
import {NodeList} from "./node/NodeList";
import {ErrorBoundary} from "react-error-boundary";
import {TransientStorage} from "./storage";
import {atom} from "recoil";


export const localStorageState = atom<TransientStorage>({
    key: "localStorageState",
    default: new TransientStorage()
})

export const WalletContext = React.createContext<Wallet>(null);
export default function App({
                                isSignedIn,
                                wallet,
                            }: {
    isSignedIn: boolean;
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
    return (<WalletContext.Provider value={wallet}>
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
    );
}
