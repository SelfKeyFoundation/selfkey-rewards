//const helper = require("./utils/truffleTestHelper");
const assertThrows = require("./utils/assertThrows")
const helper = require("./utils/truffleTestHelper");
const txHelpers = require("./utils/txHelpers")
const timeTravel = require("./utils/timeTravel")

const StakingVault = artifacts.require('./StakingVault.sol')
const MockToken = artifacts.require('./MockToken.sol')
const RewardsPool = artifacts.require('./RewardsPool.sol')


contract('StakingVault', accounts => {
  const [user1, user2, user3, user4, user5] = accounts.slice(0)

  //const ANSWER = 42

  let staking, token, rewards

  before(async () => {
    token = await MockToken.new()
    assert.notEqual(token, undefined)
    
    staking = await StakingVault.new(token.address)
    assert.notEqual(staking, undefined)

    rewards = await RewardsPool.new(token.address, staking.address)
    assert.notEqual(rewards, undefined)

    // initialize senders' funds
    await token.freeMoney(user1, 999999)
    await token.freeMoney(user2, 999999)
    await token.freeMoney(user4, 999999)
    await token.freeMoney(user5, 999999)
    await token.freeMoney(rewards.address, 20000000)

    await token.approve(staking.address, 999999, { from: user2 })
    await token.approve(staking.address, 999999, { from: user4 })
    await token.approve(staking.address, 999999, { from: user5 })
    //await token.freeMoney(user3, 1000)
  })

  context('Deposits', () => {
    it("sender that has not approved can't deposit KEY", async () => {
      await assertThrows(staking.deposit(1000, { from: user1 }))
    })

    it("sender without funds can't deposit KEY", async () => {
      await assertThrows(staking.deposit(2000, { from: user3 }))
    })

    it("sender cannot attempt to deposit zero KEY", async () => {
      await assertThrows(staking.deposit(0, { from: user2 }))
    })

    it("sender with approved amount of KEY can deposit", async () => {
      let amount = 1000
      let tx = await staking.deposit(amount, { from: user2 })
      let depositBalance = await staking.balances.call(user2)
      let indexTest = await staking.indexes.call(0)

      assert.equal(indexTest, user2)
      assert.notEqual(txHelpers.getLog(tx, "KEYStaked"), null)
      assert.equal(Number(depositBalance), amount)

      // additional stakes for reward testing
      await staking.deposit(5000, { from: user4 })
      await staking.deposit(4000, { from: user5 })
    })
  })

  context('Rewards', () => {
    xit("generates random number", async () => {
      let tx = rewards.random({ from: user1 })
      // whatever (random method should emit event if public)
    })

    it("allocates reward", async () => {
      let tx = await rewards.allocateReward({ from: user1 })
      let rand = "Random number = " + Number(txHelpers.getLog(tx, "RewardAllocated").args.random)
      
      switch(txHelpers.getLog(tx, "RewardAllocated").args.winner) {
        case user2:
          console.log("Winner is user2! " + rand)
          break;
        case user4:
          console.log("Winner is user4! " + rand)
          break;
        case user5:
          console.log("Winner is user5! " + rand)
          break;
      }

      console.log(tx.receipt.gasUsed)
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
        switch(txHelpers.getLog(tx, "RewardAllocated").args.winner) {
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
  })
})