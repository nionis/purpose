const repl = require("repl");
const contract = require("truffle-contract");
const [, , network] = process.argv;
const { networks } = require("./truffle-config");

// check if network exists
if (!Object.keys(networks).includes(network)) {
  return console.error(`network ${network} not found in truffle config`);
}

// get addresses deployed in network
const addresses = require(`./build/addresses-${network}.json`);

// initiate contracts
const contracts = Object.entries(addresses).reduce((all, [name, addr]) => {
  const config = require(`./build/contracts/${name}.json`);
  const instance = contract(config);
  instance.setProvider(networks[network].provider);

  all[name] = instance.at(addresses[name]);

  return all;
}, {});

// start repl
const session = repl.start({ prompt: "> " });
session.context.contracts = contracts;
