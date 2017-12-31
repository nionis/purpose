pragma solidity 0.4.18;

import "zeppelin-solidity/contracts/token/SafeERC20.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./Purpose.sol";
import "./DUBI.sol";


contract Hodler is Ownable {
  using SafeMath for uint256;
  using SafeERC20 for Purpose;
  using SafeERC20 for DUBI;

  Purpose public purpose;
  DUBI public dubi;

  struct Item {
    uint256 id;
    address beneficiary;
    uint256 value;
    uint256 releaseTime;
    bool fulfilled;
  }

  mapping(address => mapping(uint256 => Item)) private items;

  function Hodler(address _purpose, address _dubi) {
    require(_purpose != address(0));

    purpose = Purpose(_purpose);
    changeDubiAddress(_dubi);
  }

  function changeDubiAddress(address _dubi) public onlyOwner {
    require(_dubi != address(0));

    dubi = DUBI(_dubi);
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

    // check if user has enough balance
    uint256 balance = purpose.balanceOf(_user);
    require(balance >= _value);

    // calculate percentage to mint for user: 3 months = 1% => _months / 3 = x
    uint256 userPercentage = _months.div(3);
    // get dubi amount: => (_value * userPercentage) / 100
    uint256 userDubiAmount = _value.mul(userPercentage).div(100);

    // calculate percentage * 100 to mint for owner: 3 months = 0.05% => (_months * (0.05 * 100)) / 3 = x * 100
    uint256 ownerPercentage100 = _months.mul(5).div(3);
    // get dubi amount: => (_value * ownerPercentage100) / 100 * 100
    uint256 ownerDubiAmount = _value.mul(ownerPercentage100).div(10000);

    // get dubi item
    Item item = items[_user][_id];

    // make sure dubi doesnt exist already
    require(item.id != _id);

    // update state
    items[_user][_id] = Item(_id, _user, _value, _releaseTime, false);

    // transfer tokens to hodler
    assert(purpose.hodlerTransfer(_user, _value));

    // mint tokens for user and owner
    assert(dubi.mint(_user, userDubiAmount));
    assert(dubi.mint(owner, ownerDubiAmount));
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