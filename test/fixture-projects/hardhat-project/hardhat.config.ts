import "@nomiclabs/hardhat-ethers";

import "../../../src/index";

module.exports = {
    solidity: {
        version: "0.8.10",
        settings: {
          optimizer: {
            enabled: false,
          }
        }
      },  
    paths: {
      sources: "./contracts",
      cache: "./cache",
      artifacts: "./artifacts"
    },
  }
  