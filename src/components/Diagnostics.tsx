import React, { useState, useRef, useEffect } from 'react';

export const Diagnostics: React.FC = () => {
  const [host, setHost] = useState('google.com');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [command, setCommand] = useState('show interfaces');
  const [loading, setLoading] = useState(false);
  const [toolRunning, setToolRunning] = useState<string | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto scroll to bottom of console
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleLogs]);

  const addLog = (text: string) => {
    setConsoleLogs((prev) => [...prev, text]);
  };

  const handleClear = () => {
    setConsoleLogs([]);
  };

  const runPing = async () => {
    if (!host) return;
    setLoading(true);
    setToolRunning('PING');
    addLog(`$ ping -n 4 ${host}`);
    
    try {
      const response = await fetch('/api/diagnostics/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host })
      });
      
      const data = await response.json();
      if (data.output) {
        addLog(data.output);
      } else {
        addLog('Error: Failed to parse ping output.');
      }
    } catch (e) {
      addLog(`Error connecting to diagnostic API: ${(e as Error).message}`);
    } finally {
      setLoading(false);
      setToolRunning(null);
    }
  };

  const runPortScan = async () => {
    if (!host) return;
    setLoading(true);
    setToolRunning('PORTSCAN');
    addLog(`$ portscan --host ${host}`);
    addLog('Scanning ports 21, 22, 80, 443, 3000, 5000, 8080...');
    
    try {
      const response = await fetch('/api/diagnostics/portscan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host })
      });
      
      const data = await response.json();
      if (data.results) {
        data.results.forEach((res: { port: number; status: string }) => {
          const color = res.status === 'OPEN' ? '🟢' : '🔴';
          addLog(`${color} Port ${res.port}: ${res.status}`);
        });
        addLog('Port scan completed.');
      } else {
        addLog('Error: Failed to parse port scan results.');
      }
    } catch (e) {
      addLog(`Error: ${(e as Error).message}`);
    } finally {
      setLoading(false);
      setToolRunning(null);
    }
  };

  const runTraceroute = async () => {
    if (!host) return;
    setLoading(true);
    setToolRunning('TRACEROUTE');
    addLog(`$ traceroute -h 10 ${host}`);
    addLog('Resolving routing hops (max 10). This may take a few seconds...');
    
    try {
      const response = await fetch('/api/diagnostics/traceroute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host })
      });
      
      const data = await response.json();
      if (data.output) {
        addLog(data.output);
      } else {
        addLog('Error: Failed to parse traceroute output.');
      }
    } catch (e) {
      addLog(`Error: ${(e as Error).message}`);
    } finally {
      setLoading(false);
      setToolRunning(null);
    }
  };

  const runAIDiagnostic = async () => {
    if (!host || !username || !password || !command) {
      addLog('Error: Host, Username, Password, and Command are required for AI Diagnostics.');
      return;
    }
    setLoading(true);
    setToolRunning('AI_DIAG');
    addLog(`$ ssh ${username}@${host} "${command}" --ai-parse`);
    addLog('Connecting and analyzing output with network skills...');
    
    try {
      const response = await fetch('/api/diagnostics/ssh/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, username, password, command })
      });
      
      const data = await response.json();
      if (data.output) {
        data.output.split('\\n').forEach((line: string) => addLog(line));
      } else {
        addLog(`Error: ${data.error || 'Failed to parse output.'}`);
      }
    } catch (e) {
      addLog(`Error: ${(e as Error).message}`);
    } finally {
      setLoading(false);
      setToolRunning(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      {/* Target input and actions */}
      <div className="diag-controls">
        <div className="diag-input-group" style={{ flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
            <input type="text" value={host} onChange={(e) => setHost(e.target.value)} disabled={loading} placeholder="Host IP" style={{ flex: 1 }} />
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} disabled={loading} placeholder="Username" style={{ flex: 1 }} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} placeholder="Password" style={{ flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
            <input type="text" value={command} onChange={(e) => setCommand(e.target.value)} disabled={loading} placeholder="Command (e.g. show interfaces)" style={{ flex: 2 }} />
            <button className="diag-btn" onClick={runAIDiagnostic} disabled={loading || !host || !username || !password || !command} style={{ flex: 1, backgroundColor: 'var(--nms-accent)' }}>
              {toolRunning === 'AI_DIAG' ? 'Analyzing...' : 'AI Analyze'}
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', width: '100%' }}>
          <button className="diag-btn" onClick={runPing} disabled={loading || !host}>
          {toolRunning === 'PING' ? 'Ping...' : 'Ping'}
        </button>
        
        <button className="diag-btn" onClick={runPortScan} disabled={loading || !host}>
          {toolRunning === 'PORTSCAN' ? 'Scanning...' : 'Port Scan'}
        </button>
        
        <button className="diag-btn" onClick={runTraceroute} disabled={loading || !host}>
          {toolRunning === 'TRACEROUTE' ? 'Routing...' : 'Trace'}
        </button>
        
          <button className="diag-btn secondary-btn" onClick={handleClear} disabled={loading || consoleLogs.length === 0}>
            Clear
          </button>
        </div>
      </div>

      {/* Terminal Emulator Display */}
      <div className="terminal-emulator">
        <div className="terminal-header">
          <span className="terminal-dot" style={{ backgroundColor: '#ff5f56' }}></span>
          <span className="terminal-dot" style={{ backgroundColor: '#ffbd2e' }}></span>
          <span className="terminal-dot" style={{ backgroundColor: '#27c93f' }}></span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.5rem', fontFamily: 'Outfit' }}>
            diagnostic_console.sh
          </span>
        </div>
        
        {consoleLogs.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
            System ready. Enter a host IP and click a tool above to begin testing.
          </div>
        )}
        
        {consoleLogs.map((line, idx) => (
          <div className="terminal-line" key={idx}>
            {line}
          </div>
        ))}
        
        {loading && (
          <div className="terminal-line" style={{ color: '#f59e0b' }}>
            Executing {toolRunning} network query... <span className="terminal-cursor"></span>
          </div>
        )}
        
        {!loading && consoleLogs.length > 0 && (
          <div className="terminal-line">
            $ <span className="terminal-cursor"></span>
          </div>
        )}
        
        <div ref={consoleEndRef} />
      </div>
    </div>
  );
};
