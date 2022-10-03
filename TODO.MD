
# Contract
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

# Frontend

# Client/Indexer
## TBD
## Disorganized
* Client should build images w/ `DOCKER_BUILDKIT=1 docker build .`
* 