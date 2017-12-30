pragma solidity 0.4.18;

import "zeppelin-solidity/contracts/token/SafeERC20.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "./Purpose.sol";
import "./Ubi.sol";


contract Hodler {
  using SafeMath for uint256;
  using SafeERC20 for Purpose;
  using SafeERC20 for Ubi;

  Purpose public purpose;
  Ubi public ubi;

  struct Item {
    uint256 id;
    address beneficiary;
    uint256 value;
    uint256 releaseTime;
    bool fulfilled;
  }

  mapping(address => mapping(uint256 => Item)) private items;

  function Hodler(address _purpose, address _ubi) {
    require(_purpose != address(0));
    require(_ubi != address(0));

    purpose = Purpose(_purpose);
    ubi = Ubi(_ubi);
  }

  function hodl(uint256 _id, uint256 _value, uint256 _months) external {
    require(_id > 0);
    require(_value > 0);
    // only 3 types are allowed
    require(_months == 3 || _months == 6 || _months == 12);

    address _user = msg.sender;

    // turn months to seconds
    uint256 _seconds = _months.mul(2628000);
    // get release time
    uint256 _releaseTime = now.add(_seconds);
    require(_releaseTime > now);

    // calculate percentage to mint: 3 months = 1% => _months / 3 = x
    uint256 percentage = _months.div(3);
    // get ubi amount: => (_value * percentage) / 100
    uint256 ubiAmount = _value.mul(percentage).div(100);

    // check if user has enough balance
    uint256 balance = purpose.balanceOf(_user);
    require(balance >= _value);

      // get ubi item
    Item item = items[_user][_id];

    // make sure ubi doesnt exist already
    require(item.id != _id);

    // update state
    items[_user][_id] = Item(_id, _user, _value, _releaseTime, false);

    // transfer tokens to hodler
    assert(purpose.hodlerTransfer(_user, _value));

    // mint tokens for user
    assert(ubi.mintUbi(_user, ubiAmount));
  }

  function release(uint256 _id) external {
    require(_id > 0);

    address _user = msg.sender;

    // get item
    Item item = items[_user][_id];

    // check if it exists
    require(item.id == _id);
    // check if its not already fulfilled
    require(!item.fulfilled);
    // check time
    require(now >= item.releaseTime);

    // check if there is enough tokens
    uint256 balance = purpose.balanceOf(this);
    require(balance >= item.value);

    // update state
    item.fulfilled = true;

    // transfer tokens to beneficiary
    purpose.safeTransfer(item.beneficiary, item.value);
  }

  function getItem(address _user, uint256 _id) view returns (uint256, address, uint256, uint256, bool) {
    Item item = items[_user][_id];

    return (
      item.id,
      item.beneficiary,
      item.value,
      item.releaseTime,
      item.fulfilled
    );
  }
}