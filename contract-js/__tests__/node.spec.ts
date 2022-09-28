import { Worker } from 'near-workspaces'
import test from "ava";


test.beforeEach(async t => {
    const worker = await Worker.init()
    const root = worker.rootAccount;
    const contract = await root.createSubAccount('dev-account')
    // const oracleContract = await root.devDeploy("./build/hello_near.wasm");
    await contract.deploy(process.argv[2])
    // Save state for test runs, it is unique for each test
    t.context.worker = worker;
    t.context.accounts = { root, contract };
})
test.afterEach(async (t) => {
    // Stop Sandbox server
    await t.context.worker.tearDown().catch((error) => {
        console.log('Failed to stop the Sandbox:', error);
    });
});
