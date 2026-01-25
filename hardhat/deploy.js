const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying MemoryMatchProgress to Base Mainnet...\n");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");
  
  if (balance < hre.ethers.parseEther("0.001")) {
    console.error("❌ Insufficient balance! Need at least 0.001 ETH");
    process.exit(1);
  }

  console.log("⏳ Deploying contract...");
  const MemoryMatchProgress = await hre.ethers.getContractFactory("MemoryMatchProgress");
  const contract = await MemoryMatchProgress.deploy();
  
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log("\n✅ MemoryMatchProgress deployed to:", address);
  console.log("\n📋 Next steps:");
  console.log("1. Add to .env:");
  console.log(`   VITE_PROGRESS_CONTRACT_MAINNET=${address}`);
  console.log("\n2. Verify on Basescan:");
  console.log(`   npx hardhat verify --network baseMainnet ${address}`);
  console.log("\n3. Add to Coinbase Paymaster:");
  console.log(`   Contract Address: ${address}`);
  console.log(`   Functions: update(uint8,uint8), batchUpdate(uint8[],uint8[])`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
