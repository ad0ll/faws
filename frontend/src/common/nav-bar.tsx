import React, { useContext } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import { default as Logo } from "../../assets/svg/logo-white.svg";
import { WalletContext } from "../App";

export default function NavBar({ isSignedIn }: { isSignedIn: boolean }) {
  const wallet = useContext(WalletContext);
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(
    null
  );

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

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
            <a href="/">
              <img style={{ width: "50px", height: "50px" }} src={Logo} />
            </a>
          </Box>
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            <Button
              key="Bounties"
              href="/bounty"
              sx={{ my: 2, color: "white", display: "block" }}
              disabled={!isSignedIn}
            >
              Bounty
            </Button>
            <Button
              key="Node"
              href="/node"
              sx={{ my: 2, color: "white", display: "block" }}
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
    <Button onClick={onClick} variant="contained">
      Connect Wallet
    </Button>
  );
}

function SignOutButton({ accountId, onClick }: { accountId: string; onClick }) {
  return (
    <Button onClick={onClick} variant="contained">
      {accountId}
    </Button>
  );
}
