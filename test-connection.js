// Test DIDLab network connection - Works with both ethers v5 and v6
require('dotenv').config();

async function testConnection() {
    console.log("\n🔍 Testing DIDLab Network Connection...\n");
    
    const rpcUrl = process.env.DIDLAB_RPC_URL || "https://eth.didlab.org";
    console.log("RPC URL:", rpcUrl);
    
    try {
        // Try to load ethers - handle both v5 and v6
        let ethers;
        let provider;
        
        try {
            ethers = require('ethers');
            console.log("Ethers version detected:", ethers.version || "6.x");
        } catch (e) {
            console.error("❌ Ethers.js not installed!");
            console.error("Run: npm install ethers");
            process.exit(1);
        }
        
        // Create provider based on version
        console.log("1️⃣  Connecting to provider...");
        
        if (ethers.providers) {
            // Ethers v5
            provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        } else {
            // Ethers v6
            provider = new ethers.JsonRpcProvider(rpcUrl);
        }
        
        // Test basic connection
        console.log("2️⃣  Getting network info...");
        const network = await provider.getNetwork();
        console.log("   ✓ Chain ID:", network.chainId);
        
        // Get block number
        console.log("3️⃣  Getting latest block...");
        const blockNumber = await provider.getBlockNumber();
        console.log("   ✓ Latest Block:", blockNumber);
        
        // Get gas price
        console.log("4️⃣  Getting gas price...");
        const gasPrice = await provider.getFeeData();
        console.log("   ✓ Gas Price available");
        
        // Test wallet if private key provided
        if (process.env.PRIVATE_KEY) {
            console.log("5️⃣  Testing wallet connection...");
            const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
            console.log("   ✓ Wallet Address:", wallet.address);
            
            const balance = await provider.getBalance(wallet.address);
            
            // Format balance based on ethers version
            let balanceFormatted;
            if (ethers.utils && ethers.utils.formatEther) {
                balanceFormatted = ethers.utils.formatEther(balance);
            } else {
                balanceFormatted = ethers.formatEther(balance);
            }
            
            console.log("   ✓ Balance:", balanceFormatted, "TT");
            
            if (balance.toString() === '0') {
                console.log("\n⚠️  WARNING: Balance is 0!");
                console.log("   Get TT tokens from: https://faucet.didlab.org");
                console.log("   Your address:", wallet.address);
            } else {
                console.log("\n✅ You have tokens! Ready to deploy.");
            }
        }
        
        console.log("\n✅ Connection test PASSED! Network is accessible.\n");
        return true;
        
    } catch (error) {
        console.error("\n❌ Connection test FAILED!");
        console.error("═══════════════════════════════════════════════════");
        
        if (error.code === 'NETWORK_ERROR' || error.message.includes('502') || error.message.includes('Bad Gateway')) {
            console.error("ERROR: DIDLab network is currently unavailable (502)");
            console.error("\n🔧 POSSIBLE SOLUTIONS:");
            console.error("1. Wait 5-10 minutes and try again (network might be down)");
            console.error("2. Check https://didlab.org for network status");
            console.error("3. Verify your internet connection");
            console.error("4. Try again later - educational networks can have downtime");
        } else if (error.message.includes('timeout')) {
            console.error("ERROR: Connection timeout");
            console.error("SOLUTION: Check your internet connection");
        } else if (error.message.includes('fetch')) {
            console.error("ERROR: Cannot reach DIDLab RPC");
            console.error("SOLUTION: The network might be temporarily offline");
        } else {
            console.error("ERROR:", error.message);
        }
        
        console.error("\n💡 ALTERNATIVE: Use frontend-only mode for now");
        console.error("   Your frontend works without blockchain!");
        console.error("═══════════════════════════════════════════════════\n");
        return false;
    }
}

testConnection().then((success) => {
    process.exit(success ? 0 : 1);
});