/*
 * Example smart contract written in RUST
 *
 * Learn more about writing NEAR smart contracts with Rust:
 * https://near-docs.io/develop/Contract
 *
 */


use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::serde::Serialize;
use near_sdk::{AccountId, env, log, near_bindgen};
// use near_sdk::collections::{UnorderedMap, UnorderedSet};
// Define the default message

// struct gpu {
//     brand: String,
//     architecture: String,
//     cores: u128,
//     memory: u128,
// }
// Define the contract structure
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, Serialize)]
#[serde(crate = "near_sdk::serde")]
pub struct Node {

    pub owner_id: AccountId,
    pub coordinator_id: AccountId,
    pub account_id: AccountId,
    pub offline: bool,
    // pub installed_software: UnorderedMap<String, String>,
    // pub gpus: UnorderedSet<gpu>
}

// Implement the contract structure
#[near_bindgen]
impl Node {
    #[init]
    #[private] // Public - but only callable by env::current_account_id()
    pub fn init(account_id: AccountId) -> Self {
        assert!(!env::state_exists(), "Already initialized");

        Self {
            owner_id: env::signer_account_id(),
            coordinator_id: env::predecessor_account_id(), //TODO can we validate that this is a coordinator?
            account_id,
            offline: false,
        }
    }

    pub fn get_owner_id(&self) -> AccountId {
        log!(self.owner_id);
        return self.owner_id.clone();
    }
    pub fn get_coordinator_id(&self) -> AccountId {
        log!(self.coordinator_id);
        return self.coordinator_id.clone();
    }
    pub fn get_account_id(&self) -> AccountId {
        log!(self.account_id);
        return self.account_id.clone();
    }
    pub fn get_offline(&self) -> bool {
        return self.offline;
    }
    pub fn toggle_offline(&mut self) {
        assert!((env::signer_account_id() == self.owner_id || env::signer_account_id() == self.coordinator_id), "Only the owner or the coordinator can toggle offline");
        self.offline = !self.offline;
    }

}

// Define the default, which automatically initializes the contract
impl Default for Node{
    fn default() -> Self{
        Self{
            owner_id: env::signer_account_id(),
            coordinator_id: env::signer_account_id(),
            account_id: env::signer_account_id(),
            offline: false,
        }
    }
}



/*
 * The rest of this file holds the inline tests for the code above
 * Learn more about Rust tests: https://doc.rust-lang.org/book/ch11-01-writing-tests.html
 */
#[cfg(test)]
mod tests {
    use near_sdk::env::signer_account_id;
    use super::*;

    #[test]
    fn get_default_greeting() {
        let contract = Node::default();
        // this test did not call set_greeting so should return the default "Hello" greeting
        assert_eq!(
            contract.get_owner_id(),
            signer_account_id()
        );
        assert_eq!(
            contract.get_coordinator_id(),
            signer_account_id()
        );
        assert_eq!(
            contract.get_account_id(),
            signer_account_id()
        );
        assert_eq!(
            contract.get_offline(),
            false
        );
    }

}
