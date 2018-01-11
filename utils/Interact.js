const Eth = require("ethjs");
const { networks } = require("../truffle-config");

const Interact = networkName => {
  // check if network exists
  if (!Object.keys(networks).includes(networkName)) {
    return console.error(`network ${networkName} not found in truffle config`);
  }
  // get provider
  const provider = networks[networkName].provider;

  // get eth
  const eth = new Eth(provider);

  // get addresses deployed in network
  const addresses = require(`../build/addresses-${networkName}.json`);

  // initiate contracts
  const contracts = Object.entries(addresses).reduce((all, [name, addr]) => {
    const config = require(`../build/contracts/${name}.json`);
    const instance = eth.contract(config.abi).at(addr);
    all[name] = instance;

    return all;
  }, {});

  return {
    Eth,
    eth,
    contracts,
    provider
  }
}

module.exports = Interact;