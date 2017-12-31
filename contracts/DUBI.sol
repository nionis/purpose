pragma solidity 0.4.18;

import "zeppelin-solidity/contracts/token/StandardToken.sol";
import "zeppelin-solidity/contracts/token/BurnableToken.sol";
import "zeppelin-solidity/contracts/ownership/rbac/RBAC.sol";


contract DUBI is StandardToken, BurnableToken, RBAC {
  string public constant name = "Decentralized Universal Basic Income";
  string public constant symbol = "DUBI";
  uint8 public constant decimals = 18;
  string constant public ROLE_MINT = "mint";

  event MintLog(address indexed to, uint256 amount);

  function DUBI() {
    totalSupply = 0;
  }

  // used by contracts to mint DUBI tokens
  function mint(address _to, uint256 _amount) external onlyRole(ROLE_MINT) returns (bool) {
    require(_to != address(0));
    require(_amount > 0);

    // update state
    totalSupply = totalSupply.add(_amount);
    balances[_to] = balances[_to].add(_amount);

    // logs
    MintLog(_to, _amount);
    Transfer(0x0, _to, _amount);
    
    return true;
  }
}