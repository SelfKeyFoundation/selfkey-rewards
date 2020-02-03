//const helper = require("./utils/truffleTestHelper");
const assertThrows = require("./utils/assertThrows")
const helper = require("./utils/truffleTestHelper");
const txHelpers = require("./utils/txHelpers")
const util = require("ethereumjs-util")

const StakingVault = artifacts.require('./StakingVault.sol')
const MockToken = artifacts.require('./MockToken.sol')
const RewardsPool = artifacts.require('./RewardsPool.sol')
const DIDLedger = artifacts.require('./DIDLedger.sol')

const zeroBytes = util.bufferToHex(util.setLengthLeft(0, 32))

contract('StakingVault', accounts => {
  const [user1, user2, user3, user4, user5] = accounts.slice(0)
  let staking, token, rewards, ledger
  let did1, did2, did3, did4, did5

  const createDID = async (user) => {
    let tx = await ledger.createDID(zeroBytes, { from: user })
    let log = txHelpers.getLog(tx, "CreatedDID")
    return log.args.id
  }

  before(async () => {
    let reward = 1
    let period = 2592000  // 30 days

    ledger = await DIDLedger.new()
    assert.notEqual(ledger, undefined)

    token = await MockToken.new()
    assert.notEqual(token, undefined)
    
    staking = await StakingVault.new(token.address, ledger.address)
    assert.notEqual(staking, undefined)

    rewards = await RewardsPool.new(token.address, staking.address, ledger.address, reward, period)
    assert.notEqual(rewards, undefined)

    // initialize senders' funds
    await token.freeMoney(user1, 999999)
    await token.freeMoney(user2, 999999)
    await token.freeMoney(user4, 999999)
    await token.freeMoney(user5, 999999)

    await token.approve(staking.address, 999999, { from: user2 })
    await token.approve(staking.address, 999999, { from: user4 })
    await token.approve(staking.address, 999999, { from: user5 })

    did1 = await createDID(user1)
    did2 = await createDID(user2)
    did3 = await createDID(user3)
    did4 = await createDID(user4)
    did5 = await createDID(user5)    
  })

  context('Deposits', () => {
    it("sender that has not approved can't deposit KEY", async () => {
      await assertThrows(staking.deposit(1000, did1, { from: user1 }))
    })

    it("sender without funds can't deposit KEY", async () => {
      await assertThrows(staking.deposit(2000, did3, { from: user3 }))
    })

    it("sender cannot attempt to deposit zero KEY", async () => {
      await assertThrows(staking.deposit(0, did2, { from: user2 }))
    })

    it("sender cannot deposit to a different DID (?)", async () => {
      await assertThrows(staking.deposit(1000, did1, { from: user2 }))
    })

    it("cannot return weighted selection if there's no stake", async () => {
      await assertThrows(staking.getDIDbyWeightedSelection(999))
    })

    it("sender with approved amount of KEY can deposit", async () => {
      let amount = 1000
      let tx = await staking.deposit(amount, did2, { from: user2 })
      let depositBalance = await staking.balances.call(did2)
      let indexTest = await staking.indexes.call(0)

      assert.equal(indexTest, did2)
      assert.notEqual(txHelpers.getLog(tx, "KEYStaked"), null)
      assert.equal(Number(depositBalance), amount)

      // additional stakes for reward testing
      await staking.deposit(5000, did4, { from: user4 })
      await staking.deposit(500, did4, { from: user4 })   // to cover all test branches
      await staking.deposit(4000, did5, { from: user5 })
    })

    it("cannot return weighted selection if random > totalStake", async () => {
      let totalStake = Number(await staking.getTotalStake())
      await assertThrows(staking.getDIDbyWeightedSelection(totalStake + 1))
    })
  })

  context('Rewards', () => {
    it("reverts on insufficient funds in rewards contract", async () => {
      await assertThrows(rewards.allocateReward({ from: user1 }))
    })

    it("allocates reward", async () => {
      await token.freeMoney(rewards.address, 20000000)  // load contract with funds

      let tx = await rewards.allocateReward({ from: user1 })
      let rand = "Random number = " + Number(txHelpers.getLog(tx, "RewardAllocated").args.random)
      
      /*switch(txHelpers.getLog(tx, "RewardAllocated").args.winnerAddress) {
        case user2:
          console.log("Winner is user2! " + rand)
          break;
        case user4:
          console.log("Winner is user4! " + rand)
          break;
        case user5:
          console.log("Winner is user5! " + rand)
          break;
      }*/

      //console.log(tx.receipt.gasUsed)
    })

    it("allows owner (only) to set reward size", async () => {
      await assertThrows(rewards.setRewardSize(999, { from: user4 }))
      let newSize = 99
      await rewards.setRewardSize(newSize, { from: user1 })
      let size = await rewards.rewardSize()
      assert.equal(size, newSize)
    })

    it("allows owner (only) to set reward time window", async () => {
      await assertThrows(rewards.setRewardWindow(999, { from: user4 }))
      let newWindow = 604800  // 1 week
      await rewards.setRewardWindow(newWindow, { from: user1 })
      let window = await rewards.rewardWindow()
      assert.equal(window, newWindow)
    })

    it("cannot allocate reward before time", async () => {
      await assertThrows(rewards.allocateReward({ from: user1 }))
    })

    it("randomly allocates multiple rewards in due time", async () => {
      let rewardEvents = 100
      let user2count = 0
      let user4count = 0
      let user5count = 0

      let period = Number(await rewards.rewardWindow.call())
      let tx

      //console.log("period = " + typeof Number(period))
      //await timeTravel(period + 1)
      //await helper.advanceTime(period);
      //tx = await rewards.allocateReward({ from: user1 })

      for(var i = 0; i < rewardEvents; i++) {
        await helper.advanceTime(period);
        tx = await rewards.allocateReward({ from: user1 })
        switch(txHelpers.getLog(tx, "RewardAllocated").args.winnerAddress) {
          case user2:
            user2count++
            break;
          case user4:
            user4count++
            break;
          case user5:
            user5count++
            break;
        }
      }

      console.log("Ran " + rewardEvents + " reward event simulations:")
      console.log("user2 reward count = " + user2count)
      console.log("user4 reward count = " + user4count)
      console.log("user5 reward count = " + user5count)
    })

    it("allows owner (only) to withdraw tokens", async () => {
      let withdrawAmount = 10
      let balance1 = await token.balanceOf(rewards.address)
      await assertThrows(rewards.withdraw(withdrawAmount, { from: user3 }))    // FAILS
      let tx = await rewards.withdraw(withdrawAmount)
      let balance2 = await token.balanceOf(rewards.address)
      assert.equal(balance2, balance1 - withdrawAmount)
    })
  })
})
