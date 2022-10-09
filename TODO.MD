
# Contract(s)
## Global
## Coordinator
* (Med pri) Analyze answers to cut outliers
* (Med-pri) Find a gas efficient way to incentivise higher node rewards. Maybe using Vec or TreeMap.
## Node
* (Low-pri) Add support to register installed software
* (Med-pri) Add support to indicate that a node supports GPU workloads
* (Med-pri) Implement allow_network setting that can be changed **only by the node owner** (i.e. coordinator can't change it)
## Bounty
* (High pri) Figure out a way to reimburse nodes for gas used when publishing answers
* (High pri) Create bounty needs to return a bounty
* (Highest pri) Figure out how to conceal answers from anyone except the coordinator, while still allowing nodes to publish answers. Maybe do this with a secret phrase that only the node and the cooridnator can access?
* (Low pri) Allow bounty creators to select specific nodes
## Events
* (High pri) Need to add owner_id to events 
* (Med/High pri) Need to add answer posted event, may be critical if the frontend needs it to stay current

# Frontend
* (High pri) Be able to create bounties
* Be able to view a table of all bounties
* Be able to view a table of all nodes
* (Low pri) Use JSON RPC in the front end to get a heartbeat from a node


# Client
## TBD
## Disorganized
* Client should build images w/ `DOCKER_BUILDKIT=1 docker build .`
* Client must be able to set timeout to prevent malicious actor from blocking their node

# Presentation


# Events API
* (Low pri) wsSubs is hardcoded. Low pri because this may not be required on mainnet

# Other
Look into batching transactions in https://github.com/near/workspaces-rs/blob/main/workspaces/tests/batch_tx.rs
Include bytes macro is this in rust `        .dev_deploy(include_bytes!("../../examples/res/status_message.wasm"))```