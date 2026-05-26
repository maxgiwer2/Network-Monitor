import React, { useState, useEffect, useRef } from 'react';
import '../Nms.css';
import { MonitoredDevice } from './DeviceManager';

interface NmsNode {
  id: string;
  name: string;
  ip: string;
  zone: 'datacenter' | 'buildings' | 'medicine16' | 'med11' | 'special' | 'gear' | 'custom';
  details: string;
  status: 'green' | 'red' | 'yellow' | 'gray';
  x: number;
  y: number;
  mac: string;
}

interface NmsLink {
  source: string;
  target: string;
}

interface NmsEvent {
  id: string;
  severity: 'Normal' | 'Major' | 'Minor' | 'Unknown';
  date: string;
  time: string;
  device: string;
  message: string;
}

interface NmsTopologyProps {
  onClose: () => void;
  customDevices: MonitoredDevice[];
  onAddDevice: (name: string, ip: string, details: string) => Promise<string | null>;
  onDeleteDevice: (id: string) => Promise<void>;
  pollingActive: boolean;
}

export const INITIAL_NODES: NmsNode[] = [
  // Cores (Center)
  { id: 'core1', name: 'CORE-SWITCH-1', ip: '10.0.0.1', zone: 'gear', details: 'Core Backbone Switch 1', status: 'green', x: 400, y: 250, mac: '00:1A:4F:11:AA:01' },
  { id: 'core2', name: 'CORE-SWITCH-2', ip: '10.0.0.2', zone: 'gear', details: 'Core Backbone Switch 2', status: 'green', x: 480, y: 250, mac: '00:1A:4F:11:AA:02' },
  { id: 'core3', name: 'CORE-SWITCH-3', ip: '10.0.0.3', zone: 'gear', details: 'Core Dist Switch 3', status: 'green', x: 440, y: 310, mac: '00:1A:4F:11:AA:03' },
  { id: 'nac', name: 'NAC-SERVER', ip: '10.0.0.5', zone: 'gear', details: 'Network Access Control', status: 'green', x: 520, y: 310, mac: '00:1A:4F:11:AA:04' },
  
  // Data Center (Bottom-Middle)
  { id: 'dc_dmz', name: 'DC-DMZ', ip: '10.10.1.1', zone: 'datacenter', details: 'DMZ Gateway Switch', status: 'green', x: 440, y: 410, mac: '00:1A:4F:22:BB:01' },
  { id: 'dc_fw', name: 'firewall', ip: '10.10.1.254', zone: 'datacenter', details: 'ASA Firewall Gate', status: 'green', x: 380, y: 380, mac: '00:1A:4F:22:BB:02' },
  { id: 'dc_s', name: 'DC-S', ip: '10.10.1.10', zone: 'datacenter', details: 'Main DC Server Switch', status: 'green', x: 500, y: 410, mac: '00:1A:4F:22:BB:03' },
  { id: 'dc_emr1', name: 'DC-emr_1', ip: '10.10.2.1', zone: 'datacenter', details: 'EMR Records Database 1', status: 'green', x: 410, y: 470, mac: '00:1A:4F:22:BB:11' },
  { id: 'dc_emr2', name: 'DC-emr_2', ip: '10.10.2.2', zone: 'datacenter', details: 'EMR Records Database 2', status: 'green', x: 440, y: 470, mac: '00:1A:4F:22:BB:12' },
  { id: 'dc_emr3', name: 'DC-emr_3', ip: '10.10.2.3', zone: 'datacenter', details: 'EMR Records Database 3', status: 'green', x: 470, y: 470, mac: '00:1A:4F:22:BB:13' },
  { id: 'dc_net1', name: 'DC-net1', ip: '10.10.3.1', zone: 'datacenter', details: 'VLAN Network Server 1', status: 'green', x: 500, y: 470, mac: '00:1A:4F:22:BB:21' },
  { id: 'dc_net2', name: 'DC-net2', ip: '10.10.3.2', zone: 'datacenter', details: 'VLAN Network Server 2', status: 'green', x: 530, y: 470, mac: '00:1A:4F:22:BB:22' },
  { id: 'dc_ap1', name: 'DC-S-AP1', ip: '10.10.4.1', zone: 'datacenter', details: 'DataCenter Access Point 1', status: 'yellow', x: 560, y: 410, mac: '00:1A:4F:22:BB:31' },
  { id: 'dc_ap2', name: 'DC-S-AP2', ip: '10.10.4.2', zone: 'datacenter', details: 'DataCenter Access Point 2', status: 'green', x: 560, y: 470, mac: '00:1A:4F:22:BB:32' },

  // Special medical rooms (Left Side)
  { id: 'opd', name: 'OPD-NODE-1', ip: '10.20.1.1', zone: 'special', details: 'Outpatient Dept Switch', status: 'green', x: 250, y: 150, mac: '00:1A:4F:33:CC:01' },
  { id: 'emr', name: 'EMR-TERM', ip: '10.20.1.2', zone: 'special', details: 'Emergency Med Records', status: 'green', x: 190, y: 180, mac: '00:1A:4F:33:CC:02' },
  { id: 'xray', name: 'X-Ray-Diag', ip: '10.20.2.10', zone: 'special', details: 'X-Ray Imaging Terminal', status: 'green', x: 230, y: 220, mac: '00:1A:4F:33:CC:03' },
  { id: 'pharmacy', name: 'Pharmacy-S', ip: '10.20.3.5', zone: 'special', details: 'Pharmacy Inventory Controller', status: 'green', x: 170, y: 250, mac: '00:1A:4F:33:CC:04' },
  { id: 'icu', name: 'ICU-Monitor', ip: '10.20.4.1', zone: 'special', details: 'ICU Central Vital Monitor', status: 'green', x: 210, y: 290, mac: '00:1A:4F:33:CC:05' },
  { id: 'lab', name: 'Lab-Analyzer', ip: '10.20.5.1', zone: 'special', details: 'Lab Chemistry Analyzer', status: 'green', x: 150, y: 320, mac: '00:1A:4F:33:CC:06' },
  { id: 'or', name: 'OR-System', ip: '10.20.6.1', zone: 'special', details: 'Operating Room Integration', status: 'green', x: 190, y: 360, mac: '00:1A:4F:33:CC:07' },

  // Buildings A-G (Bottom-Left & Bottom)
  { id: 'b_a', name: 'A-building-S', ip: '10.30.1.1', zone: 'buildings', details: 'Building A Distribution Switch', status: 'green', x: 140, y: 440, mac: '00:1A:4F:44:DD:01' },
  { id: 'b_b', name: 'B-building-S', ip: '10.30.2.1', zone: 'buildings', details: 'Building B Distribution Switch', status: 'green', x: 175, y: 480, mac: '00:1A:4F:44:DD:02' },
  { id: 'b_c', name: 'C-building-S', ip: '10.30.3.1', zone: 'buildings', details: 'Building C Distribution Switch', status: 'green', x: 210, y: 440, mac: '00:1A:4F:44:DD:03' },
  { id: 'b_d', name: 'D-building-S', ip: '10.30.4.1', zone: 'buildings', details: 'Building D Distribution Switch', status: 'green', x: 245, y: 480, mac: '00:1A:4F:44:DD:04' },
  { id: 'b_e', name: 'E-building-S', ip: '10.30.5.1', zone: 'buildings', details: 'Building E Distribution Switch', status: 'gray', x: 280, y: 440, mac: '00:1A:4F:44:DD:05' },
  { id: 'b_f', name: 'F-building-S', ip: '10.30.6.1', zone: 'buildings', details: 'Building F Distribution Switch', status: 'green', x: 315, y: 480, mac: '00:1A:4F:44:DD:06' },
  { id: 'b_g', name: 'G-building-S', ip: '10.30.7.1', zone: 'buildings', details: 'Building G Distribution Switch', status: 'green', x: 350, y: 440, mac: '00:1A:4F:44:DD:07' },

  // Medicine Building - ตึก Medicine (16 Floors)
  { id: 'med16_f1', name: 'MED16-F1-SW', ip: '10.40.1.1', zone: 'medicine16', details: 'Medicine Bldg Floor 1 Switch', status: 'green', x: 650, y: 130, mac: '00:1A:4F:55:EE:01' },
  { id: 'med16_f2', name: 'MED16-F2-AP', ip: '10.40.2.1', zone: 'medicine16', details: 'Medicine Bldg Floor 2 Access Point', status: 'green', x: 730, y: 130, mac: '00:1A:4F:55:EE:02' },
  { id: 'med16_f7', name: 'MED16-F7-SW', ip: '10.40.7.1', zone: 'medicine16', details: 'Medicine Bldg Floor 7 Switch', status: 'green', x: 650, y: 190, mac: '00:1A:4F:55:EE:04' },
  { id: 'med16_f9', name: 'MED16-F9-SW', ip: '10.40.9.1', zone: 'medicine16', details: 'Medicine Bldg Floor 9 Switch', status: 'green', x: 730, y: 190, mac: '00:1A:4F:55:EE:06' },
  { id: 'med16_f12', name: 'MED16-F12-SW', ip: '10.40.12.1', zone: 'medicine16', details: 'Medicine Bldg Floor 12 Switch', status: 'green', x: 650, y: 250, mac: '00:1A:4F:55:EE:08' },
  { id: 'med16_f15', name: 'MED16-F15-SW', ip: '10.40.15.1', zone: 'medicine16', details: 'Medicine Bldg Floor 15 Switch', status: 'green', x: 730, y: 250, mac: '00:1A:4F:55:EE:09' },
  { id: 'med16_f16', name: 'MED16-F16-SW', ip: '10.40.16.1', zone: 'medicine16', details: 'Medicine Bldg Floor 16 Switch', status: 'green', x: 690, y: 310, mac: '00:1A:4F:55:EE:10' },

  // Med Building - ตึก Med (11 Floors)
  { id: 'med11_f1', name: 'MED11-F1-SW', ip: '10.41.1.1', zone: 'med11', details: 'Med Bldg Floor 1 Switch', status: 'green', x: 810, y: 130, mac: '00:1A:4F:77:AA:01' },
  { id: 'med11_f2', name: 'MED11-F2-AP', ip: '10.41.2.1', zone: 'med11', details: 'Med Bldg Floor 2 Access Point', status: 'green', x: 890, y: 130, mac: '00:1A:4F:77:AA:02' },
  { id: 'med11_f5', name: 'MED11-F5-SW', ip: '10.41.5.1', zone: 'med11', details: 'Med Bldg Floor 5 Switch', status: 'green', x: 810, y: 190, mac: '00:1A:4F:77:AA:05' },
  { id: 'med11_f8', name: 'MED11-F8-SW', ip: '10.41.8.1', zone: 'med11', details: 'Med Bldg Floor 8 Switch', status: 'green', x: 890, y: 190, mac: '00:1A:4F:77:AA:08' },
  { id: 'med11_f10', name: 'MED11-F10-SW', ip: '10.41.10.1', zone: 'med11', details: 'Med Bldg Floor 10 Switch', status: 'green', x: 810, y: 250, mac: '00:1A:4F:77:AA:10' },
  { id: 'med11_f11', name: 'MED11-F11-SW', ip: '10.41.11.1', zone: 'med11', details: 'Med Bldg Floor 11 Switch', status: 'green', x: 850, y: 310, mac: '00:1A:4F:77:AA:11' },

  // Special Network Gear (Bottom-Right)
  { id: 'air1', name: 'AIR1-SENS', ip: '10.50.1.10', zone: 'gear', details: 'Air Conditioning System 1', status: 'green', x: 620, y: 440, mac: '00:1A:4F:66:FF:01' },
  { id: 'air2', name: 'AIR2-SENS', ip: '10.50.1.11', zone: 'gear', details: 'Air Conditioning System 2', status: 'red', x: 670, y: 440, mac: '00:1A:4F:66:FF:02' },
  { id: 'printer', name: 'printer-sys', ip: '10.50.2.20', zone: 'gear', details: 'Central Network Printer', status: 'green', x: 720, y: 440, mac: '00:1A:4F:66:FF:03' },
];

export const NmsTopology: React.FC<NmsTopologyProps> = ({
  onClose,
  customDevices,
  onAddDevice,
  onDeleteDevice,
  pollingActive
}) => {

  // Links setup
  const links: NmsLink[] = [
    // Cores interconnects
    { source: 'core1', target: 'core2' },
    { source: 'core1', target: 'core3' },
    { source: 'core2', target: 'core3' },
    { source: 'core3', target: 'nac' },

    // DC links
    { source: 'core1', target: 'dc_fw' },
    { source: 'dc_fw', target: 'dc_dmz' },
    { source: 'core2', target: 'dc_s' },
    { source: 'dc_dmz', target: 'dc_s' },
    { source: 'dc_s', target: 'dc_emr1' },
    { source: 'dc_s', target: 'dc_emr2' },
    { source: 'dc_s', target: 'dc_emr3' },
    { source: 'dc_s', target: 'dc_net1' },
    { source: 'dc_s', target: 'dc_net2' },
    { source: 'dc_s', target: 'dc_ap1' },
    { source: 'dc_s', target: 'dc_ap2' },

    // Special rooms
    { source: 'core1', target: 'opd' },
    { source: 'opd', target: 'emr' },
    { source: 'opd', target: 'xray' },
    { source: 'core1', target: 'icu' },
    { source: 'icu', target: 'pharmacy' },
    { source: 'icu', target: 'lab' },
    { source: 'icu', target: 'or' },

    // Buildings
    { source: 'core3', target: 'b_a' },
    { source: 'core3', target: 'b_c' },
    { source: 'core3', target: 'b_e' },
    { source: 'core3', target: 'b_g' },
    { source: 'b_a', target: 'b_b' },
    { source: 'b_c', target: 'b_d' },
    { source: 'b_e', target: 'b_f' },

    // Medicine Building - ตึก Medicine (16 Floors) Links
    { source: 'core2', target: 'med16_f1' },
    { source: 'core2', target: 'med16_f7' },
    { source: 'med16_f1', target: 'med16_f2' },
    { source: 'med16_f7', target: 'med16_f9' },
    { source: 'med16_f7', target: 'med16_f12' },
    { source: 'med16_f12', target: 'med16_f15' },
    { source: 'med16_f12', target: 'med16_f16' },

    // Med Building - ตึก Med (11 Floors) Links
    { source: 'core3', target: 'med11_f1' },
    { source: 'core3', target: 'med11_f5' },
    { source: 'med11_f1', target: 'med11_f2' },
    { source: 'med11_f5', target: 'med11_f8' },
    { source: 'med11_f5', target: 'med11_f10' },
    { source: 'med11_f10', target: 'med11_f11' },

    // Air & Printer (Connected to Medicine Building switches)
    { source: 'med16_f12', target: 'air1' },
    { source: 'med16_f15', target: 'air2' },
    { source: 'med16_f15', target: 'printer' }
  ];

  // 2. Initial Events Data
  const initialEvents: NmsEvent[] = [
    { id: 'e1', severity: 'Major', date: '2026-05-25', time: '18:45:12', device: 'AIR2-SENS', message: 'Major - No Response to Device Poll' },
    { id: 'e2', severity: 'Minor', date: '2026-05-25', time: '18:50:31', device: 'DC-S-AP1', message: 'Minor - Jitter variance exceeds threshold (85ms)' },
    { id: 'e3', severity: 'Unknown', date: '2026-05-25', time: '19:12:44', device: 'E-building-S', message: 'Unknown - Router routing table unreachable' },
    { id: 'e4', severity: 'Normal', date: '2026-05-25', time: '19:14:02', device: 'CORE-SWITCH-1', message: 'Normal - Device Responding to Poll' }
  ];

  // States
  const [nodes, setNodes] = useState<NmsNode[]>(INITIAL_NODES);
  const [events, setEvents] = useState<NmsEvent[]>(initialEvents);
  const [selectedNode, setSelectedNode] = useState<NmsNode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'CURRENT' | 'HISTORY' | 'DC' | 'BLDG' | 'FLR' | 'SPEC' | 'GEAR'>('HISTORY');
  const [refreshInterval, setRefreshInterval] = useState(10); // in seconds
  
  // Custom Devices CRUD Form States
  const [newName, setNewName] = useState('');
  const [newIp, setNewIp] = useState('');
  const [newDetails, setNewDetails] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const handleNmsAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newName.trim() || !newIp.trim()) {
      setFormError('Name and IP are required.');
      return;
    }
    setFormLoading(true);
    try {
      const errMsg = await onAddDevice(newName.trim(), newIp.trim(), newDetails.trim());
      if (errMsg) {
        setFormError(errMsg);
      } else {
        setNewName('');
        setNewIp('');
        setNewDetails('');
      }
    } catch (err) {
      setFormError('Failed to add device.');
    } finally {
      setFormLoading(false);
    }
  };

  // Sidebar expand/collapse categories
  const [expandedGroups, setExpandedGroups] = useState({
    datacenter: true,
    buildings: true,
    medicine16: true,
    med11: true,
    special: true,
    gear: true,
    custom: true
  });

  // Pan and Zoom coordinates state
  const [transform, setTransform] = useState({ x: 0, y: 0, zoom: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll event logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  // Toggle tree group expand
  const toggleGroup = (group: keyof typeof expandedGroups) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  // ----------------------------------------------------
  // Interactive Pan / Zoom logic
  // ----------------------------------------------------
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    // Left click drags map
    if (e.button === 0 && !draggedNode) {
      setIsDragging(true);
      dragStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    }
  };

  const handleNodeMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (e.button === 0) {
      setDraggedNode(id);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggedNode) {
      const dx = e.movementX / transform.zoom;
      const dy = e.movementY / transform.zoom;
      setNodes(prev => prev.map(n => n.id === draggedNode ? { ...n, x: n.x + dx, y: n.y + dy } : n));
    } else if (isDragging) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNode(null);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    let nextZoom = transform.zoom;
    if (e.deltaY < 0) {
      // Zoom In
      nextZoom = Math.min(transform.zoom * zoomFactor, 3);
    } else {
      // Zoom Out
      nextZoom = Math.max(transform.zoom / zoomFactor, 0.4);
    }
    setTransform(prev => ({ ...prev, zoom: nextZoom }));
  };

  const handleZoomIn = () => {
    setTransform(prev => ({ ...prev, zoom: Math.min(prev.zoom * 1.2, 3) }));
  };

  const handleZoomOut = () => {
    setTransform(prev => ({ ...prev, zoom: Math.max(prev.zoom / 1.2, 0.4) }));
  };

  const handleResetZoom = () => {
    setTransform({ x: 0, y: 0, zoom: 1 });
    setSelectedNode(null);
  };

  // Center view on a specific node coordinates
  const centerOnNode = (node: NmsNode) => {
    setSelectedNode(node);
    if (canvasRef.current) {
      const containerWidth = canvasRef.current.clientWidth;
      const containerHeight = canvasRef.current.clientHeight;
      const targetZoom = 1.3;
      
      // Calculate transform to place node in the dead center
      const nextX = containerWidth / 2 - node.x * targetZoom;
      const nextY = containerHeight / 2 - node.y * targetZoom;
      
      setTransform({ x: nextX, y: nextY, zoom: targetZoom });
    }
  };

  // ----------------------------------------------------
  // Real-time Polling Simulation Engine
  // ----------------------------------------------------
  useEffect(() => {
    const runSimulationTick = () => {
      // Randomly pick between 1 and 3 nodes
      const numNodesToChange = Math.floor(Math.random() * 3) + 1;
      const nodesCopy = [...nodes];
      const newEvents: NmsEvent[] = [];

      const severities: ('green' | 'red' | 'yellow' | 'gray')[] = ['green', 'red', 'yellow', 'gray'];
      const statusMap = {
        green: { severity: 'Normal', message: 'Normal - Device Responding to Poll' },
        red: { severity: 'Major', message: 'Major - No Response to Device Poll' },
        yellow: { severity: 'Minor', message: 'Minor - Jitter variance exceeds threshold' },
        gray: { severity: 'Unknown', message: 'Unknown - Remote node link packet loss exceeding 90%' }
      };

      for (let i = 0; i < numNodesToChange; i++) {
        // Pick a random node (avoid cores to maintain basic network connectivity in simulation)
        const randIdx = Math.floor(Math.random() * nodesCopy.length);
        const node = nodesCopy[randIdx];
        if (node.id.startsWith('core')) continue;

        // Pick a new random status different from current
        const availableStatuses = severities.filter(s => s !== node.status);
        const nextStatus = availableStatuses[Math.floor(Math.random() * availableStatuses.length)];
        
        // Log event
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const timeStr = now.toTimeString().split(' ')[0];

        const eventDetails = statusMap[nextStatus];

        newEvents.push({
          id: `sim-${Date.now()}-${i}`,
          severity: eventDetails.severity as any,
          date: dateStr,
          time: timeStr,
          device: node.name,
          message: eventDetails.message
        });

        // Update node status
        node.status = nextStatus;
      }

      setNodes(nodesCopy);
      if (newEvents.length > 0) {
        setEvents(prev => [...prev, ...newEvents]);
      }
    };

    const intervalId = setInterval(runSimulationTick, refreshInterval * 1000);
    return () => clearInterval(intervalId);
  }, [nodes, refreshInterval]);

  // Dynamically merge static nodes with custom monitored devices
  const mergedNodes: NmsNode[] = [
    ...nodes,
    ...customDevices.map((dev, idx) => {
      const totalDevs = customDevices.length;
      const spacing = 80;
      const startX = 440 - ((totalDevs - 1) * spacing) / 2;
      return {
        id: dev.id,
        name: dev.name,
        ip: dev.ip,
        zone: 'custom' as const,
        details: dev.details,
        status: pollingActive ? (dev.status === 'ONLINE' ? 'green' as const : 'red' as const) : 'gray' as const,
        x: startX + idx * spacing,
        y: 80,
        mac: 'N/A'
      };
    })
  ];

  const mergedLinks: NmsLink[] = [
    ...links,
    ...customDevices.map(dev => ({
      source: dev.uplinkId || 'core3', // connect to chosen uplink or core3
      target: dev.id
    }))
  ];

  // ----------------------------------------------------
  // Filters & Tabs logic
  // ----------------------------------------------------
  const filteredNodes = mergedNodes.filter(n => {
    const term = searchTerm.toLowerCase();
    return n.name.toLowerCase().includes(term) || n.ip.toLowerCase().includes(term) || n.details.toLowerCase().includes(term);
  });

  const getTabFilteredEvents = () => {
    switch (activeTab) {
      case 'CURRENT':
        // Show active problems (non-green statuses)
        return events.filter(e => e.severity !== 'Normal');
      case 'DC':
        // Filter events by DC devices
        return events.filter(e => e.device.startsWith('DC') || e.device === 'firewall');
      case 'BLDG':
        // Filter events by building devices
        return events.filter(e => e.device.includes('building'));
      case 'FLR':
        // Filter events by Floor devices (Medicine Building or Med Building)
        return events.filter(e => e.device.startsWith('MED16-') || e.device.startsWith('MED11-'));
      case 'SPEC':
        // Filter events by special medical departments
        return events.filter(e => ['OPD-NODE-1', 'EMR-TERM', 'X-Ray-Diag', 'Pharmacy-S', 'ICU-Monitor', 'Lab-Analyzer', 'OR-System'].includes(e.device));
      case 'GEAR':
        // Filter events by network gears
        return events.filter(e => e.device.startsWith('CORE') || e.device === 'NAC-SERVER' || e.device.includes('AIR') || e.device === 'printer-sys');
      case 'HISTORY':
      default:
        return events;
    }
  };

  // Group nodes by zone for device tree sidebar
  const getZoneNodes = (zone: NmsNode['zone']) => {
    return filteredNodes.filter(n => n.zone === zone);
  };

  // Helper to get severity dot styling
  const getSeverityClass = (status: NmsNode['status']) => {
    switch (status) {
      case 'green': return 'green';
      case 'red': return 'red';
      case 'yellow': return 'yellow';
      case 'gray':
      default: return 'gray';
    }
  };

  const getEventRowClass = (severity: NmsEvent['severity']) => {
    switch (severity) {
      case 'Major': return 'nms-log-row red';
      case 'Minor': return 'nms-log-row yellow';
      case 'Normal': return 'nms-log-row green';
      default: return 'nms-log-row gray';
    }
  };

  return (
    <div className="nms-crt-screen">
      {/* 1. NMS TOPBAR TOOLBAR */}
      <header className="nms-topbar">
        <div className="nms-topbar-left">
          <span className="nms-sys-title">GLOWNET // NMS TOPOLOGY CONSOLE</span>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button className="nms-btn" onClick={handleZoomIn} title="Zoom In">+</button>
            <button className="nms-btn" onClick={handleZoomOut} title="Zoom Out">-</button>
            <button className="nms-btn" onClick={handleResetZoom} title="Reset View">Reset Map</button>
            <button className="nms-btn" onClick={onClose} style={{ borderColor: 'var(--nms-red)', color: 'var(--nms-red)', marginLeft: '1rem' }} title="Exit NMS Mode">Exit NMS</button>
          </div>
        </div>

        <div className="nms-topbar-right">
          {/* Refresh Polling selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
            <span>Poll Speed:</span>
            <select 
              className="nms-select" 
              value={refreshInterval} 
              onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
            >
              <option value={5}>5s (Fast)</option>
              <option value={10}>10s (Normal)</option>
              <option value={15}>15s (Slow)</option>
            </select>
          </div>

          <span style={{ fontSize: '0.75rem', color: 'var(--phosphor-dim)' }}>
            HOST: <strong style={{ color: 'white' }}>localhost</strong> | ADMIN: <strong style={{ color: 'white' }}>Supervisor</strong>
          </span>
        </div>
      </header>

      {/* 2. LEFT SIDEBAR DEVICE TREE */}
      <aside className="nms-sidebar">
        <div className="nms-search-box">
          <input 
            type="text" 
            placeholder="Search device name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="nms-tree-container">
          {/* Group 1: Core Gear */}
          <div className="nms-tree-group">
            <div className="nms-tree-group-header" onClick={() => toggleGroup('gear')}>
              {expandedGroups.gear ? '▼' : '►'} Core & Net Gear
            </div>
            {expandedGroups.gear && (
              <div className="nms-tree-group-items">
                {getZoneNodes('gear').map(node => (
                  <div 
                    key={node.id} 
                    className={`nms-tree-item ${selectedNode?.id === node.id ? 'selected' : ''}`}
                    onClick={() => centerOnNode(node)}
                  >
                    <span className={`nms-dot ${getSeverityClass(node.status)}`}></span>
                    {node.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Group 2: Data Center */}
          <div className="nms-tree-group">
            <div className="nms-tree-group-header" onClick={() => toggleGroup('datacenter')}>
              {expandedGroups.datacenter ? '▼' : '►'} Data Center
            </div>
            {expandedGroups.datacenter && (
              <div className="nms-tree-group-items">
                {getZoneNodes('datacenter').map(node => (
                  <div 
                    key={node.id} 
                    className={`nms-tree-item ${selectedNode?.id === node.id ? 'selected' : ''}`}
                    onClick={() => centerOnNode(node)}
                  >
                    <span className={`nms-dot ${getSeverityClass(node.status)}`}></span>
                    {node.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Group 3: Buildings Distribution */}
          <div className="nms-tree-group">
            <div className="nms-tree-group-header" onClick={() => toggleGroup('buildings')}>
              {expandedGroups.buildings ? '▼' : '►'} Buildings A-G
            </div>
            {expandedGroups.buildings && (
              <div className="nms-tree-group-items">
                {getZoneNodes('buildings').map(node => (
                  <div 
                    key={node.id} 
                    className={`nms-tree-item ${selectedNode?.id === node.id ? 'selected' : ''}`}
                    onClick={() => centerOnNode(node)}
                  >
                    <span className={`nms-dot ${getSeverityClass(node.status)}`}></span>
                    {node.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Group 4: Medicine Building (16 Floors) */}
          <div className="nms-tree-group">
            <div className="nms-tree-group-header" onClick={() => toggleGroup('medicine16')}>
              {expandedGroups.medicine16 ? '▼' : '►'} Medicine Bldg (16 Fl)
            </div>
            {expandedGroups.medicine16 && (
              <div className="nms-tree-group-items">
                {getZoneNodes('medicine16').map(node => (
                  <div 
                    key={node.id} 
                    className={`nms-tree-item ${selectedNode?.id === node.id ? 'selected' : ''}`}
                    onClick={() => centerOnNode(node)}
                  >
                    <span className={`nms-dot ${getSeverityClass(node.status)}`}></span>
                    {node.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Group 4b: Med Building (11 Floors) */}
          <div className="nms-tree-group">
            <div className="nms-tree-group-header" onClick={() => toggleGroup('med11')}>
              {expandedGroups.med11 ? '▼' : '►'} Med Bldg (11 Fl)
            </div>
            {expandedGroups.med11 && (
              <div className="nms-tree-group-items">
                {getZoneNodes('med11').map(node => (
                  <div 
                    key={node.id} 
                    className={`nms-tree-item ${selectedNode?.id === node.id ? 'selected' : ''}`}
                    onClick={() => centerOnNode(node)}
                  >
                    <span className={`nms-dot ${getSeverityClass(node.status)}`}></span>
                    {node.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Group 5: Special Departments */}
          <div className="nms-tree-group">
            <div className="nms-tree-group-header" onClick={() => toggleGroup('special')}>
              {expandedGroups.special ? '▼' : '►'} Medical Depts
            </div>
            {expandedGroups.special && (
              <div className="nms-tree-group-items">
                {getZoneNodes('special').map(node => (
                  <div 
                    key={node.id} 
                    className={`nms-tree-item ${selectedNode?.id === node.id ? 'selected' : ''}`}
                    onClick={() => centerOnNode(node)}
                  >
                    <span className={`nms-dot ${getSeverityClass(node.status)}`}></span>
                    {node.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Group 6: Custom Devices */}
          <div className="nms-tree-group">
            <div className="nms-tree-group-header" onClick={() => toggleGroup('custom' as any)}>
              {expandedGroups.custom ? '▼' : '►'} Custom Monitored
            </div>
            {expandedGroups.custom && (
              <div className="nms-tree-group-items">
                {/* Inline Add Device Form */}
                <form 
                  onSubmit={handleNmsAddSubmit}
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--nms-border)',
                    padding: '0.4rem',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    borderRadius: '3px'
                  }}
                >
                  <input
                    type="text"
                    placeholder="Name..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    style={{
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid var(--nms-border)',
                      color: 'var(--phosphor)',
                      fontSize: '0.7rem',
                      padding: '0.2rem',
                      fontFamily: 'inherit',
                      outline: 'none'
                    }}
                    required
                  />
                  <input
                    type="text"
                    placeholder="IP/Host..."
                    value={newIp}
                    onChange={(e) => setNewIp(e.target.value)}
                    style={{
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid var(--nms-border)',
                      color: 'var(--phosphor)',
                      fontSize: '0.7rem',
                      padding: '0.2rem',
                      fontFamily: 'inherit',
                      outline: 'none'
                    }}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Details..."
                    value={newDetails}
                    onChange={(e) => setNewDetails(e.target.value)}
                    style={{
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid var(--nms-border)',
                      color: 'var(--phosphor)',
                      fontSize: '0.7rem',
                      padding: '0.2rem',
                      fontFamily: 'inherit',
                      outline: 'none'
                    }}
                  />
                  {formError && (
                    <div style={{ color: 'var(--nms-red)', fontSize: '0.6rem' }}>
                      {formError}
                    </div>
                  )}
                  <button 
                    type="submit" 
                    className="nms-btn" 
                    style={{ padding: '0.15rem', fontSize: '0.7rem', justifyContent: 'center', width: '100%' }}
                    disabled={formLoading}
                  >
                    {formLoading ? 'Saving...' : 'Add Node'}
                  </button>
                </form>

                {/* Custom Devices List */}
                {getZoneNodes('custom' as any).map(node => (
                  <div 
                    key={node.id} 
                    className={`nms-tree-item ${selectedNode?.id === node.id ? 'selected' : ''}`}
                    style={{ justifyContent: 'space-between', width: '100%' }}
                    onClick={() => centerOnNode(node)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
                      <span className={`nms-dot ${getSeverityClass(node.status)}`}></span>
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{node.name}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDevice(node.id);
                        if (selectedNode?.id === node.id) {
                          setSelectedNode(null);
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--nms-red)',
                        cursor: 'pointer',
                        padding: '0 4px',
                        fontSize: '0.8rem',
                        fontFamily: 'inherit'
                      }}
                      title="Remove Node"
                    >
                      [x]
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 3. CENTER TOPOLOGY CANVAS (SVG MAP) */}
      <main className="nms-canvas-container" ref={canvasRef}>
        <svg 
          className="nms-svg-map"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Glowing Filter Definitions */}
          <defs>
            <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Master Transform Group */}
          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.zoom})`}>
            {/* Draw Links/Cables */}
            {mergedLinks.map((link, idx) => {
              const srcNode = mergedNodes.find(n => n.id === link.source);
              const tgtNode = mergedNodes.find(n => n.id === link.target);
              if (!srcNode || !tgtNode) return null;
              
              const isAlert = srcNode.status === 'red' || tgtNode.status === 'red';

              return (
                <line
                  key={`link-${idx}`}
                  x1={srcNode.x}
                  y1={srcNode.y}
                  x2={tgtNode.x}
                  y2={tgtNode.y}
                  className={`nms-link-line ${isAlert ? 'alert' : 'active'}`}
                />
              );
            })}

            {/* Draw Nodes */}
            {filteredNodes.map(node => {
              // Rect dimensions
              const width = 80;
              const height = 24;
              const rx = node.x - width / 2;
              const ry = node.y - height / 2;

              return (
                <g 
                  key={node.id} 
                  style={{ cursor: draggedNode ? 'grabbing' : 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    centerOnNode(node);
                  }}
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                >
                  {/* Rectangle base */}
                  <rect
                    x={rx}
                    y={ry}
                    width={width}
                    height={height}
                    rx={4}
                    ry={4}
                    className={`nms-node-rect ${node.status}`}
                  />
                  {/* Text Label */}
                  <text
                    x={node.x}
                    y={node.y + 4}
                    className="nms-node-label"
                  >
                    {node.name.length > 13 ? node.name.substring(0, 11) + '..' : node.name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Floating Details Popup */}
        {selectedNode && (
          <div className="nms-details-popup">
            <div className="nms-details-header">
              <span>{selectedNode.name}</span>
              <button 
                style={{ background: 'none', border: 'none', color: 'var(--nms-red)', cursor: 'pointer', fontSize: '0.8rem' }}
                onClick={() => setSelectedNode(null)}
              >
                [X]
              </button>
            </div>
            <div className="nms-details-row">
              <span className="nms-details-label">IP Address:</span>
              <span className="nms-details-val">{selectedNode.ip}</span>
            </div>
            <div className="nms-details-row">
              <span className="nms-details-label">MAC ID:</span>
              <span className="nms-details-val" style={{ fontSize: '0.65rem' }}>{selectedNode.mac}</span>
            </div>
            <div className="nms-details-row">
              <span className="nms-details-label">Zone/Area:</span>
              <span className="nms-details-val" style={{ textTransform: 'capitalize' }}>{selectedNode.zone}</span>
            </div>
            <div className="nms-details-row">
              <span className="nms-details-label">Status:</span>
              <span className="nms-details-val" style={{ color: `var(--nms-${selectedNode.status})` }}>
                {selectedNode.status.toUpperCase()}
              </span>
            </div>
            <div style={{ borderTop: '1px solid var(--nms-border)', marginTop: '0.5rem', paddingTop: '0.35rem', color: 'white', fontSize: '0.7rem' }}>
              {selectedNode.details}
            </div>
          </div>
        )}
      </main>

      {/* 4. BOTTOM EVENT LOG PANEL */}
      <footer className="nms-log-panel">
        <div className="nms-tabs-bar">
          <button 
            className={`nms-tab-btn ${activeTab === 'CURRENT' ? 'active' : ''}`}
            onClick={() => setActiveTab('CURRENT')}
          >
            Current Alarms
          </button>
          <button 
            className={`nms-tab-btn ${activeTab === 'HISTORY' ? 'active' : ''}`}
            onClick={() => setActiveTab('HISTORY')}
          >
            All Events (History)
          </button>
          <button 
            className={`nms-tab-btn ${activeTab === 'DC' ? 'active' : ''}`}
            onClick={() => setActiveTab('DC')}
          >
            DC Zone
          </button>
          <button 
            className={`nms-tab-btn ${activeTab === 'BLDG' ? 'active' : ''}`}
            onClick={() => setActiveTab('BLDG')}
          >
            Buildings
          </button>
          <button 
            className={`nms-tab-btn ${activeTab === 'FLR' ? 'active' : ''}`}
            onClick={() => setActiveTab('FLR')}
          >
            Floors
          </button>
          <button 
            className={`nms-tab-btn ${activeTab === 'SPEC' ? 'active' : ''}`}
            onClick={() => setActiveTab('SPEC')}
          >
            Medical Depts
          </button>
          <button 
            className={`nms-tab-btn ${activeTab === 'GEAR' ? 'active' : ''}`}
            onClick={() => setActiveTab('GEAR')}
          >
            Core Gear
          </button>
        </div>

        <div className="nms-log-table-container">
          <table className="nms-log-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Severity</th>
                <th style={{ width: '100px' }}>Date</th>
                <th style={{ width: '80px' }}>Time</th>
                <th style={{ width: '130px' }}>Device</th>
                <th>Event Message</th>
              </tr>
            </thead>
            <tbody>
              {getTabFilteredEvents().map(event => (
                <tr key={event.id} className={getEventRowClass(event.severity)}>
                  <td>{event.severity.toUpperCase()}</td>
                  <td>{event.date}</td>
                  <td>{event.time}</td>
                  <td>{event.device}</td>
                  <td>{event.message}</td>
                </tr>
              ))}
              <tr ref={logEndRef} />
            </tbody>
          </table>
        </div>
      </footer>
    </div>
  );
};
