import React, { useContext, useEffect } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Grid,
  LinearProgress,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Bounty, BountyStatuses } from "../../../execution-client/types";
import { WalletContext } from "../app";
import { atom, selector, selectorFamily, useRecoilState } from "recoil";
import { UpdateBountyModal } from "./update-bounty-modal";
import { wallet } from "../index";
import { ErrorBoundary } from "react-error-boundary";
import IosShareIcon from "@mui/icons-material/IosShare";

const yoctoNear = 1000000000000000000000000;

const chainBountiesState = selector({
  key: "chainBounties",
  get: async ({ get }) => {
    let bounties = [];
    try {
      bounties = await wallet.getBountiesOwnedBySelf();
    } catch (e) {}
    return bounties;
  },
});

const bountyAnswerCountsState = selectorFamily({
  key: "bountyAnswerCounts",
  get:
    (bountyID: string) =>
    async ({ get }) => {
      return await wallet.getBountyAnswerCounts(bountyID);
    },
});
const allBountyAnswersCountState = selector({
  key: "allBountyAnswersCountState",
  get: async ({ get }) => {
    const bounties = get(chainBountiesState);
    return bounties.reduce((acc: { [key: string]: any }, bounty) => {
      acc[bounty.id] = get(bountyAnswerCountsState(bounty.id));
      return acc;
    }, {});
  },
});

export const bountiesState = atom({
  key: "bountiesStates",
  default: chainBountiesState,
});

const bountyAnswersState = atom({
  key: "bountyAnswersState",
  default: allBountyAnswersCountState,
});

export default function ExistingBounty() {
  const wallet = useContext(WalletContext);
  const [open, setOpen] = React.useState(false);
  const [field, setField] = React.useState("");
  const [bountyId, setBountyId] = React.useState("");
  const [bounties, setBounties] = useRecoilState(bountiesState);
  const [bountyAnswers, setBountyAnswers] = useRecoilState(bountyAnswersState);
  //Refetch bounties and answer counts every 2s
  useEffect(() => {
    const getBounties = async () => {
      const selfBounties = await wallet.getBountiesOwnedBySelf();
      console.log("Bounties: ", selfBounties);
      let answers = { ...bountyAnswers };
      for await (const bounty of selfBounties) {
        const answerCounts = await wallet.getBountyAnswerCounts(bounty.id);
        answers[bounty.id] = answerCounts;
      }
      setBounties(selfBounties);
      setBountyAnswers(answers);
    };
    const interval = setInterval(() => {
      getBounties();
    }, 2000);
    return () => clearInterval(interval);
  }, [bounties]);
  const handleOpen = (button: string, bountyId: string) => {
    setBountyId(bountyId);
    setField(button);
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const cancelBounty = async (bountyId: string) => {
    await wallet.cancelBounty(bountyId);
  };

  const exportBounty = (bounty: Bounty) => {
    const element = document.createElement("a");
    const bountyConfig = {
      file_location: bounty.file_location,
      file_download_protocol: bounty.file_download_protocol,
      min_nodes: bounty.min_nodes,
      total_nodes: bounty.total_nodes,
      amt_storage: Number(bounty.amt_storage) / yoctoNear,
      amt_node_reward: Number(bounty.amt_node_reward) / yoctoNear,
      timeout_seconds: bounty.timeout_seconds,
      network_required: bounty.network_required,
      gpu_required: bounty.gpu_required,
    };
    const file = new Blob([JSON.stringify(bountyConfig)], {
      type: "applciation/json",
    });
    element.href = URL.createObjectURL(file);
    element.download = `${bounty.id}.json`;
    document.body.appendChild(element);
    element.click();
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
            <>
              <LinearProgress
                /* Show as green if in progress and not all nodes have completed
                   Show as red if all nodes complete but have not met threshold
                   Show as red is cancelled or failed
                */
                color={
                  ((bounty.successful_nodes?.length || 0) +
                    (bounty.failed_nodes?.length || 0) ===
                    bounty.total_nodes &&
                    (bounty.successful_nodes?.length || 0) <
                      bounty.min_nodes) ||
                  bounty.status.toLowerCase() ===
                    BountyStatuses.Failed.toLowerCase() ||
                  bounty.status.toLowerCase() ===
                    BountyStatuses.Cancelled.toLowerCase()
                    ? "error"
                    : "success"
                }
                variant="determinate"
                value={
                  ((bounty.successful_nodes?.length || 0) / bounty.min_nodes) *
                  100
                }
              />
              <Accordion key={bounty.id}>
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
                        {bounty.amt_storage / yoctoNear} NEAR
                      </Typography>
                      <Typography>
                        <Box fontWeight="700" display="inline">
                          Reward:
                        </Box>{" "}
                        {bounty.amt_node_reward / yoctoNear} NEAR
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
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                          exportBounty(bounty);
                        }}
                        sx={{
                          display: "flex",
                          marginLeft: "auto",
                          marginRight: 0,
                          marginY: "10px",
                        }}
                        startIcon={<IosShareIcon />}
                      >
                        Export
                      </Button>
                      {bounty.status.toLowerCase() ===
                      BountyStatuses.Pending.toLowerCase() ? (
                        <>
                          <Button
                            variant="contained"
                            color="secondary"
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
            </>
          ))}
      </div>
      <ErrorBoundary
        fallbackRender={({ error, resetErrorBoundary }) => (
          <div role="alert">
            <p>Something went wrong:</p>
            <pre>{error.message}</pre>
            <button onClick={resetErrorBoundary}>Try again</button>
          </div>
        )}
      />
    </>
  );
}
