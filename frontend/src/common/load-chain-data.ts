import { localStorageState } from "../app";
import { useRecoilValue } from "recoil";
import { Wallet } from "./near-wallet";

export async function loadData(wallet: Wallet) {
  const storage = useRecoilValue(localStorageState);
  let bounties = {};
  let nodes = {};
  try {
    // Pull all bounties and nodes
    // Filter at the component level
    bounties = await wallet.getBounties();
    nodes = await wallet.getNodes();
  } catch (e) {
    console.log({ e });
  }

  storage.set("bounties", bounties);
  storage.set("nodes", nodes);
  storage.set("nodesCount", nodes ? 0 : Object.keys(nodes).length);

  await new Promise((r) => setTimeout(r, 2000));

  loadData(wallet);
}
