# Contract(s)
## Global
* (Med pri) Inclusion of rlib makes the contract bulky and expensive to deploy (currently ~2.5mb or 26~27 NEAR)
* (Med-low pri) Convert repeating require! preflights to macros: https://doc.rust-lang.org/book/ch19-06-macros.html
## Coordinator
* (High pri) Create lookup sets of nodes supporting network and gpu loads to avoid assigning them work
* (Med pri) Analyze answers to cut outliers
* (Med-pri) Find a gas efficient way to incentivise higher node rewards. Maybe using Vec or TreeMap.
## Node
* (Low-pri) Add support to register installed software
* (Med-pri) Add support to indicate that a node supports GPU workloads
* (Med-pri) Implement allow_network setting that can be changed **only by the node owner** (i.e. coordinator can't change it)
## Bounty
* (Highest pri) Figure out how to conceal answers from anyone except the coordinator, while still allowing nodes to publish answers. Maybe do this with a secret phrase that only the node and the cooridnator can access?
* (High pri) Create bounty needs to return a bounty
* (Med pri) Bounty owner shouldn't be elected for their own bounty (not that it matters if they are, it just looks bad)
* (Med pri) If we end up putting all of the logic in the coordinator, we should probably move the bounty logic to the coordinator
* (Med pri) Reimburse node who closes a bounty for gas, since this is notably more expensive than posting an answer
* (Med-low pri) Figure out a way to reimburse nodes for gas used when publishing answers, med pri because gas is cheap and we can get the nodes more gains elsewhere
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
## Disorganized
* (High pri) Client must be able to set timeout to prevent malicious actor from blocking their node
* (Med pri) Client should preflight node to make sure it has all the software it needs installed (docker, git, curl, etc)
* (Low pri) Client should have a pruning routine to run docker system prune
* (Low pri) Client should prune images that are older than some specified days
* (Very low pri) Client should build images w/ `DOCKER_BUILDKIT=1 docker build .`

# Presentation

# Events API

# Other
Look into batching transactions in https://github.com/near/workspaces-rs/blob/main/workspaces/tests/batch_tx.rs
Include bytes macro is this in rust, recommended way to deploy contracts `        .dev_deploy(include_bytes!("../../examples/res/status_message.wasm"))```
