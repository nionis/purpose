const Interact = require("../../utils/Interact");
const Keys = require("../../keys");
const [, , networkName] = process.argv;
const interact = Interact(networkName);
const { Eth, eth, contracts, provider } = interact;

(async () => {
  const keys = Keys(networkName);
  const { Eth, eth, contracts, provider } = interact;
  const { Purpose, DUBI, Hodler, Crowdsale } = contracts;
  const deployer = provider.address;
  const ops = { from: deployer };

  // disallow deployer to change roles
  await Purpose.adminRemoveRole(deployer, "admin", ops)
    .then(console.log)
    .catch(console.log);
  // disallow deployer to change roles
  await DUBI.adminRemoveRole(deployer, "admin", ops)
    .then(console.log)
    .catch(console.log);
})();
