const Deploy = require("./helpers/Deploy");

const Purpose = artifacts.require("./Purpose.sol");
const Ubi = artifacts.require("./Ubi.sol");
const Burner = artifacts.require("./Burner.sol");
const Hodler = artifacts.require("./Hodler.sol");
const Gatherer = artifacts.require("./Gatherer.sol");
const Crowdsale = artifacts.require("./Crowdsale.sol");

const getNow = () => web3.eth.getBlock("latest").timestamp;
const burnPerweiYearly = web3.toWei(0.2, "ether"); // 20% per year
const crowdsaleRate = 6; // ~100$ of ether (24/12/17)
const gathererRate = 1268391679;

const start = async (deployer, network, accounts) => {
  const deploy = Deploy(deployer);
  const [owner, atheneAddr, atheneAddrWallet] = accounts;

  // --> deploy purpose
  const purpose = await deploy(Purpose, atheneAddr);

  // --> deploy ubi
  const ubi = await deploy(Ubi);

  // --> deploy burner
  const burner = await deploy(
    Burner,
    Purpose.address,
    atheneAddr,
    getNow(),
    burnPerweiYearly
  );

  // --> deploy hodler
  const hodler = await deploy(Hodler, purpose.address, ubi.address);

  // --> deploy gatherer
  const gatherer = await deploy(Gatherer, ubi.address, gathererRate);

  // -> RBAC
  // allow burner to burn purpose
  await purpose.adminAddRole(burner.address, "burn");
  // allow hodler to hodl purpose
  await purpose.adminAddRole(hodler.address, "transfer");
  // allow hodler to mint ubi
  await ubi.adminAddRole(hodler.address, "mint");
  // allow gatherer to mint ubi
  await ubi.adminAddRole(gatherer.address, "mint");
  // disallow admin to change roles
  await purpose.adminRemoveRole(owner, "admin");
  await ubi.adminRemoveRole(owner, "admin");
  // add new admin and remove previous
  await gatherer.adminAddRole(atheneAddr, "admin"); // reese or athene
  await gatherer.adminRemoveRole(owner, "admin");

  // --> crowdsale
  const crowdsale = await deploy(
    Crowdsale,
    atheneAddrWallet,
    purpose.address,
    crowdsaleRate,
    atheneAddr
  );
  // allow crowdsale to transfer from supplier
  const balanceOfAthene = await purpose.balanceOf(atheneAddr);
  await purpose.approve(crowdsale.address, balanceOfAthene);
};

module.exports = (deployer, network, accounts) => {
  if (network === "test") return;

  return start(deployer, network, accounts);
};
