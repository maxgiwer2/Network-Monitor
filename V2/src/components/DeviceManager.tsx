import React, { useState } from 'react';

export interface MonitoredDevice {
  id: string;
  name: string;
  ip: string;
  details: string;
  sshUsername?: string;
  sshPassword?: string;
  deviceType?: string;
  latency?: number | null;
  status?: 'ONLINE' | 'OFFLINE';
  uplinkId?: string;
  zone?: string;
  x?: number;
  y?: number;
}

interface DeviceManagerProps {
  devices: MonitoredDevice[];
  availableUplinks?: {id: string, name: string}[];
  onAddDevice: (name: string, ip: string, details: string, sshUsername?: string, sshPassword?: string, deviceType?: string, uplinkId?: string, zone?: string) => Promise<string | null>;
  onDeleteDevice: (id: string) => Promise<void>;
  onAddDevicesBulk?: (devices: any[]) => void;
  pollingActive: boolean;
}

export const DeviceManager: React.FC<DeviceManagerProps> = ({
  devices,
  availableUplinks = [],
  onAddDevice,
  onDeleteDevice,
  onAddDevicesBulk,
  pollingActive
}) => {
  const [name, setName] = useState('');
  const [ip, setIp] = useState('');
  const [details, setDetails] = useState('');
  const [sshUsername, setSshUsername] = useState('');
  const [sshPassword, setSshPassword] = useState('');
  const [deviceType, setDeviceType] = useState('general');
  const [uplinkId, setUplinkId] = useState('');
  const [zone, setZone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const validateIp = (ipAddress: string) => {
    // Basic IP address validation regex (also allows simple hostnames like 'localhost')
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    const hostRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return ipAddress === 'localhost' || ipRegex.test(ipAddress) || hostRegex.test(ipAddress);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onAddDevicesBulk) return;
    
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\\n');
        // skip header
        const dataLines = lines.slice(1).filter(l => l.trim().length > 0);
        
        const newDevices = dataLines.map(line => {
          // simple CSV parsing handling commas
          const parts = line.split(',');
          return {
            name: parts[0] || '',
            ip: parts[1] || '',
            details: parts[2] || '',
            sshUsername: parts[3] || '',
            sshPassword: parts[4] || '',
            deviceType: parts[5] || 'general',
            uplinkId: parts[6] || ''
          };
        });
        
        if (newDevices.length > 0) {
          onAddDevicesBulk(newDevices);
        }
      } catch (err) {
        console.error('Failed to parse CSV', err);
        setError('Failed to parse CSV file.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // clear input
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanIp = ip.trim();
    const cleanDetails = details.trim();

    if (!cleanName || !cleanIp) {
      setError('Device Name and IP Address are required.');
      return;
    }

    if (!validateIp(cleanIp)) {
      setError('Please enter a valid IP address or hostname.');
      return;
    }

    setLoading(true);
    try {
      const errMsg = await onAddDevice(cleanName, cleanIp, cleanDetails, sshUsername, sshPassword, deviceType, uplinkId, zone.trim());
      if (errMsg) {
        setError(errMsg);
      } else {
        // Reset form
        setName('');
        setIp('');
        setDetails('');
        setSshUsername('');
        setSshPassword('');
        setDeviceType('general');
        setUplinkId('');
        setZone('');
        setShowForm(false);
      }
    } catch (err) {
      setError('Failed to add device. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      {/* Header section with toggle form button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Monitor custom internal hosts (Limit 10)
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <a 
            href="/api/devices/template.csv" 
            className="diag-btn secondary-btn"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', textDecoration: 'none' }}
            download="device_template.csv"
          >
            ↓ Template
          </a>
          <label className="diag-btn secondary-btn" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer', margin: 0 }}>
            ↑ Import CSV
            <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileUpload} disabled={loading} />
          </label>
          <button
            className="diag-btn"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => {
              setShowForm(!showForm);
              setError(null);
            }}
          >
            {showForm ? 'Cancel' : '+ Add Device'}
          </button>
        </div>
      </div>

      {/* Add Device Form Panel */}
      {showForm && (
        <form 
          onSubmit={handleSubmit}
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {/* Device Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Device Name *</label>
              <input
                type="text"
                placeholder="e.g. Primary Router"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.45rem',
                  color: 'white',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
                disabled={loading}
              />
            </div>
            {/* IP Address */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>IP / Hostname *</label>
              <input
                type="text"
                placeholder="e.g. 192.168.1.1"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.45rem',
                  color: 'white',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
                disabled={loading}
              />
            </div>
            {/* Zone */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Zone/Group</label>
              <input
                type="text"
                placeholder="e.g. floor1 (optional)"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.45rem',
                  color: 'white',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
                disabled={loading}
              />
            </div>
          </div>

          {/* Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Details</label>
            <input
              type="text"
              placeholder="e.g. Gateway Server in Room A"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.45rem',
                color: 'white',
                fontSize: '0.85rem',
                outline: 'none'
              }}
              disabled={loading}
            />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0.5rem 0' }} />

          {/* SSH Configuration (Optional) */}
          <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '-0.25rem' }}>
            SSH Credentials (For Deep Network Analysis)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Device Type</label>
              <select
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.45rem',
                  color: 'white',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
                disabled={loading}
              >
                <option value="general">General (Linux/Other)</option>
                <option value="cisco">Cisco Router/Switch</option>
                <option value="mikrotik">MikroTik RouterOS</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Uplink / Connect To</label>
              <select
                value={uplinkId}
                onChange={(e) => setUplinkId(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.45rem',
                  color: 'white',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
                disabled={loading}
              >
                <option value="">-- Default (core3) --</option>
                {availableUplinks.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>SSH Username</label>
              <input
                type="text"
                placeholder="Optional"
                value={sshUsername}
                onChange={(e) => setSshUsername(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.45rem',
                  color: 'white',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
                disabled={loading}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>SSH Password</label>
              <input
                type="password"
                placeholder="Optional"
                value={sshPassword}
                onChange={(e) => setSshPassword(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.45rem',
                  color: 'white',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 500 }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="diag-btn"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={loading || !name || !ip}
          >
            {loading ? 'Saving Device...' : 'Save and Start Monitoring'}
          </button>
        </form>
      )}

      {/* Devices List Table */}
      <div className="sockets-table-container" style={{ maxHeight: '310px' }}>
        {devices.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No custom devices configured. Click "+ Add Device" above to add one.
          </div>
        ) : (
          <table className="sockets-table">
            <thead>
              <tr>
                <th>Device Name</th>
                <th>IP / Host</th>
                <th>Latency</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((dev) => (
                <tr key={dev.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{dev.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{dev.details || 'No details'}</div>
                  </td>
                  <td>{dev.ip}</td>
                  <td>
                    {pollingActive ? (
                      dev.status === 'ONLINE' && dev.latency !== undefined ? (
                        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                          {dev.latency !== null ? `${dev.latency} ms` : '< 1 ms'}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>--</span>
                      )
                    ) : (
                      <span style={{ color: 'var(--warning)', fontSize: '0.75rem' }}>PAUSED</span>
                    )}
                  </td>
                  <td>
                    {pollingActive ? (
                      <span className={`interface-status-badge ${dev.status === 'ONLINE' ? 'active' : 'inactive'}`}>
                        {dev.status || 'OFFLINE'}
                      </span>
                    ) : (
                      <span className="interface-status-badge inactive">PAUSED</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => onDeleteDevice(dev.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--danger)',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
                      onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
                      title="Delete Device"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
