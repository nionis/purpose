const getCurrentBlock = () => web3.eth.getBlock("latest").timestamp;

module.exports = getCurrentBlock;