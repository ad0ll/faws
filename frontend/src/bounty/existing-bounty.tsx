import React, { useContext } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Grid,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { BountyStatuses } from "../../../execution-client/types";
import { localStorageState, WalletContext } from "../App";
import { useRecoilValue } from "recoil";
import { BountyStorage } from "../storage";

export default function ExistingBounty() {
  const wallet = useContext(WalletContext);
  const storage = useRecoilValue(localStorageState);
  const bounties = (storage.get("bounties") as BountyStorage) || {};

  const cancelBounty = async (bountyId: string) => {
    await wallet.cancelBounty(bountyId);
  };

  const addStorage = async (bountyId: string) => {
    await wallet.addStorage(bountyId);
  };

  const addReward = async (bountyId: string) => {
    await wallet.addReward(bountyId);
  };

  return (
    <>
      <div style={{ marginTop: "24px" }}>
        {Object.values(bounties).length === 0 && (
          <Typography variant="h6" component="h2">
            No Existing Bounties
          </Typography>
        )}
        {Object.values(bounties)
          .filter((bounty) => bounty.owner_id === wallet.accountId)
          .map((bounty) => (
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
                      {bounty.amt_storage} YoctoNEAR
                    </Typography>
                    <Typography>
                      <Box fontWeight="700" display="inline">
                        Reward:
                      </Box>{" "}
                      {bounty.amt_node_reward} YoctoNEAR
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
                    {bounty.status.toLowerCase() ===
                    BountyStatuses.Pending.toLowerCase() ? (
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
