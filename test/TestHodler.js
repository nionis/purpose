const { advanceToBlock } = require("./helpers/advanceToBlock");
const { increaseTime, duration } = require("./helpers/increaseTime");
const getCurrentBlock = require("./helpers/getCurrentBlock");
const latestTime = require("./helpers/latestTime");
const expectThrow = require("./helpers/expectThrow");
const randomId = require("./helpers/randomId");
const AccurateEnough = require("./helpers/AccurateEnough");
const Purpose = artifacts.require("Purpose");
const Ubi = artifacts.require("Ubi");
const Hodler = artifacts.require("Hodler");

contract("Hodler", function(accounts) {
  const [owner] = accounts;
  const purposeInput = new web3.BigNumber(web3.toWei(100, "ether"));
  let purpose;
  let ubi;
  let hodler;

  const accurateSeconds = AccurateEnough(60);
  const calcMonths = (ubiAmount, purposeAmount) => {
    if (purposeAmount.equals(0)) return 0;

    const months = new web3.BigNumber(100)
      .times(ubiAmount)
      .times(3)
      .div(purposeAmount);

    return months;
  };
  const isMonthsAcurrateEnough = (months, ubiAmount, purposeAmount) => {
    const _months = calcMonths(ubiAmount, purposeAmount);
    const diff = _months.minus(months);

    accurateSeconds(duration.months(diff));
  };

  beforeEach(async function() {
    purpose = await Purpose.new(owner);
    ubi = await Ubi.new();
    hodler = await Hodler.new(purpose.address, ubi.address);

    await purpose.adminAddRole(hodler.address, "transfer");
    await ubi.adminAddRole(hodler.address, "mint");
  });

  it("wrong months", async function() {
    const id = randomId();

    await expectThrow(hodler.hodl(id, purposeInput, 1));
  });

  it("small number", async function() {
    const id = randomId();
    const months = 3;

    await expectThrow(hodler.hodl(id, 1, months));
  });

  it("create item twice", async function() {
    const id = randomId();
    const months = 3;

    await hodler.hodl(id, purposeInput, months);
    await expectThrow(hodler.hodl(id, purposeInput, months));
  });

  it("amounts", async function() {
    const id = randomId();
    const months = 3;

    const prpsBalanceBefore = await purpose.balanceOf(owner);
    const prpsBalanceHodlerBefore = await purpose.balanceOf(hodler.address);
    const ubiBalanceBefore = await ubi.balanceOf(owner);

    await hodler.hodl(id, purposeInput, months);

    const prpsBalanceAfter = await purpose.balanceOf(owner);
    const prpsBalanceHodlerAfter = await purpose.balanceOf(hodler.address);
    const ubiBalanceAfter = await ubi.balanceOf(owner);

    assert.isTrue(
      prpsBalanceBefore.minus(purposeInput).equals(prpsBalanceAfter)
    );
    assert.isTrue(
      prpsBalanceHodlerBefore.plus(purposeInput).equals(prpsBalanceHodlerAfter)
    );
    isMonthsAcurrateEnough(3, ubiBalanceAfter, purposeInput);
  });

  it("getItem", async function() {
    const id = randomId();
    const months = 3;
    const releaseTime = new web3.BigNumber(duration.months(months)).add(
      latestTime()
    );

    await hodler.hodl(id, purposeInput, months);

    const itemRes = await hodler.getItem(id);
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
    const itemRes = await hodler.getItem(id);
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
});
