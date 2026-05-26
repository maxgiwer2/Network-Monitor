# Network Monitor Project Overview

## Description
A full-stack network monitoring application built with React/Vite (Frontend) and Node.js/Express (Backend). It monitors network topology, bandwidth, latency, and provides deep diagnostics.

## Features Completed
- **Phase 1-2**: SSH connectivity and device management endpoints.
- **Phase 3**: AI-Assisted Automated Diagnostics parsing (simulated with regex for CRC errors and BGP).
- **Phase 4**: Advanced Topology (SVG mapping with drag-and-drop).
- **Phase 5**: CSV Import (Append mode) and Template Download.

## Tech Stack
- **Frontend**: React 18, Vite, TypeScript. Custom SVG rendering for topology.
- **Backend**: Node.js, Express, `node-ssh`, `ws` for real-time WebSockets metric delivery.
- **Storage**: Local `devices.json` file for custom devices.
- **Execution**: Frontend runs on port 3000, Backend runs on port 5000.

## User Preferences
- **Topology**: NMS Topology must allow adding, editing, and freely grouping nodes.
- **CSV Import**: Import mechanism appends data to the existing device list rather than replacing it.
- **Environment**: Used in organizations with specialized Router/Switch equipment.
