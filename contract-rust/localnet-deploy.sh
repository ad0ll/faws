#!/bin/sh

#./build.sh


#cargo test
# https://docs.near.org/tools/near-cli#near-dev-deploy


#local_near call "dev-1665283011588-97304367585179" register_node '{"name": "acheivement"}' --accountId=dev-1665283011588-97304367585179
#local_near call "dev-1665283011588-97304367585179" create_bounty '{"name": "bounty1", "file_location": "https://github.com/ad0ll/docker-hello-world.git", "file_download_protocol": "GIT", "threshold": 1, "total_nodes": 1, "network_required": true, "gpu_required": false, "amt_storage": "1000000000000000000000000", "amt_node_reward": "1000000000000000000000000"}' --accountId=dev-1665283011588-97304367585179 --deposit 2
# Helper functions to manually create nodes and bounties
function refresh_dev_account(){
  # Read neardev/dev-account into variable
  DEV_ACCOUNT_ID=LIST=$(tr ' \n' '.|' < ./neardev/dev-account)

  local_near="NEAR_ENV=\"local\" NEAR_CLI_LOCALNET_NETWORK_ID=\"localnet\" NEAR_NODE_URL=\"http://0.0.0.0:3030\" near"
#  alias local_near="NEAR_ENV=\"local\" NEAR_CLI_LOCALNET_NETWORK_ID=\"localnet\" NEAR_NODE_URL=\"http://0.0.0.0:3030\" NEAR_HELPER_ACCOUNT=test.near NEAR_CLI_LOCALNET_KEY_PATH=$NEAR_CLI_LOCALNET_KEY_PATH near"
}

function create_basic_bounty(){
  refresh_dev_account
  local_near call "dev-1665283011588-97304367585179" create_bounty '{"name": "something", "file_location": "https://github.com/ad0ll/docker-hello-world.git", "file_download_protocol": "GIT", "threshold": 2, "total_nodes": 3, "network_required": true, "gpu_required": false, "amt_storage": "1000000000000000000000000", "amt_node_reward": "1000000000000000000000000"}' --accountId="dev-1665283011588-97304367585179" --deposit 2
}

#local_near call "dev-1665283011588-97304367585179" register_node '{"name": "acheivement4"}' --accountId=dev-1665283011588-97304367585179

alias create_bounty=create_basic_bounty