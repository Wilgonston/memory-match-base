const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");
  
  if (balance < hre.ethers.parseEther("0.001")) {
    console.log("\n⚠️  Warning: Balance is low!");
    console.log("Need at least 0.001 ETH for deployment");
  } else {
    console.log("\n✅ Balance is sufficient for deployment");
  }
}

main().catch(console.error);
