import React, { useState, useEffect, useRef } from 'react';
import '../Nms.css';
import { MonitoredDevice } from './DeviceManager';
import { TopologyNodeStatus } from '../App';

export interface NmsNode {
  id: string;
  name: string;
  ip: string;
  zone: string;
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
  onAddDevice: (name: string, ip: string, details: string, sshUsername?: string, sshPassword?: string, deviceType?: string, uplinkId?: string, zone?: string) => Promise<string | null>;
  onDeleteDevice: (id: string) => Promise<void>;
  pollingActive: boolean;
  topologyStatus: TopologyNodeStatus[];
  topologyNodes: NmsNode[];
  onUpdateNode: (id: string, name: string, ip: string) => Promise<string | null>;
  onUpdatePosition?: (id: string, x: number, y: number, isCustom: boolean) => void;
  onUpdateZone?: (id: string, zone: string, isCustom: boolean) => void;
}

export const INITIAL_NODES: NmsNode[] = [
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

export const NmsTopology: React.FC<NmsTopologyProps> = ({
  onClose,
  customDevices,
  onAddDevice,
  onDeleteDevice,
  pollingActive,
  topologyStatus,
  topologyNodes,
  onUpdateNode,
  onUpdatePosition,
  onUpdateZone
}) => {

  // Links setup
  const links: NmsLink[] = [
    { source: 'F4-core_med', target: 'Maintenace-MED' },
    { source: 'F4-core_med', target: 'F1-med-organiz' },
    { source: 'F1-med-organiz', target: 'F1-med-OSH-1' },
    { source: 'F1-med-organiz', target: 'F1-med-OSH-2' },
    { source: 'F1-med-organiz', target: 'F1-nisit1-new' },
    { source: 'F1-med-organiz', target: 'F1-Library-1' },
    { source: 'F1-med-organiz', target: 'F1-Library-2' },
    { source: 'F1-med-organiz', target: 'F1-Security-1' },
    { source: 'F4-core_med', target: 'F2-Parcel' },
    { source: 'F2-Parcel', target: 'F2-Parcel-1' },
    { source: 'F2-Parcel', target: 'F2-Parcel-3' },
    { source: 'F2-Parcel', target: 'F2-Parcel-4' },
    { source: 'F2-Parcel', target: 'F2-Parcel-5' },
    { source: 'F2-Parcel', target: 'F2-Parcel6' },
    { source: 'F4-core_med', target: 'F3-Comvention' },
    { source: 'F3-Comvention', target: 'F3-Lab-PBL-1' },
    { source: 'F4-core_med', target: 'F4-IT-1' },
    { source: 'F4-IT-1', target: 'F4' },
    { source: 'F4-IT-1', target: 'F4-Medicine-1' },
    { source: 'F4-IT-1', target: 'F4-Medicine-2' },
    { source: 'F4-IT-1', target: 'F4-HR-1' },
    { source: 'F4-IT-1', target: 'F4-HR-2' },
    { source: 'F4-IT-1', target: 'F4-HR-3' },
    { source: 'F4-core_med', target: 'F5-L-1' },
    { source: 'F5-L-1', target: 'F5-R-1' },
    { source: 'F4-core_med', target: 'F6-L-1' },
    { source: 'F6-L-1', target: 'F6-L-2' },
    { source: 'F6-L-1', target: 'F6-R-1' },
    { source: 'F4-core_med', target: 'F7-L-1' },
    { source: 'F7-L-1', target: 'F7-L-2' },
    { source: 'F7-L-1', target: 'F7L-3' },
    { source: 'F7-L-1', target: 'F7-L-4' },
    { source: 'F7-L-1', target: 'F7-R-1' },
    { source: 'F7-L-1', target: 'F7-R-2' },
    { source: 'F4-core_med', target: 'F8-L-1' },
    { source: 'F8-L-1', target: 'F8-L-2' },
    { source: 'F8-L-1', target: 'F8-L-3' },
    { source: 'F8-L-1', target: 'F8-L-DIM' },
    { source: 'F8-L-1', target: 'F8-R-1' },
    { source: 'F8-L-1', target: 'F8-R-2' },
    { source: 'F4-core_med', target: 'F9-L-1' },
    { source: 'F9-L-1', target: 'F9-L-2' },
    { source: 'F4-core_med', target: 'F10-R-1' },
    { source: 'F10-R-1', target: 'F10-rack1' },
    { source: 'F10-R-1', target: 'F10-rack2' },
    { source: 'F10-R-1', target: 'F10-ip-phone' }
  ];

  // 2. Initial Events Data
  const initialEvents: NmsEvent[] = [];

  // States
  const [nodes, setNodes] = useState<NmsNode[]>(INITIAL_NODES);
  const [events, setEvents] = useState<NmsEvent[]>(initialEvents);
  const [selectedNode, setSelectedNode] = useState<NmsNode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'CURRENT' | 'HISTORY' | 'CORE' | 'FLOORS'>('HISTORY');
  const [refreshInterval, setRefreshInterval] = useState(10); // in seconds

  // Custom Devices CRUD Form States
  const [newZone, setNewZone] = useState('');
  const [newName, setNewName] = useState('');
  const [newIp, setNewIp] = useState('');
  const [newDetails, setNewDetails] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Editing Selected Node States
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editIp, setEditIp] = useState('');
  const [editZone, setEditZone] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Fetch initial events from backend
  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEvents(data);
        }
      })
      .catch(err => console.error('Failed to load events:', err));
  }, []);

  // Synchronize local nodes state when topologyNodes changes
  // Use a ref to track the currently dragged node ID (avoids stale closure issues)
  const draggedNodeRef = useRef<string | null>(null);

  // Synchronize local nodes state when topologyNodes/customDevices changes
  // CRITICAL: Never override x,y if a node is currently being dragged
  useEffect(() => {
    setNodes(prev => {
      const tNodes = topologyNodes.map(tn => {
        const current = prev.find(p => p.id === tn.id);
        const isDraggingThis = draggedNodeRef.current === tn.id;
        return {
          ...tn,
          // Preserve current x,y if dragging this node
          x: (current && isDraggingThis) ? current.x : tn.x,
          y: (current && isDraggingThis) ? current.y : tn.y,
        };
      });

      const cNodes = customDevices.map((dev, idx) => {
        const current = prev.find(p => p.id === dev.id);
        const isDraggingThis = draggedNodeRef.current === dev.id;
        const startX = 440 - ((customDevices.length - 1) * 80) / 2;
        return {
          id: dev.id,
          name: dev.name,
          ip: dev.ip,
          zone: dev.zone || 'custom',
          details: dev.details,
          status: pollingActive ? (dev.status === 'ONLINE' ? 'green' as const : 'red' as const) : 'gray' as const,
          // Preserve current x,y if dragging, else use stored value, else default
          x: (current && isDraggingThis) ? current.x : (dev.x !== undefined ? dev.x : startX + idx * 80),
          y: (current && isDraggingThis) ? current.y : (dev.y !== undefined ? dev.y : 80),
          mac: 'N/A'
        };
      });

      return [...tNodes, ...cNodes];
    });
  }, [topologyNodes, customDevices, pollingActive]);


  const handleNmsAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newName.trim() || !newIp.trim()) {
      setFormError('Name and IP are required.');
      return;
    }
    setFormLoading(true);
    try {
      const errMsg = await onAddDevice(newName.trim(), newIp.trim(), newDetails.trim(), undefined, undefined, undefined, undefined, newZone.trim());
      if (errMsg) {
        setFormError(errMsg);
      } else {
        setNewName('');
        setNewIp('');
        setNewDetails('');
        setNewZone('');
      }
    } catch (err) {
      setFormError('Failed to add device.');
    } finally {
      setFormLoading(false);
    }
  };

  // Sidebar expand/collapse categories
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    core: true,
    custom: true
  });

  // Pan and Zoom coordinates state
  const [transform, setTransform] = useState({ x: 0, y: 0, zoom: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const logEndRef = useRef<HTMLTableRowElement>(null);

  // Auto-scroll event logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  // Toggle tree group expand
  const toggleGroup = (group: string) => {
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
      draggedNodeRef.current = id;
      lastDraggedPos.current = null;
    }
  };

  const lastDraggedPos = useRef<{x: number, y: number} | null>(null);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggedNodeRef.current) {
      // Move the specific node
      const dx = e.movementX / transform.zoom;
      const dy = e.movementY / transform.zoom;
      
      setNodes(prev => {
        const next = prev.map(n => {
          if (n.id === draggedNodeRef.current) {
            const newX = n.x + dx;
            const newY = n.y + dy;
            lastDraggedPos.current = { x: newX, y: newY };
            return { ...n, x: newX, y: newY };
          }
          return n;
        });
        return next;
      });
    } else if (isDragging) {
      // Pan the canvas
      setTransform(prev => ({
        ...prev,
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    }
  };

  const handleMouseUp = () => {
    if (draggedNodeRef.current && onUpdatePosition) {
      const nodeId = draggedNodeRef.current;
      const finalPos = lastDraggedPos.current;
      if (finalPos) {
        const isCustom = customDevices.some(d => d.id === nodeId);
        onUpdatePosition(nodeId, finalPos.x, finalPos.y, isCustom);
      } else {
        // Fallback: find in current nodes state
        setNodes(prev => {
          const node = prev.find(n => n.id === nodeId);
          if (node) {
            const isCustom = customDevices.some(d => d.id === nodeId);
            onUpdatePosition(nodeId, node.x, node.y, isCustom);
          }
          return prev;
        });
      }
    }
    lastDraggedPos.current = null;
    draggedNodeRef.current = null;
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
    setIsEditing(false);
    setEditName(node.name);
    setEditIp(node.ip);
    setEditError(null);
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

  const handleSaveNodeEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNode) return;
    if (!editName.trim() || !editIp.trim()) {
      setEditError('Name and IP are required.');
      return;
    }
    setEditLoading(true);
    setEditError(null);
    try {
      const errMsg = await onUpdateNode(selectedNode.id, editName.trim(), editIp.trim());
      if (errMsg) {
        setEditError(errMsg);
        return;
      }

      // Save zone if changed
      if (editZone.trim() && editZone.trim() !== selectedNode.zone && onUpdateZone) {
        const isCustom = customDevices.some(d => d.id === selectedNode.id);
        onUpdateZone(selectedNode.id, editZone.trim(), isCustom);
      }

      setSelectedNode(prev => prev ? {
        ...prev,
        name: editName.trim(),
        ip: editIp.trim(),
        zone: editZone.trim() || prev.zone
      } : null);
      setIsEditing(false);
    } catch (err) {
      setEditError('Failed to update node.');
    } finally {
      setEditLoading(false);
    }
  };

  // ----------------------------------------------------
  // Real-time Topology Status from Backend Ping
  // ----------------------------------------------------
  // Track consecutive red poll count per node (frontend grace period)
  const prevStatusRef = useRef<Record<string, string>>({});
  const consecutiveRedRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (topologyStatus.length === 0) return;

    const statusMap: Record<string, string> = {
      green: 'Normal',
      red: 'Major',
      yellow: 'Minor',
      gray: 'Unknown'
    };

    const messageMap: Record<string, string> = {
      green: 'Normal - Device Responding to Poll',
      red: 'Major - No Response to Device Poll',
      yellow: 'Minor - High latency detected (>100ms)',
      gray: 'Unknown - Device IP not configured'
    };

    const newEvents: NmsEvent[] = [];

    setNodes(prev => {
      const updated = prev.map(node => {
        const match = topologyStatus.find(t => t.id === node.id);
        if (!match) return node;

        const prevStatus = prevStatusRef.current[node.id];
        const newStatus = match.status as 'green' | 'red' | 'yellow' | 'gray';

        // Track consecutive red counts for additional frontend grace
        if (newStatus === 'red') {
          consecutiveRedRef.current[node.id] = (consecutiveRedRef.current[node.id] || 0) + 1;
        } else {
          consecutiveRedRef.current[node.id] = 0;
        }

        // Generate event only if status actually changed
        if (prevStatus !== undefined && prevStatus !== newStatus) {
          // Skip MAJOR if this is the very first red (server already has 2-failure threshold,
          // but add one more layer: skip if prev was green and this is first red)
          const isFirstRed = newStatus === 'red' && prevStatus !== 'red';
          const consecutiveReds = consecutiveRedRef.current[node.id] || 0;

          // Only emit MAJOR event if truly confirmed red (not just a flap)
          if (newStatus === 'red' && consecutiveReds < 1) {
            // Skip - server will confirm again in next poll (30s)
            prevStatusRef.current[node.id] = newStatus;
            return { ...node, status: newStatus };
          }

          const now = new Date();
          const yyyy = now.getFullYear();
          const mm = String(now.getMonth() + 1).padStart(2, '0');
          const dd = String(now.getDate()).padStart(2, '0');
          const latencyInfo = match.latency !== null ? ` (${match.latency}ms)` : '';

          newEvents.push({
            id: `ping-${Date.now()}-${node.id}`,
            severity: statusMap[newStatus] as any,
            date: `${yyyy}-${mm}-${dd}`,
            time: now.toTimeString().split(' ')[0],
            device: node.name,
            message: messageMap[newStatus] + latencyInfo
          });
        }

        prevStatusRef.current[node.id] = newStatus;
        return { ...node, status: newStatus };
      });
      return updated;
    });

    if (newEvents.length > 0) {
      setEvents(prev => [...prev, ...newEvents]);

      // Save events to backend
      fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ events: newEvents })
      }).catch(err => console.error('Failed to save events to backend:', err));
    }
  }, [topologyStatus]);


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
  const filteredNodes = nodes.filter(n => {
    const term = searchTerm.toLowerCase();
    return n.name.toLowerCase().includes(term) || n.ip.toLowerCase().includes(term) || n.details.toLowerCase().includes(term);
  });

  const getTabFilteredEvents = () => {
    switch (activeTab) {
      case 'CURRENT':
        // Show active problems (non-green statuses)
        return events.filter(e => e.severity !== 'Normal');
      case 'CORE':
        return events.filter(e => e.device.includes('core'));
      case 'FLOORS':
        return events.filter(e => !e.device.includes('core'));
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
    <div className="nms-dashboard">
      {/* 1. TOP BAR */}
      <header className="nms-topbar">
        <div className="nms-topbar-left">
          <div className="nms-sys-title">MEDSWU || TOPOLOGY</div>
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
          <div className="nms-tree-group">
            <div className="nms-tree-group-header" onClick={() => toggleGroup('_addForm')}>
              {expandedGroups['_addForm'] !== false ? '▼' : '►'} ➕ Add Custom Device
            </div>
            {expandedGroups['_addForm'] !== false && (
              <div className="nms-tree-group-items" style={{ padding: '0.5rem' }}>
                <form
                  onSubmit={handleNmsAddSubmit}
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--nms-border)',
                    padding: '0.4rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    borderRadius: '3px'
                  }}
                >
                  <input
                    type="text"
                    placeholder="Group/Zone (e.g. floor1)"
                    value={newZone}
                    onChange={(e) => setNewZone(e.target.value)}
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
              </div>
            )}
          </div>

          {Array.from(new Set(nodes.map(n => n.zone))).sort().map(zone => (
            <div className="nms-tree-group" key={zone}>
              <div className="nms-tree-group-header" onClick={() => toggleGroup(zone)}>
                {expandedGroups[zone] !== false ? '▼' : '►'} {zone.toUpperCase()}
              </div>
              {expandedGroups[zone] !== false && (
                <div className="nms-tree-group-items">
                  {getZoneNodes(zone).map(node => {
                    const isCustom = customDevices.some(d => d.id === node.id);
                    return (
                      <div
                        key={node.id}
                        className={`nms-tree-item ${selectedNode?.id === node.id ? 'selected' : ''}`}
                        onClick={() => centerOnNode(node)}
                        style={{ justifyContent: 'space-between', width: '100%' }}
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
                            padding: '2px 4px',
                            borderRadius: '3px',
                            opacity: 0.8
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
                          onMouseOut={(e) => (e.currentTarget.style.opacity = '0.8')}
                          title="Delete Node"
                        >
                          ✖
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
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
              const srcNode = nodes.find(n => n.id === link.source);
              const tgtNode = nodes.find(n => n.id === link.target);
              if (!srcNode || !tgtNode) return null;

              const isAlert = srcNode.status === 'red' || tgtNode.status === 'red';
              
              // Smooth bezier curve logic
              const midX = (srcNode.x + tgtNode.x) / 2;
              const d = `M ${srcNode.x} ${srcNode.y} C ${midX} ${srcNode.y}, ${midX} ${tgtNode.y}, ${tgtNode.x} ${tgtNode.y}`;

              return (
                <path
                  key={`link-${idx}`}
                  d={d}
                  className={`nms-link-line ${isAlert ? 'alert' : 'active'}`}
                />
              );
            })}

            {/* Draw Nodes */}
            {filteredNodes.map(node => {
              // Modern Node dimensions
              const width = 100;
              const height = 32;
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
                  {/* Outer Status Glow */}
                  <rect
                    x={rx - 2}
                    y={ry - 2}
                    width={width + 4}
                    height={height + 4}
                    rx={10}
                    ry={10}
                    className={`nms-node-status-glow ${node.status}`}
                  />
                  {/* Rectangle base */}
                  <rect
                    x={rx}
                    y={ry}
                    width={width}
                    height={height}
                    rx={8}
                    ry={8}
                    className="nms-node-rect"
                  />
                  {/* Text Label */}
                  <text
                    x={node.x}
                    y={node.y + 4}
                    className="nms-node-label"
                  >
                    {node.name.length > 14 ? node.name.substring(0, 12) + '..' : node.name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Floating Details Popup */}
        {selectedNode && (
          <div className="nms-details-popup" style={{ minWidth: '220px' }}>
            <div className="nms-details-header">
              <span>{isEditing ? 'Edit Node' : selectedNode.name}</span>
              <button
                style={{ background: 'none', border: 'none', color: 'var(--nms-red)', cursor: 'pointer', fontSize: '0.8rem' }}
                onClick={() => {
                  setSelectedNode(null);
                  setIsEditing(false);
                }}
              >
                [X]
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveNodeEdit} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Name:</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid var(--nms-border)',
                      color: 'var(--phosphor)',
                      fontSize: '0.75rem',
                      padding: '0.25rem',
                      fontFamily: 'inherit',
                      outline: 'none'
                    }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>IP Address:</label>
                  <input
                    type="text"
                    value={editIp}
                    onChange={(e) => setEditIp(e.target.value)}
                    style={{
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid var(--nms-border)',
                      color: 'var(--phosphor)',
                      fontSize: '0.75rem',
                      padding: '0.25rem',
                      fontFamily: 'inherit',
                      outline: 'none'
                    }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Zone/Group:</label>
                  <input
                    type="text"
                    value={editZone}
                    onChange={(e) => setEditZone(e.target.value)}
                    placeholder={selectedNode?.zone || 'e.g. floor3, custom'}
                    list="zone-suggestions"
                    style={{
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid var(--nms-border)',
                      color: 'var(--phosphor)',
                      fontSize: '0.75rem',
                      padding: '0.25rem',
                      fontFamily: 'inherit',
                      outline: 'none'
                    }}
                  />
                  <datalist id="zone-suggestions">
                    {Array.from(new Set(nodes.map(n => n.zone))).sort().map(z => (
                      <option key={z} value={z} />
                    ))}
                  </datalist>
                </div>

                {editError && (
                  <div style={{ color: 'var(--nms-red)', fontSize: '0.65rem', marginTop: '0.2rem' }}>
                    {editError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="nms-btn"
                    style={{ flex: 1, padding: '0.2rem', fontSize: '0.7rem', justifyContent: 'center' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="nms-btn"
                    style={{ flex: 1, padding: '0.2rem', fontSize: '0.7rem', justifyContent: 'center', borderColor: 'var(--nms-green)', color: 'var(--nms-green)' }}
                    disabled={editLoading}
                  >
                    {editLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            ) : (
              <>
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

                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem', borderTop: '1px solid var(--nms-border)', paddingTop: '0.5rem' }}>
                  <button
                    onClick={() => {
                      setEditName(selectedNode.name);
                      setEditIp(selectedNode.ip);
                      setEditZone(selectedNode.zone);
                      setIsEditing(true);
                    }}
                    className="nms-btn"
                    style={{ flex: 1, padding: '0.2rem 0.4rem', fontSize: '0.7rem', justifyContent: 'center' }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete ${selectedNode.name}?`)) {
                        onDeleteDevice(selectedNode.id);
                        setSelectedNode(null);
                      }
                    }}
                    className="nms-btn"
                    style={{ flex: 1, padding: '0.2rem 0.4rem', fontSize: '0.7rem', justifyContent: 'center', borderColor: 'var(--nms-red)', color: 'var(--nms-red)' }}
                  >
                    🗑️ Delete
                  </button>

                  {selectedNode.ip !== '0.0.0.0' && (
                    <>
                      <a
                        href={`http://${selectedNode.ip}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="nms-btn"
                        style={{
                          flex: 1,
                          padding: '0.2rem 0.4rem',
                          fontSize: '0.7rem',
                          justifyContent: 'center',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          color: 'var(--phosphor)',
                          borderColor: 'var(--nms-border)'
                        }}
                      >
                        🌐 Open Web
                      </a>
                      <a
                        href={`ssh://${selectedNode.ip}`}
                        className="nms-btn"
                        style={{
                          flex: 1,
                          padding: '0.2rem 0.4rem',
                          fontSize: '0.7rem',
                          justifyContent: 'center',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          color: 'var(--phosphor)',
                          borderColor: 'var(--nms-border)'
                        }}
                      >
                        🖥️ SSH
                      </a>
                    </>
                  )}
                </div>
              </>
            )}
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
            className={`nms-tab-btn ${activeTab === 'CORE' ? 'active' : ''}`}
            onClick={() => setActiveTab('CORE')}
          >
            Core Zone
          </button>
          <button
            className={`nms-tab-btn ${activeTab === 'FLOORS' ? 'active' : ''}`}
            onClick={() => setActiveTab('FLOORS')}
          >
            Floors
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
                  <td>
                    <span className={`nms-severity-badge ${event.severity.toLowerCase()}`}>
                      {event.severity === 'Major' ? '▼ MAJOR' :
                       event.severity === 'Minor' ? '▲ MINOR' :
                       event.severity === 'Normal' ? '● NORMAL' : event.severity.toUpperCase()}
                    </span>
                  </td>
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
