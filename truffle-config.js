const HDWalletProvider = require("truffle-hdwallet-provider");
const Keys = require("./keys");
const rinkebyKeys = Keys("rinkeby");
const mainnetKeys = Keys("mainnet");

module.exports = {
  networks: {
    develop: {
      host: "127.0.0.1",
      port: 9545,
      network_id: "*"
    },
    rinkeby: {
      provider: new HDWalletProvider(
        rinkebyKeys.mnemonic,
        `https://rinkeby.infura.io/${rinkebyKeys.infuraKey}`
      ),
      network_id: 4
    },
    mainnet: {
      provider: new HDWalletProvider(
        mainnetKeys.mnemonic,
        `https://mainnet.infura.io/${mainnetKeys.infuraKey}`
      ),
      gas: "7000000",
      gasPrice: "2000000000",
      network_id: 1
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};
