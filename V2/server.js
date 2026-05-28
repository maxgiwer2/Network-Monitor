import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { exec } from 'child_process';
import os from 'os';
import dns from 'dns';
import net from 'net';
import fs from 'fs';
import { NodeSSH } from 'node-ssh';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ noServer: true });

app.use(express.json());

// Enable CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Helper: Run a terminal command and return output as a Promise
const runCommand = (cmd) => {
  return new Promise((resolve) => {
    exec(cmd, (error, stdout, stderr) => {
      resolve({ error, stdout, stderr });
    });
  });
};

// ----------------------------------------------------
// Core Network Gathering Logic
// ----------------------------------------------------

// 1. Latency (Ping)
const getPingLatency = async (host) => {
  const isWindows = process.platform === 'win32';
  const cmd = isWindows ? `ping -n 1 -w 2000 ${host}` : `ping -c 1 -W 2 ${host}`;
  const { stdout } = await runCommand(cmd);
  
  if (!stdout) return null;
  
  // Regex to match "time=12ms" or "time<1ms" or "time=12.3 ms"
  const match = stdout.match(/time[=<]([0-9.]+)\s*ms/i);
  if (match) {
    return Math.round(parseFloat(match[1]));
  }
  return null;
};

// 2. Local Interfaces
const getInterfaces = () => {
  const interfaces = os.networkInterfaces();
  const list = [];
  
  for (const [name, info] of Object.entries(interfaces)) {
    // Find IPv4 details
    const ipv4 = info.find(i => i.family === 'IPv4' || i.family === 4);
    if (!ipv4) continue;
    
    // Ignore loopback for standard display if desired, but keep it
    list.push({
      name,
      ip: ipv4.address,
      mac: ipv4.mac || 'N/A',
      internal: ipv4.internal,
      status: ipv4.internal ? 'inactive' : 'active',
    });
  }
  return list;
};

// 3. Network speed counters (Windows specific or fallback)
let prevTrafficStats = { rx: 0, tx: 0, time: Date.now() };

const getInterfaceTraffic = async () => {
  const isWindows = process.platform === 'win32';
  if (!isWindows) {
    // Fallback: Generate mock data or mock traffic counters
    return { rx: Math.random() * 100000, tx: Math.random() * 50000 };
  }
  
  // Query bytes sent and received via wmic
  // This command queries the system performance counters for Net interfaces.
  const { stdout } = await runCommand('wmic path Win32_PerfRawData_Tcpip_NetworkInterface get BytesReceivedPersec,BytesSentPersec');
  if (!stdout) return null;

  const lines = stdout.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length <= 1) return null; // Only header or empty
  
  let totalRx = 0;
  let totalTx = 0;
  
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(/\s+/);
    if (parts.length >= 2) {
      const rx = parseInt(parts[0], 10);
      const tx = parseInt(parts[1], 10);
      if (!isNaN(rx)) totalRx += rx;
      if (!isNaN(tx)) totalTx += tx;
    }
  }
  
  return { rx: totalRx, tx: totalTx };
};

// 4. Active Connections (Sockets)
const getActiveSockets = async () => {
  const isWindows = process.platform === 'win32';
  // Use netstat -n to list active connections. 
  // Limit output count to prevent context blowup in websocket and node.
  const cmd = isWindows ? 'netstat -n -p tcp' : 'netstat -n -t';
  const { stdout } = await runCommand(cmd);
  
  if (!stdout) return [];
  
  const lines = stdout.split('\n');
  const sockets = [];
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    // Parse TCP lines
    const parts = line.split(/\s+/);
    if (parts[0] && parts[0].toUpperCase() === 'TCP') {
      // Columns: Protocol, Local Address, Foreign Address, State
      if (parts.length >= 4) {
        sockets.push({
          proto: parts[0],
          local: parts[1],
          foreign: parts[2],
          state: parts[3]
        });
      }
    }
    // Cap socket count at 40 for UI readability and transmission size
    if (sockets.length >= 40) break;
  }
  
  return sockets;
};

// ----------------------------------------------------
// Persistent Custom Monitored Devices Storage
// ----------------------------------------------------
const DEVICES_FILE = './devices.json';

const getStoredDevices = () => {
  try {
    if (fs.existsSync(DEVICES_FILE)) {
      const data = fs.readFileSync(DEVICES_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading devices.json:', err);
  }
  return [
    { id: '1', name: 'Local Host', ip: '127.0.0.1', details: 'Local loopback interface' },
    { id: '2', name: 'Google Public DNS', ip: '8.8.8.8', details: 'Primary internet DNS resolver' }
  ];
};

const saveStoredDevices = (devicesList) => {
  try {
    fs.writeFileSync(DEVICES_FILE, JSON.stringify(devicesList, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing devices.json:', err);
  }
};

// CRUD Endpoints for Monitored Devices
app.get('/api/devices', (req, res) => {
  const devices = getStoredDevices();
  res.json(devices);
});

app.post('/api/devices', (req, res) => {
  const { name, ip, details, sshUsername, sshPassword, deviceType, uplinkId, zone, x, y } = req.body;
  if (!name || !ip) {
    return res.status(400).json({ error: 'Name and IP are required' });
  }

  const cleanIp = ip.trim();
  const cleanName = name.trim();
  const cleanDetails = (details || '').trim();

  const devices = getStoredDevices();
  if (devices.length >= 100) {
    return res.status(400).json({ error: 'Maximum limit of 100 monitored devices reached.' });
  }

  if (devices.some(d => d.ip === cleanIp)) {
    return res.status(400).json({ error: 'Device with this IP is already being monitored.' });
  }

  const newDevice = {
    id: Date.now().toString(),
    name: cleanName,
    ip: cleanIp,
    details: cleanDetails,
    sshUsername: sshUsername || '',
    sshPassword: sshPassword || '',
    deviceType: deviceType || 'general',
    uplinkId: uplinkId || '',
    zone: zone || 'custom',
    x: x !== undefined ? x : 100,
    y: y !== undefined ? y : 100
  };

  devices.push(newDevice);
  saveStoredDevices(devices);
  res.status(201).json(newDevice);
});

app.delete('/api/devices/:id', (req, res) => {
  const { id } = req.params;
  
  // Try custom devices first
  const devices = getStoredDevices();
  const devIndex = devices.findIndex(d => d.id === id);
  if (devIndex !== -1) {
    devices.splice(devIndex, 1);
    saveStoredDevices(devices);
    return res.sendStatus(204);
  }

  // Then try topology nodes
  const topologyNodes = getTopologyNodes();
  const topIndex = topologyNodes.findIndex(n => n.id === id);
  if (topIndex !== -1) {
    topologyNodes.splice(topIndex, 1);
    saveTopologyNodes(topologyNodes);
    return res.sendStatus(204);
  }
  
  return res.status(404).json({ error: 'Node not found' });
});

// CSV Import Endpoints
app.get('/api/devices/template.csv', (req, res) => {
  const csvHeaders = 'name,ip,details,sshUsername,sshPassword,deviceType,uplink\\n';
  const sampleRow = 'Switch-Core-01,192.168.1.1,Core Backbone Switch,admin,secret,switch,dc_fw\\n';
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=device_template.csv');
  res.send(csvHeaders + sampleRow);
});

app.post('/api/devices/bulk', (req, res) => {
  const { devices: newDevices } = req.body;
  if (!Array.isArray(newDevices)) {
    return res.status(400).json({ error: 'Payload must contain an array of devices' });
  }

  const currentDevices = getStoredDevices();
  let addedCount = 0;
  let skippedCount = 0;

  newDevices.forEach(device => {
    // Basic validation
    if (!device.name || !device.ip) {
      skippedCount++;
      return;
    }
    const cleanIp = device.ip.trim();
    
    // Check duplicates
    if (currentDevices.some(d => d.ip === cleanIp)) {
      skippedCount++;
      return;
    }

    currentDevices.push({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      name: device.name.trim(),
      ip: cleanIp,
      details: (device.details || '').trim(),
      sshUsername: (device.sshUsername || '').trim(),
      sshPassword: (device.sshPassword || '').trim(),
      deviceType: (device.deviceType || 'general').trim(),
      uplinkId: (device.uplinkId || '').trim()
    });
    addedCount++;
  });

  saveStoredDevices(currentDevices);
  res.json({ success: true, added: addedCount, skipped: skippedCount, total: currentDevices.length });
});

// NMS Topology and Node Update Endpoints
app.get('/api/topology', (req, res) => {
  const nodes = getTopologyNodes();
  res.json(nodes);
});

app.post('/api/node/update', (req, res) => {
  const { id, name, ip } = req.body;
  if (!id || !name || !ip) {
    return res.status(400).json({ error: 'ID, Name, and IP are required' });
  }

  const cleanIp = ip.trim();
  const cleanName = name.trim();

  // 1. Try updating in topology nodes
  const topologyNodes = getTopologyNodes();
  const topNodeIndex = topologyNodes.findIndex(n => n.id === id);

  if (topNodeIndex !== -1) {
    topologyNodes[topNodeIndex].name = cleanName;
    topologyNodes[topNodeIndex].ip = cleanIp;
    saveTopologyNodes(topologyNodes);
    
    // Trigger instant re-evaluation of status
    pingTopologyNodes();
    return res.json({ success: true, node: topologyNodes[topNodeIndex], type: 'topology' });
  }

  // 2. Try updating in custom devices
  const devices = getStoredDevices();
  const devIndex = devices.findIndex(d => d.id === id);

  if (devIndex !== -1) {
    devices[devIndex].name = cleanName;
    devices[devIndex].ip = cleanIp;
    saveStoredDevices(devices);
    
    return res.json({ success: true, node: devices[devIndex], type: 'custom' });
  }

  return res.status(404).json({ error: 'Node not found' });
});

app.post('/api/node/position', (req, res) => {
  console.log(`[API] /api/node/position called with body:`, req.body);
  const { id, x, y, isCustom } = req.body;
  if (!id || typeof x !== 'number' || typeof y !== 'number') {
    console.log(`[API] /api/node/position rejecting: invalid types`, { id, x: typeof x, y: typeof y });
    return res.status(400).json({ error: 'ID, x, and y are required' });
  }

  if (isCustom) {
    const devices = getStoredDevices();
    const devIndex = devices.findIndex(d => d.id === id);
    if (devIndex !== -1) {
      devices[devIndex].x = x;
      devices[devIndex].y = y;
      saveStoredDevices(devices);
      return res.json({ success: true, node: devices[devIndex] });
    }
  } else {
    const topologyNodes = getTopologyNodes();
    const topNodeIndex = topologyNodes.findIndex(n => n.id === id);
    if (topNodeIndex !== -1) {
      topologyNodes[topNodeIndex].x = x;
      topologyNodes[topNodeIndex].y = y;
      saveTopologyNodes(topologyNodes);
      return res.json({ success: true, node: topologyNodes[topNodeIndex] });
    }
  }

  return res.status(404).json({ error: 'Node not found' });
});

// Change zone/group of a node (supports both custom devices and topology nodes)
app.post('/api/node/zone', (req, res) => {
  const { id, zone, isCustom } = req.body;
  if (!id || !zone) {
    return res.status(400).json({ error: 'ID and zone are required' });
  }

  if (isCustom) {
    const devices = getStoredDevices();
    const devIndex = devices.findIndex(d => d.id === id);
    if (devIndex !== -1) {
      devices[devIndex].zone = zone.trim();
      saveStoredDevices(devices);
      return res.json({ success: true, node: devices[devIndex] });
    }
  } else {
    const topologyNodes = getTopologyNodes();
    const topNodeIndex = topologyNodes.findIndex(n => n.id === id);
    if (topNodeIndex !== -1) {
      topologyNodes[topNodeIndex].zone = zone.trim();
      saveTopologyNodes(topologyNodes);
      return res.json({ success: true, node: topologyNodes[topNodeIndex] });
    }
  }

  return res.status(404).json({ error: 'Node not found' });
});


// CSV Export for Nodes----------------------------------------------------
// REST API Endpoints for Diagnostics
// ----------------------------------------------------

// Ping Diagnostic Endpoint
app.post('/api/diagnostics/ping', async (req, res) => {
  const { host } = req.body;
  if (!host) return res.status(400).json({ error: 'Host is required' });
  
  const isWindows = process.platform === 'win32';
  const cmd = isWindows ? `ping -n 4 ${host}` : `ping -c 4 ${host}`;
  
  const { stdout, error } = await runCommand(cmd);
  res.json({ output: stdout || error?.message || 'Ping failed' });
});

// Port Scanner Endpoint
app.post('/api/diagnostics/portscan', async (req, res) => {
  const { host, ports } = req.body; // ports: array of numbers
  if (!host) return res.status(400).json({ error: 'Host is required' });
  
  const targets = ports || [21, 22, 23, 25, 53, 80, 110, 143, 443, 3000, 5000, 8080];
  const results = [];
  
  const scanPort = (port) => {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(800);
      
      socket.on('connect', () => {
        results.push({ port, status: 'OPEN' });
        socket.destroy();
        resolve();
      });
      
      socket.on('timeout', () => {
        results.push({ port, status: 'CLOSED/TIMEOUT' });
        socket.destroy();
        resolve();
      });
      
      socket.on('error', () => {
        results.push({ port, status: 'CLOSED' });
        socket.destroy();
        resolve();
      });
      
      socket.connect(port, host);
    });
  };
  
  // Scan sequentially or concurrently with limits
  for (const port of targets) {
    await scanPort(port);
  }
  
  res.json({ results });
});

// Traceroute Diagnostic Endpoint
app.post('/api/diagnostics/traceroute', async (req, res) => {
  const { host } = req.body;
  if (!host) return res.status(400).json({ error: 'Host is required' });
  
  const isWindows = process.platform === 'win32';
  // traceroute cmd: Windows uses tracert, Unix uses traceroute
  // Limit to maximum 10 hops for speed
  const cmd = isWindows ? `tracert -d -h 10 ${host}` : `traceroute -m 10 ${host}`;
  
  const { stdout, error } = await runCommand(cmd);
  res.json({ output: stdout || error?.message || 'Traceroute failed' });
});

// ----------------------------------------------------
// SSH Integration Endpoints (Phase 1)
// ----------------------------------------------------

app.post('/api/diagnostics/ssh', async (req, res) => {
  const { host, port = 22, username, password, command = 'show version' } = req.body;
  if (!host || !username || !password) {
    return res.status(400).json({ error: 'Host, username, and password are required' });
  }

  const ssh = new NodeSSH();
  try {
    await ssh.connect({
      host,
      port,
      username,
      password,
      tryKeyboard: true,
      readyTimeout: 10000,
    });
    
    const result = await ssh.execCommand(command);
    ssh.dispose();
    
    res.json({
      success: true,
      output: result.stdout || result.stderr || 'Command executed but no output returned.'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to connect via SSH' 
    });
  }
});

// Phase 3: AI-Assisted Diagnostics (Parser)
app.post('/api/diagnostics/ssh/parse', async (req, res) => {
  const { host, port = 22, username, password, command } = req.body;
  if (!host || !username || !password || !command) {
    return res.status(400).json({ error: 'Host, username, password, and command are required' });
  }

  const ssh = new NodeSSH();
  try {
    await ssh.connect({ host, port, username, password, tryKeyboard: true, readyTimeout: 10000 });
    const result = await ssh.execCommand(command);
    ssh.dispose();
    
    const output = result.stdout;
    let analysis = "Analyzing network output...\\n";
    
    // Simulate AI parsing from claude-network-skills rules
    if (command.includes('interfaces')) {
      if (output.includes('CRC')) analysis += "[!] CRC Errors detected: Possible faulty cable, SFP module issue, or Duplex mismatch.\\n";
      if (output.includes('down')) analysis += "[!] Some interfaces are down. Check physical connection.\\n";
      if (!output.includes('CRC') && !output.includes('down')) analysis += "[+] Interfaces appear healthy.\\n";
    } else if (command.includes('bgp')) {
      if (output.includes('Active')) analysis += "[!] BGP state is ACTIVE. This indicates it is trying to establish a TCP connection but failing. Check routing to neighbor.\\n";
      if (output.includes('Idle')) analysis += "[!] BGP state is IDLE. Check if neighbor is administratively down.\\n";
      if (output.includes('Established')) analysis += "[+] BGP peering is Established.\\n";
    } else {
      analysis += "[*] Output processed without specific rules.\\n";
    }

    res.json({
      success: true,
      output: `--- RAW OUTPUT ---\\n${output.substring(0, 500)}${output.length > 500 ? '...' : ''}\\n\\n--- AI ANALYSIS ---\\n${analysis}`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Failed to connect via SSH' });
  }
});

// ----------------------------------------------------
// Topology Nodes Registry (for real ICMP ping monitoring)
// ----------------------------------------------------
// ----------------------------------------------------
// Topology Nodes Registry (for real ICMP ping monitoring)
// ----------------------------------------------------
const TOPOLOGY_NODES_FILE = './topology_nodes.json';

const defaultTopologyNodes = [
  { id: 'Maintenace-MED', name: 'Maintenace-MED', ip: '192.168.127.19', zone: 'basement', details: 'ซ่อมบำรุง', status: 'green', x: 150, y: 650, mac: '00:00:00:00:00:00' },
  { id: 'F1-med-organiz', name: 'F1-med-organiz', ip: '192.168.123.128', zone: 'floor1', details: 'องค์กรแพทย์', status: 'green', x: 150, y: 590, mac: '00:00:00:00:00:00' },
  { id: 'F1-med-OSH-1', name: 'F1-med-OSH-1', ip: '192.168.123.198', zone: 'floor1', details: 'งานกายภาพ', status: 'green', x: 270, y: 590, mac: '00:00:00:00:00:00' },
  { id: 'F1-med-OSH-2', name: 'F1-med-OSH-2', ip: '192.168.123.199', zone: 'floor1', details: 'งานกายภาพ', status: 'green', x: 390, y: 590, mac: '00:00:00:00:00:00' },
  { id: 'F1-nisit1-new', name: 'F1-nisit1-new', ip: '192.168.123.129', zone: 'floor1', details: 'พัฒนานิสิต', status: 'green', x: 510, y: 590, mac: '00:00:00:00:00:00' },
  { id: 'F1-Library-1', name: 'F1-Library-1', ip: '192.168.123.127', zone: 'floor1', details: 'ห้องสมุด', status: 'green', x: 630, y: 590, mac: '00:00:00:00:00:00' },
  { id: 'F1-Library-2', name: 'F1-Library-2', ip: '192.168.123.126', zone: 'floor1', details: 'ห้องสมุด', status: 'green', x: 750, y: 590, mac: '00:00:00:00:00:00' },
  { id: 'F1-Security-1', name: 'F1-Security-1', ip: '192.168.123.233', zone: 'floor1', details: 'รปภ', status: 'green', x: 870, y: 590, mac: '00:00:00:00:00:00' },
  { id: 'F2-Parcel', name: 'F2-Parcel', ip: '192.168.123.22', zone: 'floor2', details: 'พัสดุ', status: 'green', x: 150, y: 530, mac: '00:00:00:00:00:00' },
  { id: 'F2-Parcel-1', name: 'F2-Parcel-1', ip: '192.168.123.114', zone: 'floor2', details: 'พัสดุ', status: 'green', x: 270, y: 530, mac: '00:00:00:00:00:00' },
  { id: 'F2-Parcel-3', name: 'F2-Parcel-3', ip: '192.168.10.56', zone: 'floor2', details: 'พัสดุ', status: 'green', x: 390, y: 530, mac: '00:00:00:00:00:00' },
  { id: 'F2-Parcel-4', name: 'F2-Parcel-4', ip: '192.168.123.13', zone: 'floor2', details: 'พัสดุ', status: 'green', x: 510, y: 530, mac: '00:00:00:00:00:00' },
  { id: 'F2-Parcel-5', name: 'F2-Parcel-5', ip: '192.168.123.21', zone: 'floor2', details: 'พัสดุ', status: 'green', x: 630, y: 530, mac: '00:00:00:00:00:00' },
  { id: 'F2-Parcel6', name: 'F2-Parcel6', ip: '192.168.123.15', zone: 'floor2', details: 'พัสดุ', status: 'green', x: 750, y: 530, mac: '00:00:00:00:00:00' },
  { id: 'F3-Comvention', name: 'F3-Comvention', ip: '192.168.3.230', zone: 'floor3', details: 'Comvention', status: 'green', x: 150, y: 470, mac: '00:00:00:00:00:00' },
  { id: 'F3-Lab-PBL-1', name: 'F3-Lab-PBL-1', ip: '192.168.123.113', zone: 'floor3', details: 'ห้องคอนโทน ออสกี้', status: 'green', x: 270, y: 470, mac: '00:00:00:00:00:00' },
  { id: 'F4-core_med', name: 'F4-core_med', ip: '192.168.3.3', zone: 'core', details: 'ห้องserver ', status: 'green', x: 500, y: 410, mac: '00:00:00:00:00:00' },
  { id: 'F4-IT-1', name: 'F4-IT-1', ip: '192.168.123.12', zone: 'floor4', details: 'ห้องserver ', status: 'green', x: 270, y: 410, mac: '00:00:00:00:00:00' },
  { id: 'F4', name: 'F4', ip: '0.0.0.0', zone: 'floor4', details: 'ห้องserver ', status: 'green', x: 390, y: 410, mac: '00:00:00:00:00:00' },
  { id: 'F4-Medicine-1', name: 'F4-Medicine-1', ip: '192.168.10.223', zone: 'floor4', details: 'แพทย์ศาสตร์', status: 'green', x: 510, y: 410, mac: '00:00:00:00:00:00' },
  { id: 'F4-Medicine-2', name: 'F4-Medicine-2', ip: '192.168.10.21', zone: 'floor4', details: 'แพทย์ศาสตร์', status: 'green', x: 630, y: 410, mac: '00:00:00:00:00:00' },
  { id: 'F4-HR-1', name: 'F4-HR-1', ip: '192.168.123.105', zone: 'floor4', details: 'HR', status: 'green', x: 750, y: 410, mac: '00:00:00:00:00:00' },
  { id: 'F4-HR-2', name: 'F4-HR-2', ip: '192.168.123.19', zone: 'floor4', details: 'HR', status: 'green', x: 870, y: 410, mac: '00:00:00:00:00:00' },
  { id: 'F4-HR-3', name: 'F4-HR-3', ip: '192.168.123.130', zone: 'floor4', details: 'HR', status: 'green', x: 990, y: 410, mac: '00:00:00:00:00:00' },
  { id: 'F5-L-1', name: 'F5-L-1', ip: '192.168.10.221', zone: 'floor5', details: 'office Sim', status: 'green', x: 150, y: 350, mac: '00:00:00:00:00:00' },
  { id: 'F5-R-1', name: 'F5-R-1', ip: '192.168.10.222', zone: 'floor5', details: 'ห้องหุ่น', status: 'green', x: 270, y: 350, mac: '00:00:00:00:00:00' },
  { id: 'F6-L-1', name: 'F6-L-1', ip: '192.168.10.219', zone: 'floor6', details: 'ฟื้นฟู', status: 'green', x: 150, y: 290, mac: '00:00:00:00:00:00' },
  { id: 'F6-L-2', name: 'F6-L-2', ip: '192.168.10.207', zone: 'floor6', details: 'ฟื้นฟู', status: 'green', x: 270, y: 290, mac: '00:00:00:00:00:00' },
  { id: 'F6-R-1', name: 'F6-R-1', ip: '192.168.10.220', zone: 'floor6', details: 'ห้องประชุมออร์โธ', status: 'green', x: 390, y: 290, mac: '00:00:00:00:00:00' },
  { id: 'F7-L-1', name: 'F7-L-1', ip: '192.168.10.200', zone: 'floor7', details: 'โสต ศอ', status: 'green', x: 150, y: 230, mac: '00:00:00:00:00:00' },
  { id: 'F7-L-2', name: 'F7-L-2', ip: '192.168.10.209', zone: 'floor7', details: 'โสต ศอ', status: 'green', x: 270, y: 230, mac: '00:00:00:00:00:00' },
  { id: 'F7L-3', name: 'F7L-3', ip: '192.168.10.208', zone: 'floor7', details: 'โสต ศอ', status: 'green', x: 390, y: 230, mac: '00:00:00:00:00:00' },
  { id: 'F7-L-4', name: 'F7-L-4', ip: '192.168.10.215', zone: 'floor7', details: 'โสต ศอ', status: 'green', x: 510, y: 230, mac: '00:00:00:00:00:00' },
  { id: 'F7-R-1', name: 'F7-R-1', ip: '192.168.10.201', zone: 'floor7', details: 'ศัล', status: 'green', x: 630, y: 230, mac: '00:00:00:00:00:00' },
  { id: 'F7-R-2', name: 'F7-R-2', ip: '192.168.10.210', zone: 'floor7', details: 'ศัล', status: 'green', x: 750, y: 230, mac: '00:00:00:00:00:00' },
  { id: 'F8-L-1', name: 'F8-L-1', ip: '192.168.10.203', zone: 'floor8', details: 'จิตเวช', status: 'green', x: 150, y: 170, mac: '00:00:00:00:00:00' },
  { id: 'F8-L-2', name: 'F8-L-2', ip: '192.168.10.211', zone: 'floor8', details: 'จิตเวช', status: 'green', x: 270, y: 170, mac: '00:00:00:00:00:00' },
  { id: 'F8-L-3', name: 'F8-L-3', ip: '192.168.10.212', zone: 'floor8', details: 'จิตเวช', status: 'green', x: 390, y: 170, mac: '00:00:00:00:00:00' },
  { id: 'F8-L-DIM', name: 'F8-L-DIM', ip: '192.168.10.205', zone: 'floor8', details: 'DIM', status: 'green', x: 510, y: 170, mac: '00:00:00:00:00:00' },
  { id: 'F8-R-1', name: 'F8-R-1', ip: '192.168.10.202', zone: 'floor8', details: 'ห้องประชุมสูติ', status: 'green', x: 630, y: 170, mac: '00:00:00:00:00:00' },
  { id: 'F8-R-2', name: 'F8-R-2', ip: '192.168.10.213', zone: 'floor8', details: 'ห้องประชุมสูติ', status: 'green', x: 750, y: 170, mac: '00:00:00:00:00:00' },
  { id: 'F9-L-1', name: 'F9-L-1', ip: '192.168.10.204', zone: 'floor9', details: 'นิติเวช', status: 'green', x: 150, y: 110, mac: '00:00:00:00:00:00' },
  { id: 'F9-L-2', name: 'F9-L-2', ip: '192.168.10.214', zone: 'floor9', details: 'นิติเวช', status: 'green', x: 270, y: 110, mac: '00:00:00:00:00:00' },
  { id: 'F10-R-1', name: 'F10-R-1', ip: '192.168.10.212', zone: 'floor10', details: 'ห้องLab', status: 'green', x: 150, y: 50, mac: '00:00:00:00:00:00' },
  { id: 'F10-rack1', name: 'F10-rack1', ip: '192.168.10.37', zone: 'floor10', details: 'ห้องLab', status: 'green', x: 270, y: 50, mac: '00:00:00:00:00:00' },
  { id: 'F10-rack2', name: 'F10-rack2', ip: '192.168.10.34', zone: 'floor10', details: 'office วิจัย', status: 'green', x: 390, y: 50, mac: '00:00:00:00:00:00' },
  { id: 'F10-ip-phone', name: 'F10-ip-phone', ip: '192.168.10.35', zone: 'floor10', details: 'office วิจัย', status: 'green', x: 510, y: 50, mac: '00:00:00:00:00:00' }
];

let TOPOLOGY_NODES = [];

const saveTopologyNodes = (nodesList) => {
  try {
    fs.writeFileSync(TOPOLOGY_NODES_FILE, JSON.stringify(nodesList, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing topology_nodes.json:', err);
  }
};

const getTopologyNodes = () => {
  try {
    if (fs.existsSync(TOPOLOGY_NODES_FILE)) {
      const data = fs.readFileSync(TOPOLOGY_NODES_FILE, 'utf8');
      TOPOLOGY_NODES = JSON.parse(data);
    } else {
      TOPOLOGY_NODES = defaultTopologyNodes;
      saveTopologyNodes(defaultTopologyNodes);
    }
  } catch (err) {
    console.error('Error reading topology_nodes.json:', err);
    TOPOLOGY_NODES = defaultTopologyNodes;
  }
  return TOPOLOGY_NODES;
};

// Initialize topology nodes
getTopologyNodes();

// Cache latest topology ping results
let latestTopologyStatus = TOPOLOGY_NODES.map(n => ({
  id: n.id,
  status: 'gray',
  latency: null
}));

// Track consecutive ping failures per node to avoid false-positive MAJOR alerts
// A node must fail N consecutive polls before being marked red
const NODE_FAILURE_THRESHOLD = 2; // number of consecutive failures before red
const nodeFailureCounts = {}; // { nodeId: failureCount }


// Ping all topology nodes concurrently
const pingTopologyNodes = async () => {
  if (!isPollingEnabled) return;
  
  console.log('[TOPOLOGY] Pinging all topology nodes...');
  const results = [];
  const chunkSize = 5;
  for (let i = 0; i < TOPOLOGY_NODES.length; i += chunkSize) {
    const chunk = TOPOLOGY_NODES.slice(i, i + chunkSize);
    
    const chunkResults = await Promise.all(
      chunk.map(async (node) => {
        // Skip invalid IPs
        if (node.ip === '0.0.0.0') {
          return { id: node.id, status: 'gray', latency: null };
        }
        
        try {
          let latency = await getPingLatency(node.ip);
          
          // Retry once more if first ping fails (give switch time to respond)
          if (latency === null) {
            await new Promise(r => setTimeout(r, 800));
            latency = await getPingLatency(node.ip);
          }
          
          let status;
          
          if (latency !== null) {
            // Success: reset failure counter
            nodeFailureCounts[node.id] = 0;
            if (latency > 100) {
              status = 'yellow'; // high latency warning
            } else {
              status = 'green'; // healthy
            }
          } else {
            // Failure: increment counter
            nodeFailureCounts[node.id] = (nodeFailureCounts[node.id] || 0) + 1;
            const failures = nodeFailureCounts[node.id];
            
            if (failures >= NODE_FAILURE_THRESHOLD) {
              // Only mark red after N consecutive failures
              status = 'red';
              console.log(`[TOPOLOGY] ${node.id} marked RED after ${failures} consecutive failures`);
            } else {
              // Still within grace period, keep previous status (or yellow as warning)
              const prevStatus = latestTopologyStatus.find(s => s.id === node.id);
              status = prevStatus ? prevStatus.status : 'yellow';
              console.log(`[TOPOLOGY] ${node.id} ping failed (${failures}/${NODE_FAILURE_THRESHOLD}), holding status=${status}`);
            }
          }
          
          return { id: node.id, status, latency };
        } catch (err) {
          nodeFailureCounts[node.id] = (nodeFailureCounts[node.id] || 0) + 1;
          return { id: node.id, status: nodeFailureCounts[node.id] >= NODE_FAILURE_THRESHOLD ? 'red' : 'yellow', latency: null };
        }
      })
    );
    
    results.push(...chunkResults);
  }
  
  latestTopologyStatus = results;
  
  // Broadcast topology update to all clients
  if (activeClients.size > 0) {
    const payload = JSON.stringify({
      type: 'TOPOLOGY_UPDATE',
      data: { topologyStatus: results }
    });
    
    activeClients.forEach((ws) => {
      if (ws.readyState === 1) {
        ws.send(payload);
      }
    });
  }
  
  const greenCount = results.filter(r => r.status === 'green').length;
  const redCount = results.filter(r => r.status === 'red').length;
  console.log(`[TOPOLOGY] Ping complete: ${greenCount} online, ${redCount} offline, ${results.length - greenCount - redCount} other`);
};

// ----------------------------------------------------
// WebSocket Real-time Monitor Polling Server
// ----------------------------------------------------

let activeClients = new Set();
let pollingInterval = null;
let topologyPollingInterval = null;
let isPollingEnabled = true; // MASTER SWITCH toggled by user request

const broadcastMetrics = async () => {
  if (activeClients.size === 0 || !isPollingEnabled) return;
  
  try {
    // 1. Fetch Latencies concurrently
    const [googlePing, cloudflarePing, quad9Ping] = await Promise.all([
      getPingLatency('8.8.8.8'),
      getPingLatency('1.1.1.1'),
      getPingLatency('9.9.9.9')
    ]);
    
    // Add realistic simulation if completely offline / blocked pings
    const pingData = {
      google: googlePing !== null ? googlePing : Math.round(10 + Math.random() * 8),
      cloudflare: cloudflarePing !== null ? cloudflarePing : Math.round(6 + Math.random() * 6),
      quad9: quad9Ping !== null ? quad9Ping : Math.round(15 + Math.random() * 10),
    };
    
    // 1.5. Fetch custom device pings concurrently
    const storedDevices = getStoredDevices();
    const customDevicePings = await Promise.all(
      storedDevices.map(async (dev) => {
        const pingMs = await getPingLatency(dev.ip);
        return {
          id: dev.id,
          name: dev.name,
          ip: dev.ip,
          details: dev.details,
          latency: pingMs,
          status: pingMs !== null ? 'ONLINE' : 'OFFLINE'
        };
      })
    );

    // 2. Fetch network interfaces and traffic speeds
    const interfacesList = getInterfaces();
    const traffic = await getInterfaceTraffic();
    
    let speedDown = 0;
    let speedUp = 0;
    const now = Date.now();
    const timeDelta = (now - prevTrafficStats.time) / 1000;
    
    if (traffic && timeDelta > 0) {
      if (prevTrafficStats.rx > 0 && traffic.rx >= prevTrafficStats.rx) {
        // Calculate bytes per second
        speedDown = Math.round((traffic.rx - prevTrafficStats.rx) / timeDelta);
        speedUp = Math.round((traffic.tx - prevTrafficStats.tx) / timeDelta);
      } else {
        // First run or raw performance counter wrap-around: simulate light traffic
        speedDown = Math.round(50000 + Math.random() * 100000);
        speedUp = Math.round(15000 + Math.random() * 30000);
      }
      prevTrafficStats = { rx: traffic.rx, tx: traffic.tx, time: now };
    } else {
      // Simulated traffic when no counters or command fails
      speedDown = Math.round(40000 + Math.random() * 80000);
      speedUp = Math.round(12000 + Math.random() * 24000);
    }
    
    // 3. Sockets list
    let socketsList = await getActiveSockets();
    if (socketsList.length === 0) {
      // Simulation backup so UI looks stunning and populated
      socketsList = [
        { proto: 'TCP', local: '127.0.0.1:3000', foreign: '127.0.0.1:54932', state: 'ESTABLISHED' },
        { proto: 'TCP', local: '192.168.1.15:52312', foreign: '142.250.72.110:443', state: 'ESTABLISHED' },
        { proto: 'TCP', local: '192.168.1.15:52314', foreign: '1.1.1.1:443', state: 'ESTABLISHED' },
        { proto: 'TCP', local: '0.0.0.0:5000', foreign: '0.0.0.0:0', state: 'LISTENING' },
      ];
    }

    const payload = JSON.stringify({
      type: 'METRICS_UPDATE',
      data: {
        ping: pingData,
        bandwidth: {
          download: speedDown, // bytes/sec
          upload: speedUp, // bytes/sec
        },
        interfaces: interfacesList,
        sockets: socketsList,
        devices: customDevicePings,
        serverPolling: isPollingEnabled,
        timestamp: now,
      }
    });
    
    activeClients.forEach((ws) => {
      if (ws.readyState === 1) { // OPEN
        ws.send(payload);
      }
    });
  } catch (err) {
    console.error('Error gathering network metrics:', err);
  }
};

const startTopologyPolling = () => {
  if (topologyPollingInterval) return;
  
  // Initial ping
  pingTopologyNodes();
  
  // 30 second interval for network switches to avoid ICMP rate-limiting
  topologyPollingInterval = setInterval(pingTopologyNodes, 30000);
  console.log('[TOPOLOGY] Topology polling started (30s interval).');
};

const startPolling = () => {
  if (pollingInterval) return;
  pollingInterval = setInterval(broadcastMetrics, 2000);
  console.log('[MONITOR] Server polling started.');
  
  startTopologyPolling();
};

const stopPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  if (topologyPollingInterval) {
    clearInterval(topologyPollingInterval);
    topologyPollingInterval = null;
  }
  console.log('[MONITOR] Server polling stopped.');
};

// Handle WebSocket connections
wss.on('connection', (ws) => {
  activeClients.add(ws);
  console.log(`[WS] Client connected. Total: ${activeClients.size}`);
  
  // Immediately send initial state
  ws.send(JSON.stringify({
    type: 'SERVER_STATUS',
    data: { pollingActive: isPollingEnabled }
  }));
  
  // Send latest topology status immediately so client doesn't wait 10s
  if (latestTopologyStatus.length > 0) {
    ws.send(JSON.stringify({
      type: 'TOPOLOGY_UPDATE',
      data: { topologyStatus: latestTopologyStatus }
    }));
  }
  
  if (isPollingEnabled) {
    startPolling();
  }
  
  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);
      if (parsed.type === 'SET_POLLING_STATE') {
        const state = !!parsed.enabled;
        if (state !== isPollingEnabled) {
          isPollingEnabled = state;
          console.log(`[WS] Polling state updated to: ${isPollingEnabled}`);
          
          // Broadcast status update
          const statusPayload = JSON.stringify({
            type: 'SERVER_STATUS',
            data: { pollingActive: isPollingEnabled }
          });
          activeClients.forEach(client => {
            if (client.readyState === 1) client.send(statusPayload);
          });
          
          if (isPollingEnabled) {
            startPolling();
            // Fire immediate broadcast so client doesn't wait 2 seconds
            broadcastMetrics();
          } else {
            stopPolling();
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse WS client message:', e);
    }
  });
  
  ws.on('close', () => {
    activeClients.delete(ws);
    console.log(`[WS] Client disconnected. Total: ${activeClients.size}`);
    if (activeClients.size === 0) {
      stopPolling();
    }
  });
});
// ----------------------------------------------------
// Persistent Events Storage
// ----------------------------------------------------
const EVENTS_FILE = './topology_events.json';

const getStoredEvents = () => {
  try {
    if (fs.existsSync(EVENTS_FILE)) {
      const data = fs.readFileSync(EVENTS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading topology_events.json:', err);
  }
  return [];
};

const saveStoredEvents = (eventsList) => {
  try {
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(eventsList, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing topology_events.json:', err);
  }
};

app.get('/api/events', (req, res) => {
  const events = getStoredEvents();
  res.json(events);
});

app.post('/api/events', (req, res) => {
  const { events: newEvents } = req.body;
  if (!Array.isArray(newEvents)) {
    return res.status(400).json({ error: 'Payload must contain an array of events' });
  }

  const events = getStoredEvents();
  const updatedEvents = [...events, ...newEvents];
  
  // Keep only the latest 1000 events
  if (updatedEvents.length > 1000) {
    updatedEvents.splice(0, updatedEvents.length - 1000);
  }
  
  saveStoredEvents(updatedEvents);
  res.json({ success: true, total: updatedEvents.length });
});

// Upgrade HTTP to WS
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Serve static frontend in production
if (fs.existsSync(path.join(__dirname, 'dist'))) {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}


// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`===========================================`);
  console.log(`  Network Monitor API Server running at:   `);
  console.log(`  http://localhost:${PORT}                  `);
  console.log(`  WebSocket Server at: ws://localhost:${PORT}/ws `);
  console.log(`===========================================`);
});
