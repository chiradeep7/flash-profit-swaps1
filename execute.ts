import { ethers, network } from "hardhat";

async function main() {
  const RECIPIENT = "0x1CD4f2560136efc2494350132C84e6030AD67a0E";
  const USDT = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";

  console.log("Compiling and deploying to local Polygon Fork...");

  // Impersonate your specific wallet so the contract "Auth" check passes
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [RECIPIENT],
  });
  
  // Give the impersonated wallet some MATIC to pay for gas on the fork
  await network.provider.send("hardhat_setBalance", [
    RECIPIENT,
    "0x10000000000000000000", // 10 MATIC
  ]);

  const signer = await ethers.getSigner(RECIPIENT);

  // Deploy Contract
  const Strategy = await ethers.getContractFactory("FlashStrategy", signer);
  const strategy = await Strategy.deploy();
  await strategy.waitForDeployment();
  
  const strategyAddress = await strategy.getAddress();
  console.log(`Strategy deployed to: ${strategyAddress}`);

  // Check balances
  const usdtContract = await ethers.getContractAt("IERC20", USDT, signer);
  const balBefore = await usdtContract.balanceOf(RECIPIENT);
  console.log(`USDT Balance Before: ${ethers.formatUnits(balBefore, 6)}`);

  // Execute Logic
  console.log("Executing Core Logic...");
  const tx = await strategy.execute({ gasLimit: 10000000 });
  await tx.wait();

  // Withdraw
  console.log("Withdrawing Profits...");
  const txWithdraw = await strategy.withdrawProfits();
  await txWithdraw.wait();

  const balAfter = await usdtContract.balanceOf(RECIPIENT);
  console.log(`USDT Balance After: ${ethers.formatUnits(balAfter, 6)}`);
  
  const profit = balAfter - balBefore;
  console.log(`Net Difference: ${ethers.formatUnits(profit, 6)} USDT`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});