# selfkey-rewards

PoC versions of reward allocation contracts for the SelfKey Token economy.

<!-- * `develop` — [![CircleCI]({{circleci-badge-develop-link}})]({{circleci-project-develop-link}})
* `master` — [![CircleCI]({{circleci-badge-master-link}})]({{circleci-project-master-link}}) -->

## Overview

This repository includes smart contract implementations for a BETA version of the SelfKey
Rewards Program. Current reward goals are:

* Incentivize holding of tokens (lower token velocity)
* Incentivize valuable behavior on the platform:
    * Getting verified as an identity owner
    * Purchasing products and services

Other incentive programs will be considered in upcoming projects.


## Development

Smart contracts are being implemented using Solidity `0.5.0`.

### Prerequisites

* [NodeJS v9.5.0](htps://nodejs.org)
* [truffle v5.0.31](http://truffleframework.com/) (install globally)
* [web3.js v1.2.1](https://github.com/ethereum/web3.js/) (already embedded in truffle package)
* [ganache-cli v6.5.1](https://github.com/trufflesuite/ganache-cli)

### Initialization

    npm install

### Testing

    ganache-cli
    npm test

#### From within Truffle

Run the `truffle` development environment

    truffle develop

then from the prompt you can run

    compile
    migrate
    test

as well as other Truffle commands. See [truffleframework.com](http://truffleframework.com) for more.

## Smart Contract Status

Currently, the following smart contracts are implemented:

* StakingVault
* CappedStakingVault
* RandomRewardPool
* PredictiveRewardPool

### StakingVault

Simple contract for arbitrary staking. Function `deposit(amount, did)` allows the controller of `did` (according to SelfKey DID method) stake an arbitrary amount of KEY.

### CappedStakingVault

**CappedStakingVault** inherits **StakingVault**'s functionality yet introduces a cap per DID that limits the amount that can be staked. A set of "whitelisted" addresses are able to increase the cap for any DID. These whitelisted addresses are supposed to be trusted smart contracts. Examples:

* A claims registry increases a DID staking cap when an authorized certifier creates a public claim for that DID
* A payment contract increases a user staking cap for signing up for a product

The cap system is designed to incentivize specific behavior such as the aforementioned. It requires additional staking steps from the user.

An `initialCap` is defined at deployment time, and can later be changed by the contract owner.

### RandomRewardPool

**RandomRewardPool** is a smart contract intended to hold KEY tokens and distribute randomly to DIDs staking tokens in a staking contract (could be an instance of **StakingVault**, **CappedStakingVault** or any other implementation). Currently, random selection is weighted (i.e. not fully random), favoring those DIDs with higher stakes.

The parameters `rewardSize` and `rewardWindow` are defined at deployment time and can later be changed by the contract owner. `rewardSize` defines the amount of tokens to allocate on each reward event, and rewardWindow defines how many days need to pass between reward events.

A public function `doAllocate()` is provided in order to select a winning address in the staking contract and transfer `rewardSize` tokens to it. Each DID will have a winning probability proportional to their stake in relation to others. Currently, a single DID could be selected multiple times in different reward events if its stake is relatively high (and there are not too many other DIDs to choose from, thus increasing its chance). However, due to randomness any DID always has a chance to win.

This contract is _Ownable_, and the contract owner is able to withdraw the tokens back anytime (at least during testing and beta phases, in order to avoid accidental lock-ups).

### PredictiveRewardPool

In the **PredictiveRewardPool** contract the `allocateReward()` loops through all DIDs holding funds in a staking contract (e.g. **StakingVault** or any of its children implementations) and allocates a part of the rewardSize to each DID, proportional to their stake. "Everybody wins" a small piece. Currently, this allocation is done through increasing an allowance to each DID. DID controllers can then `withdraw(amount, did)` tokens from the contract, up to their current allowance (no token transfer is done during the allocation loop in order to save gas costs).

## Takeaways and additional notes

* **PredictiveRewardPool** allows to guarantee a predictable yield percentage to token holders (e.g. 7% monthly), as long as rewardSize is adjusted in proportion to the total stake. However, adjusting rewardSize also adds unpredictability on the reward pool depletion rate. If rewardSize is kept fixed and totalStake grows significantly, token holders with very small stakes (i.e. minimum stake) will get zero due to arithmetic rounding loss.
    
* Both reward contracts tested can be used with staking systems that encourage specific activity or arbitrary staking or any other particular staking system to be implemented. The incentive goals and values are implemented as part of the staking contract logic, and then the reward pool favors those with higher stake (either predictably or randomly).

* Since both predictive and random reward contracts need to loop through all stakeholders, there's the risk of hitting block gas limits as the number of stakeholders increase. Local tests were made and gas limits where approximated using linear regression. Assuming a block gas limit of 10,000,000:
    * RandomRewardPool: ~8000 staked DIDs (worst case scenario: selected is last on the list)
    * PredictiveRewardPool: ~1000 staked DIDs (due to storage write on each step)

Both contracts can still be optimized for more efficiency. However, a potential solution to the gas problem is to implement them as "state machines" that are able to stop before hitting a certain limit and wait for subsequent transactions to resume the allocation function.

**Notes**: The current status of these smart contracts doesn't account for any decision been made on general token economics or the release of the beta program yet. These are (currently) technical tests. Due analysis is still required to define a model that aligns stakeholders' incentives and satisfies SelfKey's general vision.

## Next (To-do):

* Implement "non-loop" version of predictive reward contract (wouldn't have gas problems, would require a few (yet unknown) changes to the reward logic.
* Implement fail-safe for gas limits for random rewards (tentatively "state-machine" solution).
* Re-iterate over the general token model and identify the desired features and properties for a beta release.
* Go back to smart contracts and make the necessary adjustments.

## Contributing

Please see the [contributing notes](CONTRIBUTING.md).
