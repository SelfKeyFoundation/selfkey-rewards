const RewardsPool = artifacts.require("./RewardsPool.sol")

module.exports = deployer => {
  let tokenAddress = '0x4CC19356f2D37338b9802aa8E8fc58B0373296E7'   // SelfKey mainnet
  let stakingAddress = '0xfeD5B061366fB77E64531F660f195685116fb5a8'
  let ledgerAddress = '0x0cb853331293d689c95187190e09bb46cb4e533e'
  let reward = 1000000
  let period = 2592000  // 30 days

  deployer.deploy(RewardsPool, tokenAddress, stakingAddress, ledgerAddress, reward, period)
}
