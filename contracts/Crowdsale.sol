pragma solidity 0.4.18;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "zeppelin-solidity/contracts/token/ERC20.sol";
import "zeppelin-solidity/contracts/token/SafeERC20.sol";


contract Crowdsale is Ownable, Pausable {
  using SafeMath for uint256;
  using SafeERC20 for ERC20;

  // token being sold
  ERC20 public token;

  // address where funds are collected
  address public wallet;

  // rate (purpose wei per eth wei)
  uint256 public rate;

  // amount of raised wei
  uint256 public weiRaised = 0;

  // amount of tokens raised (in wei)
  uint256 public weiTokensRaised = 0;

  /**
   * event for token purchase logging
   * @param purchaser who paid for the tokens
   * @param beneficiary who got the tokens
   * @param value weis paid for purchase
   * @param amount amount of tokens purchased
   */
  event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);

  function Crowdsale(address _wallet, address _token, uint256 _rate, address _owner) {
    require(_wallet != address(0));
    require(_token != address(0));

    wallet = _wallet;
    token = ERC20(_token);
    setRate(_rate);
    owner = _owner;
  }

  // fallback function can be used to buy tokens
  function () payable {
    buyTokens(msg.sender);
  }

  // change rate
  function setRate(uint256 _rate) public onlyOwner {
    require(_rate > 0);
    
    rate = _rate;
  }

  // low level token purchase function
  function buyTokens(address beneficiary) public payable whenNotPaused {
    require(beneficiary != address(0));
    require(validPurchase());

    uint256 weiAmount = msg.value;

    // calculate token amount to be created
    uint256 tokens = weiAmount.mul(rate);

    // update state
    weiRaised = weiRaised.add(weiAmount);
    weiTokensRaised = weiTokensRaised.add(tokens);

    // transfer
    token.safeTransferFrom(owner, beneficiary, tokens);

    // logs
    TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);

    // forward funds to wallet
    forwardFunds();
  }

  // send ether to the fund collection wallet
  // override to create custom fund forwarding mechanisms
  function forwardFunds() internal {
    wallet.transfer(msg.value);
  }

  // @return true if the transaction can buy tokens
  function validPurchase() internal view returns (bool) {
    bool nonZeroPurchase = msg.value != 0;
    return !paused && nonZeroPurchase;
  }
}