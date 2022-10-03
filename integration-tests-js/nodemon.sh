#!/bin/zsh

nodemon \
  --watch ../contract-rust/src \
  --watch ../contract-rust/node \
  --watch ../contract-rust/coordinator \
  --watch ../contract-rust/bounty \
  --watch src \
  --delay 1 \
  --exec "cd ../contract-rust && ./build.sh && cd ../integration-tests-js yarn" test