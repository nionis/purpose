const { increaseTime, duration } = require("./helpers/increaseTime");
const latestTime = require("./helpers/latestTime");
const expectThrow = require("./helpers/expectThrow");
const AccurateEnough = require("./helpers/AccurateEnough");
const Ubi = artifacts.require("Ubi");
const Gatherer = artifacts.require("Gatherer");

contract("Gatherer", function(accounts) {
  const [owner, user1, user2, taxer1] = accounts;
  const zeroAddr = "0x0";
  const taxPerwei50 = new web3.BigNumber(web3.toWei(0.5, "ether"));
  const taxPerwei100 = new web3.BigNumber(web3.toWei(1, "ether"));
  const gathererRate = new web3.BigNumber("1268391679");
  let ubi;
  let gatherer;

  const accurateSeconds = AccurateEnough(60);
  const calcSeconds = minted => {
    const seconds = new web3.BigNumber(minted).div(gathererRate);
    return seconds;
  };
  const calcTax = (minted, percent) => {
    const tax = new web3.BigNumber(minted)
      .times(percent)
      .div(100)
      .round();
    return tax;
  };
  const isSecondsAccurateEnough = (seconds, minted) => {
    const _seconds = calcSeconds(minted);
    const diff = _seconds.minus(seconds);

    accurateSeconds(diff);
  };

  beforeEach(async function() {
    ubi = await Ubi.new();
    gatherer = await Gatherer.new(ubi.address, gathererRate);

    await ubi.adminAddRole(gatherer.address, "mint");
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

    const user1Ubi = await ubi.balanceOf(user1);
    const taxerUbi = await ubi.balanceOf(zeroAddr);

    isSecondsAccurateEnough(seconds, user1Ubi.plus(taxerUbi));
    assert.isTrue(taxerUbi.equals(0));
  });

  it("gatherFor tax 50%", async function() {
    const seconds = duration.days(1);

    await gatherer.allow(user1, taxer1, taxPerwei50);

    await increaseTime(seconds);

    await gatherer.gatherFor(user1);

    const user1Ubi = await ubi.balanceOf(user1);
    const taxerUbi = await ubi.balanceOf(taxer1);

    const minted = user1Ubi.plus(taxerUbi);
    const taxerUbiEst = calcTax(minted, 50);

    isSecondsAccurateEnough(seconds / 2, user1Ubi);
    isSecondsAccurateEnough(seconds / 2, taxerUbi);
    isSecondsAccurateEnough(seconds, minted);
    assert.isTrue(taxerUbi.equals(taxerUbiEst));
  });

  it("gatherFor tax 50% change to 100%", async function() {
    const seconds = duration.days(1);

    await gatherer.allow(user1, taxer1, taxPerwei50);

    await increaseTime(seconds);

    await gatherer.changeTax(user1, taxer1, taxPerwei100);

    await increaseTime(seconds);

    await gatherer.gatherFor(user1);

    const user1Ubi = await ubi.balanceOf(user1);
    const taxerUbi = await ubi.balanceOf(taxer1);

    const minted = user1Ubi.plus(taxerUbi);
    const taxerUbiEst = calcTax(minted, 100);

    assert.isTrue(user1Ubi.equals(0));
    isSecondsAccurateEnough(seconds * 2, user1Ubi.plus(taxerUbi));
    assert.isTrue(taxerUbi.equals(taxerUbiEst));
  });

  it("gather", async function() {
    const seconds = duration.days(1);

    await gatherer.allow(user1, zeroAddr, 0);

    await increaseTime(duration.days(1));

    await gatherer.gather({
      from: user1
    });

    const user1Ubi = await ubi.balanceOf(user1);
    const taxerUbi = await ubi.balanceOf(zeroAddr);

    isSecondsAccurateEnough(seconds, user1Ubi.plus(taxerUbi));
    assert.isTrue(taxerUbi.equals(0));
  });

  it("gatherForMulti", async function() {
    await gatherer.allow(user1, taxer1, taxPerwei50);
    await gatherer.allow(user2, taxer1, taxPerwei50);

    await increaseTime(duration.days(1));

    const ubiBalanceBefore1 = await ubi.balanceOf(user1);
    const ubiBalanceBefore2 = await ubi.balanceOf(user1);
    await gatherer.gatherForMutli([user1, user2]);
    const ubiBalanceAfter1 = await ubi.balanceOf(user1);
    const ubiBalanceAfter2 = await ubi.balanceOf(user1);

    assert.isTrue(ubiBalanceBefore1.lessThan(ubiBalanceAfter1));
    assert.isTrue(ubiBalanceBefore2.lessThan(ubiBalanceAfter2));
  });

  it("gatherFor: 1 year", async function() {
    const seconds = duration.years(1);

    await gatherer.allow(user1, zeroAddr, 0);

    await increaseTime(seconds);

    await gatherer.gatherFor(user1);

    const user1Ubi = await ubi.balanceOf(user1);
    const taxerUbi = await ubi.balanceOf(zeroAddr);

    isSecondsAccurateEnough(seconds, user1Ubi.plus(taxerUbi));
    assert.isTrue(taxerUbi.equals(0));
  });

  it("gatherFor: 1 minute", async function() {
    const seconds = duration.minutes(1);

    await gatherer.allow(user1, zeroAddr, 0);

    await increaseTime(seconds);

    await gatherer.gatherFor(user1);

    const user1Ubi = await ubi.balanceOf(user1);
    const taxerUbi = await ubi.balanceOf(zeroAddr);

    isSecondsAccurateEnough(seconds, user1Ubi.plus(taxerUbi));
    assert.isTrue(taxerUbi.equals(0));
  });

  it("gatherFor: 1 minute, 0.005%", async function() {
    const seconds = duration.minutes(1);

    const percent = "0.005";
    const percentWei = web3.toWei(
      new web3.BigNumber(percent).div(100),
      "ether"
    );
    await gatherer.allow(user1, taxer1, percentWei);

    await increaseTime(seconds);

    await gatherer.gatherFor(user1);

    const user1Ubi = await ubi.balanceOf(user1);
    const taxerUbi = await ubi.balanceOf(taxer1);

    const minted = user1Ubi.plus(taxerUbi);
    const taxerUbiEst = calcTax(minted, percent);

    isSecondsAccurateEnough(seconds, user1Ubi.plus(taxerUbi));
    assert.isTrue(taxerUbi.equals(taxerUbiEst));
  });

  it("gatherFor: 10 years, 0.0000001%", async function() {
    const seconds = duration.years(1);

    const percent = "0.0000001";
    const percentWei = web3.toWei(
      new web3.BigNumber(percent).div(100),
      "ether"
    );
    await gatherer.allow(user1, taxer1, percentWei);

    await increaseTime(seconds);

    await gatherer.gatherFor(user1);

    const user1Ubi = await ubi.balanceOf(user1);
    const taxerUbi = await ubi.balanceOf(taxer1);

    const minted = user1Ubi.plus(taxerUbi);
    const taxerUbiEst = calcTax(minted, percent);

    isSecondsAccurateEnough(seconds, minted);
    assert.isTrue(taxerUbi.equals(taxerUbiEst));
  });
});
