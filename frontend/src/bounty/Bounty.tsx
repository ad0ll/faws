import { Wallet } from "../common/near-wallet";
import { Box, Button, Modal, Typography } from "@mui/material";
import CreateBounty from "./create-bounty";
import React from "react";
import ExistingBounty from "./existing-bounty";
import { Add } from "@mui/icons-material";

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 800,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

export default function Bounty({ wallet }: { wallet: Wallet }) {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      <Button variant="contained" onClick={handleOpen} startIcon={<Add />}>
        Create Bounty
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="create-bounty-modal-title"
        aria-describedby="create-bounty-modal-description"
      >
        <Box sx={style}>
          <Typography
            id="create-bounty-modal-title"
            variant="h5"
            component="h2"
          >
            Create Bounty
          </Typography>
          <CreateBounty wallet={wallet} handleClose={handleClose} />
        </Box>
      </Modal>
      <ExistingBounty wallet={wallet} />
    </>
  );
}
