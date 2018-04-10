// deploy contract and save its address

const path = require("path");
const fs = require("fs");
const buildPath = path.join(__dirname, "..", "build");

const Deploy = (deployer, network) => async (contract, ...args) => {
  await deployer.deploy(contract, ...args);
  const deployed = contract.at(contract.address);

  const filePath = `${path.join(buildPath, `addresses-${network}`)}.json`;
  const file = require(filePath);
  file[deployed.constructor.contractName] = deployed.address;

  fs.writeFileSync(filePath, JSON.stringify(file, null, 2));

  return deployed;
};

module.exports = Deploy;
