# Hello NEAR Contract

The smart contract exposes two methods to enable storing and retrieving a greeting in the NEAR network.

```ts
@NearBindgen({})
class HelloNear {
  greeting: string = "Hello";

  @view // This method is read-only and can be called for free
  get_greeting(): string {
    return this.greeting;
  }

  @call // This method changes the state, for which it cost gas
  set_greeting({ greeting }: { greeting: string }): void {
    // Record a log permanently to the blockchain!
    near.log(`Saving greeting ${greeting}`);
    this.greeting = greeting;
  }
}
```

<br />

# Quickstart

1. Make sure you have installed [node.js](https://nodejs.org/en/download/package-manager/) >= 16.
2. Install the [`NEAR CLI`](https://github.com/near/near-cli#setup)

<br />

## 1. Build and Deploy the Contract
You can automatically compile and deploy the contract in the NEAR testnet by running:

```bash
npm run deploy
```

Once finished, check the `neardev/dev-account` file to find the address in which the contract was deployed:

```bash
cat ./neardev/dev-account
# e.g. dev-1659899566943-21539992274727
```

<br />

## 2. Retrieve the Greeting

`get_greeting` is a read-only method (aka `view` method).

`View` methods can be called for **free** by anyone, even people **without a NEAR account**!

```bash
# Use near-cli to get the greeting
near view <dev-account> get_greeting
```

<br />

## 3. Store a New Greeting
`set_greeting` changes the contract's state, for which it is a `call` method.

`Call` methods can only be invoked using a NEAR account, since the account needs to pay GAS for the transaction.

```bash
# Use near-cli to set a new greeting
near call <dev-account> set_greeting '{"greeting":"howdy"}' --accountId <dev-account>
```

**Tip:** If you would like to call `set_greeting` using your own account, first login into NEAR using:

```bash
# Use near-cli to login your NEAR account
near login
```

and then use the logged account to sign the transaction: `--accountId <your-account>`.


# Overview

This project consists of three parts:
* An oracle contract that coordinates node selection, response handling, and payouts
* A bounty contract that describes a job for nodes to perform
* A node contract that describes a computer capable of processing bounties

# Oracle contract


## Decentralization

Our vision for the project is to have decentralized compute available on demand.
1. There is a major emphasis on making it easy to set up a node. We want people who were previously mining Ethereum to be able to participate, and strive to make to skill barrier for entry and the price for failure to be as low as possible.
2. The oracle uses random selection 
3. Collusion between node operators and bounty creators doesn't result in cheaper costs, and reputation is not used to select nodes. There is little incentive to manipulate the system.
4. Contract creators cannot withdraw funds from the contract
4. The oracle contract has no 
3. It's free to not respond to a bounty

# Node operators

1. Network : Raspberry Pis, for instance, would usually make poor general compute devices, but make for great network compute devices.
2. General compute : Computers running . This includes consumer grade hardware because availability is only moderately penalized.
3. GPU compute

## Recommendations
1. Using Linux is highly encouraged. (DRAFT) We provide OS images
2. 
3. We highly recommend using an always on VPN.
4. 

## Bootstrapping script

When a node fails to perform, they'll be marked.
