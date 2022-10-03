import "regenerator-runtime/runtime";
import React from "react";

import "../assets/global.scss";

import NavBar from "./common/NavBar";
import Home from "./home/Home";
import Coordinator from "./coordinator/Coordinator";
import Bounties from "./bounties/Bounties";
import { SignInPrompt } from "./common/NavBar";
import { Wallet } from "./common/near-wallet";
import { Contract } from "./common/near-interface";

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
    case "/bounties":
      pageComponent = <Bounties wallet={wallet} />;
      break;
    case "/coordinator":
      pageComponent = <Coordinator wallet={wallet} />;
  }

  return (
    <>
      <NavBar isSignedIn={isSignedIn} wallet={wallet} />
      {pageComponent}
    </>
  );
}
