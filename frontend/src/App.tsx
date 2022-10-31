import "regenerator-runtime/runtime";

import NavBar from "./common/NavBar";
import Home from "./home/Home";
import Coordinator from "./coordinator/Coordinator";
import {Wallet} from "./common/near-wallet";
import {Contract} from "./common/near-interface";
import Bounty from "./bounty/Bounty";
import {createBrowserRouter, RouterProvider} from 'react-router-dom'
import React from "react";
import {NodeDetail} from "./node/NodeDetail";
import {NodeList} from "./node/NodeList";
import {ErrorBoundary} from "react-error-boundary";
import {TransientStorage} from "./storage";
import {atom, useSetRecoilState} from "recoil";


export const walletState = atom<Wallet>({
    key: "walletState",
    default: null
})

// export const localStorageState = atom<any>({
//     key: "localStorageState",
//     default: {}
// })
export const localStorageState = atom<TransientStorage>({
    key: "localStorageState",
    default: new TransientStorage()
})
export default function App({
                                isSignedIn,
                                wallet,
                            }: {
    isSignedIn: boolean;
    contract: Contract;
    wallet: Wallet;
}) {
    const setWalletState = useSetRecoilState(walletState)
    setWalletState(wallet)
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
    return (<>
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
        </>
    );
}
