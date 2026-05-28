import React from 'react';

interface NetworkInterface {
  name: string;
  ip: string;
  mac: string;
  internal: boolean;
  status: 'active' | 'inactive';
}

interface InterfaceListProps {
  interfaces: NetworkInterface[];
}

export const InterfaceList: React.FC<InterfaceListProps> = ({ interfaces }) => {
  const getInterfaceIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('wi-fi') || n.includes('wifi') || n.includes('wireless') || n.includes('wlan')) {
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M12 21l-8.25-8.25a2.5 2.5 0 010-3.5 11.66 11.66 0 0116.5 0 2.5 2.5 0 010 3.5L12 21zm-6.84-9.66l6.84 6.84 6.84-6.84a10.16 10.16 0 00-13.68 0z" />
          <path d="M7.76 13.92l4.24 4.24 4.24-4.24a6.66 6.66 0 00-8.48 0zM12 18.5l1.5-1.5-1.5-1.5-1.5 1.5 1.5 1.5z" />
        </svg>
      );
    }
    if (n.includes('ethernet') || n.includes('eth') || n.includes('lan')) {
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M19 15v3c0 .55-.45 1-1 1h-5v2h2c.55 0 1 .45 1 1s-.45 1-1 1H9c-.55 0-1-.45-1-1s.45-1 1-1h2v-2H6c-.55 0-1-.45-1-1v-3c0-.55.45-1 1-1h12c.55 0 1 .45 1 1zM6 3h12c1.66 0 3 1.34 3 3v6c0 .55-.45 1-1 1H4c-.55 0-1-.45-1-1V6c0-1.66 1.34-3 3-3zm13 7V6c0-.55-.45-1-1-1H6c-.55 0-1 .45-1 1v4h14z" />
        </svg>
      );
    }
    // Loopback / Virtual / Default
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
      </svg>
    );
  };

  return (
    <div className="interfaces-list">
      {interfaces.length === 0 ? (
        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          No adapters detected
        </div>
      ) : (
        interfaces.map((iface, idx) => (
          <div className="interface-item" key={idx}>
            <div className="interface-info-left">
              <div className="interface-type-icon">
                {getInterfaceIcon(iface.name)}
              </div>
              <div className="interface-details">
                <span className="interface-name">{iface.name}</span>
                <span className="interface-ips">
                  IP: {iface.ip} &bull; MAC: {iface.mac}
                </span>
              </div>
            </div>
            <span className={`interface-status-badge ${iface.status}`}>
              {iface.status}
            </span>
          </div>
        ))
      )}
    </div>
  );
};
