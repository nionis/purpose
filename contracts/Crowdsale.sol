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

  // rate 6/1 (6 token uints for 1 wei)
  uint256 public purposeWeiRate = 6;
  uint256 public etherWeiRate = 1;

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

  function Crowdsale(address _wallet, address _token, uint256 _purposeWeiRate, uint256 _etherWeiRate, address _owner) {
    require(_wallet != address(0));
    require(_token != address(0));

    wallet = _wallet;
    token = ERC20(_token);
    setRate(_purposeWeiRate, _etherWeiRate);
    owner = _owner;
  }

  // fallback function can be used to buy tokens
  function () payable {
    buyTokens(msg.sender);
  }

  // change rate
  function setRate(uint256 _purposeWeiRate, uint256 _etherWeiRate) public onlyOwner {
    require(_purposeWeiRate > 0);
    require(_etherWeiRate > 0);
    
    purposeWeiRate = _purposeWeiRate;
    etherWeiRate = _etherWeiRate;
  }

  // low level token purchase function
  function buyTokens(address beneficiary) public payable whenNotPaused {
    require(beneficiary != address(0));
    require(validPurchase());

    uint256 weiAmount = msg.value;

    // calculate token amount to be created
    uint256 tokens = weiAmount.div(etherWeiRate).mul(purposeWeiRate);

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