const Deploy = require("../utils/Deploy");
const Keys = require("../keys");
const DUBI = artifacts.require("./DUBI.sol");

const start = async (deployer, network, accounts) => {
  if (network === "develop") return;

  const keys = Keys(network);
  const deploy = Deploy(deployer, network);
  const [owner] = accounts;

  // --> deploy dubi
  const dubi = await deploy(DUBI);
};

module.exports = start;
