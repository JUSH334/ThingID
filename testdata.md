## USAGE DATA YOU CAN USE

Device Name:        Office Temperature Sensor
Device Type:        sensor (from dropdown)
Manufacturer:       Texas Instruments
Model:              TMP117-Q1
Serial Number:      TI-TMP-2024-001
Location:           Building A - Floor 2 - Room 205
```

### Example 2: Security Camera
```
Device Name:        Lobby Security Camera
Device Type:        camera (from dropdown)
Manufacturer:       Hikvision
Model:              DS-2CD2143G0-I
Serial Number:      HK-CAM-2024-042
Location:           Main Entrance - Lobby
```

### Example 3: Smart Actuator
```
Device Name:        HVAC Control Unit
Device Type:        actuator (from dropdown)
Manufacturer:       Honeywell
Model:              HW-ACT-5000
Serial Number:      HNY-2024-0789
Location:           Building B - Mechanical Room
```

### Example 4: IoT Gateway
```
Device Name:        Main IoT Gateway
Device Type:        gateway (from dropdown)
Manufacturer:       Cisco
Model:              IR829-2LTE-EA-AK9
Serial Number:      CSC-GW-2024-123
Location:           Network Room - Rack 5
```

### Example 5: GPS Tracker
```
Device Name:        Fleet Vehicle Tracker
Device Type:        tracker (from dropdown)
Manufacturer:       Tracki
Model:              GPS-T4
Serial Number:      TRK-2024-VEH-055
Location:           Vehicle Fleet - Truck 12
```

### Example 6: Industrial Controller
```
Device Name:        Production Line Controller
Device Type:        controller (from dropdown)
Manufacturer:       Siemens
Model:              S7-1200
Serial Number:      SIE-PLC-2024-991
Location:           Factory Floor - Line 3
```

## 🎯 Quick Fill Test Data

For quick testing, here's super simple data:
```
Device Name:        Test Sensor 1
Device Type:        sensor
Manufacturer:       TestCorp
Model:              TS-100
Serial Number:      TEST-001
Location:           Test Lab
```

## 📋 Field Explanations

| Field | Required? | Purpose | Tips |
|-------|-----------|---------|------|
| **Device Name** | ✅ Yes | Identifies the device | Be descriptive, include location hint |
| **Device Type** | ✅ Yes | Category of device | Choose from dropdown |
| **Manufacturer** | ✅ Yes | Who made it | Real or test company name |
| **Model** | ✅ Yes | Model number | Include series/version |
| **Serial Number** | ❌ Optional | Unique identifier | Can be anything unique |
| **Location** | ❌ Optional | Where it's installed | Building/Floor/Room format works well |

## 🔐 For Access Control Tab

When granting access:
```
Device:             Select one of your registered devices
Grant To Address:   0xFB3C61Dcc2dF6800C62E7ba2bcA5e9dd7d42f2F7
                    (Use another MetaMask address or a friend's address)
Duration:           1 Day (or choose from dropdown)
```

## 💡 Pro Tips

1. **Serial Numbers**: Make them unique! Add date/counter:
   - `SN-2025-001`, `SN-2025-002`, etc.

2. **Location Format**: Use hierarchy:
   - `Building → Floor → Room`
   - Example: `HQ - 3F - Conference Room A`

3. **Device Names**: Be specific:
   - ❌ Bad: "Sensor 1"
   - ✅ Good: "Warehouse Temperature Sensor"

4. **For Testing**: Keep it simple:
```
   Name: Test Device 1
   Manufacturer: TestCo
   Model: TEST-v1
```

## 🎬 Quick Demo Scenario

Register these three devices to see the system in action:

**Device 1:**
```
Name: Server Room Temp Sensor
Type: sensor
Manufacturer: SensorTech
Model: ST-2024-PRO
Serial: SENSOR-001
Location: Data Center - Rack A1
```

**Device 2:**
```
Name: Main Entrance Camera
Type: camera  
Manufacturer: SecureCam
Model: SC-4K-2024
Serial: CAM-LOBBY-001
Location: Building Main Entrance
```

**Device 3:**
```
Name: Production Line Gateway
Type: gateway
Manufacturer: IndustryGate
Model: IG-5000
Serial: GATEWAY-FAC-001
Location: Factory Floor - Section B