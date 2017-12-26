const HDWalletProvider = require("truffle-hdwallet-provider");
const { mnemonic, infuraKey } = require("./keys");

module.exports = {
  networks: {
    rinkeby: {
      provider: new HDWalletProvider(
        mnemonic,
        `https://rinkeby.infura.io/${infuraKey}`
      ),
      network_id: 3
    }
  }
};
