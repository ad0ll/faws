import { Wallet } from "../common/near-wallet";
import { Box, Grid, Tab, Tabs, Typography } from "@mui/material";
import CreateBounty from "./CreateBounty";
import React from "react";
import ExistingBounty from "./ExistingBounty";

// name: String, id: AccountId, file_location: String, file_download_protocol: SupportedDownloadProtocols, threshold: u64, total_nodes: u64, network_required: bool, gpu_required: bool, amt_storage: u128, amt_node_reward: u128

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

export default function Bounty({ wallet }: { wallet: Wallet }) {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <>
      <Grid container spacing={8}>
        <Grid item xs={6}>
          <CreateBounty wallet={wallet} />
        </Grid>
        <Grid item xs={6}>
          <ExistingBounty wallet={wallet} />
        </Grid>
      </Grid>
    </>
  );
}
