const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n🚀 Deploying ThingID to DIDLab Network...\n");

  try {
    // Get signers
    const signers = await hre.ethers.getSigners();
    
    if (!signers || signers.length === 0) {
      console.error("❌ ERROR: No accounts available!");
      console.error("   Please check your .env file");
      process.exit(1);
    }
    
    const deployer = signers[0];
    console.log("📋 Deployment Account:");
    console.log("   Address:", deployer.address);
    
    // Get balance - ethers v6 compatible
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    const balanceInEther = hre.ethers.formatEther(balance);
    console.log("   Balance:", balanceInEther, "TT");
    
    // Get network info
    const network = await hre.ethers.provider.getNetwork();
    console.log("\n🌐 Network Info:");
    console.log("   Chain ID:", network.chainId.toString());
    console.log("   Network Name:", network.name || "DIDLab");
    console.log("   RPC URL:", hre.network.config.url);
    console.log("");

    // Check balance - ethers v6 compatible
    if (balance < hre.ethers.parseEther("0.01")) {
      console.warn("⚠️  WARNING: Very low balance!");
      console.warn("   Current balance:", balanceInEther, "TT");
      console.warn("   You need TT tokens to deploy.");
      console.warn("");
      console.warn("   🪙 Get tokens from: https://faucet.didlab.org");
      console.warn("   📍 Your address:", deployer.address);
      console.warn("");
      process.exit(1);
    }

    // Get contract factory
    console.log("📝 Getting ThingID contract factory...");
    const ThingID = await hre.ethers.getContractFactory("ThingID");
    
    // Deploy contract - ethers v6 syntax
    console.log("🔨 Deploying ThingID contract...");
    console.log("   Please wait, this may take a minute...\n");
    
    const thingid = await ThingID.deploy({
      gasLimit: 3000000n
    });
    
    console.log("⏳ Transaction sent! Waiting for deployment...");
    const deploymentTx = thingid.deploymentTransaction();
    console.log("   Tx Hash:", deploymentTx.hash);
    
    // Wait for deployment - ethers v6 uses waitForDeployment()
    await thingid.waitForDeployment();
    const contractAddress = await thingid.getAddress();

    console.log("\n✅ DEPLOYMENT SUCCESSFUL! 🎉");
    console.log("═══════════════════════════════════════════════════");
    console.log("📍 Contract Address:", contractAddress);
    console.log("🔗 Block Explorer:");
    console.log("   https://explorer.didlab.org/address/" + contractAddress);
    console.log("📦 Deploy Transaction:");
    console.log("   https://explorer.didlab.org/tx/" + deploymentTx.hash);
    console.log("═══════════════════════════════════════════════════\n");
    
    // Verify contract is working
    console.log("📊 Verifying contract...");
    try {
      const version = await thingid.VERSION();
      const networkName = await thingid.NETWORK();
      const totalDevices = await thingid.getTotalDevices();
      
      console.log("   ✓ Contract Version:", version);
      console.log("   ✓ Network Name:", networkName);
      console.log("   ✓ Total Devices:", totalDevices.toString());
      console.log("   ✓ Contract is live and working!\n");
    } catch (error) {
      console.log("   ⚠️  Could not verify contract immediately");
      console.log("   This is normal - contract is deployed!\n");
    }

    // Save deployment info
    const deploymentInfo = {
      network: "DIDLab QBFT",
      chainId: 252501,
      contractAddress: contractAddress,
      contractName: "ThingID",
      deployer: deployer.address,
      deploymentTxHash: deploymentTx.hash,
      timestamp: new Date().toISOString(),
      rpcUrl: "https://eth.didlab.org",
      explorerUrl: "https://explorer.didlab.org/address/" + contractAddress,
      faucetUrl: "https://faucet.didlab.org"
    };

    // Save to root directory
    const deploymentPath = path.join(__dirname, "..", "deployment-info.json");
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("💾 Deployment info saved to: deployment-info.json\n");

    // Save ABI
    try {
      const artifactPath = path.join(
        __dirname,
        "..",
        "artifacts",
        "contracts",
        "ThingID.sol",
        "ThingID.json"
      );
      
      if (fs.existsSync(artifactPath)) {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        
        // Save full ABI
        const abiPath = path.join(__dirname, "..", "ThingID-ABI.json");
        fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
        console.log("📄 Contract ABI saved to: ThingID-ABI.json\n");
      }
    } catch (error) {
      console.log("⚠️  Could not save ABI (not critical)\n");
    }

    // Print next steps
    console.log("📝 NEXT STEPS:");
    console.log("═══════════════════════════════════════════════════");
    console.log("");
    console.log("1️⃣  Update .env file:");
    console.log(`    CONTRACT_ADDRESS=${contractAddress}`);
    console.log("");
    console.log("2️⃣  Update backend/server.js:");
    console.log("    Add this near the top:");
    console.log(`    const CONTRACT_ADDRESS = "${contractAddress}";`);
    console.log("");
    console.log("3️⃣  Update frontend/index.html:");
    console.log("    Add after line 330 (in script section):");
    console.log(`    const CONTRACT_ADDRESS = "${contractAddress}";`);
    console.log("    const CONTRACT_ABI = [/* paste from ThingID-ABI.json */];");
    console.log("");
    console.log("4️⃣  Start backend server:");
    console.log("    cd backend");
    console.log("    npm start");
    console.log("");
    console.log("5️⃣  Test your dApp:");
    console.log("    - Open frontend/index.html in browser");
    console.log("    - Connect MetaMask to DIDLab network");
    console.log("    - Register your first IoT device!");
    console.log("");
    console.log("═══════════════════════════════════════════════════");
    console.log("\n✨ Deployment complete! Your contract is live! ✨\n");

  } catch (error) {
    console.error("\n❌ DEPLOYMENT FAILED!");
    console.error("═══════════════════════════════════════════════════");
    
    if (error.message && error.message.includes("insufficient funds")) {
      console.error("ERROR: Insufficient funds for gas");
      console.error("SOLUTION: Get more TT tokens from https://faucet.didlab.org");
    } else if (error.message && error.message.includes("nonce")) {
      console.error("ERROR: Nonce issue");
      console.error("SOLUTION: Wait a moment and try again");
    } else if (error.message && error.message.includes("network")) {
      console.error("ERROR: Network connection issue");
      console.error("SOLUTION: Check internet and try again");
    } else {
      console.error("ERROR:", error.message || error);
    }
    
    console.error("═══════════════════════════════════════════════════\n");
    process.exit(1);
  }
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Unexpected error:", error);
    process.exit(1);
  });