use std::collections::HashMap;
use std::fs;

use anyhow::Error;
use near_sdk::{AccountId, env};
use near_sdk::env::random_seed;
use near_sdk::serde_json::json;
use near_units::parse_near;
use near_workspaces::{Account, Contract, Worker};
use near_workspaces::network::Sandbox;

use coordinator::bounty::{Bounty, NodeResponse, NodeResponseStatus};
use coordinator::node::Node;

pub async fn setup_coordinator(worker: Worker<Sandbox>) -> anyhow::Result<Contract> {
    println!("Deploying coordinator contract");
    let paths = fs::read_dir("./").unwrap();

    for path in paths {
        println!("Name: {}", path.unwrap().path().display())
    }
    let coordinator_wasm_filepath = "../target/wasm32-unknown-unknown/release/coordinator.wasm";
    let coordinator_wasm = std::fs::read(coordinator_wasm_filepath).unwrap();
    let coordinator_contract = worker.dev_deploy(&coordinator_wasm).await?;
    coordinator_contract.call("init")
        .max_gas()
        .args_json(json!({}))
        .transact()
        .await?
        .into_result()?;
    println!("coordinator contract initialized");
    return Ok(coordinator_contract);
}

// pub async fn create_nodes(coordinator_contract: Contract, accounts: Vec<Account>, n_per_account: u64) -> Result<HashMap<AccountId, Vec<Node>>, Error> {
pub async fn create_nodes(coordinator_contract: &Contract, accounts: Vec<Account>, n_per_account: u64) -> Result<HashMap<AccountId, Node>, Error> {
    println!("Creating {} nodes", accounts.len() * n_per_account as usize);
    let mut res: HashMap<AccountId, Node> = HashMap::new();
    for account in accounts {
        // let mut tx = account.batch(coordinator_contract.id());
        println!("Creating {} nodes for {}", n_per_account, account.id());
        for i in 0..n_per_account {
            println!("bootstrapping node: {}", i);
            let name = format!("test-node{}", i.clone());
            println!("name: {}", name);
            println!("account balance for {}: {}", account.id(), account.view_account().await?.balance);
            let node_id: AccountId = format!("{}.node.{}", name, env::current_account_id())
                .parse()
                .unwrap();
            println!("planned name: {}", node_id);
            let node: Node = account
                .call(coordinator_contract.id(), "register_node")
                .args_json(json!({
                        "name": name,
                    }))
                .max_gas()
                .transact().await?.json()?;
            println!("finished bootstrapping node: {}", i);
            res.insert(node.id.clone(), node);
        }
        // let _res = tx.transact().await?.into_result()?;
    };

    return Ok(res);
}

pub async fn get_node_count(coordinator_contract: &Contract) -> anyhow::Result<u64> {
    let node_count: u64 = coordinator_contract
        .call("get_node_count")
        .args_json(json!({}))
        .view()
        .await?
        .json()?;
    println!("Checked for node count, received: {}", node_count);
    return Ok(node_count);
}

pub async fn get_bounty_count(coordinator_contract: Contract) -> anyhow::Result<u64> {
    println!("Checking for bounty count");
    // let bounty_count: u64 = coordinator_contract
    let res = coordinator_contract
        .call("get_bounty_count")
        .args_json(json!({}))
        .view()
        .await?
        .json()?;
    println!("Checked for bounty count, received: {:?}", res);
    return Ok(res);
}

pub async fn get_bounty(coordinator_contract: &Contract, bounty_id: AccountId) -> anyhow::Result<Bounty> {
    println!("Checking for bounty {}", bounty_id);
    let bounty: Bounty = coordinator_contract
        .call("get_bounty")
        .args_json(json!({
            "bounty_id": bounty_id
        }))
        .view()
        .await?
        .borsh()?;
    println!("Checked for bounty, received: {:?}", bounty.id);
    return Ok(bounty);
}

pub async fn get_bounties(coordinator_contract: &Contract) -> anyhow::Result<Vec<Bounty>> {
    println!("Checking for bounties");
    let bounties: Vec<Bounty> = coordinator_contract
        .call("get_bounties")
        .args_json(json!({}))
        .view()
        .await?
        .borsh()?;
    println!("Checked for bounty count, received: {}", bounties.len());
    return Ok(bounties);
}

pub async fn get_nodes(coordinator_contract: &Contract) -> anyhow::Result<Vec<Node>> {
    println!("Fetching all nodes");
    let nodes: Vec<Node> = coordinator_contract
        .call("get_nodes")
        .args_json(json!({}))
        .view()
        .await?
        .json()?;
    println!("Checked for node count, received: {}", nodes.len());
    return Ok(nodes);
}

pub async fn create_bounty(coordinator_contract: &Contract, creator: Account, n_bounties: u64, min_nodes: u64, total_nodes: u64) -> anyhow::Result<Vec<Bounty>> {
    println!("Creating {} bounties", n_bounties);
    let node_count = get_node_count(coordinator_contract).await?;
    assert!(node_count > 0, "failed to create bounty, no nodes are registered");
    assert!(node_count >= total_nodes, "failed to create bounty, not enough nodes are registered");
    for i in 0..n_bounties {
        println!("creating bounty {}", i);
        let name = format!("test-bounty{}", i.clone());
        println!("name: {}", name);
        // let gas_point_a = env::used_gas();
        let name: String = format!("test-bounty{}", i.clone());
        let location: String = "https://github.com/ad0ll/docker-hello-world.git".to_string();
        // let bounty = Bounty::new_bounty(name, name.parse. location, )
        let _bounty: Bounty = creator
            .call(coordinator_contract.id(), "create_bounty")
            .args_json(json!({
                "name": name,
                "file_location": location,
                "file_download_protocol": "GIT",
                "min_nodes": min_nodes,
                "total_nodes": total_nodes,
                "timeout_seconds": 30,
                "network_required": true,
                "gpu_required": false,
                "amt_storage": format!("{}", parse_near!("1N")), //Make this a string since javascript doesn't support u128
                "amt_node_reward": format!("{}", parse_near!("1N")),
            }))
            .deposit(parse_near!("2N"))
            .transact()
            .await?
            .borsh()?;
    };

    //TODO compare against statically created bounties
    let bounties = get_bounties(&coordinator_contract).await?;
    println!("Num bounties from get_bounties{}", bounties.len());
    return Ok(bounties);
}


async fn create_accounts(worker: Worker<Sandbox>, n: u64) -> HashMap<AccountId, Account> {
    let min_balance = parse_near!("10 N");
    let root = worker.root_account().unwrap();
    assert!(n > 0, "failed to create accounts, n must be greater than 0");
    let mut res: HashMap<AccountId, Account> = HashMap::new();
    for _i in 0..n {
        let account = worker
            .dev_create_account()
            .await.unwrap();
        let _success = root.transfer_near(account.id(), min_balance).await.unwrap();
        let account_id = account.id().parse().unwrap();
        println!("created account: {}", account_id);
        res.insert(account_id, account);
    }
    return res;
}

async fn call_get_answer(coordinator_contract: Contract, account: Account, node_id: AccountId, bounty_id: AccountId) -> anyhow::Result<NodeResponse> {
    let answer: NodeResponse = account
        .call(coordinator_contract.id(), "call_get_answer")
        .args_json(json!({
            "bounty_id": bounty_id,
            "node_id": node_id,
        }))
        .transact()
        .await?
        .json()?;
    return Ok(answer);
}

async fn post_answer(coordinator_contract: Contract, account: Account, node_id: AccountId, bounty_id: AccountId, answer: String, status: NodeResponseStatus) -> anyhow::Result<()> {
    println!("posting answer: {}", answer);
    println!("bounty_id: {}", bounty_id);
    let nodeResponse = account
        .call(coordinator_contract.id(), "post_answer")
        .args_json(json!({
            "node_id": node_id.clone(),
            "bounty_id": bounty_id.clone(),
            "answer": answer.clone(),
            "message": "test message",
            "status": status.clone(),
        }))
        .transact()
        .await?
        // .into_result()?;
    .borsh()?;
    return Ok(());
}


#[tokio::test]
async fn test_create_nodes() -> anyhow::Result<()> {
    let worker = near_workspaces::sandbox().await?;
    let coordinator_contract = setup_coordinator(worker.clone()).await?;
    let accounts = create_accounts(worker.clone(), 2).await;
    let account_vec: Vec<Account> = accounts.values().cloned().collect();
    create_nodes(&coordinator_contract, account_vec, 1).await?;
    assert_eq!(get_node_count(&coordinator_contract).await?, 2, "node bootstrapping didn't return the expected number of nodes");
    Ok(())
}

#[tokio::test]
async fn test_create_bounty() -> anyhow::Result<()> {
    let worker = near_workspaces::sandbox().await?;
    let coordinator_contract = setup_coordinator(worker.clone()).await?;
    let accounts = create_accounts(worker.clone(), 1).await;
    let account_vec: Vec<Account> = accounts.values().cloned().collect();
    let _nodes = create_nodes(&coordinator_contract, account_vec.clone(), 1).await?;
    let bounty_owner = &account_vec[(random_seed().clone()[0] % 10) as usize];
    let _bounties = create_bounty(&coordinator_contract, bounty_owner.clone(), 1, 1, 1).await?;
    assert_eq!(get_bounty_count(coordinator_contract.clone()).await?, 1, "bounty count should be 1");
    Ok(())
}

#[tokio::test]
async fn test_bounty_full_lifecycle() -> anyhow::Result<()> {
    let num_accounts = 5;
    let min_nodes = 2;
    let max_nodes = 3;
    let worker = near_workspaces::sandbox().await?;
    let coordinator_contract = setup_coordinator(worker.clone()).await?;
    let mut accounts = create_accounts(worker.clone(), num_accounts).await;
    let account_vec: Vec<Account> = accounts.values().cloned().collect();
    let mut nodes = create_nodes(&coordinator_contract, account_vec.clone(), 1).await?;
    assert_eq!(get_node_count(&coordinator_contract).await?, num_accounts, "node bootstrapping didn't return the expected number of nodes");
    let bounty_owner_id = accounts.keys().next().unwrap().clone();
    let bounty_owner = accounts.remove(&bounty_owner_id).unwrap_or_else(|| panic!("failed to remove bounty owner from accounts"));
    let mut keys_to_remove: Vec<AccountId> = vec!();
    for x in nodes.values() {
        if x.owner_id == bounty_owner_id {
            keys_to_remove.push(x.id.clone())
        }
    }
    for x in keys_to_remove {
        let node = nodes.remove(&x).unwrap();
        println!("removed node: {}, owned by {}", node.id, node.owner_id);
    }
    let bounties = create_bounty(&coordinator_contract, bounty_owner.clone(), 1, min_nodes, max_nodes).await?;
    assert_eq!(get_bounty_count(coordinator_contract.clone()).await?, 1, "bounty count should be 1");
    for bounty in bounties {
        println!("fetching bounty: {}", bounty.id);
        assert_eq!(get_bounty(&coordinator_contract, bounty.id.clone()).await?.id, bounty.id.clone(), "bounty should exist");
        let mut curr_idx = 0;
        for elected in bounty.elected_nodes {
            let node = nodes.get(&elected).unwrap_or_else(|| panic!("failed to get node {} from nodes", &elected));
            let account = accounts.get(&node.owner_id).unwrap_or_else(|| panic!("failed to get account {} from accounts", &node.owner_id));
            println!("checking if we should post answer using {} for bounty {}, node {}", coordinator_contract.id(), bounty.id.clone(), node.id.clone());
            let should_post_answer: bool = account
                .call(coordinator_contract.id(), "should_post_answer")
                .max_gas()
                .args_json(json!({
                "bounty_id": bounty.id.clone(),
                "message": format!("test message {}", env::random_seed()[0]),
                "node_id": node.id.clone(),
            }))
                .transact()
                // .view() //view doesn't work for some reason
                .await?
                .json::<bool>()?;
            println!("should_post_answer {}: {:?}", node.id, should_post_answer);

            if curr_idx >= min_nodes {
                println!("index above min_nodes, should not post answer");
                assert_eq!(should_post_answer, false, "should_post_answer should be false since we have enough nodes to close the bounty");
                break;
            }

            post_answer(coordinator_contract.clone(), account.clone(), node.id.clone(), bounty.id.clone(), "42".to_string(), NodeResponseStatus::SUCCESS).await?;
            println!("index below min_nodes, should post answer");
            println!("posted answer to {} for {}", bounty.id.clone(), node.id.clone());
            let answer = call_get_answer(coordinator_contract.clone(), account.clone(), node.id.clone(), bounty.id.clone()).await?;
            assert_eq!(answer.solution, "42".to_string(), "answer should be 42");
            println!("node: {}, owned by {} posted answer", node.id.clone(), node.owner_id.clone());
            curr_idx += 1;
        }
    }
    Ok(())
}

