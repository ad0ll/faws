import { Worker, NEAR, NearAccount } from 'near-workspaces';
import anyTest, { TestFn } from 'ava';

const test = anyTest as TestFn<{
  worker: Worker;
  accounts: Record<string, NearAccount>;
}>;

test.beforeEach(async (t) => {
  // Init the worker and start a Sandbox server
  const worker = await Worker.init();

  // deploy contract
  const root = worker.rootAccount;

  console.log("Creating sub accounts")
  // some test accounts
  // const alice = await root.createSubAccount("alice", {
  //   initialBalance: NEAR.parse("30 N").toJSON(),
  // });
  // const contract = await root.createSubAccount("contract", {
  //   initialBalance: NEAR.parse("30 N").toJSON(),
  // });
  console.log("Sub accounts created")
  // Get wasm file path from package.json test script in folder above
  // await root.deploy("../../target/wasm32-unknown-unknown/release/contract.wasm");
  console.log("Contract deployed")

  // Save state for test runs, it is unique for each test
  t.context.worker = worker;
  t.context.accounts = { root, contract: undefined, alice: undefined };
});

test.afterEach(async (t) => {
  // Stop Sandbox server
  console.log("Stopping worker")
  await t.context.worker.tearDown().catch((error) => {
    console.log("Failed to stop the Sandbox:", error);
  });
});
//
// test("send one message and retrieve it", async (t) => {
//   console.log("Doing the thing")
//   const { root, contract } = t.context.accounts;
//   await root.call(contract, "add_message", { text: "aloha" });
//   const msgs = await contract.view("get_messages");
//   const expectedMessagesResult = [
//     { premium: false, sender: root.accountId, text: "aloha" },
//   ];
//   t.deepEqual(msgs, expectedMessagesResult);
// });
//
// test("send two messages and expect two total", async (t) => {
//   const { root, contract, alice } = t.context.accounts;
//   await root.call(contract, "add_message", { text: "aloha" });
//   await alice.call(contract, "add_message", { text: "hola" }, { attachedDeposit: NEAR.parse('1') });
//   const msgs = await contract.view("get_messages");
//   const expected = [
//     { premium: false, sender: root.accountId, text: "aloha" },
//     { premium: true, sender: alice.accountId, text: "hola" },
//   ];
//   t.deepEqual(msgs, expected);
// });
