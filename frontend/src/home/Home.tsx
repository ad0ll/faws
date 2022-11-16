import { Box, Button, Paper, Typography } from "@mui/material";
import React, { useContext } from "react";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import ComputerIcon from "@mui/icons-material/Computer";
import { localStorageState, WalletContext } from "../app";
import { useRecoilValue } from "recoil";
import { BountyStorage, NodeStorage } from "../storage";
import { useNavigate } from "react-router";

const paperStyle = {
  margin: "24px",
  width: "30%",
  height: "250px",
  textAlign: "center",
};

const iconStyle = {
  paddingTop: "10px",
  width: "50px",
  height: "50px",
};

export default function Home({ isSignedIn }: { isSignedIn: boolean }) {
  const wallet = useContext(WalletContext);
  const storage = useRecoilValue(localStorageState);
  const nodes = (storage.get("nodes") as NodeStorage) || {};
  const bounties = (storage.get("bounties") as BountyStorage) || {};
  const navigate = useNavigate();
  let totalEarnings = 0;
  let totalBounties = 0;
  let totalNodes = 0;
  Object.values(nodes)
    .filter((node) => node.owner_id === wallet.accountId)
    .forEach((node) => {
      totalEarnings += node.lifetime_earnings ?? 0;
      totalNodes++;
    });
  Object.values(bounties)
    .filter((bounty) => bounty.owner_id === wallet.accountId)
    .forEach((_) => totalBounties++);
  return (
    <>
      {isSignedIn ? (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            margin: "auto",
          }}
        >
          <Paper
            elevation={3}
            sx={{
              ...paperStyle,
              background: "#388e3c",
            }}
          >
            <MonetizationOnIcon sx={iconStyle} />
            <Typography variant="h5">My Earnings</Typography>
            <Typography variant="h1">
              <>
                {totalEarnings}
                <Typography>NEAR</Typography>
              </>
            </Typography>
          </Paper>
          <Paper
            onClick={() => {
              navigate("/bounty");
            }}
            elevation={3}
            sx={{
              ...paperStyle,
              background: "#0288d1",
              // cursor: "pointer",
            }}
          >
            <HistoryEduIcon sx={iconStyle} />
            <Typography variant="h5">My Bounties</Typography>
            <Typography variant="h1">{totalBounties}</Typography>
          </Paper>
          <Paper
            onClick={() => {
              navigate("/node");
            }}
            elevation={3}
            sx={{
              ...paperStyle,
              background: "#ab47bc",
              // cursor: "pointer",
            }}
          >
            <ComputerIcon sx={iconStyle} />
            <Typography variant="h5">My Nodes</Typography>
            <Typography variant="h1">{totalNodes}</Typography>
          </Paper>
        </Box>
      ) : (
        <Typography
          variant="h5"
          sx={{
            textAlign: "center",
          }}
        >
          Please connect a wallet to continue
        </Typography>
      )}
    </>
  );
}
