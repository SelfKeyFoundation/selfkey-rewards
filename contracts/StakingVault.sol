pragma solidity ^0.5.3;

//import './SelfKeyToken.sol';
//import "selfkey-token/contracts/SelfKeyToken.sol";
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';


contract StakingVault {
    using SafeMath for uint256;

    ERC20 public token;
    //uint256 public depositSize = 100;

    mapping(address => uint256) public balances;
    uint256 public totalStake;
    address[] public indexes;

    event KEYStaked(address from, uint256 amount);

    constructor(ERC20 _token) public {
        token = ERC20(_token);
    }

    function deposit(uint256 amount) public {
        require(amount > 0, "Deposit amount must be greater than zero");

        if(balances[msg.sender] == 0) {
            indexes.push(msg.sender);
        }
        balances[msg.sender] += amount;
        totalStake = totalStake + amount;
        token.transferFrom(msg.sender, address(this), amount);
        emit KEYStaked(msg.sender, amount);
    }

    function getAddressByIndex(uint256 index) public view returns (address) {
        require(indexes[index] != address(0), "invalid index");
        return indexes[index];
    }

    function getBalanceByIndex(uint256 index) public view returns (uint256) {
        require(indexes[index] != address(0), "invalid index");
        return balances[indexes[index]];
    }

    function getTotalStake() public view returns (uint256) {
        return totalStake;
    }

    function getAddressbyWeightedSelection(uint256 random) public view returns (address) {
        require(totalStake > 0, "total stake must be above zero");
        require(random <= totalStake, "random number must be less than total stake");

        uint256 limit = random;
        uint256 i = 0;

        while(balances[indexes[i]] < limit) {
            limit = limit - balances[indexes[i]];
            i++;
        }

        return indexes[i];
    }
}