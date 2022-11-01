* # Global
* (Highest pri) Need to come up with a product name
* (Highest pri) Need to discuss if we want to advertise this product as a "mining" application
 
# Contracts
## Global
* (HIGHEST PRI) Crossword example has something that lets you use seed phrases to prevent front-running. I'd bet this same approach can be used to prevent nodes from reading other node data
* (High pri) Inclusion of rlib makes the contract bulky and expensive to deploy (currently ~2.5mb or 26~27 NEAR, or ~$100-150). I think this is needed for tests(?), but we could add a new build profile that excludes it.
* (Med pri) Bounty completed events, possibly including forwarding the results to a contract
* (Med-low pri) Convert repeating require! preflights to macros: https://doc.rust-lang.org/book/ch19-06-macros.html
* (Med-low pri) AnswerPosted events in case we want to respond to them (mostly thinking about the front end, to trigger an update)

## Coordinator
* (High pri) Create lookup sets of nodes supporting network and gpu loads to avoid assigning them work
* (Med pri) close_bounty and post_answer functions are quite large and complex. Individual functions should be moved to smaller jobs, and some of the logic should probably be moved back to Bounty (so we can use self instead of re-fetching the bounty)
* (Med pri) Coordinator often passes ids instead of objects to functions. This is because Bounty doesn't implement serialize. I was unsure of whether I should figure out how to borsh serialize the param, or if I should move some logic back to bounty and use `self`. Med pri because I'm not sure if this consumes more memory or if the performance impact is noteworthy.
* (Med pri) Analyze answers to cut outliers
* (Med pri) Allow nodes to reject bounties. This is separate from failing a bounty, it means that the node is refusing to work on it. Due to things like blocking network access or requiring gpus 
* (Med pri) Create a mechanism for the coordinator to mark a repeatedly failing node as offline
* (Med-low pri) Instead of accepting deposit w/ yoctoNEAR, let users pass NEAR and convert to yoctoNEAR
* (Med-low-pri) Find a gas efficient way to prioritize bounties with higher node rewards. Maybe using Vec or TreeMap.

## Node
* (Someday maybe) Add support to register installed software. Completely unnecessary since jobs are running in docker.

## Bounty
* (Highest pri) Ensure that answers are fully concealed until the bounty is complete. Most functions have blocks, but I want to look at this in the explorer.
* (Med pri) Bounty should be able to specify build args and runtime args for container. Currently present and expected on the back end, but needs to be added to the contract.
* (Med pri) Bounty owner shouldn't be elected for their own bounty (not that it matters if they are, it just looks bad). We can do this in an O(1) way by implementing Owner:[NodeList] map.
* (Med pri) No information about payouts visible on the bounty
* (Med-low pri) JSON serializer currently doesn't serialize  UnorderedMaps or *Sets
* (Med-low pri) Need to figure out some way to transmit secrets. Bounty creator should be able to encrypt secrets and share the key with the coordinator. Then elected nodes should be able to download the key.
* (Med-low pri) Figure out a way to reimburse nodes for gas used when publishing answers, med pri because gas is cheap and we can get the nodes more gains elsewhere
* (Med-low pri) Should get_bounty prevent someone who isn't elected from getting an incomplete bounty?
* (Low pri) Allow bounty creators to select specific nodes
* (Low pri) Reimburse node who closes a bounty for gas, since this is notably more expensive than posting an answer. May be able to make this slightly more equitable by delegating the close to the bounty with the earliest `last_closed` date (if we were to add that field)

## Events
* (Med pri) Need to add coordinator_id to events
* (Med pri) Need to add "AnswerPosted" event, may be critical if the frontend needs it to stay current
* (Med pri) Need to emit "BountyClosed" event
* (Low pri) Need to add owner_id to events

# Frontend
* (Highest pri) Be able to create bounties
* (Highest pri) Be able to register node (remember that this requires a 1N deposit)
* (Highest pri) Must be able to view a list of your bounties
* (Highest pri) Must be able to see solution to completed bounties (either as a nested table or as a summary)
* (High pri) Be able to update a node through the UI (contract function exists)
* (Med pri) Be able to select from one of multiple accounts (when signed in using near-wallet, provide a dropdown in navbar to set value AccountContext)
* (Low pri) Use JSON RPC in the front end to get a heartbeat from a node


# Client
## Disorganized
* (Highest pri) Client must be able to set timeout to prevent malicious actor from blocking their node
* (Second highest pri) Support for GPU workloads
* (Third highest pri) Ansible playbook to install the client and all its dependencies (note: MUST include service setup so we can get a restart-always in there)
* (Med-High pri) Client should be able to download from IPFS
* (Med pri) Allow client to upload results to IPFS and then submit a hash of their answer as the result
* (Med pri) Allow client to zip or tar results prior to uploading to IPFS
* (Low pri) Allow tor as a download protocol
* (Low pri) Client should be able to download from S3
* (Low pri) Client should have a pruning routine to run docker system prune and to clean the file system
* (Low pri) Client should prune images that are older than some specified days
* (Very low pri) Client should build images w/ `DOCKER_BUILDKIT=1 docker build .`
* (Very low pri) is there a reason to immortalize results by posting them to an unmanaged contract?

# Presentation

# Events API

# Other
* Look into batching transactions in https://github.com/near/workspaces-rs/blob/main/workspaces/tests/batch_tx.rs
* Include bytes macro is this in rust, recommended way to deploy contracts `        .dev_deploy(include_bytes!("../../examples/res/status_message.wasm"))```
