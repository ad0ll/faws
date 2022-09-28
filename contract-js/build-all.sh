#!/bin/sh

echo ">> Building contract"

#yarn near-sdk-js build src/node.ts build/node.wasm
yarn near-sdk-js build src/coordinator.ts build/coordinator.wasm
#yarn near-sdk-js build src/bounty.ts build/bounty.wasm
