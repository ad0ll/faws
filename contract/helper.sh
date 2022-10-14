
# Run: local_near dev-deploy --wasmFile target/wasm32-unknown-unknown/release/
#Populate below variable
alias local_near="NEAR_ENV=\"local\" NEAR_CLI_LOCALNET_NETWORK_ID=\"localnet\" NEAR_NODE_URL=\"http://0.0.0.0:3030\"  near"
ACCOUNT=dev-1665585776788-35746895769050
COORDINATOR=dev-1665664859992-63903829495196

local_near call "$COORDINATOR" register_node '{"name": "node1"}' --accountId="$ACCOUNT"
local_near call "$COORDINATOR" register_node '{"name": "node2"}' --accountId="$ACCOUNT"
local_near call "$COORDINATOR" register_node '{"name": "node3"}' --accountId="$ACCOUNT"
local_near call "$COORDINATOR" register_node '{"name": "node4"}' --accountId="$ACCOUNT"
local_near call "$COORDINATOR" register_node '{"name": "node5"}' --accountId="$ACCOUNT"
local_near call "$COORDINATOR" create_bounty '{"name": "something25", "file_location": "https://github.com/ad0ll/docker-hello-world.git", "file_download_protocol": "GIT", "min_nodes": 2, "total_nodes": 5, "timeout_seconds": 60, "network_required": true, "gpu_required": false, "amt_storage": "1000000000000000000000000", "amt_node_reward": "1000000000000000000000000"}' --accountId="$COORDINATOR" --deposit 2
#local_near call "$COORDINATOR" remove_node '{"account_id": "node1.node.dev-1665585776788-35746895769050"}' --accountId="$ACCOUNT"
#local_near call "$COORDINATOR" remove_node '{"account_id": "node2.node.dev-1665585776788-35746895769050"}' --accountId="$ACCOUNT"
#local_near call "$COORDINATOR" remove_node '{"account_id": "node3.node.dev-1665585776788-35746895769050"}' --accountId="$ACCOUNT"
#local_near call "$COORDINATOR" remove_node '{"account_id": "node4.node.dev-1665585776788-35746895769050"}' --accountId="$ACCOUNT"
#local_near call "$COORDINATOR" remove_node '{"account_id": "node5.node.dev-1665585776788-35746895769050"}' --accountId="$ACCOUNT"

#local_near call "$COORDINATOR" should_post_answer '{"node_id": "node2.node.dev-1665585776788-35746895769050", "bounty_id": "something25.bounty.dev-1665664859992-63903829495196"}' --accountId="$ACCOUNT"
#local_near call "$COORDINATOR" post_answer '{"bounty_id": "something25.bounty.dev-1665664859992-63903829495196", "node_id": "node2.node.dev-1665585776788-35746895769050", "answer": "42", "status": "SUCCESS"}' --accountId="$ACCOUNT"
#local_near call "$COORDINATOR" post_answer '{"bounty_id": "something25.bounty.dev-1665664859992-63903829495196", "node_id": "node3.node.dev-1665585776788-35746895769050", "answer": "42", "status": "SUCCESS"}' --accountId="$ACCOUNT"
#local_near call "$COORDINATOR" post_answer '{"bounty_id": "something25.bounty.dev-1665664859992-63903829495196", "node_id": "node5.node.dev-1665585776788-35746895769050", "answer": "42", "status": "SUCCESS"}' --accountId="$ACCOUNT"
#local_near call "$COORDINATOR" get_answer '{"node_id": "node2.node.dev-1665585776788-35746895769050", "bounty_id": "something25.bounty.dev-1665664859992-63903829495196"}' --accountId="$ACCOUNT"
