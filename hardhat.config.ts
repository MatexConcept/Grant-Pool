import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
// const { vars } = require("hardhat/config");
import { vars } from "hardhat/config";
const BASE_CAN_API_KEY = vars.get("BASE_CAN_API_KEY");

const ALCHEMY_API_KEY = vars.get("ALCHEMY_API_KEY");
const config: HardhatUserConfig = {
  solidity: "0.8.27",

  networks: {
    base_sepolia: {
      url: `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: vars.has("PRIVATE_KEY") ? [vars.get("PRIVATE_KEY")] : [],
    },
  },
  etherscan: {
    apiKey: BASE_CAN_API_KEY,
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
    ],
  },
  
};

export default config;


