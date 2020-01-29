//const time = require('util')
//const timeTravel = require('./utils/timeTravel')
const helper = require("./utils/truffleTestHelper");

const RewardsPool = artifacts.require('./RewardsPool.sol')


contract('RewardsPool', accounts => {

  //const ANSWER = 42

  let pool

  before(async () => {
    //pool = await RewardsPool.new()
  })

  xit('should generate a random integer given a upper limit', async () => {
    /*let limit = 42
    let result 
    for(var i = 0; i < limit * 3; i++) {
      result = await pool.randomIndex(limit)
      assert.isAtLeast(Number(result), 0)
      assert.isBelow(Number(result), limit)
      await helper.advanceBlock();
    }*/
  })
})