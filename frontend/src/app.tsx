import "regenerator-runtime/runtime";

import NavBar from "./common/nav-bar";
import { Wallet } from "./common/near-wallet";
import { Contract } from "./common/near-interface";
import Node from "./node/Node";
import Bounty from "./bounty/bounty";

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
    case "/bounty":
      pageComponent = <Bounty wallet={wallet} />;
      break;
    case "/node":
      pageComponent = <Node wallet={wallet} />;
  }

  return (
    <>
      <NavBar isSignedIn={isSignedIn} wallet={wallet} />
      <main
        style={{
          marginTop: "24px",
          maxWidth: "1536px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        {pageComponent}
      </main>
    </>
  );
}
