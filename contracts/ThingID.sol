// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ThingID - IoT Device Identity and Access Management on DIDLab
 * @notice Decentralized IoT device registration and access control system
 * @dev Implements DID-based device management with time-based access passes
 */
contract ThingID {
    
    // ============ STRUCTS ============
    
    struct Device {
        string did;                 // Decentralized Identifier
        string name;                // Device name
        string deviceType;          // sensor, actuator, gateway, etc.
        string manufacturer;        // Manufacturer name
        string model;               // Device model
        string serialNumber;        // Serial number
        string location;            // Physical location
        string publicKey;           // Device public key
        address owner;              // Device owner address
        uint256 registeredAt;       // Registration timestamp
        bool isActive;              // Active status
    }
    
    struct AccessPass {
        address device_owner;       // Owner of the device
        address viewer;             // Address granted access
        uint256 grantedAt;          // When access was granted
        uint256 expiresAt;          // When access expires
        bool isActive;              // Active status
    }
    
    // ============ STATE VARIABLES ============
    
    // Mapping from device ID (hash of DID) to Device
    mapping(bytes32 => Device) public devices;
    
    // Mapping from owner address to array of their device IDs
    mapping(address => bytes32[]) public ownerDevices;
    
    // Mapping from device ID to array of access passes
    mapping(bytes32 => AccessPass[]) public deviceAccessPasses;
    
    // Mapping to check if viewer has active access to device
    mapping(bytes32 => mapping(address => uint256)) public viewerAccess;
    
    // Array of all device IDs for enumeration
    bytes32[] public allDeviceIds;
    
    // Contract metadata
    string public constant VERSION = "1.0.0";
    string public constant NETWORK = "DIDLab QBFT";
    
    // ============ EVENTS ============
    
    event DeviceRegistered(
        bytes32 indexed deviceId,
        string did,
        address indexed owner,
        string name,
        string deviceType,
        uint256 timestamp
    );
    
    event AccessGranted(
        bytes32 indexed deviceId,
        address indexed owner,
        address indexed viewer,
        uint256 expiresAt,
        uint256 timestamp
    );
    
    event AccessRevoked(
        bytes32 indexed deviceId,
        address indexed viewer,
        uint256 timestamp
    );
    
    event DeviceStatusChanged(
        bytes32 indexed deviceId,
        bool isActive,
        uint256 timestamp
    );
    
    event DeviceUpdated(
        bytes32 indexed deviceId,
        string name,
        string location,
        uint256 timestamp
    );
    
    // ============ MODIFIERS ============
    
    modifier onlyDeviceOwner(bytes32 deviceId) {
        require(devices[deviceId].owner == msg.sender, "Not device owner");
        _;
    }
    
    modifier deviceExists(bytes32 deviceId) {
        require(devices[deviceId].owner != address(0), "Device does not exist");
        _;
    }
    
    modifier deviceActive(bytes32 deviceId) {
        require(devices[deviceId].isActive, "Device is not active");
        _;
    }
    
    // ============ MAIN FUNCTIONS ============
    
    /**
     * @notice Register a new IoT device on the DIDLab network
     * @param _did Decentralized identifier for the device
     * @param _name Device name
     * @param _deviceType Type of device (sensor, actuator, etc.)
     * @param _manufacturer Manufacturer name
     * @param _model Device model
     * @param _serialNumber Serial number
     * @param _location Physical location
     * @param _publicKey Device public key
     * @return deviceId Unique identifier for the device
     */
    function registerDevice(
        string memory _did,
        string memory _name,
        string memory _deviceType,
        string memory _manufacturer,
        string memory _model,
        string memory _serialNumber,
        string memory _location,
        string memory _publicKey
    ) external returns (bytes32) {
        require(bytes(_did).length > 0, "DID cannot be empty");
        require(bytes(_name).length > 0, "Name cannot be empty");
        
        // Generate unique device ID from DID
        bytes32 deviceId = keccak256(abi.encodePacked(_did, msg.sender, block.timestamp));
        
        // Ensure device doesn't already exist
        require(devices[deviceId].owner == address(0), "Device ID collision");
        
        // Create device
        devices[deviceId] = Device({
            did: _did,
            name: _name,
            deviceType: _deviceType,
            manufacturer: _manufacturer,
            model: _model,
            serialNumber: _serialNumber,
            location: _location,
            publicKey: _publicKey,
            owner: msg.sender,
            registeredAt: block.timestamp,
            isActive: true
        });
        
        // Track ownership
        ownerDevices[msg.sender].push(deviceId);
        allDeviceIds.push(deviceId);
        
        emit DeviceRegistered(
            deviceId,
            _did,
            msg.sender,
            _name,
            _deviceType,
            block.timestamp
        );
        
        return deviceId;
    }
    
    /**
     * @notice Grant time-limited access to a device
     * @param deviceId Device identifier
     * @param viewer Address to grant access to
     * @param duration Access duration in seconds
     */
    function grantAccess(
        bytes32 deviceId,
        address viewer,
        uint256 duration
    ) external deviceExists(deviceId) onlyDeviceOwner(deviceId) deviceActive(deviceId) {
        require(viewer != address(0), "Invalid viewer address");
        require(viewer != msg.sender, "Cannot grant access to self");
        require(duration > 0 && duration <= 365 days, "Invalid duration");
        
        uint256 expiresAt = block.timestamp + duration;
        
        // Create access pass
        AccessPass memory pass = AccessPass({
            device_owner: msg.sender,
            viewer: viewer,
            grantedAt: block.timestamp,
            expiresAt: expiresAt,
            isActive: true
        });
        
        deviceAccessPasses[deviceId].push(pass);
        viewerAccess[deviceId][viewer] = expiresAt;
        
        emit AccessGranted(
            deviceId,
            msg.sender,
            viewer,
            expiresAt,
            block.timestamp
        );
    }
    
    /**
     * @notice Revoke access for a viewer
     * @param deviceId Device identifier
     * @param viewer Address to revoke access from
     */
    function revokeAccess(
        bytes32 deviceId,
        address viewer
    ) external deviceExists(deviceId) onlyDeviceOwner(deviceId) {
        viewerAccess[deviceId][viewer] = 0;
        
        emit AccessRevoked(deviceId, viewer, block.timestamp);
    }
    
    /**
     * @notice Check if an address has valid access to a device
     * @param deviceId Device identifier
     * @param viewer Address to check
     * @return bool True if viewer has valid access
     */
    function hasAccess(bytes32 deviceId, address viewer) 
        external 
        view 
        deviceExists(deviceId) 
        returns (bool) 
    {
        // Owner always has access
        if (devices[deviceId].owner == viewer) {
            return true;
        }
        
        // Check if viewer has valid access pass
        uint256 expiresAt = viewerAccess[deviceId][viewer];
        return expiresAt > block.timestamp;
    }
    
    /**
     * @notice Update device information
     * @param deviceId Device identifier
     * @param _name New device name
     * @param _location New location
     */
    function updateDevice(
        bytes32 deviceId,
        string memory _name,
        string memory _location
    ) external deviceExists(deviceId) onlyDeviceOwner(deviceId) {
        require(bytes(_name).length > 0, "Name cannot be empty");
        
        devices[deviceId].name = _name;
        devices[deviceId].location = _location;
        
        emit DeviceUpdated(deviceId, _name, _location, block.timestamp);
    }
    
    /**
     * @notice Toggle device active status
     * @param deviceId Device identifier
     */
    function toggleDeviceStatus(bytes32 deviceId) 
        external 
        deviceExists(deviceId) 
        onlyDeviceOwner(deviceId) 
    {
        devices[deviceId].isActive = !devices[deviceId].isActive;
        
        emit DeviceStatusChanged(
            deviceId,
            devices[deviceId].isActive,
            block.timestamp
        );
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Get device details
     * @param deviceId Device identifier
     * @return Device struct
     */
    function getDevice(bytes32 deviceId) 
        external 
        view 
        deviceExists(deviceId) 
        returns (Device memory) 
    {
        return devices[deviceId];
    }
    
    /**
     * @notice Get all devices owned by an address
     * @param owner Owner address
     * @return Array of device IDs
     */
    function getOwnerDevices(address owner) 
        external 
        view 
        returns (bytes32[] memory) 
    {
        return ownerDevices[owner];
    }
    
    /**
     * @notice Get access passes for a device
     * @param deviceId Device identifier
     * @return Array of access passes
     */
    function getDeviceAccessPasses(bytes32 deviceId) 
        external 
        view 
        deviceExists(deviceId) 
        returns (AccessPass[] memory) 
    {
        return deviceAccessPasses[deviceId];
    }
    
    /**
     * @notice Get total number of registered devices
     * @return uint256 Total device count
     */
    function getTotalDevices() external view returns (uint256) {
        return allDeviceIds.length;
    }
    
    /**
     * @notice Get device by index (for enumeration)
     * @param index Device index
     * @return deviceId Device identifier
     */
    function getDeviceByIndex(uint256 index) 
        external 
        view 
        returns (bytes32) 
    {
        require(index < allDeviceIds.length, "Index out of bounds");
        return allDeviceIds[index];
    }
    
    /**
     * @notice Check access expiration time for a viewer
     * @param deviceId Device identifier
     * @param viewer Viewer address
     * @return uint256 Expiration timestamp (0 if no access)
     */
    function getAccessExpiration(bytes32 deviceId, address viewer) 
        external 
        view 
        returns (uint256) 
    {
        return viewerAccess[deviceId][viewer];
    }
}