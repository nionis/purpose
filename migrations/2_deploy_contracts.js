const Deploy = require("./helpers/Deploy");
const { addresses } = require("../keys");

const Purpose = artifacts.require("./Purpose.sol");
const DUBI = artifacts.require("./DUBI.sol");
const Burner = artifacts.require("./Burner.sol");
const Hodler = artifacts.require("./Hodler.sol");
const Gatherer = artifacts.require("./Gatherer.sol");
const Crowdsale = artifacts.require("./Crowdsale.sol");

const burnStart = +new Date() / 1e3;
const burnPerweiYearly = web3.toWei(0.2, "ether"); // 20% per year
const purposeWeiRate = 6; // ~100$ of ether (24/12/17)
const etherWeiRate = 1; // 6/1
const gathererRate = 1268391679;

const start = async (deployer, network, accounts) => {
  const deploy = Deploy(deployer);
  const [owner] = accounts;

  // --> deploy purpose
  const purpose = await deploy(Purpose, addresses.athene);

  // --> deploy dubi
  const dubi = await deploy(DUBI);

  // --> deploy burner
  const burner = await deploy(
    Burner,
    Purpose.address,
    addresses.athene,
    burnStart,
    burnPerweiYearly
  );

  // --> deploy hodler
  const hodler = await deploy(Hodler, purpose.address, dubi.address);

  // --> deploy gatherer
  const gatherer = await deploy(Gatherer, dubi.address, gathererRate);

  // -> RBAC
  // allow burner to burn purpose
  await purpose.adminAddRole(burner.address, "burn");
  // allow hodler to hodl purpose
  await purpose.adminAddRole(hodler.address, "transfer");
  // allow hodler to mint dubi
  await dubi.adminAddRole(hodler.address, "mint");
  // allow gatherer to mint dubi
  await dubi.adminAddRole(gatherer.address, "mint");
  // disallow admin to change roles
  await purpose.adminRemoveRole(owner, "admin");
  await dubi.adminRemoveRole(owner, "admin");
  // add new admin and remove previous
  await gatherer.adminAddRole(addresses.athene, "admin");
  await gatherer.adminRemoveRole(owner, "admin");

  // --> crowdsale
  const crowdsale = await deploy(
    Crowdsale,
    addresses.atheneWallet,
    purpose.address,
    purposeWeiRate,
    etherWeiRate,
    addresses.athene
  );
  // allow crowdsale to transfer from supplier (will be called by athene)
  // const balanceOfAthene = await purpose.balanceOf(addresses.athene);
  // await purpose.approve(crowdsale.address, balanceOfAthene, {
  //   from: addresses.athene
  // });
};

module.exports = (deployer, network, accounts) => {
  if (network === "develop") return;

  return start(deployer, network, accounts);
};
