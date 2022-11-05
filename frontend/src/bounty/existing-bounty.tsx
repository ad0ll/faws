import React from "react";
import {Accordion, AccordionDetails, AccordionSummary, Box, Button, Grid, Typography,} from "@mui/material";
import {Wallet} from "../common/near-wallet";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {BountyStatuses} from "../../../execution-client/types";
export default function ExistingBounty({ wallet }: { wallet: Wallet }) {
  const cancelBounty = (bountyId: string) => {
    //TODO WARNING COMMENTED
    // wallet.callMethod("", "cancel_bounty", { bounty_id: bountyId });
  };

  const addStorage = (bountyId: string) => {
    //TODO WARNING COMMENTED
    // wallet.callMethod("", "add_storage_deposit", { bounty_id: bountyId });
  };

  const addReward = (bountyId: string) => {
    //TODO WARNING COMMENTED
    // wallet.callMethod("", "add_node_reward_deposit", { bounty_id: bountyId });
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
              <Typography>{bounty.id}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container rowSpacing={1} spacing={4}>
                <Grid item xs={6}>
                  <Typography>
                    <Box fontWeight="700" display="inline">
                      File Location:
                    </Box>{" "}
                    {bounty.file_location}
                  </Typography>
                  <Typography>
                    <Box fontWeight="700" display="inline">
                      Download Protocol:
                    </Box>{" "}
                    {bounty.file_download_protocol}
                  </Typography>
                  <Typography>
                    <Box fontWeight="700" display="inline">
                      Threshold:
                    </Box>{" "}
                    {bounty.min_nodes}
                  </Typography>
                  <Typography>
                    <Box fontWeight="700" display="inline">
                      Total Nodes:
                    </Box>{" "}
                    {bounty.total_nodes}
                  </Typography>
                  <Typography>
                    <Box fontWeight="700" display="inline">
                      Network Required:
                    </Box>{" "}
                    {String(bounty.network_required)}
                  </Typography>
                  <Typography>
                    <Box fontWeight="700" display="inline">
                      GPU Required:
                    </Box>{" "}
                    {String(bounty.gpu_required)}
                  </Typography>
                  <Typography>
                    <Box fontWeight="700" display="inline">
                      Storage Amount:
                    </Box>{" "}
                    {bounty.amt_storage.toString()} bytes
                  </Typography>
                  <Typography>
                    <Box fontWeight="700" display="inline">
                      Reward:
                    </Box>{" "}
                    {bounty.amt_node_reward.toString()} NEAR
                  </Typography>
                  {/*TODO toString shouldnt be required. May want to change this control to grid*/}

                  <Typography>
                    <Box fontWeight="700" display="inline">
                      Status:
                    </Box>{" "}
                    {bounty.status.toString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  {bounty.status === BountyStatuses.Pending ? (
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
