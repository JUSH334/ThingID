# ThingID - Decentralized IoT Device Identity on DIDLab Blockchain

A complete decentralized application (dApp) for managing IoT device identities and access control on the DIDLab QBFT blockchain network. ThingID enables secure device registration, ownership verification, and time-based access management using Decentralized Identifiers (DIDs) and smart contracts.

## Features

- **Blockchain-Based Device Registry**: Register IoT devices with immutable records on DIDLab
- **Decentralized Identity (DID)**: Each device gets a unique DID following DIDLab conventions
- **Access Control Management**: Grant time-limited access passes to devices
- **Real-Time Monitoring**: Live device data streaming capabilities
- **Global Activity Tracking**: View all registered devices across the network
- **MetaMask Integration**: Seamless wallet connection and transaction signing
- **Full Transparency**: All transactions viewable on DIDLab block explorer

## Core Architecture

```
ThingID/
├── contracts/
│   └── ThingID.sol          # Smart contract for device management
├── backend/
│   └── server.js            # Express API server
├── scripts/
│   └── deploy.js            # Deployment script
├── index.html               # Frontend web interface
├── hardhat.config.js        # Hardhat configuration
└── package.json             # Dependencies
```

## Quick Start

### Live Demo

**Try it now**: [https://jush334.github.io/thingid](https://jush334.github.io/ThingID/)

The frontend is hosted on GitHub Pages and connects directly to the DIDLab blockchain.

### Installation

1. **Clone and Install Dependencies**
```bash
git clone <repository-url>
cd thingid
npm install
```

2. **Configure Environment**
```bash
# Create .env file
cp .env.example .env

# Edit .env with your details
DIDLAB_RPC_URL=https://eth.didlab.org
PRIVATE_KEY=your_private_key_here
```

3. **Deploy Smart Contract**
```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network didlab
```

4. **Update Configuration**

After deployment, update these files with your contract address:

**backend/server.js** (line ~36):
```javascript
contractAddress: process.env.CONTRACT_ADDRESS || '0xYourContractAddress'
```

**index.html** (line ~330):
```javascript
const CONTRACT_ADDRESS = '0xYourContractAddress';
```

5. **Start Backend Server**
```bash
cd backend
npm install
npm start
```

6. **Launch Frontend**
```bash
# Open index.html in your browser
# Or use a local server:
npx serve .
```

## DIDLab Network Configuration

| Parameter | Value |
|-----------|-------|
| Network Name | DIDLab QBFT |
| RPC URL | https://eth.didlab.org |
| Chain ID | 252501 |
| Currency Symbol | TT (TRUST) |
| Block Explorer | https://explorer.didlab.org |
| Faucet | https://faucet.didlab.org |

### Add DIDLab to MetaMask

```javascript
{
  chainId: '0x3DA55',
  chainName: 'DIDLab QBFT',
  nativeCurrency: {
    name: 'TRUST',
    symbol: 'TT',
    decimals: 18
  },
  rpcUrls: ['https://eth.didlab.org'],
  blockExplorerUrls: ['https://explorer.didlab.org']
}
```

## 📡 API Endpoints

### Network Information
- `GET /health` - Health check
- `GET /api/network/info` - Network details

### Device Management
- `POST /api/devices/register/encode` - Encode device registration
- `GET /api/devices/:deviceId` - Get device details
- `GET /api/devices/owner/:address` - Get devices by owner
- `GET /api/devices/stats/total` - Total device count

### Access Control
- `POST /api/access/grant/encode` - Encode access grant
- `GET /api/access/check/:deviceId/:viewer` - Check access status
- `GET /api/access/passes/:deviceId` - Get access passes

### Utilities
- `GET /api/account/:address/balance` - Get account balance
- `POST /api/utils/estimate-gas` - Estimate transaction gas
- `GET /api/events/devices` - Query device events

## Smart Contract Functions

### Device Registration
```solidity
function registerDevice(
    string memory _did,
    string memory _name,
    string memory _deviceType,
    string memory _manufacturer,
    string memory _model,
    string memory _serialNumber,
    string memory _location,
    string memory _publicKey
) external returns (bytes32)
```

### Access Management
```solidity
function grantAccess(bytes32 deviceId, address viewer, uint256 duration)
function revokeAccess(bytes32 deviceId, address viewer)
function hasAccess(bytes32 deviceId, address viewer) view returns (bool)
```

### View Functions
```solidity
function getDevice(bytes32 deviceId) view returns (Device memory)
function getOwnerDevices(address owner) view returns (bytes32[] memory)
function getTotalDevices() view returns (uint256)
```

## Usage Examples

### Register a Device

```javascript
// Frontend
const tx = await contract.registerDevice(
    'did:didlab:device:sensor:1234567890',
    'Temperature Sensor #1',
    'sensor',
    'SensorCorp',
    'TempSense-2024',
    'SN-2024-00001',
    'Building A - Floor 3',
    '0x04...' // Public key
);
await tx.wait();
```

### Grant Access Pass

```javascript
const duration = 86400; // 1 day in seconds
const tx = await contract.grantAccess(
    deviceId,
    viewerAddress,
    duration
);
await tx.wait();
```

### Check Device Access

```javascript
const hasAccess = await contract.hasAccess(deviceId, viewerAddress);
console.log('Access granted:', hasAccess);
```

## Frontend Features

- **Connect Wallet**: One-click MetaMask connection
- **Device Registration**: User-friendly form for registering devices
- **My Devices**: View and manage your registered devices
- **Global Activity**: See all network activity and statistics
- **Access Control**: Grant and manage access passes
- **Live Stream**: Real-time device data monitoring
- **Network Info**: Complete DIDLab network information

## Development

### Compile Contracts
```bash
npx hardhat compile
```

### Run Tests
```bash
npx hardhat test
```

### Deploy to DIDLab
```bash
npx hardhat run scripts/deploy.js --network didlab
```

### Local Development
```bash
# Start local Hardhat node
npx hardhat node

# Deploy to local network
npx hardhat run scripts/deploy.js --network localhost
```

## Contract Events

The smart contract emits the following events:

- `DeviceRegistered`: Fired when a device is registered
- `AccessGranted`: Fired when access is granted
- `AccessRevoked`: Fired when access is revoked
- `DeviceStatusChanged`: Fired when device status changes
- `DeviceUpdated`: Fired when device info is updated

## Tech Stack

- **Smart Contracts**: Solidity 0.8.19
- **Development Framework**: Hardhat
- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla JavaScript, Ethers.js v5
- **Blockchain**: DIDLab QBFT (Hyperledger Besu)
