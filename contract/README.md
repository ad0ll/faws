## Instructions
1. Build the contract with `./build.sh`
2. Deploy t


## Examples
1.  Deploy contract
```bash
local_near dev-deploy --wasmFile target/wasm32-unknown-unknown/release/coordinator.wasm 
```
2. Create an account:
```bash

```
1. Register a node:
```bash
local_near call "dev-1665283011588-97304367585179" register_node '{"name": "acheivement20"}' --accountId=dev-1665427694682-19594043998989
```
2. Create a bounty:
```bash
local_near call "dev-1665283011588-97304367585179" create_bounty '{"name": "something22", "file_location": "https://github.com/ad0ll/docker-hello-world.git", "file_download_protocol": "GIT", "threshold": 2, "network_required": true, "gpu_required": false, "amt_storage": "1000000000000000000000000", "amt_node_reward": "1000000000000000000000000"}' --accountId="dev-1665427694682-19594043998989" --deposit 2 
```
1. Get nodes
```bash 
 local_near call "dev-1665283011588-97304367585179" get_nodes '{}' --accountId dev-1665427694682-19594043998989 
```
2. Get bounties (useless because borsh serialization)
```bash
local_near call "dev-1665283011588-97304367585179" get_bounties '{}' --accountId=dev-1665427694682-19594043998989 
```
3. Get bounty
```bash

```

local_near generate-key account1
near repl
// Paste this code in the javascript console
const pk58 = 'ed25519:<data>'
nearAPI.utils.PublicKey.fromString(pk58).data.hexSlice()

local_near call localnet create_account '{"new_account_id": "<account-name>.testnet"
near call testnet create_account '{"new_account_id": "<account-name>.testnet", "new_public_key": "ed25519:<data>"}' --deposit 0.00182 --accountId <account-with-funds>


~/projects/hello-near/contract ad0ll-develop +1 !8 ?1 ❯ local_near generate-key account1                                                                                                          4s 06:50:22
Loaded master account test.near key from /Users/adoll/.near/validator_key.json with public key = ed25519:HxzAZgDCZTvA4dJbUJH1u9VT1YAex13QZohVoYr732zu
Key pair with ed25519:5uAweyZFafk6WZrh2j9FgKVTGzXjB99ET9YVnfTRUcGA public key for an account "account1"
~/projects/hello-near/contract ad0ll-develop +1 !8 ?1 ❯ near repl                                                                                                                                    06:53:49
> const pk58 = 'ed25519:5uAweyZFafk6WZrh2j9FgKVTGzXjB99ET9YVnfTRUcGA'
undefined
> const pk58='ed25519:5uAweyZFafk6WZrh2j9FgKVTGzXjB99ET9YVnfTRUcGA'
Uncaught SyntaxError: Identifier 'pk58' has already been declared
> nearAPI.utils.PublicKey.fromString(pk58).data.hexSlice()
'48cc310c9020f664cd3f8da6c9a1eae425b2830b623348bec45a38fba896e553'



>
~/projects/hello-near/contract ad0ll-develop +1 !8 ?1 ❯ local_near generate-key account2                                                                                                       1m 4s 06:55:03
Loaded master account test.near key from /Users/adoll/.near/validator_key.json with public key = ed25519:HxzAZgDCZTvA4dJbUJH1u9VT1YAex13QZohVoYr732zu
Key pair with ed25519:HEmKDD7JzmhMuoTz3HfsTpAfdmww3EaujexLYXhigvEC public key for an account "account2"
~/projects/hello-near/contract ad0ll-develop +1 !8 ?1 ❯ local_near generate-key account3                                                                                                             06:55:08
Loaded master account test.near key from /Users/adoll/.near/validator_key.json with public key = ed25519:HxzAZgDCZTvA4dJbUJH1u9VT1YAex13QZohVoYr732zu
Key pair with ed25519:BwZVQnCpJCFXcreoPMN4uC2fXoJaKxun4AmZmYdynFVD public key for an account "account3"
~/projects/hello-near/contract ad0ll-develop +1 !8 ?1 ❯ near repl

> nearAPI.utils.PublicKey.fromString('ed25519:HEmKDD7JzmhMuoTz3HfsTpAfdmww3EaujexLYXhigvEC').data.hexSlice()
'f141a5b618ecc20c9991642529202907b241476ce2e2074121153f3eded89e19'


> nearAPI.utils.PublicKey.fromString('ed25519:BwZVQnCpJCFXcreoPMN4uC2fXoJaKxun4AmZmYdynFVD').data.hexSlice()
'a28ef825426ea7eb976c8a1083824d45a63e27f73c048ca1cf921dbcc70d7124'



near call testnet create_account '{"new_account_id": "account1.localnet", "new_public_key": "ed25519:<data>"}' --deposit 0.00182 --accountId <account-with-funds>

ed25519:5uAweyZFafk6WZrh2j9FgKVTGzXjB99ET9YVnfTRUcGA
48cc310c9020f664cd3f8da6c9a1eae425b2830b623348bec45a38fba896e553
local_near call localnet create_account '{"new_account_id": "account1.localnet", "new_public_key": "ed25519:5uAweyZFafk6WZrh2j9FgKVTGzXjB99ET9YVnfTRUcGA"}' --deposit 2 --accountId dev-1665283011588-97304367585179


ed25519:HEmKDD7JzmhMuoTz3HfsTpAfdmww3EaujexLYXhigvEC
f141a5b618ecc20c9991642529202907b241476ce2e2074121153f3eded89e19

ed25519:BwZVQnCpJCFXcreoPMN4uC2fXoJaKxun4AmZmYdynFVD
a28ef825426ea7eb976c8a1083824d45a63e27f73c048ca1cf921dbcc70d7124

near call create_acc