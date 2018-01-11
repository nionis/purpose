pragma solidity 0.4.18;

import "zeppelin-solidity/contracts/token/SafeERC20.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./Purpose.sol";
import "./DUBI.sol";
import "./Hodler.sol";


contract HodlFor is Ownable {
  using SafeERC20 for Purpose;
  using SafeERC20 for DUBI;

  Purpose public purpose;
  DUBI public dubi;
  Hodler public hodler;

  struct Item {
    uint256 id;
    address creator;
    address beneficiary;
    bool fulfilled;
  }

  mapping(address => mapping(uint256 => Item)) private items;

  function HodlFor(address _purpose, address _dubi, address _hodler) public {
    require(_purpose != address(0));
    require(_hodler != address(0));

    purpose = Purpose(_purpose);
    changeDubiAddress(_dubi);
    hodler = Hodler(_hodler);
  }

  function changeDubiAddress(address _dubi) public onlyOwner {
    require(_dubi != address(0));

    dubi = DUBI(_dubi);
  }

  function hodl(address _beneficiary, uint256 _id, uint256 _value, uint256 _months) external {
    require(_beneficiary != address(0));
    require(_id > 0);

    address _creator = msg.sender;

    // get item
    Item storage item = items[_creator][_id];
    // make sure item doesnt exist
    require(item.id != _id);

    // update state
    items[_creator][_id] = Item(_id, _creator, _beneficiary, false);

    // get tokens from creator to this contract
    purpose.safeTransferFrom(_creator, this, _value);
    
    // hodl tokens
    hodler.hodl(_id, _value, _months);

    // send DUBI to beneficiary
    uint256 balance = dubi.balanceOf(this);
    dubi.safeTransfer(_beneficiary, balance);
  }

  function release(address _creator, uint256 _id) external {
    require(_creator != address(0));
    require(_id > 0);

    address _beneficiary = msg.sender;

    // get item
    Item storage item = items[_creator][_id];
    // check if it exists
    require(item.id == _id);
    // check if its not already fulfilled
    require(!item.fulfilled);
    // check if beneficiary is same
    require(item.beneficiary == _beneficiary);

    // update state
    item.fulfilled = true;

    // release tokens to this contract
    hodler.release(item.id);

    // transfer tokens from this contract to beneficiary
    uint256 balance = purpose.balanceOf(this);
    purpose.safeTransfer(_beneficiary, balance);
  }

  function getItem(address _creator, uint256 _id) public view returns (uint256, address, address, bool) {
    Item storage item = items[_creator][_id];

    return (
      item.id,
      item.creator,
      item.beneficiary,
      item.fulfilled
    );
  }
}