pragma solidity ^0.5.3;

import './StakingVault.sol';
import './DIDLedger.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol';


/**
 *  SelfKey Semi-automated Rewards Pool (beta)
 */
contract RewardPool is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for ERC20;

    ERC20 public token;
    StakingVault public staking;
    DIDLedger public ledger;

    uint256 public lastReward = 0;
    uint256 public rewardSize = 1;
    uint256 public rewardWindow = 30 days;

    event RewardAllocated(address winnerAddress, uint256 amount);

    constructor(
        address _token,
        address _staking,
        address _ledger,
        uint256 _rewardSize,
        uint256 _rewardWindow
    )
        public
    {
        token = ERC20(_token);
        staking = StakingVault(_staking);
        ledger = DIDLedger(_ledger);
        rewardSize = _rewardSize;
        rewardWindow = _rewardWindow;
    }

    function allocateReward() internal returns (address) {
    }

    function setRewardSize(uint256 _newSize) public onlyOwner {
        require(_newSize > 0, "reward size must be greater than zero");
        rewardSize = _newSize;
    }

    function setRewardWindow(uint256 _newWindow) public onlyOwner {
        rewardWindow = _newWindow;
    }

    function withdrawFunds(uint256 amount) public onlyOwner {
        token.safeTransfer(msg.sender, amount);
    }

    function doAllocate() public returns (bool) {
        require(token.balanceOf(address(this)) >= rewardSize, "not enough funds in the contract");
        require(now >= lastReward + rewardWindow, "cannot trigger reward yet");

        lastReward = now;
        address winnerAddress = allocateReward();

        if(winnerAddress != address(0)) {
            token.safeTransfer(winnerAddress, rewardSize);
        }

        emit RewardAllocated(winnerAddress, rewardSize);
        return true;
    }
}