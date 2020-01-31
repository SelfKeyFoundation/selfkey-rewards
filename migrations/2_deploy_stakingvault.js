const StakingVault = artifacts.require("./StakingVault.sol")

module.exports = deployer => {
  let tokenAddress = '0x4CC19356f2D37338b9802aa8E8fc58B0373296E7'   // SelfKey mainnet
  deployer.deploy(StakingVault, tokenAddress)
}
