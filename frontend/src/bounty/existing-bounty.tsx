import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
} from "@mui/material";
import { Wallet } from "../common/near-wallet";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export default function ExistingBounty({ wallet }: { wallet: Wallet }) {
  return (
    <>
      <div style={{ marginTop: "16px" }}>
        {wallet.existingBounties.map((bounty) => (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>{bounty.name}</Typography>
            </AccordionSummary>
            <AccordionDetails>
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
            </AccordionDetails>
          </Accordion>
        ))}
      </div>
    </>
  );
}
