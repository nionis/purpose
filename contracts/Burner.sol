pragma solidity 0.4.18;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "./Purpose.sol";


contract Burner {
  using SafeMath for uint256;

  Purpose public purpose;
  address public supplier;
  uint256 public start;
  uint256 public lastBurn;
  uint256 public burnPerweiYearly;
  uint256 constant public MAXPERWEI = 1 ether;

  function Burner (address _purpose, address _supplier, uint256 _start, uint256 _burnPerweiYearly) {
    require(_purpose != address(0));
    require(_supplier != address(0));
    require(_start > 0);
    require(_burnPerweiYearly > 0 && _burnPerweiYearly <= MAXPERWEI);

    purpose = Purpose(_purpose);
    supplier = _supplier;
    start = _start;
    lastBurn = _start;
    burnPerweiYearly = _burnPerweiYearly;
  }
  
  function burn () external {
    // get how much purpose will be burned
    uint256 amount = burnable();
    require(amount > 0);

    // update state
    lastBurn = now;

    // burn purpose
    assert(purpose.supplyBurn(amount));
  }

  function burnable () public view returns (uint256) {
    // seconds since last burn
    uint256 secsPassed = now.sub(lastBurn);
    // how much percent to burn
    uint256 perweiToBurn = secsPassed.mul(burnPerweiYearly).div(1 years);

    // balance of supplier
    uint256 balance = purpose.balanceOf(supplier);
    // how much purpose to burn
    uint256 amount = balance.mul(perweiToBurn).div(MAXPERWEI);

    // return how much would be burned
    if (amount > balance) return balance;
    return amount;
  }
}