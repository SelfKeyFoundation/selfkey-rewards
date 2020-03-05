pragma solidity ^0.5.3;

import '../DIDLedger.sol';
import '../RewardPool.sol';
import '../StakingVault.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol';


/**
 *  SelfKey Semi-automated Rewards Pool (beta)
 */
contract MockRandomRewardPool is RewardPool {
    using SafeMath for uint256;
    using SafeERC20 for ERC20;

    uint256 public nonce = 0;

    event RandomRewardAllocated(address winnerAddress, bytes32 winnerDID, uint256 amount, uint256 random);

    constructor(
        address _token,
        address _staking,
        address _ledger,
        uint256 _rewardSize,
        uint256 _rewardWindow
    ) RewardPool(_token, _staking, _ledger, _rewardSize, _rewardWindow) public {}

    function random() internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.number, block.difficulty, now)));
    }

    /**
     * @dev MOCK allocateReward function. Picks the last one of the list always to cover worst case
     */
    function allocateReward() internal returns (address) {
        uint256 totalStake = staking.getTotalStake();
        require(totalStake > 0, "total stake must be above zero");

        uint256 randomNumber = random() % totalStake;
        bytes32 winnerDID = staking.getDIDByStakeNumber(randomNumber);
        address controller = ledger.getController(winnerDID);

        emit RandomRewardAllocated(controller, winnerDID, rewardSize, randomNumber);
        return controller;
    }
}