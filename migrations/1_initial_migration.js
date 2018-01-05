const Deploy = require("./helpers/Deploy");
const Migrations = artifacts.require("./Migrations.sol");
const Keys = require("../keys");

module.exports = async (deployer, network, accounts) => {
  if (network === "develop") return;

  const deploy = Deploy(deployer);

  // migrations
  await deploy(Migrations);
};
