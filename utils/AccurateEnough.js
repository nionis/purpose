/* used when dealing with variables like time */

const AccurateEnough = okDiff => value => {
  const diff = new web3.BigNumber(value);

  assert.isTrue(diff.lessThan(okDiff));
  assert.isTrue(diff.greaterThan(okDiff * -1));
};

module.exports = AccurateEnough;
