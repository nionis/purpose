pragma solidity 0.4.18;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/ownership/rbac/RBAC.sol";
import "./Ubi.sol";


contract Gatherer is RBAC {
  using SafeMath for uint256;

  struct Item {
    bool allowed;
    uint256 lastGather;
    address taxReceiver;
    uint256 taxPerwei;
  }

  mapping(address => Item) private items;

  Ubi public ubi;
  uint256 public rate;
  bool public canChangeRate = true;
  uint256 constant public MAXPERWEI = 1 ether;

  function Gatherer(address _ubi, uint256 _rate) {
    require(_ubi != address(0));

    ubi = Ubi(_ubi);
    changeRate(_rate);
  }

  // this makes it impossible to change the rate
  function disableCanChangeRate() external onlyAdmin {
    canChangeRate = false;
  }
  
  // allow user to gather ubi
  function allow(address _user, address _taxReceiver, uint256 _taxPerwei) external onlyAdmin {
    require(_user != address(0));

    Item item = items[_user];
    require(!item.allowed);

    item.allowed = true;
    item.lastGather = now;
    changeTax(_user, _taxReceiver, _taxPerwei);
  }

  // disallow user from gathering ubi
  function disallow(address _user) external onlyAdmin {
    require(_user != address(0));

    Item item = items[_user];
    require(item.allowed);

    item.allowed = false;
  }

  function gather() external {
    gatherFor(msg.sender);
  }

  function gatherForMulti(address[] _users) external {
    uint256 i = 0;
    while (i < _users.length) {
      gatherFor(_users[i]);
      i++;
    }
  }

  function changeRate(uint256 _rate) public onlyAdmin {
    require(_rate >= 12683916 && _rate <= 126839167900);
    require(canChangeRate);

    rate = _rate;
  }

  function changeTax(address _user, address _taxReceiver, uint256 _taxPerwei) public onlyAdmin {
    require(_user != address(0));
    require(_taxPerwei >= 0 && _taxPerwei <= MAXPERWEI);

    Item item = items[_user];

    item.taxReceiver = _taxReceiver;
    item.taxPerwei = _taxPerwei;
  }

  function isAllowed(address _user) public view returns (bool) {
    return items[_user].allowed;
  }

  function gatherFor(address _user) public {
    require(_user != address(0));

    Item item = items[_user];
    require(item.allowed);
    require(item.lastGather < now);

    // get seconds difference from lastGather
    uint256 secsDiff = now.sub(item.lastGather);
    // get amount of UBI for user
    uint256 userAmount = secsDiff.mul(rate);
    uint256 taxAmount = 0;

    // calculate tax amount and update amounts
    if (item.taxReceiver != address(0) && item.taxPerwei > 0) {
      taxAmount = userAmount.mul(item.taxPerwei).div(MAXPERWEI);
      userAmount = userAmount.sub(taxAmount);
    }

    // update state
    item.lastGather = now;

    if (userAmount > 0) {
      assert(ubi.mintUbi(_user, userAmount));
    }
    
    if (taxAmount > 0) {
      assert(ubi.mintUbi(item.taxReceiver, taxAmount));  
    }
  }
}