pragma solidity 0.4.18;

import "zeppelin-solidity/contracts/token/StandardToken.sol";
import "zeppelin-solidity/contracts/token/BurnableToken.sol";
import "zeppelin-solidity/contracts/ownership/rbac/RBAC.sol";


contract Purpose is StandardToken, BurnableToken, RBAC {
  string public constant name = "Purpose";
  string public constant symbol = "PRPS";
  uint8 public constant decimals = 18;
  string constant public ROLE_BURN = "burn";
  string constant public ROLE_TRANSFER = "transfer";
  address public supplier;

  function Purpose(address _supplier) public {
    supplier = _supplier;
    totalSupply = 1000000000 ether;
    balances[supplier] = totalSupply;
  }
  
  // used by burner contract to burn athenes tokens
  function supplyBurn(uint256 _value) external onlyRole(ROLE_BURN) returns (bool) {
    require(_value > 0);

    // update state
    balances[supplier] = balances[supplier].sub(_value);
    totalSupply = totalSupply.sub(_value);

    // logs
    Burn(supplier, _value);

    return true;
  }

  // used by hodler contract to transfer users tokens to it
  function hodlerTransfer(address _from, uint256 _value) external onlyRole(ROLE_TRANSFER) returns (bool) {
    require(_from != address(0));
    require(_value > 0);

    // hodler
    address _hodler = msg.sender;

    // update state
    balances[_from] = balances[_from].sub(_value);
    balances[_hodler] = balances[_hodler].add(_value);

    // logs
    Transfer(_from, _hodler, _value);

    return true;
  }
}