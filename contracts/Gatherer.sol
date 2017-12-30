pragma solidity 0.4.18;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/ownership/rbac/RBAC.sol";
import "./DUBI.sol";


contract Gatherer is RBAC {
  using SafeMath for uint256;

  struct Item {
    bool allowed;
    uint256 lastGather;
    address taxReceiver;
    uint256 taxPerwei;
  }

  mapping(address => Item) private items;

  DUBI public dubi;
  uint256 public rate;
  bool public canChangeRate = true;
  uint256 constant public MAXPERWEI = 1 ether;

  function Gatherer(address _dubi, uint256 _rate) {
    require(_dubi != address(0));

    dubi = DUBI(_dubi);
    changeRate(_rate);
  }

  // this makes it impossible to change the rate
  function disableCanChangeRate() external onlyAdmin {
    canChangeRate = false;
  }

  // change the rate in which dubi is minted
  function changeRate(uint256 _rate) public onlyAdmin {
    require(_rate >= 12683916 && _rate <= 126839167900);
    require(canChangeRate);

    rate = _rate;
  }
  
  // allow user to gather dubi
  function allow(address _user, address _taxReceiver, uint256 _taxPerwei) external onlyAdmin {
    require(_user != address(0));

    Item item = items[_user];
    require(!item.allowed);

    item.allowed = true;
    item.lastGather = now;
    changeTax(_user, _taxReceiver, _taxPerwei);
  }

  // disallow user from gathering dubi
  function disallow(address _user) external onlyAdmin {
    require(_user != address(0));

    Item item = items[_user];
    require(item.allowed);

    item.allowed = false;
  }

  // change user's tax
  function changeTax(address _user, address _taxReceiver, uint256 _taxPerwei) public onlyAdmin {
    require(_user != address(0));
    require(_taxPerwei >= 0 && _taxPerwei <= MAXPERWEI);

    Item item = items[_user];

    item.taxReceiver = _taxReceiver;
    item.taxPerwei = _taxPerwei;
  }

  // returns true if user is allowed to gather
  function isAllowed(address _user) public view returns (bool) {
    return items[_user].allowed;
  }

  // returns user's item
  function getItem(address _user) public view returns (bool, uint256, address, uint256) {
    Item item = items[_user];

    return (
      item.allowed,
      item.lastGather,
      item.taxReceiver,
      item.taxPerwei
    );
  }

  // returns total amount that will be minted
  function mintable(address _user) public view returns (uint256) {
    Item item = items[_user];

    if (!item.allowed) return 0;
    if (item.lastGather >= now) return 0;

    // get seconds difference from lastGather
    uint256 secsDiff = now.sub(item.lastGather);
    // get amount to mint
    uint256 amount = secsDiff.mul(rate);

    return amount;
  }

  // gathers (mints) dubi
  function gatherFor(address _user) public {
    require(_user != address(0));
 
    // get total mint amount
    Item item = items[_user];
    uint256 userAmount = mintable(_user);
    uint256 taxAmount = 0;

    // calculate tax amount and update amounts
    if (item.taxReceiver != address(0) && item.taxPerwei > 0) {
      taxAmount = userAmount.mul(item.taxPerwei).div(MAXPERWEI);
      userAmount = userAmount.sub(taxAmount);
    }

    // update state
    item.lastGather = now;

    // mint dubi
    if (userAmount > 0) {
      assert(dubi.mint(_user, userAmount));
    }
    
    if (taxAmount > 0) {
      assert(dubi.mint(item.taxReceiver, taxAmount));  
    }
  }

  // gatherFor sender
  function gather() external {
    gatherFor(msg.sender);
  }

  // input accepts an array of users and then calls gatherFor
  function gatherForMulti(address[] _users) external {
    uint256 i = 0;
    while (i < _users.length) {
      gatherFor(_users[i]);
      i++;
    }
  }
}