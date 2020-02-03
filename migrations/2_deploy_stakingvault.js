const StakingVault = artifacts.require("./StakingVault.sol")

module.exports = deployer => {
  let tokenAddress = '0x4CC19356f2D37338b9802aa8E8fc58B0373296E7'   // SelfKey mainnet
  let ledgerAddress = '0x0cb853331293d689c95187190e09bb46cb4e533e'

  deployer.deploy(StakingVault, tokenAddress, ledgerAddress)
}
