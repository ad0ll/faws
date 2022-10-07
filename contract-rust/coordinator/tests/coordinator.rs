use near_sdk::{AccountId, env, log};
use near_sdk::serde_json::json;
use near_workspaces::{Contract, Worker};
use near_workspaces::network::Sandbox;
use coordinator::node::Node;
use coordinator::bounty::Bounty;

pub async fn setup_coordinator(worker: Worker<Sandbox>) -> anyhow::Result<Contract> {
    println!("Deploying coordinator contract");
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

pub async fn create_nodes(coordinator_contract: Contract, n: u64) -> anyhow::Result<()>{
    println!("Creating {} nodes", n);
    let mut i = 0;
    while i < n{
        println!("bootstrapping node: {}", i);
        let name = format!("test-node{}", i.clone());
        println!("name: {}", name);
        let gas_point_a = env::used_gas();
        let res = coordinator_contract
            .call("register_node")
            .max_gas()
            .args_json(json!({
                "name": name
            }))
            .transact()
            .await?;
            // .json()?;
        println!("create_node (in create_nodes) res: {:?}", res);
        let gas_point_b = env::used_gas();
        // log!("gas used: {:?}", gas_point_b - gas_point_a);
        // println!("node: {} registered", name.clone());
        i += 1;
    };
    return Ok(());
}

pub async fn get_node_count(coordinator_contract: Contract) -> anyhow::Result<u64>{
    let node_count: u64 = coordinator_contract
        .call("get_node_count")
        .args_json(json!({}))
        .view()
        .await?
        .json()?;
    println!("Checked for node count, received: {}", node_count);
    return Ok(node_count);
}

pub async fn get_bounty_count(coordinator_contract: Contract) -> anyhow::Result<u64>{
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
pub async fn get_bounty(coordinator_contract: Contract, bounty_id: AccountId) -> anyhow::Result<Bounty>{
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

pub async fn get_bounties(coordinator_contract: Contract) -> anyhow::Result<Vec<Bounty>>{
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

pub async fn create_bounties(coordinator_contract: Contract, n_bounties: u64, n_threshold: u64, n_elections: u64) -> anyhow::Result<(Vec<Bounty>)>{
    println!("Creating {} bounties", n_bounties);
    let node_count = get_node_count(coordinator_contract.clone()).await?;
    assert!(node_count > 0, "failed to create bounty, no nodes are registered");
    assert!(node_count >= n_elections, "failed to create bounty, no nodes are registered");
    let mut res: Vec<Bounty> = Vec::new();
    let mut i = 0;
    while i < n_bounties{
        println!("creating bounty {}", i);
        let name = format!("test-bounty{}", i.clone());
        println!("name: {}", name);
        let gas_point_a = env::used_gas();
        let name: String = format!("test-bounty{}", i.clone());
        let bounty: Bounty = coordinator_contract
            .call("create_bounty")
            .max_gas()
            .deposit(2000)
            .args_json(json!({
                "name": name,
                "file_location": "https://github.com/ad0ll/docker-hello-world.git",
                "file_download_protocol": "GIT",
                "threshold": n_threshold,
                "total_nodes": n_elections,
                "network_required": true,
            "amt_storage": 1,
            "amt_node_reward": 1
            }))
            .transact()
            .await?
            .borsh()?;

        println!("created bounty {:?}", bounty.id);
        let gas_point_b = env::used_gas();
        log!("gas used: {:?}", gas_point_b - gas_point_a);
        println!("node: {} registered", name.clone());
        res.push(bounty);
        i += 1;
    };
    return Ok(res);
}

#[tokio::test]
async fn test_create_nodes() -> anyhow::Result<()> {
    let worker = near_workspaces::sandbox().await?;
    let coordinator_contract = setup_coordinator(worker).await?;
    let create_n: u64 = 10;
    create_nodes(coordinator_contract.clone(), create_n).await?;
    assert_eq!(get_node_count(coordinator_contract.clone()).await?, create_n, "node bootstrapping didn't return the expected number of nodes");
    Ok(())
}

#[tokio::test]
async fn test_create_bounty() -> anyhow::Result<()>{
    println!("Starting test_create_bounty");
    let worker = near_workspaces::sandbox().await?;
    let coordinator_contract = setup_coordinator(worker).await?;
    println!("Creating nodes in create bounty");
    create_nodes(coordinator_contract.clone(), 10).await?;
    assert_eq!(get_node_count(coordinator_contract.clone()).await?, 10, "node bootstrapping didn't return the expected number of nodes");
    println!("creating bounty");
    println!("Getting initial bounty count");
    assert_eq!(get_bounty_count(coordinator_contract.clone()).await?, 0, "bounty count should be 0");
    let bounties = create_bounties(coordinator_contract.clone(), 3, 3, 5).await?;
    assert_eq!(get_bounty_count(coordinator_contract.clone()).await?, 3, "bounty count should be 0");
    for bounty in bounties{
        let b = get_bounty(coordinator_contract.clone(), bounty.id.clone()).await?;
        assert_eq!(b.id, bounty.id.clone(), "bounty couldn't be fetched from contract");
    }
    // assert_eq!(bounty.elected_nodes.len(), 5, "bounty creation didn't return the expected number of elected nodes");
    // println!("bounty created with these nodes: {:?}", bounty.elected_nodes);
    println!("timestamp: {}", env::block_timestamp());
    println!("timestamp ms: {}", env::block_timestamp_ms());
    Ok(())
}
