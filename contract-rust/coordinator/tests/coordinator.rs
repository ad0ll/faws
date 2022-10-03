use near_sdk::serde_json::json;
use main::coordinator::Node;
// use coordinator::Node;

#[tokio::test]
async fn test_empty_args_error() -> anyhow::Result<()> {
    let worker = near_workspaces::sandbox().await?;
    // let NODE_WASM_FILPATH = "../target/wasm32-unknown-unknown/release/node.wasm";
    println!("sandbox worker created");
    let coordinator_wasm_filpath = "./target/wasm32-unknown-unknown/release/main.wasm";
    let coordinator_wasm = std::fs::read(coordinator_wasm_filpath).unwrap();
    println!("coordinator wasm read");
    let coordinator_contract = worker.dev_deploy(&coordinator_wasm).await?;
    println!("coordinator contract deployed");
    coordinator_contract.call("init")
        .max_gas()
        .args_json(json!({}))
        .transact()
        .await?
        .into_result()?;

    println!("coordinator contract initialized");
    let node: Node = coordinator_contract
        .call("register_node")
        .max_gas()
        .args_json(json!({
            "name": "test-node"
        }))
        .transact()
        .await?
        .json()?;

    let node_compare = Node::new(node.owner_id.clone());
    println!("checking if node {} is equal to {}", node, node_compare);
    assert_eq!(node, node_compare);
    println!("coordinator contract registered node");

    let node_count: u64 = coordinator_contract
        .call("get_node_count")
        .args_json(json!({}))
        .transact()
        .await?
        .json()?;
    assert_eq!(node_count, 1, "node count should be 1");


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