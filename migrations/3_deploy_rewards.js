const RewardsPool = artifacts.require("./RewardsPool.sol")

module.exports = deployer => {
  let tokenAddress = '0x4CC19356f2D37338b9802aa8E8fc58B0373296E7'   // SelfKey mainnet
  let stakingAddress = '0xF53506D009f0b1EBD961285B40CEa207cC628519'

  deployer.deploy(RewardsPool, tokenAddress, stakingAddress)
}
