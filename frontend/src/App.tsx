import "regenerator-runtime/runtime";

import NavBar from "./common/NavBar";
import Home from "./home/Home";
import Coordinator from "./coordinator/Coordinator";
import { Wallet } from "./common/near-wallet";
import { Contract } from "./common/near-interface";
import Node from "./node/Node";
import Bounty from "./bounty/Bounty";

export default function App({
  isSignedIn,
  contract,
  wallet,
}: {
  isSignedIn: boolean;
  contract: Contract;
  wallet: Wallet;
}) {
  let pageComponent;

  switch (window.location.pathname) {
    case "/":
      pageComponent = <Home wallet={wallet} />;
      break;
    case "/bounty":
      pageComponent = <Bounty wallet={wallet} />;
      break;
    case "/coordinator":
      pageComponent = <Coordinator wallet={wallet} />;
      break;
    case "/node":
      pageComponent = <Node wallet={wallet} />;
  }

  return (
    <>
      <NavBar isSignedIn={isSignedIn} wallet={wallet} />
      <main
        style={{ marginTop: "16px", marginLeft: "32px", marginRight: "32px" }}
      >
        {pageComponent}
      </main>
    </>
  );
}
