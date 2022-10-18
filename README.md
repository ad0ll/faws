## Contracts

There are two main contracts in this project:
* coordinator (TODO link): Responsible for delegating tasks to nodes and managing aspects of the bounty lifecycle. The definition for Nodes is embedded in the coordinator contract
* bounty: Represents a unit of work for coordinators to do

## Mining client
Persistent program


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