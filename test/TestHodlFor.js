const { increaseTime, duration } = require("../utils/increaseTime");
const expectThrow = require("../utils/expectThrow");
const randomId = require("../utils/randomId");
const Purpose = artifacts.require("Purpose");
const DUBI = artifacts.require("DUBI");
const Hodler = artifacts.require("Hodler");
const HodlFor = artifacts.require("HodlFor");

contract("HodlFor", function(accounts) {
	const [owner, creator, beneficiary, user] = accounts;
	const purposeInput = new web3.BigNumber(web3.toWei(1, "ether"));
	let purpose;
	let dubi;
	let hodler;
	let hodlFor;

	beforeEach(async function() {
		purpose = await Purpose.new();
		dubi = await DUBI.new();
		hodler = await Hodler.new(purpose.address, dubi.address);
		hodlFor = await HodlFor.new(purpose.address, dubi.address, hodler.address);

		// setup permissions
		await purpose.adminAddRole(hodler.address, "transfer");
		await dubi.adminAddRole(hodler.address, "mint");

		// give purpose to creator
		await purpose.mint(owner, new web3.BigNumber(web3.toWei(1e9, "ether")));
		await purpose.transfer(creator, purposeInput);

		// approve hodlFor to use creators tokens
		await purpose.approve(hodlFor.address, purposeInput, {
			from: creator
		});
	});

	it("wrong hodlFor inputs", async function() {
		const id = randomId();
		const months = 3;

		// no beneficiary
		await expectThrow(hodlFor.hodl(0, id, purposeInput, months, {
			from: creator
		}));

		// no id
		await expectThrow(hodlFor.hodl(beneficiary, 0, purposeInput, months, {
			from: creator
		}));

		// no value
		await expectThrow(hodlFor.hodl(beneficiary, id, 0, months, {
			from: creator
		}));

		// invalid months
		await expectThrow(hodlFor.hodl(beneficiary, id, purposeInput, 1, {
			from: creator
		}));
	});

	it("wrong release inputs", async function() {
		const id = randomId();
		const months = 3;

		await hodlFor.hodl(beneficiary, id, purposeInput, months, {
			from: creator
		});

		await increaseTime(duration.months(4));

		// release by wrong beneficiary
		await expectThrow(hodlFor.release(creator, id, {
			from: user
		}));
	});

	it("too early release", async function() {
		const id = randomId();
		const months = 3;

		await hodlFor.hodl(beneficiary, id, purposeInput, months, {
			from: creator
		});

		await increaseTime(duration.months(1));

		await expectThrow(hodlFor.release(creator, id, {
			from: beneficiary
		}));

		const [_id, _creator, _beneficiary, _fulfilled] = await hodlFor.getItem(creator, id);

		assert.isFalse(_fulfilled);
	});

	it("hodl and release", async function() {
		const id = randomId();
		const months = 3;

		const pCreator1 = await purpose.balanceOf(creator);
		const pBeneficiary1 = await purpose.balanceOf(beneficiary);
		const dCreator1 = await dubi.balanceOf(creator);
		const dBeneficiary1 = await dubi.balanceOf(beneficiary);

		await hodlFor.hodl(beneficiary, id, purposeInput, months, {
			from: creator
		});

		const pCreator2 = await purpose.balanceOf(creator);
		const pBeneficiary2 = await purpose.balanceOf(beneficiary);
		const dCreator2 = await dubi.balanceOf(creator);
		const dBeneficiary2 = await dubi.balanceOf(beneficiary);

		await increaseTime(duration.months(4));

		await hodlFor.release(creator, id, {
			from: beneficiary
		});

		const [_id, _creator, _beneficiary, _fulfilled] = await hodlFor.getItem(creator, id);

		const pCreator3 = await purpose.balanceOf(creator);
		const pBeneficiary3 = await purpose.balanceOf(beneficiary);
		const dCreator3 = await dubi.balanceOf(creator);
		const dBeneficiary3 = await dubi.balanceOf(beneficiary);

		assert.isTrue(pCreator1.minus(purposeInput).equals(pCreator2));
		assert.isTrue(dBeneficiary2.greaterThan(0));

		assert.isTrue(pBeneficiary3.equals(purposeInput));
		assert.isTrue(pCreator1.minus(purposeInput).equals(pCreator3));
		assert.isTrue(dCreator3.equals(0));

		assert.isTrue(_fulfilled);
	});
});
