const Interact = require("../../utils/Interact")
const Keys = require("../../keys");
const [, , networkName] = process.argv;
const interact = Interact(networkName);
const { Eth, eth, contracts, provider } = interact;

(async () => {
  const keys = Keys(networkName);
  const { Eth, eth, contracts, provider } = interact;
  const { Purpose, DUBI, Hodler, Burner, Crowdsale } = contracts;
  const deployer = provider.address;
  const ops = { from: deployer }

  // allow burner to burn purpose
  await Purpose.adminAddRole(Burner.address, "burn", ops).then(console.log).catch(console.log)
  // allow hodler to transfer purpose
  await Purpose.adminAddRole(Hodler.address, "transfer", ops).then(console.log).catch(console.log)
  // allow hodler to mint dubi
  await DUBI.adminAddRole(Hodler.address, "mint", ops).then(console.log).catch(console.log)

  // transfer ownership to athene
  await DUBI.adminAddRole(keys.athene, "admin", ops).then(console.log).catch(console.log)
  // transfer ownership to athene
  await Hodler.transferOwnership(keys.athene, ops).then(console.log).catch(console.log)
  // transfer ownership to athene
  await Crowdsale.transferOwnership(keys.wallet, ops).then(console.log).catch(console.log)

  // disallow deployer to change roles
  await Purpose.adminRemoveRole(deployer, "admin", ops).then(console.log).catch(console.log)
  // disallow deployer to change roles
  await DUBI.adminRemoveRole(deployer, "admin", ops).then(console.log).catch(console.log)
})();