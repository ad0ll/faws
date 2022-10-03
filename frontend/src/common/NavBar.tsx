import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import { default as Logo } from "../../assets/svg/logo-black.svg";
import { default as UserIcon } from "../../assets/svg/user-icon-white.svg";
import { Wallet } from "./near-wallet";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

const pageMap = {
  Home: "/",
  Bounties: "/bounties",
  Coordinator: "/coordinator",
};

export default function NavBar({
  isSignedIn,
  wallet,
}: {
  isSignedIn: boolean;
  wallet: Wallet;
}) {
  const [anchorElNav, setAnchorElNav] = React.useState(null);

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  let walletComponent;
  if (isSignedIn) {
    walletComponent = (
      <SignOutButton accountId={wallet.accountId} onClick={wallet.signOut()} />
    );
  } else {
    walletComponent = <SignInPrompt onClick={() => wallet.signIn()} />;
  }

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <div className="logo">
            <img src={Logo} />
          </div>
          <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: "block", md: "none" },
              }}
            >
              {Object.keys(pageMap).map((page) => (
                <MenuItem key={page} onClick={handleCloseNavMenu}>
                  <Typography textAlign="center">{page}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            {Object.keys(pageMap).map((page) => (
              <Button
                key={page}
                onClick={handleCloseNavMenu}
                sx={{ my: 2, color: "gray", display: "block" }}
              >
                {page}
              </Button>
            ))}
          </Box>
          {walletComponent}
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export function SignInPrompt({ onClick }) {
  return <button onClick={onClick}>Connect Wallet</button>;
}

function SignOutButton({ accountId, onClick }: { accountId: string; onClick }) {
  return (
    <button onClick={onClick}>
      <img src={UserIcon} />
      <div>{accountId}</div>
    </button>
  );
}
