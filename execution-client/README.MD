# Execution client

## Risks
#### **Please read this section first**
This execution client is built to allow people you don't know to run code on your computer. 
While we've done some DD to attempt to prevent some of the most aggregious
For this reason, although it is not required, we **HIGHLY** recommend taking the following steps to protect yourself from malicious actors:
* Installing an always on VPN on your node or using tor for all network interactions. This should be considered required.
* Isolating all of your nodes on a separate VLAN
* Forcing DNS requests to always go through your router. 
* Using PiHole or PFBlockerNG or similar for blacklists (TODO what's the replacement for blacklists?)
* Having firewall rules that...
* Paying close attention to Snyk alerts when building the image
* Setting sensible thresholds for CPU to prevent . These are enabled by default at 85% for all of disk, cpu, and memory.
* TODO Setting a kill threshold to destroy the most extensive bounties when memory has reached XYZ. This is on by default XYZ

This is the long-running process that clients will

The short step-by-step is this:

The longer, but more accurate step-by-step is this 

1. Client receives websocket event stating that a bounty has been created
2. Client checks if they are one of the elected nodes
3. If the client is not one of the elected nodes, then their work is done. 
4. If the client **is one of the elected nodes**, client will go through some preflight checks:
   1. client checks if the bounty requires network access.
      1. If the bounty does require network access and the node permits it, this check **passes**
      2. If the bounty does not require network access, then this check **passes**. Later when we execute, --net will not be passed to `unshare`
   2. Client checks if the bounty requires GPU access
      1. ...
      2. ...
5. Client creates a mount sandbox to build the image. Some system level docker directories are available
      6. The ansible script sets up iptables to permit access to dockerhub, github, bitbucket, gitlab cloud, ipfs,...
      7. 

4. client acks they've received it by changing their node status to pending. This is done by setting coordinator_contract.bounties[BOUNTY_ID].elected_nodes[NODE_ID].status to PENDING
4. Client s