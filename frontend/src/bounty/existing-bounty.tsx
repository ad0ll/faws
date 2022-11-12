import React, {useContext, useEffect} from "react";
import {Accordion, AccordionDetails, AccordionSummary, Box, Button, Grid, Typography,} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {BountyStatuses} from "../../../execution-client/types";
import {WalletContext} from "../app";
import {atom, selector, useRecoilState} from "recoil";
import {UpdateBountyModal} from "./update-bounty-modal";
import {wallet} from "../index";

const chainBountiesState = selector({
  key: "chainBounties",
  get: async ({get}) => {
    return await wallet.getBountiesOwnedBySelf();
  }
})
const bountiesState = atom({
  key: "bountiesStates",
  default: chainBountiesState
})


export default function ExistingBounty() {
  const wallet = useContext(WalletContext);
  const [open, setOpen] = React.useState(false);
  const [field, setField] = React.useState("");
  const [bountyId, setBountyId] = React.useState("");
  const [bounties, setBounties] = useRecoilState(bountiesState);

  //Refetch bounties every 2s
  useEffect(
      () => {
        const getBounties = async () => {
          const selfBounties = await wallet.getBountiesOwnedBySelf();
          console.log("Bounties: ", selfBounties);
            setBounties(selfBounties);
        }
        const interval = setInterval(() => {
          getBounties();
        }, 2000);
        return () => clearInterval(interval);
      }, [bounties]
  )
  const handleOpen = (button: string, bountyId: string) => {
    setBountyId(bountyId);
    setField(button);
    setOpen(true);
  };
  const handleClose = () => setOpen(false);



  const cancelBounty = async (bountyId: string) => {
    await wallet.cancelBounty(bountyId);
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

                    <Typography>
                      <Box fontWeight="700" display="inline">
                        Successes:
                      </Box>{" "}
                      {bounty.successful_nodes?.length}
                    </Typography>
                    <Typography>
                    <Box fontWeight="700" display="inline">
                      Failures:
                    </Box>{" "}
                    {bounty.failed_nodes?.length}
                    </Typography>

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
                          onClick={() => {
                            handleOpen("Reward", bounty.id);
                          }}
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
                          onClick={() => {
                            handleOpen("Storage", bounty.id);
                          }}
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
                        <UpdateBountyModal
                          bountyId={bountyId}
                          field={field}
                          open={open}
                          handleClose={handleClose}
                        />
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
