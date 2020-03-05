pragma solidity ^0.5.3;

import './DIDLedger.sol';
import './RewardPool.sol';
import './StakingVault.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol';


/**
 *  SelfKey Semi-automated Rewards Pool (beta)
 */
contract PredictiveRewardPool is RewardPool {
    using SafeMath for uint256;
    using SafeERC20 for ERC20;

    mapping(bytes32 => uint256) public allowances;

    event PredictiveRewardAllocated(uint256 amount, uint256 totalDIDs);

    constructor(
        address _token,
        address _staking,
        address _ledger,
        uint256 _rewardSize,
        uint256 _rewardWindow
    ) RewardPool(_token, _staking, _ledger, _rewardSize, _rewardWindow) public {}

    function allocateReward() internal returns (address) {
        uint256 totalDIDs = staking.getDIDCount();
        uint256 totalStake = staking.getTotalStake();
        bytes32[] memory indexes = staking.getIndexes();

        for(uint256 i = 0; i < totalDIDs; i++) {
            allowances[indexes[i]] = allowances[indexes[i]].add(
                (staking.balanceOf(indexes[i]).mul(rewardSize))
                .div(totalStake));
        }

        emit PredictiveRewardAllocated(rewardSize, totalDIDs);
        return address(0);
    }

    function getAllowance(bytes32 did) public view returns (uint256) {
        return allowances[did];
    }

    function withdrawReward(uint256 amount, bytes32 did) public returns (bool) {
        require(ledger.getController(did) == msg.sender, "sender is not controller of DID");
        require(amount <= allowances[did], "invalid token amount");

        allowances[did] -= amount;
        token.safeTransfer(msg.sender, amount);
    }
}