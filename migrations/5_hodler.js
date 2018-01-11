const Deploy = require("../utils/Deploy");
const Keys = require("../keys");
const Hodler = artifacts.require("./Hodler.sol");

const start = async (deployer, network, accounts) => {
  if (network === "develop") return;

  const keys = Keys(network);
  const deploy = Deploy(deployer, network);
  const contracts = require(`../build/addresses-${network}.json`);
  const [owner] = accounts;

  // --> deploy hodler
  const hodler = await deploy(Hodler, contracts.Purpose, contracts.DUBI);
};

module.exports = start;
