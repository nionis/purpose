const { increaseTime, duration } = require("./helpers/increaseTime");
const latestTime = require("./helpers/latestTime");
const expectThrow = require("./helpers/expectThrow");
const AccurateEnough = require("./helpers/AccurateEnough");
const DUBI = artifacts.require("DUBI");
const Gatherer = artifacts.require("Gatherer");

contract("Gatherer", function(accounts) {
  const [owner, user1, user2, taxer1] = accounts;
  const zeroAddr = "0x0";
  const taxPerwei50 = new web3.BigNumber(web3.toWei(0.5, "ether"));
  const taxPerwei100 = new web3.BigNumber(web3.toWei(1, "ether"));
  const gathererRate = new web3.BigNumber("1268391679");
  let dubi;
  let gatherer;

  const accurateSeconds = AccurateEnough(60);
  const calcSeconds = minted => {
    const seconds = new web3.BigNumber(minted).div(gathererRate);
    return seconds;
  };
  const calcTax = (minted, perwei) => {
    const tax = new web3.BigNumber(minted)
      .times(perwei)
      .div(1e18)
      .round();
    return tax;
  };
  const isSecondsAccurateEnough = (seconds, minted) => {
    const _seconds = calcSeconds(minted);
    const diff = _seconds.minus(seconds);

    accurateSeconds(diff);
  };

  beforeEach(async function() {
    dubi = await DUBI.new();
    gatherer = await Gatherer.new(dubi.address, gathererRate);

    await dubi.adminAddRole(gatherer.address, "mint");
  });

  it("initial", async function() {
    const isAllowed = await gatherer.isAllowed(user1);
    assert.isFalse(isAllowed);
  });

  it("allow", async function() {
    await gatherer.allow(user1, taxer1, taxPerwei50);

    const isAllowed = await gatherer.isAllowed(user1);
    assert.isTrue(isAllowed);
  });

  it("allow twice", async function() {
    await gatherer.allow(user1, taxer1, taxPerwei50);
    await expectThrow(gatherer.allow(user1, taxer1, taxPerwei50));
  });

  it("disallow", async function() {
    await gatherer.allow(user1, taxer1, taxPerwei50);
    await gatherer.disallow(user1);

    const isAllowed = await gatherer.isAllowed(user1);
    assert.isFalse(isAllowed);
  });

  it("disallow twice", async function() {
    await gatherer.allow(user1, taxer1, taxPerwei50);

    await gatherer.disallow(user1);
    await expectThrow(gatherer.disallow(user1));
  });

  it("mintable when not allowed", async function() {
    const mintable = await gatherer.mintable(user1);

    assert.isTrue(mintable.equals(0));
  });

  it("mintable after 1 day", async function() {
    const seconds = duration.days(1);

    await gatherer.allow(user1, zeroAddr, 0);

    await increaseTime(seconds);

    const mintable = await gatherer.mintable(user1);

    isSecondsAccurateEnough(seconds, mintable);
  });

  it("gather when not allowed", async function() {
    const user1DubiBefore = await dubi.balanceOf(user1);

    await gatherer.gatherFor(user1);

    const user1DubiAfter = await dubi.balanceOf(user1);

    assert.isTrue(user1DubiBefore.equals(user1DubiAfter));
    assert.isTrue(user1DubiAfter.equals(0));
  });

  it("change rate falsy", async function() {
    const belowMinRate = gathererRate.div(100).minus(1);
    const aboveMaxRate = gathererRate.times(100).plus(1);

    await expectThrow(gatherer.changeRate(belowMinRate));
    await expectThrow(gatherer.changeRate(aboveMaxRate));
  });

  it("change rate 10x", async function() {
    const newRate = gathererRate.times(10);
    await gatherer.changeRate(newRate);

    const rate = await gatherer.rate();

    assert.isTrue(newRate.equals(rate));
  });

  it("change rate while disabled", async function() {
    await gatherer.disableCanChangeRate();

    await expectThrow(gatherer.changeRate(gathererRate));
  });

  it("gatherFor more than 100% tax", async function() {
    const seconds = duration.days(1);

    await expectThrow(gatherer.allow(user1, taxer1, taxPerwei100.plus(1)));
  });

  it("gatherFor no tax", async function() {
    const seconds = duration.days(1);

    await gatherer.allow(user1, zeroAddr, 0);

    await increaseTime(seconds);

    await gatherer.gatherFor(user1);

    const user1Dubi = await dubi.balanceOf(user1);
    const taxerDubi = await dubi.balanceOf(zeroAddr);

    isSecondsAccurateEnough(seconds, user1Dubi.plus(taxerDubi));
    assert.isTrue(taxerDubi.equals(0));
  });

  it("gatherFor tax 50%", async function() {
    const seconds = duration.days(1);

    await gatherer.allow(user1, taxer1, taxPerwei50);

    await increaseTime(seconds);

    await gatherer.gatherFor(user1);

    const user1Dubi = await dubi.balanceOf(user1);
    const taxerDubi = await dubi.balanceOf(taxer1);

    const minted = user1Dubi.plus(taxerDubi);
    const taxerDubiEst = calcTax(minted, taxPerwei50);

    isSecondsAccurateEnough(seconds / 2, user1Dubi);
    isSecondsAccurateEnough(seconds / 2, taxerDubi);
    isSecondsAccurateEnough(seconds, minted);
    assert.isTrue(taxerDubi.equals(taxerDubiEst));
  });

  it("gatherFor tax 50% change to 100%", async function() {
    const seconds = duration.days(1);

    await gatherer.allow(user1, taxer1, taxPerwei50);

    await increaseTime(seconds);

    await gatherer.changeTax(user1, taxer1, taxPerwei100);

    await increaseTime(seconds);

    await gatherer.gatherFor(user1);

    const user1Dubi = await dubi.balanceOf(user1);
    const taxerDubi = await dubi.balanceOf(taxer1);

    const minted = user1Dubi.plus(taxerDubi);
    const taxerDubiEst = calcTax(minted, taxPerwei100);

    assert.isTrue(user1Dubi.equals(0));
    isSecondsAccurateEnough(seconds * 2, user1Dubi.plus(taxerDubi));
    assert.isTrue(taxerDubi.equals(taxerDubiEst));
  });

  it("gather", async function() {
    const seconds = duration.days(1);

    await gatherer.allow(user1, zeroAddr, 0);

    await increaseTime(duration.days(1));

    await gatherer.gather({
      from: user1
    });

    const user1Dubi = await dubi.balanceOf(user1);
    const taxerDubi = await dubi.balanceOf(zeroAddr);

    isSecondsAccurateEnough(seconds, user1Dubi.plus(taxerDubi));
    assert.isTrue(taxerDubi.equals(0));
  });

  it("gatherForMulti", async function() {
    await gatherer.allow(user1, taxer1, taxPerwei50);
    await gatherer.allow(user2, taxer1, taxPerwei50);

    await increaseTime(duration.days(1));

    const dubiBalanceBefore1 = await dubi.balanceOf(user1);
    const dubiBalanceBefore2 = await dubi.balanceOf(user1);
    await gatherer.gatherForMulti([user1, user2]);
    const dubiBalanceAfter1 = await dubi.balanceOf(user1);
    const dubiBalanceAfter2 = await dubi.balanceOf(user1);

    assert.isTrue(dubiBalanceBefore1.lessThan(dubiBalanceAfter1));
    assert.isTrue(dubiBalanceBefore2.lessThan(dubiBalanceAfter2));
  });

  it("gatherFor: 1 year", async function() {
    const seconds = duration.years(1);

    await gatherer.allow(user1, zeroAddr, 0);

    await increaseTime(seconds);

    await gatherer.gatherFor(user1);

    const user1Dubi = await dubi.balanceOf(user1);
    const taxerDubi = await dubi.balanceOf(zeroAddr);

    isSecondsAccurateEnough(seconds, user1Dubi.plus(taxerDubi));
    assert.isTrue(taxerDubi.equals(0));
  });

  it("gatherFor: 1 minute", async function() {
    const seconds = duration.minutes(1);

    await gatherer.allow(user1, zeroAddr, 0);

    await increaseTime(seconds);

    await gatherer.gatherFor(user1);

    const user1Dubi = await dubi.balanceOf(user1);
    const taxerDubi = await dubi.balanceOf(zeroAddr);

    isSecondsAccurateEnough(seconds, user1Dubi.plus(taxerDubi));
    assert.isTrue(taxerDubi.equals(0));
  });

  it("gatherFor: 1 minute, 0.005%", async function() {
    const seconds = duration.minutes(1);

    const perwei = web3.toWei(0.05, "ether");
    await gatherer.allow(user1, taxer1, perwei);

    await increaseTime(seconds);

    await gatherer.gatherFor(user1);

    const user1Dubi = await dubi.balanceOf(user1);
    const taxerDubi = await dubi.balanceOf(taxer1);

    const minted = user1Dubi.plus(taxerDubi);
    const taxerDubiEst = calcTax(minted, perwei);

    isSecondsAccurateEnough(seconds, user1Dubi.plus(taxerDubi));
    assert.isTrue(taxerDubi.equals(taxerDubiEst));
  });

  it("gatherFor: 10 years, 0.0000001%", async function() {
    const seconds = duration.years(10);
    const perwei = web3.toWei(0.000001, "ether");

    await gatherer.allow(user1, taxer1, perwei);

    await increaseTime(seconds);

    await gatherer.gatherFor(user1);

    const user1Dubi = await dubi.balanceOf(user1);
    const taxerDubi = await dubi.balanceOf(taxer1);

    const minted = user1Dubi.plus(taxerDubi);
    const taxerDubiEst = calcTax(minted, perwei);

    isSecondsAccurateEnough(seconds, minted);
    assert.isTrue(taxerDubi.equals(taxerDubiEst));
  });
});
