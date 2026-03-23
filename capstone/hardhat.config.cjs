require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {},
    rskTestnet: {
      url: "https://public-node.testnet.rsk.co",
      chainId: 31,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      gasPrice: 60000000
    }
  },
  etherscan: {
    apiKey: {
      rskTestnet: "abc" // Dummy key, Rootstock doesn't require one
    },
    customChains: [
      {
        network: "rskTestnet",
        chainId: 31,
        urls: {
          apiURL: "https://explorer.testnet.rootstock.io/api",
          browserURL: "https://explorer.testnet.rootstock.io"
        }
      }
    ]
  },
  sourcify: {
    enabled: false
  },
  paths: {
    tests: "./test"
  }
};
