import {
    Button,
    Checkbox,
    FormControl,
    FormControlLabel,
    FormGroup,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    TextField,
} from "@mui/material";
import React from "react";
import {Wallet} from "../common/near-wallet";
import {Bounty, SupportedFileDownloadProtocols} from "../../../execution-client/types"
import {COORDINATOR_ID} from "../coordinator/Coordinator";

export default function CreateBounty({
                                         wallet,
                                         handleClose,
                                     }: {
    wallet: Wallet;
    handleClose: () => void;
}) {
    const [state, setState] = React.useState<Bounty>({
        amt_node_reward: 0n,
        amt_storage: 0n,
        answers: {},
        bounty_created: 0,
        build_args: [],
        cancelled: false,
        complete: false,
        coordinator_id: "",
        elected_nodes: [],
        file_download_protocol: undefined,
        file_location: "",
        gpu_required: false,
        id: "",
        min_nodes: 0,
        network_required: false,
        owner_id: "",
        runtime_args: [],
        status: undefined,
        success: false,
        total_nodes: 0
    });

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value =
            event.target.type === "checkbox"
                ? event.target.checked
                : event.target.value;
        setState({
            ...state,
            [event.target.name]: value,
        });
    };

    const handleSubmit = () => {
        //TODO WARNING COMMENTED
        // createBounty(wallet, state);
        handleClose();
    };

    return (
        <>
            <Grid container rowSpacing={1} spacing={4}>
                <Grid item xs={6}>
                    <FormGroup>
                        <FormControl margin="normal">
                            <TextField
                                fullWidth
                                id="outlined-basic"
                                label="Name"
                                variant="outlined"
                                size="small"
                                name="name"
                                onChange={handleChange}
                            />
                        </FormControl>
                        <FormControl margin="normal">
                            <TextField
                                fullWidth
                                id="outlined-basic"
                                label="File Location"
                                variant="outlined"
                                size="small"
                                name="fileLocation"
                                onChange={handleChange}
                            />
                        </FormControl>
                        <FormControl size="small" margin="normal">
                            <InputLabel id="file-download-protocol-select-label">
                                File Download Protocol
                            </InputLabel>
                            <Select
                                labelId="file-download-protocol-select-label"
                                id="file-download-protocol-select"
                                label="File Download Protocol"
                                onChange={handleChange}
                                size="small"
                                name="fileDownloadProtocol"
                            >
                                {Object.values(SupportedFileDownloadProtocols).map((protocol) => (
                                    <MenuItem value={protocol}>{protocol}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl margin="normal">
                            <TextField
                                fullWidth
                                id="outlined-basic"
                                label="Threshold"
                                variant="outlined"
                                size="small"
                                name="threshold"
                                onChange={handleChange}
                            />
                        </FormControl>
                        <FormControl margin="normal">
                            <TextField
                                fullWidth
                                id="outlined-basic"
                                label="Total Nodes"
                                variant="outlined"
                                size="small"
                                name="totalNodes"
                                onChange={handleChange}
                            />
                        </FormControl>
                    </FormGroup>
                </Grid>
                <Grid item xs={6}>
                    <FormGroup>
                        <FormControl margin="normal">
                            <TextField
                                fullWidth
                                id="outlined-basic"
                                label="Storage Amount"
                                variant="outlined"
                                size="small"
                                placeholder="Storage in KB"
                                name="amtStorage"
                                onChange={handleChange}
                            />
                        </FormControl>
                        <FormControl margin="normal">
                            <TextField
                                fullWidth
                                id="outlined-basic"
                                label="Reward Amount"
                                variant="outlined"
                                size="small"
                                placeholder="Reward in NEAR"
                                name="amtNodeReward"
                                onChange={handleChange}
                            />
                        </FormControl>
                        <FormControl margin="normal">
                            <TextField
                                fullWidth
                                id="outlined-basic"
                                label="Bounty Timeout"
                                variant="outlined"
                                size="small"
                                name="timeout"
                                onChange={handleChange}
                            />
                        </FormControl>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    name="networkRequired"
                                    onChange={handleChange}
                                    checked={state.network_required}
                                />
                            }
                            label="Network Required"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    name="gpuRequired"
                                    onChange={handleChange}
                                    checked={state.gpu_required}
                                />
                            }
                            label="GPU Required"
                        />
                    </FormGroup>
                </Grid>
            </Grid>
            <FormGroup>
                <FormControl margin="normal">
                    <Button variant="contained" onClick={handleSubmit}>
                        Create
                    </Button>
                </FormControl>
            </FormGroup>
        </>
    );
}

//TODO wallet.createBounty will drop the need for the wallet param
async function createBounty(wallet: Wallet, bounty: Bounty) {

    return await wallet.callMethod({
        contractId: COORDINATOR_ID,
        method: "create_bounty",
        args: bounty
    });

}
