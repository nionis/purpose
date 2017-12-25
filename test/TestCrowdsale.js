const Purpose = artifacts.require("Purpose");
const Crowdsale = artifacts.require("Crowdsale");
const expectThrow = require("./helpers/expectThrow");

contract("Crowdsale", function(accounts) {
  const [owner, investor] = accounts;
  const buyAmount = new web3.BigNumber(web3.toWei(1, "ether"));
  const purposeWeiRate6 = 6;
  const purposeWeiRate12 = 12;
  const purposeWeiRate1 = 1;
  const etherWeiRate1 = 1;
  const etherWeiRate2 = 2;
  let purpose;
  let crowdsale;

  const calcTokens = (buyAmount, purposeWeiRate, etherWeiRate) => {
    return new web3.BigNumber(buyAmount)
      .div(etherWeiRate)
      .times(purposeWeiRate)
      .round();
  };

  beforeEach(async function() {
    purpose = await Purpose.new(owner);
    crowdsale = await Crowdsale.new(
      owner,
      purpose.address,
      purposeWeiRate6,
      etherWeiRate1,
      owner
    );

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

  it("change rate", async function() {
    await expectThrow(
      crowdsale.setRate(purposeWeiRate1, etherWeiRate2, {
        from: investor
      })
    );
  });

  it("sendTransaction rate 6/1", async function() {
    await crowdsale.sendTransaction({
      from: investor,
      value: buyAmount
    });

    const estimate = calcTokens(buyAmount, purposeWeiRate6, etherWeiRate1);
    const tokenBalanceAfter = await purpose.balanceOf(investor);

    assert.isTrue(tokenBalanceAfter.equals(estimate));
  });

  it("buyTokens rate 1/2", async function() {
    await crowdsale.setRate(purposeWeiRate1, etherWeiRate2);

    await crowdsale.buyTokens(investor, {
      from: investor,
      value: buyAmount
    });

    const estimate = calcTokens(buyAmount, purposeWeiRate1, etherWeiRate2);
    const tokenBalanceAfter = await purpose.balanceOf(investor);

    assert.isTrue(tokenBalanceAfter.equals(estimate));
  });

  it("buyTokens rate 6/1", async function() {
    await crowdsale.buyTokens(investor, {
      from: investor,
      value: buyAmount
    });

    const estimate = calcTokens(buyAmount, purposeWeiRate6, etherWeiRate1);
    const tokenBalanceAfter = await purpose.balanceOf(investor);

    assert.isTrue(tokenBalanceAfter.equals(estimate));
  });

  it("buy rate 12/1", async function() {
    await crowdsale.setRate(purposeWeiRate12, etherWeiRate1);

    await crowdsale.buyTokens(investor, {
      from: investor,
      value: buyAmount
    });

    const estimate = calcTokens(buyAmount, purposeWeiRate12, etherWeiRate1);
    const tokenBalanceAfter = await purpose.balanceOf(investor);

    assert.isTrue(tokenBalanceAfter.equals(estimate));
  });

  it("buy rate 6/1, 1 wei", async function() {
    const buyAmount = new web3.BigNumber(1);

    await crowdsale.buyTokens(investor, {
      from: investor,
      value: buyAmount
    });

    const estimate = calcTokens(buyAmount, purposeWeiRate6, etherWeiRate1);
    const tokenBalanceAfter = await purpose.balanceOf(investor);

    assert.isTrue(tokenBalanceAfter.equals(estimate));
    assert.isTrue(tokenBalanceAfter.equals(6));
  });

  it("buy rate 1/2, 2 wei", async function() {
    const buyAmount = new web3.BigNumber(2);

    await crowdsale.setRate(purposeWeiRate1, etherWeiRate2);

    await crowdsale.buyTokens(investor, {
      from: investor,
      value: buyAmount
    });

    const estimate = calcTokens(buyAmount, purposeWeiRate1, etherWeiRate2);
    const tokenBalanceAfter = await purpose.balanceOf(investor);

    assert.isTrue(tokenBalanceAfter.equals(estimate));
    assert.isTrue(tokenBalanceAfter.equals(1));
  });

  it("buy rate 6/1, 1e10 wei", async function() {
    const buyAmount = new web3.BigNumber(1e10);

    await crowdsale.buyTokens(investor, {
      from: investor,
      value: buyAmount
    });

    const estimate = calcTokens(buyAmount, purposeWeiRate6, etherWeiRate1);
    const tokenBalanceAfter = await purpose.balanceOf(investor);

    assert.isTrue(tokenBalanceAfter.equals(estimate));
    assert.isTrue(tokenBalanceAfter.equals(6e10));
  });
});
