pragma solidity ^0.5.3;

import './DIDLedger.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';


contract StakingVault {
    using SafeMath for uint256;

    ERC20 public token;

    DIDLedger public ledger;
    mapping(bytes32 => uint256) public balances;
    uint256 public totalStake;
    bytes32[] public indexes;

    event KEYStaked(address from, bytes32 did, uint256 amount);

    constructor(ERC20 _token, address _ledger) public {
        token = ERC20(_token);
        ledger = DIDLedger(_ledger);
    }

    function deposit(uint256 amount, bytes32 did) public {
        require(amount > 0, "Deposit amount must be greater than zero");
        //require(ledger.getController(did) == msg.sender, "sender is not controller of DID");

        if(balances[did] == 0) {
            indexes.push(did);
        }

        balances[did] += amount;
        totalStake = totalStake + amount;
        token.transferFrom(msg.sender, address(this), amount);
        emit KEYStaked(msg.sender, did, amount);
    }

    function getTotalStake() public view returns (uint256) {
        return totalStake;
    }

    function getDIDCount() public view returns (uint256) {
        return indexes.length;
    }

    function getIndexes() public view returns (bytes32[] memory) {
        return indexes;
    }

    function balanceOf(bytes32 did) public view returns (uint256) {
        return balances[did];
    }

    function getDIDByStakeNumber(uint256 stakeNumber) public view returns (bytes32) {
        require(stakeNumber < totalStake, "invalid stakeNumber specified for weighted selection");
        uint256 i = 0;
        uint256 selector = stakeNumber;
        while(balances[indexes[i]] < selector) {
            selector = selector - balances[indexes[i]];
            i++;
        }
        return indexes[i];
    }
}