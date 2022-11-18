require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
  networks: {
    localhost: {
      url: "HTTP://127.0.0.1:8545",
      timeout: 800000,
      gas: "auto",
      gasPrice: "auto",
    },
    goerli: {
      url: process.env.GOERLI_TESNET_URL,
      accounts: [process.env.ADMIN_ACCOUNT_PRIVATE_KEY],
      timeout: 0,
      gas: "auto",
      gasPrice: "auto",
    },
    matic: {
      // Polygon funciona con MATIC y no ETHER
      url: process.env.MUMBAI_TESNET_URL,
      accounts: [process.env.ADMIN_ACCOUNT_PRIVATE_KEY],
      timeout: 0, // tiempo de espera para terminar el proceso
      gas: "auto", // limite de gas a gastar
      gasPrice: "auto", // precio del gas a pagar
    },
  },
  etherscan: { apiKey: process.env.POLYGONSCAN_API_KEY },
};
