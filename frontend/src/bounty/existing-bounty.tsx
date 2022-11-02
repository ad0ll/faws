import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Grid,
  Typography,
} from "@mui/material";
import { Wallet } from "../common/near-wallet";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export default function ExistingBounty({ wallet }: { wallet: Wallet }) {
  const cancelBounty = (bountyId: string) => {
    wallet.callMethod("", "cancel_bounty", { bounty_id: bountyId });
  };

  const addStorage = (bountyId: string) => {
    wallet.callMethod("", "add_storage_deposit", { bounty_id: bountyId });
  };

  const addReward = (bountyId: string) => {
    wallet.callMethod("", "add_node_reward_deposit", { bounty_id: bountyId });
  };

  return (
    <>
      <div style={{ marginTop: "16px" }}>
        {wallet.existingBounties.length === 0 && (
          <Typography variant="h6" component="h2">
            No Existing Bounties
          </Typography>
        )}
        {wallet.existingBounties.map((bounty) => (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>{bounty.name}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container rowSpacing={1} spacing={4}>
                <Grid item xs={6}>
                  <Typography>
                    <Box fontWeight="700" display="inline">
                      File Location:
                    </Box>{" "}
                    {bounty.fileLocation}
                  </Typography>
                  <Typography>
                    <Box fontWeight="700" display="inline">
                      Download Protocol:
                    </Box>{" "}
                    {bounty.fileDownloadProtocol}
                  </Typography>
                  <Typography>
                    <Box fontWeight="700" display="inline">
                      Threshold:
                    </Box>{" "}
                    {bounty.threshold}
                  </Typography>
                  <Typography>
                    <Box fontWeight="700" display="inline">
                      Total Nodes:
                    </Box>{" "}
                    {bounty.totalNodes}
                  </Typography>
                  <Typography>
                    <Box fontWeight="700" display="inline">
                      Network Required:
                    </Box>{" "}
                    {String(bounty.networkRequired)}
                  </Typography>
                  <Typography>
                    <Box fontWeight="700" display="inline">
                      GPU Required:
                    </Box>{" "}
                    {String(bounty.gpuRequired)}
                  </Typography>
                  <Typography>
                    <Box fontWeight="700" display="inline">
                      Storage Amount:
                    </Box>{" "}
                    {bounty.amtStorage} bytes
                  </Typography>
                  <Typography>
                    <Box fontWeight="700" display="inline">
                      Reward:
                    </Box>{" "}
                    {bounty.amtNodeReward} NEAR
                  </Typography>
                  <Typography>
                    <Box fontWeight="700" display="inline">
                      Status:
                    </Box>{" "}
                    {bounty.status}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  {bounty.status === "Pending" ? (
                    <>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => addReward(bounty.id)}
                        sx={{
                          display: "flex",
                          marginLeft: "auto",
                          marginRight: 0,
                          marginY: "10px",
                        }}
                      >
                        Add Reward
                      </Button>
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => addStorage(bounty.id)}
                        sx={{
                          display: "flex",
                          marginLeft: "auto",
                          marginRight: 0,
                          marginY: "10px",
                        }}
                      >
                        Add Storage
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => cancelBounty(bounty.id)}
                        sx={{
                          display: "flex",
                          marginLeft: "auto",
                          marginRight: 0,
                          marginY: "10px",
                        }}
                      >
                        Cancel Bounty
                      </Button>
                    </>
                  ) : (
                    <></>
                  )}
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}
      </div>
    </>
  );
}
