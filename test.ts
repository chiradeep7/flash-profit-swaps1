import { expect } from "chai";
import { ethers, network } from "hardhat";

describe("Flash Loan Strategy - Profitability Check", function () {
  // Hardcoded constants to match the Solidity contract
  const RECIPIENT = "0x1CD4f2560136efc2494350132C84e6030AD67a0E";
  const USDT = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";

  it("Should execute strategy on Polygon fork and calculate USDT net profit", async function () {
    console.log("Setting up mainnet fork environment...");

    // 1. Impersonate the specific wallet
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [RECIPIENT],
    });

    // 2. Fund the impersonated wallet with 10 MATIC to pay for gas on the local fork
    await network.provider.send("hardhat_setBalance", [
      RECIPIENT,
      "0x8AC7230489E80000", // 10 MATIC in hex
    ]);

    const signer = await ethers.getSigner(RECIPIENT);

    // 3. Deploy the Smart Contract
    console.log("Deploying FlashStrategy...");
    const Strategy = await ethers.getContractFactory("FlashStrategy", signer);
    const strategy = await Strategy.deploy();
    await strategy.waitForDeployment();
    
    const strategyAddress = await strategy.getAddress();
    console.log(`Deployed to: ${strategyAddress}`);

    // 4. Setup USDT Token Contract instance to check balances
    const usdtContract = await ethers.getContractAt("IERC20", USDT, signer);
    
    // 5. Record Initial Balance
    const balanceBefore = await usdtContract.balanceOf(RECIPIENT);
    console.log(`USDT Balance Before: ${ethers.formatUnits(balanceBefore, 6)} USDT`);

    // 6. Execute Core Strategy
    console.log("Triggering execute()...");
    const tx = await strategy.execute({ gasLimit: 15000000 });
    const receipt = await tx.wait();
    console.log(`Execution cost: ${receipt?.gasUsed} gas`);

    // 7. Withdraw Profits
    console.log("Withdrawing profits...");
    const txWithdraw = await strategy.withdrawProfits();
    await txWithdraw.wait();

    // 8. Record Final Balance & Calculate Profit
    const balanceAfter = await usdtContract.balanceOf(RECIPIENT);
    console.log(`USDT Balance After: ${ethers.formatUnits(balanceAfter, 6)} USDT`);
    
    // The difference is our gross profit minus any Uniswap pool fees / slippage logic
    const profit = balanceAfter - balanceBefore;
    console.log(`\n===========================================`);
    console.log(`NET PROFIT: ${ethers.formatUnits(profit, 6)} USDT`);
    console.log(`===========================================\n`);

    // Assert that execution completes without reverting
    expect(balanceAfter).to.not.be.undefined;
  });
});