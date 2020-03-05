var linearRegression = require('everpolate').linearRegression

//const helper = require("./utils/truffleTestHelper");
const assertThrows = require("./utils/assertThrows")
const helper = require("./utils/truffleTestHelper");
const txHelpers = require("./utils/txHelpers")
const util = require("ethereumjs-util")

const StakingVault = artifacts.require('./StakingVault.sol')
const MockToken = artifacts.require('./MockToken.sol')
const MockRandomRewardPool = artifacts.require('./MockRandomRewardPool.sol')
const DIDLedger = artifacts.require('./DIDLedger.sol')

const zeroBytes = util.bufferToHex(util.setLengthLeft(0, 32))

contract('RandomRewardPool (gas tests)', accounts => {
  const [user1, user2] = accounts.slice(0)
  let staking, token, rewards, ledger

  const createDID = async (user) => {
    let tx = await ledger.createDID(zeroBytes, { from: user })
    let log = txHelpers.getLog(tx, "CreatedDID")
    return log.args.id
  }

  const testGasCosts = async (number, stepSize) => {
    let dids = []
    let X = []
    let Y = []
    let j, limSup

    for(var i = 0; i < number; i++) {
      limSup = dids.length + stepSize
      for(j = dids.length; j < limSup; j++) {
        dids[j] = await createDID(user2)
        await staking.deposit(1, dids[j], { from: user2 })
      }
      let tx = await rewards.doAllocate({ from: user1 })
      X[i] = dids.length
      Y[i] = tx.receipt.gasUsed
    }
    return [X, Y]
  }

  const invertLine = (y, slope, intercept) => {
    return (y - intercept) / slope
  }

  before(async () => {
    let reward = 1
    let period = 0
    let initialCap = 1

    ledger = await DIDLedger.new()
    token = await MockToken.new()
    staking = await StakingVault.new(token.address, ledger.address)
    rewards = await MockRandomRewardPool.new(token.address, staking.address, ledger.address, reward, period)

    await token.freeMoney(user1, 999999)
    await token.freeMoney(user2, 999999)
    await token.freeMoney(rewards.address, 999999)

    await token.approve(staking.address, 999999, { from: user2 })
  })

  context('Gas limit calculation', () => {
    it("performs multiple gas tests with a defined step size", async () => {
      let runs = 12
      let size = 10
      let r = await testGasCosts(runs, size)
      //console.log(r[1])
      let regr = linearRegression(r[0], r[1])
      let inverse = invertLine(10000000, regr.slope, regr.intercept)
      console.log(regr)
      console.log("estimated limit = " + inverse)
    })
  })
})
