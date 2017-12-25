const Purpose = artifacts.require("Purpose");
const Crowdsale = artifacts.require("Crowdsale");
const expectThrow = require("./helpers/expectThrow");

contract("Crowdsale", function(accounts) {
  const [owner, investor] = accounts;
  const buyAmount = new web3.BigNumber(web3.toWei(1, "ether"));
  const rate1 = 6;
  const rate2 = 12;
  let purpose;
  let crowdsale;

  beforeEach(async function() {
    purpose = await Purpose.new(owner);
    crowdsale = await Crowdsale.new(owner, purpose.address, rate1, owner);

    // allow crowdsale to access owners tokens
    const balanceOfOwner = await purpose.balanceOf(owner);
    await purpose.approve(crowdsale.address, balanceOfOwner);
  });

  it("is paused", async function() {
    const paused = await crowdsale.paused();
    assert.equal(paused, false);
  });

  it("buy when paused", async function() {
    await crowdsale.pause();

    const paused = await crowdsale.paused();
    assert.equal(paused, true);

    await expectThrow(
      crowdsale.buyTokens(investor, {
        from: investor,
        value: buyAmount
      })
    );
  });

  it("sendTransaction rate 1", async function() {
    await crowdsale.sendTransaction({
      from: investor,
      value: buyAmount
    });

    const estimate = buyAmount.times(rate1).round();
    const tokenBalanceAfter = await purpose.balanceOf(investor);

    assert.isTrue(tokenBalanceAfter.equals(estimate));
  });

  it("buyTokens rate 1", async function() {
    await crowdsale.buyTokens(investor, {
      from: investor,
      value: buyAmount
    });

    const estimate = buyAmount.times(rate1).round();
    const tokenBalanceAfter = await purpose.balanceOf(investor);
    assert.isTrue(tokenBalanceAfter.equals(estimate));
  });

  it("buy rate 2", async function() {
    await crowdsale.setRate(rate2);

    await crowdsale.buyTokens(investor, {
      from: investor,
      value: buyAmount
    });

    const estimate = buyAmount.times(rate2).round();
    const tokenBalanceAfter = await purpose.balanceOf(investor);
    assert.isTrue(tokenBalanceAfter.equals(estimate));
  });
});
