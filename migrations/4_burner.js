const Deploy = require("../utils/Deploy");
const Keys = require("../keys");
const Burner = artifacts.require("./Burner.sol");

const start = async (deployer, network, accounts) => {
  if (network === "develop") return;

  const keys = Keys(network);
  const deploy = Deploy(deployer, network);
  const contracts = require(`../build/addresses-${network}.json`);
  const [owner] = accounts;

  const burnStart = +new Date() / 1e3;
  const burnPerweiYearly = web3.toWei(0.2, "ether"); // 20% per year

  // --> deploy burner
  const burner = await deploy(
    Burner,
    contracts.Purpose,
    keys.athene,
    burnStart,
    burnPerweiYearly
  );
};

module.exports = start;
