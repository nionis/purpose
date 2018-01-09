const Deploy = require("./helpers/Deploy");
const Keys = require("../keys");
const Purpose = artifacts.require("./Purpose.sol");
const DUBI = artifacts.require("./DUBI.sol");
const Hodler = artifacts.require("./Hodler.sol");
const Crowdsale = artifacts.require("./Crowdsale.sol");

const start = async (deployer, network, accounts) => {
  if (network === "develop") return;

  const keys = Keys(network);
  const deploy = Deploy(deployer, network);
  const contracts = require(`../build/addresses-${network}.json`);
  const [owner] = accounts;

  const purpose = Purpose.at(contracts.Purpose);
  const dubi = DUBI.at(contracts.DUBI);
  const hodler = Hodler.at(contracts.Hodler);
  const crowdsale = Crowdsale.at(contracts.Crowdsale);

  // -> Ownable & RBAC permissions
  await Promise.all([
    // allow burner to burn purpose
    purpose.adminAddRole(contracts.Burner, "burn"),
    // allow hodler to transfer purpose
    purpose.adminAddRole(contracts.Hodler, "transfer"),
    // allow hodler to mint dubi
    dubi.adminAddRole(contracts.Hodler, "mint")
  ]);

  await Promise.all([
    // transfer ownership to athene
    dubi.adminAddRole(keys.athene, "admin"),
    // transfer ownership to athene
    hodler.transferOwnership(keys.athene),
    // transfer ownership to athene
    crowdsale.transferOwnership(keys.wallet)
  ]);

  await Promise.all([
    // disallow deployer to change roles
    purpose.adminRemoveRole(owner, "admin"),
    // disallow deployer to change roles
    dubi.adminRemoveRole(owner, "admin")
  ]);
};

module.exports = start;
