import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import { default as Logo } from "../../assets/svg/logo-white.svg";
import { default as UserIcon } from "../../assets/svg/user-icon-white.svg";
import { Wallet } from "./near-wallet";

const pages = ["Bounties", "Coordinator"];

export default function NavBar({ wallet }: { wallet: Wallet }) {
  const [anchorElNav, setAnchorElNav] = React.useState(null);

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Typography
            variant="h5"
            noWrap
            component="a"
            href=""
            sx={{
              mr: 2,
              display: { xs: "flex", md: "none" },
              flexGrow: 1,
              fontFamily: "monospace",
              fontWeight: 700,
              letterSpacing: ".3rem",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            <img src={Logo} />
          </Typography>
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            {pages.map((page) => (
              <Button
                key={page}
                onClick={handleCloseNavMenu}
                sx={{ my: 2, color: "white", display: "block" }}
              >
                {page}
              </Button>
            ))}
          </Box>

          <SignOutButton
            accountId={wallet.accountId}
            onClick={wallet.signOut()}
          />
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export function SignInPrompt({ onClick }) {
  return (
    <main>
      <p style={{ textAlign: "center" }}>
        <button onClick={onClick}>Sign in with NEAR Wallet</button>
      </p>
    </main>
  );
}

function SignOutButton({ accountId, onClick }: { accountId: string; onClick }) {
  return (
    <button className="wallet" onClick={onClick}>
      <img src={UserIcon} />
      <div className="wallet-address">{accountId}</div>
    </button>
  );
}
