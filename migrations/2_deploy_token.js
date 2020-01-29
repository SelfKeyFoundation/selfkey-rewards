const MockToken = artifacts.require("./MockToken.sol")

module.exports = deployer => {
  deployer.deploy(MockToken)
}
