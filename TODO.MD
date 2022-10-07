
# Contract(s)
## Global
* (very-low-pri) `rand` crate is quite large (86 KB), potentially making contract deployment about  1N more expensive.
## Coordinator
* Find a gas efficient way to incentivise higher node rewards. Maybe using Vec or TreeMap.
* Make random node selection more random
* (Low pri) Tentatively swap node_queue's vec impl for a linked list for O(1) dequeues.
## Node
* (Low-pri) Add support to register installed software
* Add support to indicate that a node supports GPU workloads
* Implement allow_network setting that can be changed **only by the node owner** (i.e. coordinator can't change it)
## Bounty
* Figure out a way to reimburse nodes for gas used when publishing answers
* Figure out how to conceal answers from anyone except the coordinator, while still allowing nodes to publish answers. Maybe do this with a secret phrase that only the node and the cooridnator can access?
* (Low pri) Allow bounty creators to select specific nodes

# Frontend
* Be able to view a table of all bounties
* Be able to view a table of all nodes
* (Low pri) Use JSON RPC in the front end to get a heartbeat from a node

# Client/Indexer
## TBD
## Disorganized
* Client should build images w/ `DOCKER_BUILDKIT=1 docker build .`
* Client must be able to set timeout to prevent malicious actor from blocking their node
* 

# Other
Look into batching transactions in https://github.com/near/workspaces-rs/blob/main/workspaces/tests/batch_tx.rs
Include bytes macro is this in rust `        .dev_deploy(include_bytes!("../../examples/res/status_message.wasm"))```