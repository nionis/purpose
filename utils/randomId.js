const randomId = () => {
  return web3.BigNumber.random()
    .times(1e6)
    .round();
};

module.exports = randomId;
