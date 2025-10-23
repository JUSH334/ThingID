# ThingID

[Requirements for this assignment / exam](https://mailmissouri-my.sharepoint.com/:w:/r/personal/ahrzd_umsystem_edu/_layouts/15/Doc.aspx?sourcedoc=%7B9E8A3429-8343-4F6A-A024-7E04FA6B5F50%7D&file=Group%206%20%E2%80%94%20ThingID%20(SSI%20%2B%20IoT%20device%20SBT%20%2B%20access%20passes).docx&action=default&mobileredirect=tru)


# 🔐 ThingID: Blockchain-Based IoT Device Identity & Access Management

## 📖 Table of Contents
- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Solution & Blockchain Principles](#solution--blockchain-principles)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Features](#features)
- [Technical Implementation](#technical-implementation)
- [API Documentation](#api-documentation)
- [Smart Contract Design](#smart-contract-design)
- [Security Considerations](#security-considerations)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

ThingID is a decentralized identity and access management system for IoT devices that leverages blockchain technology to provide secure, transparent, and automated device authentication and data access control.

**Key Innovation:** We treat IoT devices as entities with blockchain identities (DIDs) and use NFT-based access passes with built-in expiration for granular, time-boxed access control.

### 🏆 Value Proposition
- **For Device Manufacturers:** Unforgeable device certificates
- **For Device Owners:** Complete control over data access
- **For Data Consumers:** Verifiable, auditable access rights
- **For Compliance:** Immutable audit trails

---

## ❓ Problem Statement

### Current IoT Security Challenges:
1. **Device Spoofing:** No reliable way to verify device authenticity
2. **Centralized Failure Points:** Single server compromise affects all devices
3. **Access Control Complexity:** Manual management of who can access what
4. **Audit Gaps:** Incomplete or tamperable access logs
5. **Credential Management:** Shared passwords and keys that never expire

### Real-World Impact:
- 🏭 **Industrial IoT:** Unauthorized access to factory sensors
- 🏥 **Healthcare:** Medical device data breaches
- 🏢 **Smart Buildings:** Security camera feed interception
- 🚗 **Connected Vehicles:** Spoofed telemetry data

---

## 💡 Solution & Blockchain Principles

### How ThingID Applies Blockchain:

#### 1. **Decentralized Identity (DID)**
```
Traditional: Device ID stored in central database
ThingID: Device DID stored on immutable blockchain
Benefit: Cannot be forged or deleted
```

#### 2. **Soul-Bound Tokens (SBT) for Device Certificates**
```solidity
// Device certificates are non-transferable NFTs
function _beforeTokenTransfer(...) {
    require(from == address(0) || to == address(0), "SBT non-transferable");
}
```
**Principle:** Device identity is permanently bound to owner address

#### 3. **NFT Access Passes with Expiry**
```solidity
mapping(uint256 => uint64) public expiresAt;

function isValid(uint256 tokenId) public view returns(bool) {
    return block.timestamp < expiresAt[tokenId];
}
```
**Principle:** Time-locked smart contracts automatically revoke access

#### 4. **Cryptographic Verification**
- Each device has a public/private key pair
- Access requests are signed and verified
- Man-in-the-middle attacks become impossible

#### 5. **Immutable Audit Trail**
- Every certificate issuance is recorded
- Every access grant is logged
- Every revocation is permanent
- Compliance-ready history

---

## 🏗️ Architecture

### System Components:

```
┌─────────────────────────────────────────────────────────────┐
│                        Blockchain Layer                       │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ DeviceCert  │  │ AccessPass   │  │ Audit Logs      │  │
│  │ (SBT)       │  │ (NFT)        │  │ (Events)        │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                      Gateway Layer                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Access Verification | Stream Proxy | Rate Limiting   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │
│  │  Issuer    │  │   Owner    │  │     Viewer        │  │
│  │  Portal    │  │   Portal   │  │     Portal        │  │
│  └────────────┘  └────────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                       IoT Devices                           │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────────┐   │
│  │Sensor│  │Camera│  │ Lock │  │Meter │  │Controller│   │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow:
1. **Registration:** Issuer → Blockchain → Device Certificate
2. **Access Grant:** Owner → Blockchain → Access Pass NFT
3. **Data Request:** Viewer → Gateway → Verify NFT → Stream Data
4. **Audit:** All Actions → Blockchain Events → Immutable Log

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Web browser with MetaMask (optional)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/your-org/thingid.git
cd thingid
```

2. **Install backend dependencies:**
```bash
npm install
```

3. **Start the backend server:**
```bash
node server.js
# Server runs on http://localhost:3000
```

4. **Open the frontend:**
```bash
# Open index.html in your browser
open index.html  # macOS
start index.html # Windows
xdg-open index.html # Linux
```

5. **Verify connection:**
- Check for green "API: Connected" status
- Click "Connect Wallet" to begin

### Quick Test
Use the "Quick Test (Auto-Setup)" button in the Viewer tab for instant demo.

---

## ✨ Features

### Core Functionality
- ✅ **Device Registration**: Issue unforgeable device certificates
- ✅ **Access Management**: Grant time-boxed access passes
- ✅ **Stream Gateway**: Cryptographically verified data access
- ✅ **Automatic Expiry**: Self-revoking access passes
- ✅ **Audit Trail**: Complete history of all actions

### User Roles
1. **Issuer**: Register devices, create certificates
2. **Owner**: Manage devices, grant/revoke access
3. **Viewer**: Access permitted device streams

### Security Features
- 🔐 Non-transferable device certificates (SBT)
- ⏱️ Time-locked access with automatic expiry
- 🔑 Public key cryptography for device identity
- 📝 Immutable audit logs
- 🚫 Zero-trust access verification

---

