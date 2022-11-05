import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import {default as Logo} from "../../assets/svg/logo-white.svg";
import {Wallet} from "./near-wallet";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import {IconButton} from "@mui/material";

const pageMap = {
    bounties: "/bounties",
    node: "/node",
};

export default function NavBar({
                                   isSignedIn,
                                   wallet,
                               }: {
    isSignedIn: boolean;
    wallet: Wallet;
}) {
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
        walletComponent = <SignInPrompt onClick={() => wallet.signIn()}/>;
    }

    return (
        <AppBar position="static">
            <Container maxWidth="xl">
                <Toolbar disableGutters>
                    <Box sx={{display: "contents"}}>
                        <img style={{width: "50px", height: "50px"}} src={Logo}/>
                    </Box>
                    <Box sx={{flexGrow: 1, display: {xs: "flex", md: "none"}}}>
                        <IconButton
                            size="large"
                            aria-label="account of current user"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            onClick={handleOpenNavMenu}
                            color="inherit"
                        ></IconButton>
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
                                display: {xs: "block", md: "none"},
                            }}
                        >
                            <MenuItem key="Bounties" onClick={handleCloseNavMenu}>
                                <Typography textAlign="center">Bounty</Typography>
                            </MenuItem>
                            <MenuItem key="Node" onClick={handleCloseNavMenu}>
                                <Typography textAlign="center">Node</Typography>
                            </MenuItem>
                        </Menu>
                    </Box>
                    <Box sx={{flexGrow: 1, display: {xs: "none", md: "flex"}}}>
                        <Button
                            key="Bounties"
                            href="/bounty"
                            sx={{my: 2, color: "white", display: "block"}}
                        >
                            Bounty
                        </Button>
                        <Button
                            key="Node"
                            href="/node"
                            sx={{my: 2, color: "white", display: "block"}}
                        >
                            Node
                        </Button>
                    </Box>
                    <Box sx={{flexGrow: 0}}>{walletComponent}</Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
}

export function SignInPrompt({onClick}) {
    return (
        <Button onClick={onClick} variant="contained">
            Connect Wallet
        </Button>
    );
}

function SignOutButton({accountId, onClick}: { accountId: string; onClick }) {
    return (
        <Button onClick={onClick} variant="contained">
            {accountId}
        </Button>
    );
}
