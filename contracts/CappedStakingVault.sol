pragma solidity ^0.5.3;

import './StakingVault.sol';
/*import './DIDLedger.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';*/
import 'openzeppelin-solidity/contracts/access/roles/WhitelistedRole.sol';


contract CappedStakingVault is StakingVault, WhitelistedRole {
    using SafeMath for uint256;

    uint256 public initialCap;
    mapping(bytes32 => uint256) public caps;

    //event KEYStaked(address from, bytes32 did, uint256 amount);

    constructor(ERC20 _token, address _ledger, uint256 _initialCap) StakingVault(_token, _ledger)
        public
    {
        initialCap = _initialCap;
    }

    function setInitialCap(uint256 newCap) public onlyWhitelistAdmin {
        initialCap = newCap;
    }

    function increaseCap(bytes32 did, uint256 newCap) public onlyWhitelisted {
        caps[did] = newCap;
    }

    function deposit(uint256 amount, bytes32 did) public {
        //require(ledger.getController(did) == msg.sender, "sender is not controller of DID");
        require((caps[did] == 0 && amount == initialCap) || balances[did] + amount <= caps[did], "Invalid amount");
        // try super.deposit()
        if(caps[did] == 0) {
            caps[did] = initialCap;
        }

        if(balances[did] == 0) {
            indexes.push(did);
        }

        balances[did] += amount;
        totalStake = totalStake + amount;
        token.transferFrom(msg.sender, address(this), amount);
        emit KEYStaked(msg.sender, did, amount);
    }
}