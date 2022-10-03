## Bounties

Bounties are objects that specify work to be executed on nodes. 

File location: Either a git repo, http link, or ipfs link. The first part of the url will be used to determine the protocol.

### How to prepare packages for nodes:

A Dockerfile must always be present at the root of the repo.
* `Dockerfile`: Note that run.sh will always take precedence over a Dockerfile when both are present