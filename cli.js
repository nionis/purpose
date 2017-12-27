const repl = require("repl");
const contract = require("truffle-contract");
const { networks } = require("./truffle-config");
const addresses = require("./build/addresses-rinkeby.json");
const hodler = require("./build/contracts/Hodler.json");

const contracts = {
  hodler
};

const session = repl.start({ prompt: "> " });

session.context.contract = contract;
session.context.contracts = contracts;

const hodlerContract = contract(contracts.hodler);
hodlerContract.setProvider(networks.rinkeby.provider);

session.context.hodler = hodlerContract.at(addresses.Hodler);
