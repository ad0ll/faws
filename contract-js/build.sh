#!/bin/sh

echo ">> Building contract"

near-sdk-js build src/node.ts build/node.wasm

