pragma solidity ^0.5.3;

import './StakingVault.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol';

/**
 *  SelfKey Semi-automated Rewards Pool (beta)
 */
contract RewardsPool {
    using SafeMath for uint256;
    using SafeERC20 for ERC20;

    ERC20 public token;
    StakingVault public staking;

    uint256 public nonce = 0;
    uint256 public rewardSize = 1;
    uint256 public lastReward = 0;
    uint256 public rewardWindow = 30 days;

    event RewardAllocated(address winner, uint256 amount, uint256 random);

    constructor(address _token, address _staking) public {
        token = ERC20(_token);
        staking = StakingVault(_staking);
    }

    function random() public view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.number, block.difficulty, nonce)));
    }

    function getRandomLimit() public view returns (uint256) {
        //nonce++;
        uint256 limit = staking.getTotalStake();
        require(limit > 0, "limit must be above zero");
        return random() % limit;
    }

    function allocateReward() public returns (address) {
        require(token.balanceOf(address(this)) >= rewardSize, "not enough funds in the contract");
        require(now >= lastReward + rewardWindow, "cannot trigger reward yet");
        lastReward = now;
        uint256 randomLimit = getRandomLimit();
        address winner = staking.getAddressbyWeightedSelection(randomLimit);
        token.safeTransfer(winner, rewardSize);
        emit RewardAllocated(winner, rewardSize, randomLimit);

        return winner;
    }
}