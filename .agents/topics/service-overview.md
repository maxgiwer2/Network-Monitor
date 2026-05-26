# Service Overview - GlowNet Web Network Monitor

## What is this project?
GlowNet is a Web Network Monitor system featuring:
1. A modern **Host Monitor Dashboard** showing real-time network interface traffic, socket connections, system jitter/packet loss, and interactive network diagnostics.
2. A retro **NMS Topology Map** (CRT green-phosphor console theme) containing 40+ nodes categorized by zone (Core, Data Center, Special Depts, Buildings A-G, Wards/Floors in Medicine and Med buildings) with real-time status polling, interactive pan/zoom, and log details.
3. A shared CRUD **Device Manager** allowing users to add/delete custom monitored nodes that instantly map onto the NMS topology and get active latency ping updates from the background server.

## Where is it running?
- Local Frontend Dev: `http://localhost:3000` (Vite)
- Local Backend API/WS: `http://localhost:5000` (Node.js/Express)

## How to run locally?
Start both the React development server and the Node.js API server:
```bash
# Install dependencies
npm install

# Start development environment (Vite dev server + concurrently starts server.js backend)
npm run dev
```

## Important things to know
- **Database**: Custom devices are persisted in the local file `devices.json` as a JSON array.
- **WebSocket Feed**: The backend server polls network stats, adapters, and custom devices, and broadcasts the metrics via WS on `ws://localhost:5000/ws` (proxied through Vite).
- **CRT Styling**: Uses a monospace phosphor green aesthetic (`Nms.css`) with scanlines and glow filters to mimic classic terminals.
