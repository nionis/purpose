const { increaseTime, duration } = require("./helpers/increaseTime");
const getCurrentBlock = require("./helpers/getCurrentBlock");
const latestTime = require("./helpers/latestTime");
const AccurateEnough = require("./helpers/AccurateEnough");
const Purpose = artifacts.require("Purpose");
const Burner = artifacts.require("Burner");

contract("Burner", function(accounts) {
  const [owner] = accounts;
  const supplier = owner;
  const burnPerweiYearly = web3.toWei(0.2, "ether");
  let purpose;
  let burner;

  const accurateSeconds = AccurateEnough(60);
  const calcSeconds = (balance, burnable) => {
    if (balance.equals(0)) return 0;

    const seconds = new web3.BigNumber(1e18)
      .times(burnable)
      .times(duration.years(1))
      .div(balance.times(burnPerweiYearly));

    return seconds;
  };
  const isSecondsAcurrateEnough = (seconds, balance, burnable) => {
    const _seconds = calcSeconds(balance, burnable);
    const diff = _seconds.minus(seconds);

    accurateSeconds(diff);
  };

  beforeEach(async function() {
    purpose = await Purpose.new(owner);
    burner = await Burner.new(
      purpose.address,
      supplier,
      latestTime(),
      burnPerweiYearly
    );

    // allow burner to burn suppliers purpose
    await purpose.adminAddRole(burner.address, "burn");
  });

  it("after 1 minute no burn", async function() {
    const seconds = duration.minutes(1);
    const balance = await purpose.balanceOf(supplier);

    await increaseTime(seconds);
    const burnable = await burner.burnable();

    isSecondsAcurrateEnough(seconds, balance, burnable);
  });

  it("after 1 year no burn", async function() {
    const seconds = duration.years(1);
    const balance = await purpose.balanceOf(supplier);

    await increaseTime(seconds);
    const burnable = await burner.burnable();

    isSecondsAcurrateEnough(seconds, balance, burnable);
  });

  it("after 5 years no burn", async function() {
    const seconds = duration.years(5);
    const balance = await purpose.balanceOf(supplier);

    await increaseTime(seconds);
    const burnable = await burner.burnable();

    isSecondsAcurrateEnough(seconds, balance, burnable);
  });

  it("after 6 years no burn", async function() {
    const seconds = duration.years(6);
    const balance = await purpose.balanceOf(supplier);

    await increaseTime(seconds);
    const burnable = await burner.burnable();

    // it should burn only 5 years since 6 years is above suppliers balance
    isSecondsAcurrateEnough(duration.years(5), balance, burnable);
  });

  it("after 1 year", async function() {
    const seconds = duration.years(1);
    await increaseTime(seconds);

    const totalBefore = await purpose.totalSupply();
    const supplierBefore = await purpose.balanceOf(supplier);

    await burner.burn();

    const totalAfter = await purpose.totalSupply();
    const supplierAfter = await purpose.balanceOf(supplier);

    const totalDiff = totalBefore.minus(totalAfter);
    const supplierDiff = supplierBefore.minus(supplierAfter);

    assert.isTrue(totalDiff.equals(supplierDiff));
    isSecondsAcurrateEnough(seconds, supplierBefore, totalDiff);
  });

  it("burn twice in 2 years", async function() {
    const seconds = duration.years(1);

    // year 1
    await increaseTime(seconds);
    await burner.burn();

    // year 2
    const totalBefore = await purpose.totalSupply();
    const supplierBefore = await purpose.balanceOf(supplier);

    await increaseTime(seconds);
    await burner.burn();

    const totalAfter = await purpose.totalSupply();
    const supplierAfter = await purpose.balanceOf(supplier);

    const totalDiff = totalBefore.minus(totalAfter);
    const supplierDiff = supplierBefore.minus(supplierAfter);

    assert.isTrue(totalDiff.equals(supplierDiff));
    isSecondsAcurrateEnough(seconds, supplierBefore, totalDiff);
  });

  it("after 5 years", async function() {
    await increaseTime(duration.years(5));
    await burner.burn();

    const totalAfter = await purpose.totalSupply();
    const supplierAfter = await purpose.balanceOf(supplier);

    assert.isTrue(totalAfter.equals(0));
    assert.isTrue(supplierAfter.equals(0));
  });
});
