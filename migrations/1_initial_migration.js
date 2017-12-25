const Deploy = require("./helpers/Deploy");
const Migrations = artifacts.require("./Migrations.sol");

module.exports = async (deployer, network, accounts) => {
  const deploy = Deploy(deployer);

  await deploy(Migrations);
};
