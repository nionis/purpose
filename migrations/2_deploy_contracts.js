const Deploy = require("./helpers/Deploy");
const { addresses } = require("../keys");

const Purpose = artifacts.require("./Purpose.sol");
const DUBI = artifacts.require("./DUBI.sol");
const Burner = artifacts.require("./Burner.sol");
const Hodler = artifacts.require("./Hodler.sol");
const Crowdsale = artifacts.require("./Crowdsale.sol");

const burnStart = +new Date() / 1e3;
const burnPerweiYearly = web3.toWei(0.2, "ether"); // 20% per year
const purposeWeiRate = 6; // ~100$ of ether (24/12/17)
const etherWeiRate = 1; // 6/1

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

  // --> crowdsale
  const crowdsale = await deploy(
    Crowdsale,
    addresses.atheneWallet,
    purpose.address,
    purposeWeiRate,
    etherWeiRate
  );

  // -> Ownable & RBAC permissions
  // - adding RBAC roles
  // allow burner to burn purpose
  await purpose.adminAddRole(burner.address, "burn");
  // allow hodler to transfer purpose
  await purpose.adminAddRole(hodler.address, "transfer");
  // allow hodler to mint dubi
  await dubi.adminAddRole(hodler.address, "mint");

  // - tranfering ownership
  // transfer ownership to athene
  await dubi.adminAddRole(addresses.athene, "admin");
  await hodler.transferOwnership(addresses.athene);
  await crowdsale.transferOwnership(addresses.athene);

  // // - removing roles
  // // disallow deployer to change roles
  await purpose.adminRemoveRole(owner, "admin");
  await dubi.adminRemoveRole(owner, "admin");

  /* after migration
    permissions:
      purpose: nobody can change anything
      burner: nobody can change anything
      crowdsale: athene can pause / change rate
      dubi: athene can change who mints
      hodler: athene can change dubi address

    todo:
      athene needs to whitelist crowdsale to be able to pull purpose from him
  */
};

module.exports = (deployer, network, accounts) => {
  if (network === "develop") return;

  return start(deployer, network, accounts).catch(console.error);
};
