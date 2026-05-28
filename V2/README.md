# GlowNet (Network Monitor System)

GlowNet is a real-time, high-performance Network Monitoring System (NMS) designed for tracking, mapping, and diagnosing network infrastructure. It features a stunning glassmorphic and cyberpunk/CRT dashboard layout, complete with an interactive SVG topology map, drag-and-drop device positioning, automatic hierarchical uplink rendering, and automated terminal-based diagnostics.

Designed specifically for organizational environments with specialized networking gear (such as Core Switches, Routers, Firewalls, and Access Points), GlowNet bridges the gap between raw command-line network tools and high-fidelity visual monitoring.

---

## Table of Contents

- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture & Data Flow](#architecture--data-flow)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [API Reference](#api-reference)
- [CSV Bulk Import Schema](#csv-bulk-import-schema)
- [Directory Structure](#directory-structure)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Key Features

### 1. Interactive NMS Topology Map
- **Dynamic Link Diagram:** Renders static system nodes and custom-added devices inside a dark phosphor green SVG canvas.
- **Hierarchical Uplink Drawing:** Automatically draws thin cable connection lines (`#00aa44`) from custom devices to their specified parent uplink (e.g., Core Switches or Firewalls).
- **Navigation Controls:** Drag-and-pan canvas and mouse-wheel zoom-in/out support to easily navigate large topologies.
- **Node Position Saving:** Drag-and-drop nodes to customize the layout. Click any node to open an inspector card showing details, IP address, MAC address, and status.
- **Sidebar Integration:** Grouped collapsible tree list of devices by location/zone. Click any device in the tree to automatically center and focus the topology map camera onto that node.

### 2. Live-Feed Bandwidth & Performance Dashboard
- **Speedometer Gauges:** Real-time download/upload network speeds computed from active OS counters.
- **Rolling Latency Timeline:** Beautiful canvas-rendered line charts plotting 50 seconds of rolling ping latency history to Google DNS and Cloudflare.
- **Metric Cards:** High-priority status indicators displaying ping latency, network jitter, simulated packet loss, and total session data throughput.
- **Active Adapter Panel:** Lists active/inactive system network interfaces, IP addresses, and MAC addresses.

### 3. Network Diagnostics Console
- **Interactive Terminal Emulator:** Cyberpunk CRT terminal display with custom blinking cursor and scanline overlay.
- **Integrated Utilities:** Execute standard commands including **Ping**, **Port Scan**, and **Traceroute** directly from the UI.
- **SSH Command Executor:** Remotely log into physical network nodes via SSH (supporting Cisco, MikroTik, or Linux devices) and execute commands.
- **AI-Assisted Output Parsing:** Automated rule-based parser that scans CLI outputs for network anomalies (e.g., BGP ACTIVE/IDLE state alerts, BGP peering logs, CRC cable interface errors, down links) and generates structured recommendations.

### 4. Device Management & Bulk Imports
- **Manual Node Provisioning:** Add individual devices to the monitor with custom IP addresses, description fields, SSH login credentials, and custom parent uplink attachments.
- **Bulk CSV Import:** Download a standardized CSV template directly from the browser, populate it with bulk device arrays, and import them with validation checks.

---

## Tech Stack

### Frontend (Client-side)
- **Framework:** React 18 (TypeScript)
- **Build Tool:** Vite
- **Styling:** Custom Vanilla CSS (Dark glassmorphism theme with phosphor animations and Cyberpunk/CRT style effects; NO utility frameworks)
- **Visuals:** SVG-based interactive topology nodes, cables, and metric gauges

### Backend (Server-side)
- **Runtime:** Node.js
- **API Framework:** Express.js
- **Real-Time Feed:** WebSocket (`ws` protocol) for high-frequency metrics polling
- **SSH Connectivity:** `node-ssh` wrapper for system-level remote shell execution
- **Database:** Local JSON-based persistent storage (`devices.json`)

---

## Architecture & Data Flow

GlowNet is structured with a decoupled client-server architecture using a bidirectional real-time loop:

```
[System OS / Commands] 
       │ (wmic / ping / netstat / os)
       ▼
[Node.js Server] ◄─── (GET/POST REST API / SSH) ───► [React UI Dashboard]
       │                                                     │
       ▼ (2-Second Polling Broadcast)                        ▼ (SVG Interactive Canvas)
  [WebSocket] ─────────────────────────────────────────► [NMS Topology & Gauges]
```

### 1. Polling Cycle
- Every 2 seconds, the Node.js backend performs parallel system-level lookups:
  - Sends ICMP echo requests (pings) to Google DNS (`8.8.8.8`), Cloudflare DNS (`1.1.1.1`), Quad9 (`9.9.9.9`), and any custom-registered device IPs.
  - Queries active TCP network socket lists (using `netstat`).
  - Measures adapter bandwidth throughput (using Windows `wmic` performance counters or simulated fallbacks).
- The aggregated metrics payload is broadcasted down to all active WebSocket clients.

### 2. Client-Side Orchestration
- **React State Manager (`App.tsx`):** Listens for incoming metrics, records rolling historical data points (last 25 records), calculates latency jitter (millisecond differences), and sums cumulative session bytes.
- **NMS Mode Polling Simulation:** When in NMS view mode, a secondary simulation engine periodically alters the status of random mock nodes to simulate network changes. Node warnings populate a scrolling real-time alarm log on the bottom pane.

---

## Prerequisites

Before setting up the project, make sure you have installed:
- **Node.js** (v18.x or v20.x+ recommended)
- **npm** (comes packaged with Node.js)
- *Optional:* A terminal shell supporting SSH client queries (if deploying to live SSH devices).

---

## Getting Started

Follow these steps to run GlowNet locally:

### 1. Clone the Repository
```bash
git clone https://github.com/maxgiwer2/Network-Monitor.git
cd Network-Monitor
```

### 2. Install Dependencies
Install all package dependencies for the unified project (frontend Vite config and backend Express routes run under a single root directory):
```bash
npm install
```

### 3. Start the Development Servers
Launch both the backend API server and the frontend client concurrently:
```bash
npm run dev
```

* GlowNet will spawn the **Node.js Backend** on `http://localhost:5000` (along with the WebSocket gateway on `ws://localhost:5000/ws`).
* The **Vite React Client** will launch on `http://localhost:3000` (or the next available port).
* Open `http://localhost:3000` in your web browser.

---

## Available Scripts

The project includes standard scripts configured in [package.json](file:///d:/Network-Monitor/package.json):

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `concurrently "npm run dev:server" "npm run dev:client"` | Runs both backend and client concurrently (Default developer setup). |
| `npm run dev:client` | `vite` | Starts only the Vite development server for the React client. |
| `npm run dev:server` | `node server.js` | Starts only the Express.js API backend and WebSocket listener. |
| `npm run build` | `vite build` | Compiles the React production bundle into static assets (`/dist`). |
| `npm run preview` | `vite preview` | Previews the compiled production build locally. |

---

## API Reference

The backend provides several endpoints for device management, diagnostics, and SSH integrations:

### Device CRUD Operations

#### 1. Retrieve Monitored Devices
* **Endpoint:** `GET /api/devices`
* **Response (200 OK):**
  ```json
  [
    {
      "id": "1",
      "name": "Local Host",
      "ip": "127.0.0.1",
      "details": "Local loopback interface"
    }
  ]
  ```

#### 2. Register a New Device
* **Endpoint:** `POST /api/devices`
* **Request Body:**
  ```json
  {
    "name": "Floor-2-Switch",
    "ip": "192.168.2.10",
    "details": "Distribution Switch",
    "deviceType": "cisco",
    "uplinkId": "core1",
    "sshUsername": "admin",
    "sshPassword": "secure_password"
  }
  ```
* **Response (210 Created):** Returns the saved device object with a generated unique ID.

#### 3. Remove a Device from Monitoring
* **Endpoint:** `DELETE /api/devices/:id`
* **Response (204 No Content):** Deletes the device.

---

### Bulk & CSV Endpoints

#### 1. Download CSV Template
* **Endpoint:** `GET /api/devices/template.csv`
* **Description:** Initiates a browser download for a pre-formatted device CSV file.

#### 2. Bulk Add Devices
* **Endpoint:** `POST /api/devices/bulk`
* **Request Body:**
  ```json
  {
    "devices": [
      {
        "name": "Firewall-Backup",
        "ip": "10.10.1.250",
        "details": "Failover FW",
        "sshUsername": "admin",
        "sshPassword": "pass",
        "deviceType": "cisco",
        "uplinkId": "dc_fw"
      }
    ]
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "added": 1,
    "skipped": 0,
    "total": 3
  }
  ```

---

### Diagnostic Endpoints

#### 1. Ping Host
* **Endpoint:** `POST /api/diagnostics/ping`
* **Request Body:** `{ "host": "8.8.8.8" }`
* **Response (200 OK):**
  ```json
  {
    "output": "Pinging 8.8.8.8 with 32 bytes of data...\nReply from 8.8.8.8..."
  }
  ```

#### 2. Scan Ports
* **Endpoint:** `POST /api/diagnostics/portscan`
* **Request Body:** `{ "host": "127.0.0.1", "ports": [80, 443, 3000] }`
* **Response (200 OK):**
  ```json
  {
    "results": [
      { "port": 80, "status": "CLOSED" },
      { "port": 3000, "status": "OPEN" }
    ]
  }
  ```

#### 3. Trace Route
* **Endpoint:** `POST /api/diagnostics/traceroute`
* **Request Body:** `{ "host": "google.com" }`
* **Response (200 OK):** Returns trace hops from server to the destination.

---

### SSH Execution & Analysis

#### 1. Run SSH Command
* **Endpoint:** `POST /api/diagnostics/ssh`
* **Request Body:**
  ```json
  {
    "host": "192.168.1.1",
    "port": 22,
    "username": "admin",
    "password": "sshPassword",
    "command": "show ip route"
  }
  ```

#### 2. Execute with AI Analysis Parser
* **Endpoint:** `POST /api/diagnostics/ssh/parse`
* **Request Body:** Same as the SSH execution endpoint.
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "output": "--- RAW OUTPUT ---\n...\n\n--- AI ANALYSIS ---\n[!] CRC Errors detected: Possible faulty cable or Duplex mismatch."
  }
  ```

---

## CSV Bulk Import Schema

When compiling your devices list for bulk import, construct your CSV using the exact header formatting below:

```csv
name,ip,details,sshUsername,sshPassword,deviceType,uplink
Switch-Core-01,192.168.1.1,Core Backbone Switch,admin,secret,switch,core3
Floor1-Access,192.168.1.12,Access Point Floor 1,admin,secret,mikrotik,Switch-Core-01
```

### Column Reference Table

| Column Header | Data Type | Required | Description |
|---|---|---|---|
| `name` | String | Yes | Visible label displayed on the topology map and device trees. |
| `ip` | String | Yes | Target host IPv4 address or domain host resolver target. |
| `details` | String | No | Description displayed inside device info popup modules. |
| `sshUsername`| String | No | Username for logging in during terminal-based diagnostics. |
| `sshPassword`| String | No | Password corresponding to the SSH username. |
| `deviceType` | Enum | No | Choices: `general`, `cisco`, `mikrotik`. Configures command parsers. |
| `uplink` | String | No | Parent device node `id` (e.g., `core1`, `dc_fw`) or names to link cables. |

---

## Directory Structure

A layout map of key directories and files:

```
├── .agents/                    # Shared context and workspace notes
├── src/                        # React Frontend Source Files
│   ├── components/             # Reusable Interface Components
│   │   ├── ActiveSockets.tsx   # Active TCP/IP socket tables
│   │   ├── DeviceManager.tsx   # Device provisioning and CSV uploading
│   │   ├── Diagnostics.tsx     # Shell client and AI analysis terminal
│   │   ├── InterfaceList.tsx   # Active system adapters list
│   │   ├── LatencyChart.tsx    # Live rolling canvas latency graph
│   │   ├── MetricCard.tsx      # Individual stat counters
│   │   ├── NmsTopology.tsx     # Topology canvas with interactive SVGs
│   │   └── Speedometer.tsx     # Download/Upload gauges
│   ├── App.tsx                 # Core client orchestration file
│   ├── App.css                 # Main dashboard layouts styling
│   ├── Nms.css                 # Cyberpunk CRT specific interface styling
│   ├── index.css               # Base CSS design tokens and gradients
│   └── main.tsx                # Client-side mounting script
├── server.js                   # Node Express API & WebSocket Server
├── devices.json                # Local JSON database (dynamically created)
├── datasheet.txt               # Developer system specifications
└── package.json                # Project script commands and dependencies
```

---

## Troubleshooting

### 1. WebSockets Disconnected / Reconnecting
* **Problem:** Client shows `RECONNECTING...` in the top right.
* **Resolution:** 
  1. Ensure the backend API server is active on Port 5000. Check console output from `npm run dev`.
  2. If running behind a reverse proxy (e.g. Nginx), confirm that WebSocket upgrades (`Upgrade: websocket`) are properly configured.

### 2. Network Polling shows "PAUSED"
* **Problem:** Dashboard cards show statistics as paused.
* **Resolution:** Ensure the "Server Monitor" master toggle switch is turned **ON** in the header. The backend pauses polling automatically when the master switch is disabled to conserve local CPU cycles.

### 3. Port Conflicts (5000 or 3000)
* **Problem:** "Port is already in use" errors during server start.
* **Resolution:** Kill any orphaned Node processes. On Windows:
  ```powershell
  Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force
  ```

### 4. SSH Diagnostics Failures
* **Problem:** Terminal reports connection timeouts or authentication failures.
* **Resolution:** 
  - Verify that the target network device has SSH enabled and is reachable from your local hosting server.
  - Verify credential pairings by trying a manual SSH connection directly from your command terminal first.

---

## License

This project is licensed under the MIT License.
