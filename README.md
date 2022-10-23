## Contracts

There is one contract, the coordinator contract, which is used to create and manage both nodes and bounties.

### Inactivity



## Mining client

### Installation

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