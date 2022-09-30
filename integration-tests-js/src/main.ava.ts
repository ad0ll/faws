import {Worker, NearAccount, NEAR} from 'near-workspaces';
import anyTest, { TestFn } from 'ava';
import * as path from "path";
import {describe} from "node:test";

const test = anyTest as TestFn<{
  worker: Worker;
  accounts: Record<string, NearAccount>;
}>;
test.before(async (t) => {
  // Init the worker and start a Sandbox server
  const worker = await Worker.init();

  // Deploy contracts to sandbox. Note that each time we have a new sandbox with new accounts and new pubkeys
  const root = worker.rootAccount;
  const coordinator = await root.createSubAccount("coordinator-account");
  await coordinator.deploy(path.join(process.cwd(), "../contract-js/build/coordinator.wasm",));
  const node = await root.createSubAccount("node-account");
  await node.deploy(path.join(process.cwd(), "../contract-js/build/node.wasm",));

  // Save state for test runs, it is unique for each test
  t.context.worker = worker;
  t.context.accounts = { root, coordinator, node };
  console.log("Finished setting up test")
});

test.after(async (t) => {
  // Stop Sandbox server
  await t.context.worker.tearDown().catch((error) => {
    console.log('Failed to stop the Sandbox:', error);
  });
});


test('returns the default greeting', async (t) => {
  const { root, coordinator, node } = t.context.accounts;
  const result = await root.call(coordinator, "createAndRegisterNode", {accountPrefix: Date.now()}, {
    // attachedDeposit: NEAR.parse("1 N").toString(),
    gas: BigInt(1000000000000000000000), //SomeN
  });
  console.log(result)
});

//
// test('changes the message', async (t) => {
//   const { root, contract-js } = t.context.accounts;
//   await root.call(contract-js, 'set_greeting', { message: 'Howdy' });
//   const message: string = await contract-js.view('get_greeting', {});
//   t.is(message, 'Howdy');
// });
//
// test("miner", async (t) => {
//   const {root, contract-js} = t.context.accounts;
//   console.log(root)
//   // await contract-js.init({
//   //   owner: root.account_id,
//   //   oracle: contract-js.account_id,
//   // })
//
// })