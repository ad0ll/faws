import { Box, Paper, Typography } from "@mui/material";
import React, { startTransition, useContext, useEffect } from "react";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import ComputerIcon from "@mui/icons-material/Computer";
import { WalletContext } from "../app";
import { selector, useRecoilValue } from "recoil";
import { useNavigate } from "react-router";
import { chainNodesState } from "../node/existing-node";
import { wallet } from "..";
import { default as NearBadge } from "../../assets/svg/near-brand-badge.png";
import { bountiesState } from "../bounty/existing-bounty";

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

const totalPayoutsSelector = selector({
  key: "totalPayoutsSelector",
  get: async ({ get }) => {
    return await wallet.getTotalPayouts();
  },
});

const bountiesCountSelector = selector({
  key: "bountiesCountSelector",
  get: async ({ get }) => {
    return await wallet.getBountyCount();
  },
});

const nodesCountSelector = selector({
  key: "nodesCountSelector",
  get: async ({ get }) => {
    return await wallet.getNodeCount();
  },
});

export default function Home({ isSignedIn }: { isSignedIn: boolean }) {
  const wallet = useContext(WalletContext);
  const navigate = useNavigate();
  let nodes = [];
  let bounties = [];
  if (isSignedIn) {
    nodes = useRecoilValue(chainNodesState);
    bounties = useRecoilValue(bountiesState);
  }

  const processBounties = (bounties: any[]) => {
    let tempBountiesCount = 0;
    Object.values(bounties)
      .filter((bounty) => bounty.owner_id === wallet.accountId)
      .forEach((_) => tempBountiesCount++);
    return tempBountiesCount;
  };

  const processNodes = (nodes: any[]) => {
    let tempNodesCount = 0;
    let tempEarnings = 0;
    Object.values(nodes)
      .filter((node) => node.owner_id === wallet.accountId)
      .forEach((node) => {
        tempEarnings += node.lifetime_earnings ?? 0;
        tempNodesCount++;
      });
    return [tempEarnings, tempNodesCount];
  };

  const [totalSelfEarnings, setTotalSelfEarnings] = React.useState(
    processNodes(nodes)[0]
  );
  const [totalSelfBounties, setTotalSelfBounties] = React.useState(
    processBounties(bounties)
  );
  const [totalSelfNodes, setTotalSelfNodes] = React.useState(
    processNodes(nodes)[1]
  );
  const [totalPayouts, setTotalPayouts] = React.useState(
    useRecoilValue(totalPayoutsSelector)
  );
  const [totalBounties, setTotalBounties] = React.useState(
    useRecoilValue(bountiesCountSelector)
  );
  const [totalNodes, setTotalNodes] = React.useState(
    useRecoilValue(nodesCountSelector)
  );

  useEffect(() => {
    const getBounties = async () => {
      if (isSignedIn) {
        const selfBounties = await wallet.getBountiesOwnedBySelf();
        setTotalSelfBounties(processBounties(selfBounties));
      } else {
        setTotalBounties(await wallet.getBountyCount());
      }
    };
    const interval = setInterval(() => {
      getBounties();
    }, 2000);
    return () => clearInterval(interval);
  }, [bounties]);
  useEffect(() => {
    const updateNodes = async () => {
      if (isSignedIn) {
        nodes = await wallet.getNodesOwnedBySelf();
        setTotalSelfEarnings(processNodes(nodes)[0]);
        setTotalSelfNodes(processNodes(nodes)[1]);
      } else {
        setTotalPayouts(await wallet.getTotalPayouts());
        setTotalNodes(await wallet.getNodeCount());
      }
    };
    const pollingInterval = setInterval(updateNodes, 2000);
    return () => {
      clearInterval(pollingInterval);
    };
  }, [nodes]);
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
                {totalSelfEarnings}
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
              cursor: "pointer",
            }}
          >
            <HistoryEduIcon sx={iconStyle} />
            <Typography variant="h5">My Bounties</Typography>
            <Typography variant="h1">{totalSelfBounties}</Typography>
          </Paper>
          <Paper
            onClick={() => {
              navigate("/node");
            }}
            elevation={3}
            sx={{
              ...paperStyle,
              background: "#ab47bc",
              cursor: "pointer",
            }}
          >
            <ComputerIcon sx={iconStyle} />
            <Typography variant="h5">My Nodes</Typography>
            <Typography variant="h1">{totalSelfNodes}</Typography>
          </Paper>
        </Box>
      ) : (
        <>
          <Typography
            variant="h5"
            sx={{
              textAlign: "center",
            }}
          >
            Please connect a wallet to continue
          </Typography>
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
              <Typography variant="h5">Total Payouts</Typography>
              <Typography variant="h1">
                <>
                  {totalPayouts}
                  <Typography>NEAR</Typography>
                </>
              </Typography>
            </Paper>
            <Paper
              elevation={3}
              sx={{
                ...paperStyle,
                background: "#0288d1",
              }}
            >
              <HistoryEduIcon sx={iconStyle} />
              <Typography variant="h5">Total Bounties</Typography>
              <Typography variant="h1">{totalBounties}</Typography>
            </Paper>
            <Paper
              elevation={3}
              sx={{
                ...paperStyle,
                background: "#ab47bc",
              }}
            >
              <ComputerIcon sx={iconStyle} />
              <Typography variant="h5">Total Nodes</Typography>
              <Typography variant="h1">{totalNodes}</Typography>
            </Paper>
          </Box>
        </>
      )}
      <Box>
        <img
          style={{
            marginTop: "24px",
            height: "50px",
            position: "absolute",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
          src={NearBadge}
        />
      </Box>
    </>
  );
}
