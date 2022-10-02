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

  /// If user not signed-in with wallet - show prompt
  if (!isSignedIn) {
    // Sign-in flow will reload the page later
    console.log("Trigger sign in prompt");
    return <SignInPrompt onClick={() => wallet.signIn()} />;
  }

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
      <NavBar wallet={wallet} />
      {pageComponent}
    </>
  );
}
