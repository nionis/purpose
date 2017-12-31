const Gatherer = artifacts.require("./Gatherer.sol");
const gathererRate = 1268391679;

// --> deploy gatherer
const gatherer = await deploy(Gatherer, dubi.address, gathererRate);

// allow gatherer to mint dubi
await dubi.adminAddRole(gatherer.address, "mint");

// add new admin and remove previous
await gatherer.adminAddRole(addresses.athene, "admin");
await gatherer.adminRemoveRole(owner, "admin");