// server.js - ThingID Backend Server
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// In-memory database (replace with MongoDB/PostgreSQL in production)
const db = {
    devices: [],
    accessPasses: [],
    streamData: {},
    deviceIdCounter: 0,
    passIdCounter: 0,
    users: []
};

// Initialize with sample data
function initializeSampleData() {
    // Sample devices
    db.devices = [
        {
            id: 1,
            did: 'did:didlab:device-temp-sensor-001',
            pubKey: '0x04a8c3e5d7b9f2e1c6d8a4b2e9f7c3d5a1b8e6f4c2d9a7b5e3f1c8d6a4b2e9f7',
            make: 'SensorCo',
            model: 'TempSensor-S1',
            owner: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
            certId: 'DCERT-001',
            issuedAt: Date.now() - 86400000,
            metadata: {
                location: 'Building A - Floor 3',
                serialNumber: 'SC-TS-2024-0001',
                firmware: 'v2.3.1'
            }
        },
        {
            id: 2,
            did: 'did:didlab:device-motion-detector-002',
            pubKey: '0x04b7e2f8a3c5d9b1e7f4a6c2d8e5b9f3a7d1c4e8b2f6a9d3e7b1c5f9a3d7e2b6',
            make: 'SecureNet',
            model: 'MotionGuard-Pro',
            owner: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
            certId: 'DCERT-002',
            issuedAt: Date.now() - 172800000,
            metadata: {
                location: 'Warehouse B - Entry Point',
                serialNumber: 'SN-MG-2024-0045',
                firmware: 'v1.8.3'
            }
        },
        {
            id: 3,
            did: 'did:didlab:device-humidity-sensor-003',
            pubKey: '0x04c9f3a7e2b5d8c1f6a9e3b7d2c5f8a4e1b9d6c3f7a2e5b8d1c4f9a6e3b7d2c5',
            make: 'EnviroTech',
            model: 'HumidityTracker-X',
            owner: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
            certId: 'DCERT-003',
            issuedAt: Date.now() - 259200000,
            metadata: {
                location: 'Greenhouse Section C',
                serialNumber: 'ET-HT-2024-0123',
                firmware: 'v3.1.0'
            }
        }
    ];

    // Sample access passes
    db.accessPasses = [
        {
            id: 1,
            passId: 'APASS-001',
            deviceId: 1,
            deviceDid: 'did:didlab:device-temp-sensor-001',
            viewer: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
            grantedBy: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
            grantedAt: Date.now() - 1800000,
            expiresAt: Date.now() + 1800000 // 30 minutes from now
        },
        {
            id: 2,
            passId: 'APASS-002',
            deviceId: 1,
            deviceDid: 'did:didlab:device-temp-sensor-001',
            viewer: '0xCA35b7d915458EF540aDe6068dFe2F44E8fa733c',
            grantedBy: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
            grantedAt: Date.now() - 3600000,
            expiresAt: Date.now() - 600000 // Expired 10 minutes ago
        }
    ];

    db.deviceIdCounter = 3;
    db.passIdCounter = 2;
}

// Initialize sample data on startup
initializeSampleData();

// Utility function to generate random sensor data
function generateSensorData(deviceId) {
    const device = db.devices.find(d => d.id === deviceId);
    if (!device) return null;

    let data = {
        deviceId: device.id,
        did: device.did,
        timestamp: new Date().toISOString(),
    };

    // Generate data based on device type
    if (device.model.includes('Temp')) {
        data = {
            ...data,
            temperature: (18 + Math.random() * 12).toFixed(1),
            unit: 'celsius'
        };
    }
    
    if (device.model.includes('Humidity')) {
        data = {
            ...data,
            humidity: (30 + Math.random() * 40).toFixed(1),
            unit: 'percentage'
        };
    }
    
    if (device.model.includes('Motion')) {
        data = {
            ...data,
            motion: Math.random() > 0.7,
            confidence: (85 + Math.random() * 15).toFixed(1)
        };
    }

    // Add common sensor data
    data.battery = (70 + Math.random() * 30).toFixed(0);
    data.signalStrength = (-80 + Math.random() * 40).toFixed(0);

    return data;
}

// API Routes

// Get all devices
app.get('/api/devices', (req, res) => {
    res.json({
        success: true,
        devices: db.devices
    });
});

// Get devices by owner
app.get('/api/devices/owner/:address', (req, res) => {
    const ownerAddress = req.params.address.toLowerCase();
    const devices = db.devices.filter(d => 
        d.owner.toLowerCase() === ownerAddress
    );
    
    res.json({
        success: true,
        devices
    });
});

// Get device by DID
app.get('/api/devices/did/:did', (req, res) => {
    const device = db.devices.find(d => d.did === req.params.did);
    
    if (!device) {
        return res.status(404).json({
            success: false,
            error: 'Device not found'
        });
    }
    
    res.json({
        success: true,
        device
    });
});

// Issue new device certificate
app.post('/api/devices/issue', (req, res) => {
    const { did, pubKey, make, model, owner, metadata } = req.body;
    
    // Validate required fields
    if (!did || !pubKey || !make || !model || !owner) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields'
        });
    }
    
    // Check if DID already exists
    if (db.devices.find(d => d.did === did)) {
        return res.status(400).json({
            success: false,
            error: 'Device DID already exists'
        });
    }
    
    const device = {
        id: ++db.deviceIdCounter,
        did,
        pubKey,
        make,
        model,
        owner: owner.toLowerCase(),
        certId: `DCERT-${String(db.deviceIdCounter).padStart(3, '0')}`,
        issuedAt: Date.now(),
        metadata: metadata || {}
    };
    
    db.devices.push(device);
    
    res.json({
        success: true,
        device,
        message: 'Device certificate issued successfully'
    });
});

// Get all access passes
app.get('/api/access-passes', (req, res) => {
    res.json({
        success: true,
        accessPasses: db.accessPasses
    });
});

// Get access passes for a device
app.get('/api/access-passes/device/:deviceId', (req, res) => {
    const deviceId = parseInt(req.params.deviceId);
    const passes = db.accessPasses.filter(p => p.deviceId === deviceId);
    
    res.json({
        success: true,
        accessPasses: passes
    });
});

// Get access passes for a viewer
app.get('/api/access-passes/viewer/:address', (req, res) => {
    const viewerAddress = req.params.address.toLowerCase();
    const passes = db.accessPasses.filter(p => 
        p.viewer.toLowerCase() === viewerAddress
    );
    
    res.json({
        success: true,
        accessPasses: passes
    });
});

// Grant access pass
app.post('/api/access-passes/grant', (req, res) => {
    const { deviceId, viewer, duration, grantedBy } = req.body;
    
    // Validate required fields
    if (!deviceId || !viewer || !duration || !grantedBy) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields'
        });
    }
    
    const device = db.devices.find(d => d.id === parseInt(deviceId));
    if (!device) {
        return res.status(404).json({
            success: false,
            error: 'Device not found'
        });
    }
    
    // Check if granter owns the device
    if (device.owner.toLowerCase() !== grantedBy.toLowerCase()) {
        return res.status(403).json({
            success: false,
            error: 'Only device owner can grant access passes'
        });
    }
    
    const accessPass = {
        id: ++db.passIdCounter,
        passId: `APASS-${String(db.passIdCounter).padStart(3, '0')}`,
        deviceId: device.id,
        deviceDid: device.did,
        viewer: viewer.toLowerCase(),
        grantedBy: grantedBy.toLowerCase(),
        grantedAt: Date.now(),
        expiresAt: Date.now() + (parseInt(duration) * 1000)
    };
    
    db.accessPasses.push(accessPass);
    
    res.json({
        success: true,
        accessPass,
        message: 'Access pass granted successfully'
    });
});

// Check access and get stream
app.post('/api/stream/access', (req, res) => {
    const { deviceDid, viewerAddress } = req.body;
    
    if (!deviceDid || !viewerAddress) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields'
        });
    }
    
    const device = db.devices.find(d => d.did === deviceDid);
    if (!device) {
        return res.status(404).json({
            success: false,
            error: 'Device not found'
        });
    }
    
    // Check for valid access pass
    const validPass = db.accessPasses.find(p => 
        p.deviceDid === deviceDid &&
        p.viewer.toLowerCase() === viewerAddress.toLowerCase() &&
        p.expiresAt > Date.now()
    );
    
    if (!validPass) {
        return res.status(403).json({
            success: false,
            error: 'No valid access pass found',
            hasAccess: false
        });
    }
    
    // Generate stream data
    const streamData = generateSensorData(device.id);
    
    // Log access (in production, this would be stored persistently)
    const accessLog = {
        deviceDid,
        viewer: viewerAddress,
        timestamp: Date.now(),
        passId: validPass.passId
    };
    
    res.json({
        success: true,
        hasAccess: true,
        accessPass: validPass,
        streamData,
        accessLog,
        message: 'Access granted'
    });
});

// Get stream data (requires valid access)
app.get('/api/stream/:deviceDid', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({
            success: false,
            error: 'No authorization provided'
        });
    }
    
    const viewerAddress = authHeader.replace('Bearer ', '');
    const deviceDid = req.params.deviceDid;
    
    const device = db.devices.find(d => d.did === deviceDid);
    if (!device) {
        return res.status(404).json({
            success: false,
            error: 'Device not found'
        });
    }
    
    // Check for valid access pass
    const validPass = db.accessPasses.find(p => 
        p.deviceDid === deviceDid &&
        p.viewer.toLowerCase() === viewerAddress.toLowerCase() &&
        p.expiresAt > Date.now()
    );
    
    if (!validPass) {
        return res.status(403).json({
            success: false,
            error: 'Access denied'
        });
    }
    
    // Generate and return stream data
    const streamData = generateSensorData(device.id);
    
    res.json({
        success: true,
        streamData,
        device: {
            did: device.did,
            make: device.make,
            model: device.model,
            metadata: device.metadata
        }
    });
});

// Revoke access pass
app.delete('/api/access-passes/:passId', (req, res) => {
    const { revokedBy } = req.body;
    const passId = req.params.passId;
    
    const passIndex = db.accessPasses.findIndex(p => p.passId === passId);
    if (passIndex === -1) {
        return res.status(404).json({
            success: false,
            error: 'Access pass not found'
        });
    }
    
    const pass = db.accessPasses[passIndex];
    const device = db.devices.find(d => d.id === pass.deviceId);
    
    // Check if revoker owns the device
    if (device.owner.toLowerCase() !== revokedBy.toLowerCase()) {
        return res.status(403).json({
            success: false,
            error: 'Only device owner can revoke access passes'
        });
    }
    
    // Set expiration to now (soft delete)
    db.accessPasses[passIndex].expiresAt = Date.now();
    
    res.json({
        success: true,
        message: 'Access pass revoked successfully'
    });
});

// Root API endpoint
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'ThingID API Server',
        version: '1.0.0',
        endpoints: {
            devices: {
                'GET /api/devices': 'Get all devices',
                'GET /api/devices/owner/:address': 'Get devices by owner',
                'GET /api/devices/did/:did': 'Get device by DID',
                'POST /api/devices/issue': 'Issue new device certificate'
            },
            accessPasses: {
                'GET /api/access-passes': 'Get all access passes',
                'GET /api/access-passes/device/:deviceId': 'Get passes for a device',
                'GET /api/access-passes/viewer/:address': 'Get passes for a viewer',
                'POST /api/access-passes/grant': 'Grant new access pass',
                'DELETE /api/access-passes/:passId': 'Revoke access pass'
            },
            streams: {
                'POST /api/stream/access': 'Check access and get stream',
                'GET /api/stream/:deviceDid': 'Get stream data (requires auth)'
            },
            system: {
                'GET /api/health': 'Health check and stats',
                'GET /api': 'This help message'
            }
        },
        stats: {
            devices: db.devices.length,
            accessPasses: db.accessPasses.length,
            activePassses: db.accessPasses.filter(p => p.expiresAt > Date.now()).length
        }
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        stats: {
            devices: db.devices.length,
            accessPasses: db.accessPasses.length,
            activePassses: db.accessPasses.filter(p => p.expiresAt > Date.now()).length
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 ThingID Backend Server running on port ${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
    console.log('\n📋 Available endpoints:');
    console.log('  GET  /api                              - API information');
    console.log('  GET  /api/health                       - Health check');
    console.log('  GET  /api/devices                      - List all devices');
    console.log('  GET  /api/devices/owner/:address       - Get devices by owner');
    console.log('  GET  /api/devices/did/:did             - Get device by DID');
    console.log('  POST /api/devices/issue                - Issue device certificate');
    console.log('  GET  /api/access-passes                - List all passes');
    console.log('  GET  /api/access-passes/device/:id     - Get passes for device');
    console.log('  GET  /api/access-passes/viewer/:addr   - Get passes for viewer');
    console.log('  POST /api/access-passes/grant          - Grant access pass');
    console.log('  POST /api/stream/access                - Check access & stream');
    console.log('  GET  /api/stream/:deviceDid            - Get stream data');
    console.log('  DELETE /api/access-passes/:passId      - Revoke access pass');
    console.log('\n✅ Server initialized with sample data:');
    console.log(`   - ${db.devices.length} devices`);
    console.log(`   - ${db.accessPasses.length} access passes`);
    console.log('\n💡 Test the API: http://localhost:${PORT}/api');
});

// Add a root route that redirects to API
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to ThingID Backend',
        api: 'http://localhost:' + PORT + '/api',
        documentation: 'Visit /api for available endpoints'
    });
});

// Error handling for 404
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        message: `The endpoint ${req.method} ${req.url} does not exist`,
        suggestion: 'Visit /api to see available endpoints'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

module.exports = app;