const HDWalletProvider = require("truffle-hdwallet-provider");
const Keys = require("./keys");
const rinkebyKeys = Keys("rinkeby");
const mainnetKeys = Keys("mainnet");

module.exports = {
  networks: {
    rinkeby: {
      provider: new HDWalletProvider(
        rinkebyKeys.mnemonic,
        `https://rinkeby.infura.io/${rinkebyKeys.infuraKey}`
      ),
      network_id: 3
    },
    mainnet: {
      provider: new HDWalletProvider(
        mainnetKeys.mnemonic,
        `https://mainnet.infura.io/${mainnetKeys.infuraKey}`
      ),
      network_id: 1
    }
  }
};
