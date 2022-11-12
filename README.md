#

There are two sets of documentation for different users. 
Miners: 
Bounty creators:


## Installation:


## Contracts

There is one contract, the coordinator contract, which is used to create and manage both nodes and bounties.

### Inactivity



## Mining client

### Installation



The default installation connects to testnet, and makes a moderate effort to keep harddrive usage low by deleting bounty files after execution has completed. For more configuration options, see the configuration section below.

Please note that this installation script has only been tested on Debian/Debian based systems on x86_64, amd64, and ARM CPUs.

### Configuration

Configuration is done through a .env file that's placed at the root of the execution_client subdirectory. The contents of this file are determined by the jinja template at [./playbook/files/default.env.j2]()


The following variables are available:

[//]: # (TODO Defaults below are wrong, need to update)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `COORDINATOR_URL` | Yes | Hardcoded in [./playbook/install.sh] | The URL of the coordinator contract |
| `WEBSOCKET_URL` | Yes | ws://127.0.0.1:8000/ws | This is the URL to event-api |
| `ACCOUNT_ID` | Yes | "garbage8.testnet" | |
| `BOUNTY_STORAGE_DIR` | Yes | "$HOME/bounty_data/$BOUNTY_ID"0 | |
| `NODE_ID` | Yes | "node2.node.$ACCOUNT_ID" | |
| `COORDINATOR_CONTRACT_ID` | Yes | "dev-1667851730608-70663242970224" | |
| `DOCKER_CONTAINER_NAME_FORMAT` | Yes | "bounty-$BOUNTY_ID" | |
| `DOCKER_IMAGE_NAME_FORMAT` | Yes | "$BOUNTY_ID" | |
| `NEAR_NETWORK_ID` | Yes | "testnet" | |
| `NEAR_NODE_URL` | Yes | "http://dresser.mechadol:3030" # This is the URL to example-indexer | |
| `NEAR_WALLET_URL` | Yes | "http://0.0.0.0/wallet" | |
| `NEAR_HELPER_URL` | Yes | "http://0.0.0.0/helper" | |
| `STORAGE_DOCKER_PRUNE_SYSTEM_EACH_RUN` | No | "false" | |
| `STORAGE_DOCKER_PRUNE_IMAGES_EACH_RUN` | No | "false" | |
| `STORAGE_DOCKER_REMOVE_EXECUTION_CONTAINER_EACH_RUN` | No | "true" | |
| `STORAGE_DOCKER_REMOVE_EXECUTION_IMAGE_EACH_RUN` | No | "true" | |

#### Dev settings
The following variables are intended for development purposes only, and should not be used in production:

| Variable | Required | Default | Description |
| -------- | -------- | ------- | ----------- |
| `EMIT_BOUNTY` | No |   | If true, will create a bounty every INTERVAL milliseconds    |
| `EMIT_BOUNTY__PUBLISH_CREATE_EVENT` | No |  | If true, sends a bounty_created event payload to the websocket relay |
| `EMIT_BOUNTY__PUBLISH_COMPLETE_EVENT` | No |  | If true, sends a bounty_complete event payload to the websocket relay |
| `EMIT_BOUNTY__WS_RELAY_URL` | No |  | URL of a websocket that echoes published events (used in absence of a local indexer) |
| `EMIT_BOUNTY__MIN_NODES` | No | 1 | Sets the bounty.min_nodes property on emitted bounties |
| `EMIT_BOUNTY__MAX_NODES` | No | 3 | Sets the bounty.max_nodes property on emitted bounties |

Within the .env file, a handful of placeholders are supported, which are replaced with their corresponding values at runtime. You will often see these placeholders in the default configuration, where they're used to avoid collisions at runtime. Currently $HOME, $BOUNTY_ID, $ACCOUNT_ID, and $NODE_ID are supported.


#### Automatic install w/ ansible (recommended)

TODO
**TL;DR**: To install all software necessary to run the mining client, run install.sh on a Debian based Linux distribution (Debian, Mint, Ubuntu, Raspberry Pi OS, others). Once finished, you'll be able to ... localhost(3000) etc. 

Currently, the mining client can only be run on linux hosts because we use basic sandboxing to provide limited protection for miners.

./install.sh does the following:
Installs pip and ansible if not installed. The following steps are all done in ansible playbookt;
(TODO) Creates a new user `miner` and installs rootless docker under that user 
Installs NVM and NodeJS 18
Installs the mining client and exposes the UI on http://0.0.0.0:3000
Opts into automatic security updates

#### Manual installation
Skilled users can install the mining client manually. We do not recommend this approach, since a non-compliant installation could result in failed bounties (and thus wasted gas). That said, if you're willing to accept the risk, manual installations may open up access to non-Debian linux distributions.



1. As a prerequisite, your OS must support namespaces and cgroups. You can check this by running `cat /proc/self/cgroup` and `cat /proc/self/mountinfo`. If you see a line that starts with `cgroup`, you're good to go. If you see a line that starts with `ns`, you're good to go. If you see neither, you'll need to upgrade your kernel.
1. Install wget, unzip, curl, git, and tar (these will come preinstalled on many Linux distros)
2. Install docker (TODO link to debian instructions)
3. Install NVM and then run `nvm install stable` (link to debian instructions)
4. Install yarn with `npm install -g yarn`

Below is an example systemd service file for the mining client. You can use this as a template for your own service file.
```
TODO
```
Clone the repository, cd into the ./execution-client directory, and run `yarn`

Please note that the client relies on linux sandboxing commands such as chroot and unshare.

## Useful docs:
* Gas for native near https://docs.near.org/concepts/storage/data-storage#big-o-notation-big-o-notation-1

## Creating bounties


### **Required**
Please follow all of these requirements when creating a bounty. Failure to follow these requirements will likely result in `min_nodes` failing to run the job, which will result in the loss of your bounty reward.

1. If your bounty execution accesses the internet, you must pass the network_required flag **_NOTE:_** Nodes can access the internet during the image build phase.
2. (TODO not currently a feature) Avoid accessing sites that aren't on the default whitelist (dockerhub, alpine repo, github repo) when building your image.
3. Fatal errors should result in a non-zero exit code so the nodes can report that they failed.
4. Your bounty should output a line to stdout or stderr that has a string informing nodes of what data they should push on chain. This string should print on a single line, and should be in the format `bounty_data: <data>`. The data should be a json object with the following fields:
    * `result`: A **string** containing the result of the bounty execution (Ex: "1000", "This is the result"). There are no restrictions on the content so long as you have made a storage deposit that can cover used space. Remember that the storage deposit is refundable, so you can always set lean high if you're not sure
    * `message`: (Optional) A **string** containing a message that should be pushed to the chain. This is typically used for publishing error messages.
   
   Examples:

   python: 
   ```python3
   import json
   result_json = json.dumps({
     "bounty_data": {
         "result": "1000",
         "message": ""
     }
   })
   ```
   javascript:
   ```javascript
   console.log(JSON.stringify({
      "bounty_data": {
         "result": "",
         "message": "ERROR: received statusCode 404 from https://example.com"
      } 
   }))
   ```
4. If your bounty uses runtime args, use `ENTRYPOINT` instead of `CMD`. `CMD` can be overwritten with runtime args, but the client provides no ability to override `ENTRYPOINT`. 
5. (TODO, can't currently upload to ipfs) If your result is uploaded to IPFS, nodes will participate as peers for a configurable amount of time (default 1h, minimum 15m if node allows IPFS upload). If you do not make yourself into a peer before the last node stops sharing, your result will be lost forever. (Should create a systemd process to listen for bounty close events)
Note that your bounty reward will be lost if min_nodes fail to execute (which closes the bounty with a status of failed)

### Output