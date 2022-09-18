require('hardhat-deploy');
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require('dotenv').config();
require('@nomicfoundation/hardhat-toolbox');

require("./tasks/unrug");
require("./tasks/rescuewdoge");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    solidity: {
        version: "0.8.10",
        settings: {
            optimizer: {
                enabled: true,
                runs: 1000,
            },
        },
    },
    networks: {
        hardhat: {
            forking: {
                url: "https://rpc.ankr.com/bsc",
                blockNumber: 21279994
            },
            // initialDate: Date.now().toString(),
        },
        // testnet: {
        //     url: "https://rpc-testnet.dogechain.dog",
        //     accounts: [process.env.PRIVATE_KEY]
        // },
        dogechain: {
            url: "https://dogechain.ankr.com",
            accounts: [process.env.PRIVATE_KEY]
        },
        bsc: {
            url: "https://bsc-dataseed.binance.org",
            accounts: [process.env.PRIVATE_KEY]
        }
    },
    namedAccounts: {
        deployer: 0,
    },
    etherscan: {
        apiKey: {
            mainnet: process.env.ETHERSCAN_KEY,
            ropsten: process.env.ETHERSCAN_KEY
        }
    }
};