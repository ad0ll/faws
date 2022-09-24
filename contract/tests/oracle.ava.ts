import { Worker } from 'near-workspaces'

import test from "ava";
test.before(async t => {
    const worker = await Worker.init()
    const root = worker.rootAccount;
    const oracleContract = await root.devDeploy("./build/hello_near.wasm");
    const oracleContract =
})
test("oracle", async (t) => {

})