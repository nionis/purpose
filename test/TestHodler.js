const { advanceToBlock } = require("./helpers/advanceToBlock");
const { increaseTime, duration } = require("./helpers/increaseTime");
const getCurrentBlock = require("./helpers/getCurrentBlock");
const latestTime = require("./helpers/latestTime");
const expectThrow = require("./helpers/expectThrow");
const randomId = require("./helpers/randomId");
const AccurateEnough = require("./helpers/AccurateEnough");
const Purpose = artifacts.require("Purpose");
const DUBI = artifacts.require("DUBI");
const Hodler = artifacts.require("Hodler");

contract("Hodler", function(accounts) {
  const [owner, user] = accounts;
  const purposeInput = new web3.BigNumber(web3.toWei(100, "ether"));
  let purpose;
  let dubi;
  let hodler;

  const accurateSeconds = AccurateEnough(60);
  const isMonthsAcurrateEnough = (months, dubiAmount, purposeAmount) => {
    if (purposeAmount.equals(0)) return 0;

    const _months = new web3.BigNumber(100)
      .times(dubiAmount)
      .times(3)
      .div(purposeAmount.mul(1));
    const diff = _months.minus(months);

    accurateSeconds(duration.months(diff));
  };
  const isOwnerMonthsAcurrateEnough = (months, dubiAmount, purposeAmount) => {
    if (purposeAmount.equals(0)) return 0;

    const _months = new web3.BigNumber(10000)
      .times(dubiAmount)
      .times(3)
      .div(purposeAmount.mul(5));
    const diff = _months.minus(months);

    accurateSeconds(duration.months(diff));
  };

  beforeEach(async function() {
    purpose = await Purpose.new(owner);
    dubi = await DUBI.new();
    hodler = await Hodler.new(purpose.address, dubi.address);

    await purpose.transfer(user, purposeInput);
    await purpose.adminAddRole(hodler.address, "transfer");
    await dubi.adminAddRole(hodler.address, "mint");
  });

  it("wrong months", async function() {
    const id = randomId();

    await expectThrow(hodler.hodl(id, purposeInput, 1));
  });

  it("small number", async function() {
    const id = randomId();
    const months = 3;

    await expectThrow(hodler.hodl(id, 1000, months));
  });

  it("create item twice", async function() {
    const id = randomId();
    const months = 3;

    await hodler.hodl(id, purposeInput, months);
    await expectThrow(hodler.hodl(id, purposeInput, months));
  });

  it("amounts, 3 months", async function() {
    const id = randomId();
    const months = 3;

    const prpsBalanceBefore = await purpose.balanceOf(user);
    const prpsBalanceHodlerBefore = await purpose.balanceOf(hodler.address);
    const dubiBalanceBefore = await dubi.balanceOf(user);
    const ownerDubiBalanceBefore = await dubi.balanceOf(owner);

    await hodler.hodl(id, purposeInput, months, {
      from: user
    });

    const prpsBalanceAfter = await purpose.balanceOf(user);
    const prpsBalanceHodlerAfter = await purpose.balanceOf(hodler.address);
    const dubiBalanceAfter = await dubi.balanceOf(user);
    const ownerDubiBalanceAfter = await dubi.balanceOf(owner);

    assert.isTrue(
      prpsBalanceBefore.minus(purposeInput).equals(prpsBalanceAfter)
    );
    assert.isTrue(
      prpsBalanceHodlerBefore.plus(purposeInput).equals(prpsBalanceHodlerAfter)
    );
    isMonthsAcurrateEnough(months, dubiBalanceAfter, purposeInput);
    isOwnerMonthsAcurrateEnough(months, ownerDubiBalanceAfter, purposeInput);
  });

  it("amounts, 6 months", async function() {
    const id = randomId();
    const months = 6;

    const prpsBalanceBefore = await purpose.balanceOf(user);
    const prpsBalanceHodlerBefore = await purpose.balanceOf(hodler.address);
    const dubiBalanceBefore = await dubi.balanceOf(user);
    const ownerDubiBalanceBefore = await dubi.balanceOf(owner);

    await hodler.hodl(id, purposeInput, months, {
      from: user
    });

    const prpsBalanceAfter = await purpose.balanceOf(user);
    const prpsBalanceHodlerAfter = await purpose.balanceOf(hodler.address);
    const dubiBalanceAfter = await dubi.balanceOf(user);
    const ownerDubiBalanceAfter = await dubi.balanceOf(owner);

    assert.isTrue(
      prpsBalanceBefore.minus(purposeInput).equals(prpsBalanceAfter)
    );
    assert.isTrue(
      prpsBalanceHodlerBefore.plus(purposeInput).equals(prpsBalanceHodlerAfter)
    );
    isMonthsAcurrateEnough(months, dubiBalanceAfter, purposeInput);
    isOwnerMonthsAcurrateEnough(months, ownerDubiBalanceAfter, purposeInput);
  });

  it("amounts, 12 months", async function() {
    const id = randomId();
    const months = 12;

    const prpsBalanceBefore = await purpose.balanceOf(user);
    const prpsBalanceHodlerBefore = await purpose.balanceOf(hodler.address);
    const dubiBalanceBefore = await dubi.balanceOf(user);
    const ownerDubiBalanceBefore = await dubi.balanceOf(owner);

    await hodler.hodl(id, purposeInput, months, {
      from: user
    });

    const prpsBalanceAfter = await purpose.balanceOf(user);
    const prpsBalanceHodlerAfter = await purpose.balanceOf(hodler.address);
    const dubiBalanceAfter = await dubi.balanceOf(user);
    const ownerDubiBalanceAfter = await dubi.balanceOf(owner);

    assert.isTrue(
      prpsBalanceBefore.minus(purposeInput).equals(prpsBalanceAfter)
    );
    assert.isTrue(
      prpsBalanceHodlerBefore.plus(purposeInput).equals(prpsBalanceHodlerAfter)
    );
    isMonthsAcurrateEnough(months, dubiBalanceAfter, purposeInput);
    isOwnerMonthsAcurrateEnough(months, ownerDubiBalanceAfter, purposeInput);
  });

  it("getItem", async function() {
    const id = randomId();
    const months = 3;
    const releaseTime = new web3.BigNumber(duration.months(months)).add(
      latestTime()
    );

    await hodler.hodl(id, purposeInput, months);

    const itemRes = await hodler.getItem(owner, id);
    const [_id, beneficiary, value, _releaseTime, fulfilled] = itemRes;

    assert.isTrue(_id.equals(id));
    assert.equal(beneficiary, owner);
    assert.isTrue(value.equals(purposeInput));
    accurateSeconds(_releaseTime.minus(releaseTime));
    assert.isFalse(fulfilled);
  });

  it("release early", async function() {
    const id = randomId();
    const months = 3;

    await hodler.hodl(id, purposeInput, months);

    await increaseTime(duration.months(1));

    await expectThrow(hodler.release(id));
  });

  it("release", async function() {
    const id = randomId();
    const months = 3;
    const releaseTime = new web3.BigNumber(duration.months(months)).add(
      latestTime()
    );

    await hodler.hodl(id, purposeInput, months);

    await increaseTime(duration.months(months));

    const prpsBalanceBefore = await purpose.balanceOf(owner);
    const prpsBalanceHodlerBefore = await purpose.balanceOf(hodler.address);

    await hodler.release(id);

    const prpsBalanceAfter = await purpose.balanceOf(owner);
    const prpsBalanceHodlerAfter = await purpose.balanceOf(hodler.address);

    // balance check
    assert.isTrue(
      prpsBalanceBefore.plus(purposeInput).equals(prpsBalanceAfter)
    );
    assert.isTrue(
      prpsBalanceHodlerBefore.minus(purposeInput).equals(prpsBalanceHodlerAfter)
    );

    // item check
    const itemRes = await hodler.getItem(owner, id);
    const [_id, beneficiary, value, _releaseTime, fulfilled] = itemRes;

    assert.isTrue(_id.equals(id));
    assert.equal(beneficiary, owner);
    assert.isTrue(value.equals(purposeInput));
    accurateSeconds(_releaseTime.minus(releaseTime));
    assert.isTrue(fulfilled);
  });

  it("release twice", async function() {
    const id = randomId();
    const months = 3;

    await hodler.hodl(id, purposeInput, months);

    await increaseTime(duration.months(months));

    await hodler.release(id);
    await expectThrow(hodler.release(id));
  });

  it("change dubi address", async function() {
    const newDubi = await DUBI.new();

    await hodler.changeDubiAddress(newDubi.address);

    const dubiAddress = await hodler.dubi();

    assert.equal(newDubi.address, dubiAddress);
  });
});
