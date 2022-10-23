# Run: local_near dev-deploy --wasmFile target/wasm32-unknown-unknown/release/
#Populate below variable
alias local_near="NEAR_ENV=\"local\" NEAR_CLI_LOCALNET_NETWORK_ID=\"localnet\" NEAR_NODE_URL=\"http://0.0.0.0:3030\"  near"
ACCOUNT=$ACCOUNT
REDEPLOY_CONTRACT=yes# Put anything here to redeploy the contract
BOUNTY_NAME="test-bounty-$(date +%s)"
REFERENCE_BOUNTY=test-bounty-1666465914.bounty.dev-1666465917611-93368491720914

source_neardev(){

  source ./neardev/dev-account.env

  echo "$CONTRACT_NAME"
  if [[ -z $CONTRACT_NAME ]]; then
    echo "No CONTRACT_NAME defined: $CONTRACT_NAME"
    exit 1
  fi

sed -i.bak "s/COORDINATOR_CONTRACT_ID=.*/COORDINATOR_CONTRACT_ID=\"$CONTRACT_NAME\"/g" ../execution-client/.env
}
local_near call "$CONTRACT_NAME" create_bounty --accountId="$ACCOUNT" --deposit 2 "{\"name\": \"$BOUNTY_NAME\", \"file_location\": \"https://github.com/ad0ll/docker-hello-world.git\", \"file_download_protocol\": \"GIT\", \"min_nodes\": 1, \"total_nodes\": 3, \"timeout_seconds\": 60, \"network_required\": true, \"gpu_required\": false, \"amt_storage\": \"1000000000000000000000000\", \"amt_node_reward\": \"1000000000000000000000000\"}"
#local_near view "$CONTRACT_NAME" get_bounties --accountId="$ACCOUNT"

#local_near call "$CONTRACT_NAME" should_post_answer "{\"node_id\": \"node2.node.$ACCOUNT\", \"bounty_id\": \"$BOUNTY_NAME.bounty.$CONTRACT_NAME\"}" --accountId="$ACCOUNT"#local_near call "$CONTRACT_NAME" call_get_answer "{\"node_id\": \"node2.node.$ACCOUNT\", \"bounty_id\": \"$BOUNTY_NAME.bounty.$CONTRACT_NAME\"}" --accountId="$ACCOUNT"
#Bounty should be closed, so we should be able to get the answer now
#local_near call "$CONTRACT_NAME" get_answer "{\"node_id\": \"node3.node.$ACCOUNT\", \"bounty_id\": \"$BOUNTY_NAME.bounty.$CONTRACT_NAME\"}" --accountId="$ACCOUNT"
#local_near call "$CONTRACT_NAME" get_bounty_result "{\"bounty_id\": \"$BOUNTY_NAME.bounty.$CONTRACT_NAME\"}" --accountId="$ACCOUNT"
#local_near call "$CONTRACT_NAME" post_answer "{\"bounty_id\": \"$BOUNTY_NAME.bounty.$CONTRACT_NAME\", \"node_id\": \"node5.node.$ACCOUNT\", \"answer\": \"42\", \"message\": \"slayer\", \"status\": \"SUCCESS\"}" --accountId="$ACCOUNT"
