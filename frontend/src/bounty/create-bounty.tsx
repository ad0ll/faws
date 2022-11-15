import {
    Alert,
    Button,
    Checkbox,
    FormControl,
    FormControlLabel,
    FormGroup,
    Grid,
    InputLabel, List, ListItem,
    MenuItem,
    Select,
    TextField, Tooltip, Typography,
} from "@mui/material";
import React, {useContext, useTransition} from "react";
import {
    Bounty,
    BountyStatuses,
    SupportedFileDownloadProtocols,
} from "../../../execution-client/types";
import {localStorageState, WalletContext} from "../app";
import {selector, useRecoilValue} from "recoil";
import {wallet} from "../index";
import HelpIcon from '@mui/icons-material/Help';


export const HelpText: React.FC<{ text: string }> = ({text}) => {
    return <Tooltip title={text}>
        <HelpIcon/>
    </Tooltip>
}
type BountyValidationError = Record<keyof Bounty, string>
export default function CreateBounty({
                                         handleClose,
                                         nodeCount
                                     }: {
    handleClose: () => void;
    nodeCount: number;
}) {
    console.log("Node count: (create bounty)", nodeCount);
    const wallet = useContext(WalletContext);
    const [inTransition, startTransition] = useTransition();
    const [error, setError] = React.useState<BountyValidationError>({} as BountyValidationError);
    const [state, setState] = React.useState<Bounty>({
        amt_node_reward: "",
        amt_storage: "",
        answers: {},
        bounty_created: 0,
        build_args: [],
        cancelled: false,
        complete: false,
        coordinator_id: "",
        elected_nodes: [],
        file_download_protocol: "" as SupportedFileDownloadProtocols,
        file_location: "",
        gpu_required: false,
        id: "",
        min_nodes: 0,
        network_required: true,
        owner_id: "",
        runtime_args: [],
        status: "" as BountyStatuses,
        total_nodes: 0,
        timeout_seconds: 60,
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

    const validateBounty = (bounty: Bounty): BountyValidationError => {

        const stagedError = {} as BountyValidationError;
        if (!bounty.file_location) {
            stagedError.file_location = "File location is required";
        }
        if (!bounty.file_download_protocol) {
            stagedError.file_download_protocol = "File download protocol is required";
        }
        if (!bounty.min_nodes) {
            stagedError.min_nodes = "Minimum number of nodes is required";
        }
        if (!bounty.total_nodes) {
            stagedError.total_nodes = "Total number of nodes is required";
        }
        if (!bounty.amt_storage) {
            stagedError.amt_storage = "Storage amount is required";
        }
        if (!bounty.amt_node_reward) {
stagedError.amt_node_reward = "Node reward amount is required";
        }
        if (bounty.min_nodes === 0) {
            stagedError.min_nodes = "Minimum number of nodes must be greater than 0";
        }
        if (bounty.total_nodes === 0) {
            stagedError.total_nodes = "Total number of nodes must be greater than 0";
        }
        if (bounty.min_nodes > bounty.total_nodes) {
stagedError.min_nodes = "Min number of nodes must be less than or equal to the total number of nodes";
stagedError.total_nodes = "Total number of nodes must be greater than or equal to minimum number of nodes";
        }
        if (bounty.total_nodes > nodeCount) {
            stagedError.total_nodes = `Total number of nodes must be less than or equal to the number of nodes available (${nodeCount})`;
        }
        return stagedError;
    };

    const handleSubmit = async () => {
        try {
            const tempError = validateBounty(state);
            setError(tempError);
            if (Object.keys(tempError).length === 0) {
                await wallet.createBounty(state);
                handleClose();
            }
        } catch (e: any) {
        }
    };

    return (
        <>
            {Object.keys(error).length > 0 && (
                <Alert severity="error" variant="outlined" sx={{marginTop: "16px"}}>
                    <List>

                    {Object.values(error).map((e) => <ListItem>{e}</ListItem>)}
                    </List>
                </Alert>
            )}
            {inTransition ? <div>[Loading new results...]</div> : null}
            <Grid container rowSpacing={1} spacing={4}>
                <Grid item xs={6}>
                    <FormGroup>
                        <FormControl margin="normal">
                            <TextField
                                required
                                fullWidth
                                id="file-location"
                                label="Package URL"
                                variant="outlined"
                                size="small"
                                placeholder={"https://github.com/ad0ll/docker-hello-world.git"}
                                name="file_location"
                                onChange={handleChange}
                                helperText={error.file_location}
                                error={error.file_location !== undefined}
                            />
                        </FormControl>
                        <FormControl size="small" margin="normal">
                            <InputLabel
                                required
                                id="file-download-protocol-select-label"
                                error={error.file_download_protocol !== undefined}
                            >
                                File Download Protocol
                            </InputLabel>
                            <Select
                                required
                                labelId="file-download-protocol-select-label"
                                id="file-download-protocol"
                                label="File Download Protocol"
                                onChange={handleChange}
                                size="small"
                                name="file_download_protocol"
                                value={state.file_download_protocol}
                                error={error.file_download_protocol !== undefined}
                            >
                                {Object.values(SupportedFileDownloadProtocols).map(
                                    (protocol) => (
                                        <MenuItem key={protocol} value={protocol}>
                                            {protocol}
                                        </MenuItem>
                                    )
                                )}
                            </Select>
                        </FormControl>
                        <FormControl margin="normal">
                            <TextField
                                required
                                fullWidth
                                id="threshold"
                                label="Min Nodes"
                                variant="outlined"
                                size="small"
                                name="min_nodes"
                                InputProps={{
                                    endAdornment: (<HelpText
                                        text={"The minimum number of nodes required to complete the bounty."}/>)
                                }}
                                onChange={handleChange}
                                helperText={error.min_nodes}
                                error={error.min_nodes !== undefined}
                            />
                        </FormControl>
                        <FormControl margin="normal">
                            <TextField
                                required
                                fullWidth
                                id="total-nodes"
                                label="Total Nodes"
                                variant="outlined"
                                size="small"
                                name="total_nodes"
                                onChange={handleChange}
                                InputProps={{
                                    endAdornment: (<HelpText
                                        text={"The total number of nodes to have attempt the bounty. Should be higher than Min Nodes so the bounty has a buffer for failure."}/>)
                                }}
                                helperText={error.total_nodes}
                                error={error.total_nodes !== undefined}
                            />
                        </FormControl>
                    </FormGroup>
                </Grid>
                <Grid item xs={6}>
                    <FormGroup>
                        <FormControl margin="normal">
                            <TextField
                                required
                                fullWidth
                                id="storage"
                                label="Storage (NEAR)"
                                variant="outlined"
                                size="small"
                                placeholder="Storage in NEAR"
                                name="amt_storage"
                                onChange={handleChange}
                                error={error.amt_storage !== undefined}
                                helperText={error.amt_storage}
                                InputProps={{
                                    endAdornment: <>{state.amt_storage ? `~${parseFloat(state.amt_storage) * 100}KB` : "~0KB"}</>
                                }}
                            />
                        </FormControl>
                        <FormControl margin="normal">
                            <TextField
                                required
                                fullWidth
                                id="reward"
                                label="Reward (NEAR)"
                                variant="outlined"
                                size="small"
                                placeholder="Reward in NEAR"
                                name="amt_node_reward"
                                onChange={handleChange}
                                helperText={error.amt_node_reward}
                                error={error.amt_node_reward !== undefined}
                            />
                        </FormControl>
                        <FormControl margin="normal">
                            <TextField
                                fullWidth
                                id="timeout-seconds"
                                label="Bounty Timeout"
                                placeholder={"60"}
                                defaultValue={"60"}
                                variant="outlined"
                                size="small"
                                name="timeout_seconds"
                                onChange={handleChange}
                                value={state.timeout_seconds}
                            />
                        </FormControl>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    name="network_required"
                                    onChange={handleChange}
                                    checked={state.network_required}
                                />
                            }
                            label="Network Required "
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    name="gpu_required"
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
