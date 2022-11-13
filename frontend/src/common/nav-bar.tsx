import React, { useContext } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import { default as Logo } from "../../assets/svg/faws-logo-blue.svg";
import { WalletContext } from "../app";
import { Link } from "@mui/material";
import { AccountBalanceWallet } from "@mui/icons-material";

export default function NavBar({ isSignedIn }: { isSignedIn: boolean }) {
  const wallet = useContext(WalletContext);

  let walletComponent;
  if (isSignedIn) {
    walletComponent = (
      <SignOutButton
        accountId={wallet.accountId}
        onClick={() => wallet.signOut()}
      />
    );
  } else {
    walletComponent = <SignInPrompt onClick={() => wallet.signIn()} />;
  }

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Box sx={{ display: "contents" }}>
            <Link href="/" sx={{ width: "50px", height: "50px" }}>
              <img style={{ width: "50px", height: "50px" }} src={Logo} />
            </Link>
          </Box>
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            <Button
              key="Bounties"
              href="/bounty"
              sx={{ my: 2, display: "block" }}
              disabled={!isSignedIn}
            >
              Bounty
            </Button>
            <Button
              key="Node"
              href="/node"
              sx={{ my: 2, display: "block" }}
              disabled={!isSignedIn}
            >
              Node
            </Button>
          </Box>
          <Box sx={{ flexGrow: 0 }}>{walletComponent}</Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export function SignInPrompt({ onClick }) {
  return (
    <Button
      onClick={onClick}
      variant="contained"
      startIcon={<AccountBalanceWallet />}
    >
      Connect Wallet
    </Button>
  );
}

function SignOutButton({ accountId, onClick }: { accountId: string; onClick }) {
  return (
    <Button
      onClick={onClick}
      variant="contained"
      startIcon={<AccountBalanceWallet />}
    >
      {accountId}
    </Button>
  );
}
