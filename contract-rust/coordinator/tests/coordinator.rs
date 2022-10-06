use near_sdk::{AccountId, env, log};
use near_sdk::serde_json::json;
use near_workspaces::{Contract, Worker};
use near_workspaces::network::Sandbox;
use near_units::parse_gas;
use coordinator::node::Node;

pub async fn setup_coordinator(worker: Worker<Sandbox>) -> anyhow::Result<Contract> {
    let coordinator_wasm_filepath = "../target/wasm32-unknown-unknown/release/main.wasm";
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
    let upper = 10;
    let mut i = 0;
    while i < upper{
        println!("bootstrapping node: {}", i);
        let name = format!("test-node{}", i.clone());
        println!("name: {}", name);
        let gas_point_a = env::used_gas();
        let node: Node = coordinator_contract
            .call("register_node")
            .max_gas()
            .args_json(json!({
                "name": name
            }))
            .transact()
            .await?
            .json()?;
        let gas_point_b = env::used_gas();
        log!("gas used: {:?}", gas_point_b - gas_point_a);
        println!("node: {} registered", name.clone());
        let node_compare = Node::new(node.owner_id.clone());
        println!("checking if node {} is equal to {}", node, node_compare);
        assert_eq!(node, node_compare);
        i += 1;
    };
    return Ok(());
}

#[tokio::test]
async fn test_create_nodes() -> anyhow::Result<()> {
    let worker = near_workspaces::sandbox().await?;
    let coordinator_contract = setup_coordinator(worker).await?;
    let create_n: u64 = 10;
    create_nodes(coordinator_contract.clone(), create_n).await?;
    let node_count: u64 = coordinator_contract
        .call("get_node_count")
        .args_json(json!({}))
        .view()
        .await?
        .json()?;
    assert_eq!(node_count, create_n, "node bootstrapping didn't return the expected number of nodes");
    Ok(())
}

#[tokio::test]
async fn test_create_bounty() -> anyhow::Result<()>{
    // Create 10 nodes
    // Create bounty
    // Check nodes elected is populated
    // Check elected nodes at tail in order
    Ok(())
}

#[tokio::test]
async fn test_post_answer() -> anyhow::Result<()>{
    // Create 10 nodes
    // Create bounty
    // Post answer
    // Attempt to post answer as non-signer
    Ok(())
}


#[tokio::test]
async fn test_empty_args_error() -> anyhow::Result<()> {
    let worker = near_workspaces::sandbox().await?;
    let coordinator_contract = setup_coordinator(worker).await?;


    println!("coordinator contract registered nodes");



    // if let Some(execution_err) = res.err() {
    //     assert!(format!("{}", exeuction_err).contains("Failed to deserialize input from JSON"));
    //     assert!(
    //         exeuction_err.total_gas_burnt > 0,
    //         "Gas is still burnt for transaction although inputs are incorrect"
    //     );
    // } else {
    //     panic!("Expected execution to error out");
    // }

    Ok(())
}