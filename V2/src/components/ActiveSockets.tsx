import React, { useState } from 'react';

interface SocketConnection {
  proto: string;
  local: string;
  foreign: string;
  state: string;
}

interface ActiveSocketsProps {
  sockets: SocketConnection[];
}

export const ActiveSockets: React.FC<ActiveSocketsProps> = ({ sockets }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSockets = sockets.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.local.toLowerCase().includes(term) ||
      s.foreign.toLowerCase().includes(term) ||
      s.state.toLowerCase().includes(term) ||
      s.proto.toLowerCase().includes(term)
    );
  });

  const getStateClass = (state: string) => {
    const s = state.toUpperCase();
    if (s === 'ESTABLISHED') return 'state-badge established';
    if (s === 'LISTENING' || s === 'LISTEN') return 'state-badge listening';
    if (s.includes('WAIT')) return 'state-badge time-wait';
    return 'state-badge close-wait';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
      {/* Search box */}
      <div className="search-filter-box">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="var(--text-secondary)">
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
        <input
          type="text"
          placeholder="Filter by address, port, protocol or state..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')} 
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Sockets Table */}
      <div className="sockets-table-container">
        {filteredSockets.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No connections match filters
          </div>
        ) : (
          <table className="sockets-table">
            <thead>
              <tr>
                <th>Proto</th>
                <th>Local Address</th>
                <th>Foreign Address</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {filteredSockets.map((s, idx) => (
                <tr key={idx}>
                  <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{s.proto}</td>
                  <td>{s.local}</td>
                  <td>{s.foreign}</td>
                  <td>
                    <span className={getStateClass(s.state)}>
                      {s.state}
                    </span>
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
