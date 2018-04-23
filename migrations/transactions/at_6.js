const Interact = require("../../utils/Interact");
const Keys = require("../../keys");
const [, , networkName] = process.argv;
const interact = Interact(networkName);
const { Eth, eth, contracts, provider } = interact;

(async () => {
  const keys = Keys(networkName);
  const { Eth, eth, contracts, provider } = interact;
  const { HodlFor } = contracts;
  const deployer = provider.address;
  const ops = { from: deployer };

  // transfer ownership to athene
  await HodlFor.transferOwnership(keys.athene, ops)
    .then(console.log)
    .catch(console.log);
})();
