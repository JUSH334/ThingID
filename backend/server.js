// ThingID Backend API Server for DIDLab Network
// Requirements: npm install express ethers dotenv cors helmet express-rate-limit

const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============ MIDDLEWARE ============

app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// ============ CONFIGURATION ============

const DIDLAB_CONFIG = {
    rpcUrl: process.env.DIDLAB_RPC_URL || 'https://eth.didlab.org',
    chainId: 252501,
    contractAddress: process.env.CONTRACT_ADDRESS || '0x5A0d15B2E16b67Bf8dCbd2DfBf147d4A20e5CAC4', // Deploy contract first
    privateKey: process.env.PRIVATE_KEY // For server-side transactions (optional)
};

// ThingID Contract ABI (minimal interface)
const THINGID_ABI = [
    "function registerDevice(string _did, string _name, string _deviceType, string _manufacturer, string _model, string _serialNumber, string _location, string _publicKey) returns (bytes32)",
    "function grantAccess(bytes32 deviceId, address viewer, uint256 duration)",
    "function revokeAccess(bytes32 deviceId, address viewer)",
    "function hasAccess(bytes32 deviceId, address viewer) view returns (bool)",
    "function getDevice(bytes32 deviceId) view returns (tuple(string did, string name, string deviceType, string manufacturer, string model, string serialNumber, string location, string publicKey, address owner, uint256 registeredAt, bool isActive))",
    "function getOwnerDevices(address owner) view returns (bytes32[])",
    "function getDeviceAccessPasses(bytes32 deviceId) view returns (tuple(address device_owner, address viewer, uint256 grantedAt, uint256 expiresAt, bool isActive)[])",
    "function getTotalDevices() view returns (uint256)",
    "function getAccessExpiration(bytes32 deviceId, address viewer) view returns (uint256)",
    "function updateDevice(bytes32 deviceId, string _name, string _location)",
    "function toggleDeviceStatus(bytes32 deviceId)",
    "event DeviceRegistered(bytes32 indexed deviceId, string did, address indexed owner, string name, string deviceType, uint256 timestamp)",
    "event AccessGranted(bytes32 indexed deviceId, address indexed owner, address indexed viewer, uint256 expiresAt, uint256 timestamp)",
    "event AccessRevoked(bytes32 indexed deviceId, address indexed viewer, uint256 timestamp)"
];

// ============ PROVIDER & CONTRACT SETUP ============

let provider;
let contract;
let wallet;

function initializeProvider() {
    try {
        provider = new ethers.providers.JsonRpcProvider(DIDLAB_CONFIG.rpcUrl);
        
        if (DIDLAB_CONFIG.contractAddress) {
            contract = new ethers.Contract(
                DIDLAB_CONFIG.contractAddress,
                THINGID_ABI,
                provider
            );
            
            // If private key is provided, create wallet for server-side txs
            if (DIDLAB_CONFIG.privateKey) {
                wallet = new ethers.Wallet(DIDLAB_CONFIG.privateKey, provider);
                contract = contract.connect(wallet);
            }
        }
        
        console.log('✅ Connected to DIDLab network');
        return true;
    } catch (error) {
        console.error('❌ Failed to connect to DIDLab:', error);
        return false;
    }
}

// ============ HEALTH CHECK ============

app.get('/health', async (req, res) => {
    try {
        const blockNumber = await provider.getBlockNumber();
        const network = await provider.getNetwork();
        
        res.json({
            status: 'healthy',
            network: {
                name: 'DIDLab QBFT',
                chainId: network.chainId,
                blockNumber: blockNumber
            },
            contractAddress: DIDLAB_CONFIG.contractAddress || 'Not deployed',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

// ============ NETWORK INFO ============

app.get('/api/network/info', async (req, res) => {
    try {
        const blockNumber = await provider.getBlockNumber();
        const network = await provider.getNetwork();
        const gasPrice = await provider.getGasPrice();
        
        res.json({
            success: true,
            data: {
                network: 'DIDLab QBFT',
                chainId: network.chainId,
                rpcUrl: DIDLAB_CONFIG.rpcUrl,
                blockNumber: blockNumber,
                gasPrice: ethers.utils.formatUnits(gasPrice, 'gwei') + ' gwei',
                explorer: 'https://explorer.didlab.org',
                faucet: 'https://faucet.didlab.org'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============ DEVICE ENDPOINTS ============

// Register device (client-side transaction - return encoded data)
app.post('/api/devices/register/encode', (req, res) => {
    try {
        const { did, name, deviceType, manufacturer, model, serialNumber, location, publicKey } = req.body;
        
        if (!contract) {
            return res.status(400).json({
                success: false,
                error: 'Contract not initialized'
            });
        }
        
        // Validate required fields
        if (!did || !name || !deviceType || !manufacturer || !model) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }
        
        // Encode the transaction data
        const iface = new ethers.utils.Interface(THINGID_ABI);
        const data = iface.encodeFunctionData('registerDevice', [
            did,
            name,
            deviceType,
            manufacturer,
            model,
            serialNumber || '',
            location || '',
            publicKey || ''
        ]);
        
        res.json({
            success: true,
            data: {
                to: DIDLAB_CONFIG.contractAddress,
                data: data,
                value: '0'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get device by ID
app.get('/api/devices/:deviceId', async (req, res) => {
    try {
        if (!contract) {
            return res.status(400).json({
                success: false,
                error: 'Contract not initialized'
            });
        }
        
        const deviceId = req.params.deviceId;
        const device = await contract.getDevice(deviceId);
        
        res.json({
            success: true,
            data: {
                did: device.did,
                name: device.name,
                deviceType: device.deviceType,
                manufacturer: device.manufacturer,
                model: device.model,
                serialNumber: device.serialNumber,
                location: device.location,
                publicKey: device.publicKey,
                owner: device.owner,
                registeredAt: device.registeredAt.toNumber(),
                isActive: device.isActive
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get devices by owner
app.get('/api/devices/owner/:address', async (req, res) => {
    try {
        if (!contract) {
            return res.status(400).json({
                success: false,
                error: 'Contract not initialized'
            });
        }
        
        const address = req.params.address;
        
        if (!ethers.utils.isAddress(address)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid address'
            });
        }
        
        const deviceIds = await contract.getOwnerDevices(address);
        
        // Fetch full device details
        const devices = await Promise.all(
            deviceIds.map(async (id) => {
                const device = await contract.getDevice(id);
                return {
                    deviceId: id,
                    did: device.did,
                    name: device.name,
                    deviceType: device.deviceType,
                    manufacturer: device.manufacturer,
                    model: device.model,
                    serialNumber: device.serialNumber,
                    location: device.location,
                    owner: device.owner,
                    registeredAt: device.registeredAt.toNumber(),
                    isActive: device.isActive
                };
            })
        );
        
        res.json({
            success: true,
            data: devices
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get total devices
app.get('/api/devices/stats/total', async (req, res) => {
    try {
        if (!contract) {
            return res.status(400).json({
                success: false,
                error: 'Contract not initialized'
            });
        }
        
        const total = await contract.getTotalDevices();
        
        res.json({
            success: true,
            data: {
                totalDevices: total.toNumber()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============ ACCESS CONTROL ENDPOINTS ============

// Grant access (encode transaction)
app.post('/api/access/grant/encode', (req, res) => {
    try {
        const { deviceId, viewer, duration } = req.body;
        
        if (!contract) {
            return res.status(400).json({
                success: false,
                error: 'Contract not initialized'
            });
        }
        
        if (!deviceId || !viewer || !duration) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }
        
        if (!ethers.utils.isAddress(viewer)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid viewer address'
            });
        }
        
        const iface = new ethers.utils.Interface(THINGID_ABI);
        const data = iface.encodeFunctionData('grantAccess', [
            deviceId,
            viewer,
            duration
        ]);
        
        res.json({
            success: true,
            data: {
                to: DIDLAB_CONFIG.contractAddress,
                data: data,
                value: '0'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Check access
app.get('/api/access/check/:deviceId/:viewer', async (req, res) => {
    try {
        if (!contract) {
            return res.status(400).json({
                success: false,
                error: 'Contract not initialized'
            });
        }
        
        const { deviceId, viewer } = req.params;
        
        if (!ethers.utils.isAddress(viewer)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid viewer address'
            });
        }
        
        const hasAccess = await contract.hasAccess(deviceId, viewer);
        const expiration = await contract.getAccessExpiration(deviceId, viewer);
        
        res.json({
            success: true,
            data: {
                hasAccess: hasAccess,
                expiresAt: expiration.toNumber(),
                isExpired: expiration.toNumber() < Math.floor(Date.now() / 1000)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get access passes for device
app.get('/api/access/passes/:deviceId', async (req, res) => {
    try {
        if (!contract) {
            return res.status(400).json({
                success: false,
                error: 'Contract not initialized'
            });
        }
        
        const deviceId = req.params.deviceId;
        const passes = await contract.getDeviceAccessPasses(deviceId);
        
        const formattedPasses = passes.map(pass => ({
            deviceOwner: pass.device_owner,
            viewer: pass.viewer,
            grantedAt: pass.grantedAt.toNumber(),
            expiresAt: pass.expiresAt.toNumber(),
            isActive: pass.isActive,
            isExpired: pass.expiresAt.toNumber() < Math.floor(Date.now() / 1000)
        }));
        
        res.json({
            success: true,
            data: formattedPasses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============ EVENTS ============

// Listen for contract events
app.get('/api/events/devices', async (req, res) => {
    try {
        if (!contract) {
            return res.status(400).json({
                success: false,
                error: 'Contract not initialized'
            });
        }
        
        const fromBlock = req.query.fromBlock || 'latest';
        const filter = contract.filters.DeviceRegistered();
        const events = await contract.queryFilter(filter, fromBlock);
        
        const formattedEvents = events.map(event => ({
            deviceId: event.args.deviceId,
            did: event.args.did,
            owner: event.args.owner,
            name: event.args.name,
            deviceType: event.args.deviceType,
            timestamp: event.args.timestamp.toNumber(),
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash
        }));
        
        res.json({
            success: true,
            data: formattedEvents
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============ UTILITIES ============

// Estimate gas for transaction
app.post('/api/utils/estimate-gas', async (req, res) => {
    try {
        const { to, data, from } = req.body;
        
        const gasEstimate = await provider.estimateGas({
            to: to,
            data: data,
            from: from || ethers.constants.AddressZero
        });
        
        res.json({
            success: true,
            data: {
                gasEstimate: gasEstimate.toString(),
                gasEstimateGwei: ethers.utils.formatUnits(gasEstimate, 'gwei')
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get account balance
app.get('/api/account/:address/balance', async (req, res) => {
    try {
        const address = req.params.address;
        
        if (!ethers.utils.isAddress(address)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid address'
            });
        }
        
        const balance = await provider.getBalance(address);
        
        res.json({
            success: true,
            data: {
                address: address,
                balance: balance.toString(),
                balanceEther: ethers.utils.formatEther(balance),
                symbol: 'TT'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============ ERROR HANDLING ============

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// ============ START SERVER ============

async function startServer() {
    const initialized = initializeProvider();
    
    if (!initialized) {
        console.error('⚠️  Warning: Provider initialization failed. Some features may not work.');
    }
    
    app.listen(PORT, () => {
        console.log(`
╔════════════════════════════════════════════════════════╗
║           ThingID Backend API Server                    ║
║           DIDLab Network Integration                    ║
╚════════════════════════════════════════════════════════╝

🚀 Server running on port ${PORT}
🌐 Network: DIDLab QBFT (Chain ID: ${DIDLAB_CONFIG.chainId})
📡 RPC: ${DIDLAB_CONFIG.rpcUrl}
📝 Contract: ${DIDLAB_CONFIG.contractAddress || 'Not deployed'}

Endpoints:
  GET  /health
  GET  /api/network/info
  POST /api/devices/register/encode
  GET  /api/devices/:deviceId
  GET  /api/devices/owner/:address
  GET  /api/devices/stats/total
  POST /api/access/grant/encode
  GET  /api/access/check/:deviceId/:viewer
  GET  /api/access/passes/:deviceId
  GET  /api/events/devices
  GET  /api/account/:address/balance
  POST /api/utils/estimate-gas
        `);
    });
}

startServer();

module.exports = app;