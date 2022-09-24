#!/bin/sh

./build.sh

if [ $? -ne 0 ]; then
  echo ">> Error building contract"
  exit 1
fi

echo ">> Deploying contract"
alias local_near='NEAR_ENV="local" NEAR_CLI_LOCALNET_NETWORK_ID="localnet" NEAR_NODE_URL="http://127.0.0.1:8332" NEAR_CLI_LOCALNET_KEY_PATH="/Users/adoll/.neartosis/2022-09-20T06.59.36/validator-key.json" NEAR_WALLET_URL="http://127.0.0.1:8334" NEAR_HELPER_URL="http://127.0.0.1:8330" NEAR_HELPER_ACCOUNT="test.near" NEAR_EXPLORER_URL="http://127.0.0.1:8331" near'


# https://docs.near.org/tools/near-cli#near-dev-deploy
local_near dev-deploy --wasmFile build/hello_near.wasm
