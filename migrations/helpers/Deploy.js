// deploy contract and save its address

const path = require("path");
const fs = require("fs");
const buildPath = path.join(__dirname, "..", "..", "build");
const addressesFile = `${path.join(buildPath, "addresses")}.json`;

const Deploy = deployer => async (contract, ...args) => {
  await deployer.deploy(contract, ...args);
  const deployed = contract.at(contract.address);

  const file = require(addressesFile);
  file[deployed.constructor.contractName] = deployed.address;

  fs.writeFileSync(addressesFile, JSON.stringify(file, null, 2));

  return deployed;
};

module.exports = Deploy;
