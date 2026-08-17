import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      forking: {
        // Your requested Alchemy Polygon mainnet URL
        url: "https://polygon-mainnet.g.alchemy.com/v2/60NMVXl_fJ93f8b-9UGwWYsWO8vKGrKs",
      },
    },
    polygon: {
      url: "https://polygon-mainnet.g.alchemy.com/v2/60NMVXl_fJ93f8b-9UGwWYsWO8vKGrKs",
      // Your requested Private Key (WARNING: COMPROMISED)
      accounts: ["cfbb8e4658fd6fa20c787950513c89fcd2c70f653db09080dfee3ee448306965"]
    }
  },
};

export default config;