// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../MemoryMatchProgress.sol";

/**
 * @title Deploy Script for MemoryMatchProgress
 * @notice Foundry script to deploy the MemoryMatchProgress contract
 * 
 * Usage:
 * forge script contracts/script/Deploy.s.sol:DeployScript --rpc-url <RPC_URL> --broadcast --verify
 */
contract DeployScript is Script {
    function run() external {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy MemoryMatchProgress contract
        MemoryMatchProgress progress = new MemoryMatchProgress();
        
        // Log deployment address
        console.log("MemoryMatchProgress deployed to:", address(progress));
        
        // Stop broadcasting
        vm.stopBroadcast();
        
        // Log next steps
        console.log("\n=== Deployment Complete ===");
        console.log("Contract Address:", address(progress));
        console.log("\nNext Steps:");
        console.log("1. Update .env with contract address");
        console.log("2. Add contract to Coinbase Paymaster allowlist");
        console.log("3. Verify contract on Basescan (if not auto-verified)");
        console.log("\nVerify command:");
        console.log("forge verify-contract --chain-id <CHAIN_ID> --compiler-version v0.8.20", address(progress), "contracts/MemoryMatchProgress.sol:MemoryMatchProgress");
    }
}
