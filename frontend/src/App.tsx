import "regenerator-runtime/runtime";

import NavBar from "./common/NavBar";
import Home from "./home/Home";
import Coordinator from "./coordinator/Coordinator";
import {Wallet} from "./common/near-wallet";
import {Contract} from "./common/near-interface";
import {NodeDetail, NodeList} from "./node/Node";
import Bounty from "./bounty/Bounty";
import {Route, Routes} from 'react-router-dom'

export default function App({
                                isSignedIn,
                                contract,
                                wallet,
                            }: {
    isSignedIn: boolean;
    contract: Contract;
    wallet: Wallet;
}) {


    return (
        <>
            <NavBar isSignedIn={isSignedIn} wallet={wallet}/>
            <main
                style={{marginTop: "16px", marginLeft: "32px", marginRight: "32px"}}
            >
                <Routes>
                    <Route path={"/"} element={<Home wallet={wallet}/>}/>
                    <Route path={"/bounty"} element={<Bounty wallet={wallet}/>}/>
                    <Route path={"/coordinator"} element={<Coordinator wallet={wallet}/>}/>
                    <Route path={"/node"} element={<NodeList wallet={wallet}/> }/>
                    <Route path={"/node/:id"} element={<NodeDetail wallet={wallet}/> }/>
                </Routes>
            </main>
        </>
    );
}
