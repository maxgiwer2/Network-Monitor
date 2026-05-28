import React from 'react';

interface PingPoint {
  timestamp: number;
  google: number;
  cloudflare: number;
}

interface LatencyChartProps {
  history: PingPoint[];
}

export const LatencyChart: React.FC<LatencyChartProps> = ({ history }) => {
  const width = 600;
  const height = 180;
  const padding = 25;

  if (history.length === 0) {
    return (
      <div style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        No latency data available
      </div>
    );
  }

  // Find max ping to scale Y axis appropriately (with a minimum of 40ms to avoid flatlines)
  const maxPing = Math.max(
    40,
    ...history.map(d => Math.max(d.google, d.cloudflare))
  ) * 1.1; // Add 10% padding on top

  // Helper to get coordinates
  const getCoords = (index: number, val: number, total: number) => {
    const divisor = total > 1 ? total - 1 : 1;
    const x = padding + (index / divisor) * (width - padding * 2);
    // Y is inverted (0 is top)
    const y = height - padding - (val / maxPing) * (height - padding * 2);
    return { x, y };
  };

  // Generate SVG path for a line
  const generatePath = (data: number[]) => {
    if (data.length === 0) return '';
    return data.map((val, idx) => {
      const { x, y } = getCoords(idx, val, data.length);
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  };

  // Generate SVG path for a filled area below the line
  const generateAreaPath = (data: number[]) => {
    if (data.length === 0) return '';
    const linePath = generatePath(data);
    const lastCoords = getCoords(data.length - 1, 0, data.length);
    const firstCoords = getCoords(0, 0, data.length);
    // Draw line, drop to bottom right, go to bottom left, close
    return `${linePath} L ${lastCoords.x.toFixed(1)} ${(height - padding).toFixed(1)} L ${firstCoords.x.toFixed(1)} ${(height - padding).toFixed(1)} Z`;
  };

  const googleData = history.map(h => h.google);
  const cloudflareData = history.map(h => h.cloudflare);

  const googleLine = generatePath(googleData);
  const googleArea = generateAreaPath(googleData);

  const cloudflareLine = generatePath(cloudflareData);
  const cloudflareArea = generateAreaPath(cloudflareData);

  // Generate grid lines
  const gridLines = [];
  const gridCount = 4;
  for (let i = 0; i <= gridCount; i++) {
    const yVal = (maxPing / gridCount) * i;
    const y = height - padding - (yVal / maxPing) * (height - padding * 2);
    gridLines.push({ y, value: Math.round(yVal) });
  }

  // Get the latest values to render in the legend
  const latestGoogle = googleData[googleData.length - 1] ?? 0;
  const latestCloudflare = cloudflareData[cloudflareData.length - 1] ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
      {/* Legend & Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)' }}></span>
            <span style={{ color: 'var(--text-secondary)' }}>Google (8.8.8.8):</span>
            <strong style={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{latestGoogle} ms</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent)' }}></span>
            <span style={{ color: 'var(--text-secondary)' }}>Cloudflare (1.1.1.1):</span>
            <strong style={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{latestCloudflare} ms</strong>
          </div>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
          Max Scale: {Math.round(maxPing)}ms
        </span>
      </div>

      {/* SVG Canvas */}
      <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="googleAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="cloudflareAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridLines.map((line, idx) => (
            <g key={idx}>
              <line
                x1={padding}
                y1={line.y}
                x2={width - padding}
                y2={line.y}
                stroke="rgba(255, 255, 255, 0.03)"
                strokeWidth="1"
              />
              <text
                x={padding - 5}
                y={line.y + 3}
                fill="var(--text-muted)"
                fontSize="8px"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="end"
              >
                {line.value}ms
              </text>
            </g>
          ))}

          {/* X Axis boundary */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1"
          />

          {/* Cloudflare Area & Line */}
          {cloudflareArea && (
            <path
              d={cloudflareArea}
              fill="url(#cloudflareAreaGrad)"
            />
          )}
          {cloudflareLine && (
            <path
              d={cloudflareLine}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 0 3px rgba(6, 182, 212, 0.3))' }}
            />
          )}

          {/* Google Area & Line */}
          {googleArea && (
            <path
              d={googleArea}
              fill="url(#googleAreaGrad)"
            />
          )}
          {googleLine && (
            <path
              d={googleLine}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 0 3px rgba(139, 92, 246, 0.3))' }}
            />
          )}

          {/* Data Points (last point highlight) */}
          {history.length > 0 && (() => {
            const lastIdx = history.length - 1;
            const ptG = getCoords(lastIdx, latestGoogle, history.length);
            const ptC = getCoords(lastIdx, latestCloudflare, history.length);
            return (
              <g>
                {/* Cloudflare Dot */}
                <circle cx={ptC.x} cy={ptC.y} r="5" fill="var(--accent)" stroke="var(--bg-main)" strokeWidth="1.5" />
                <circle cx={ptC.x} cy={ptC.y} r="9" fill="var(--accent)" fillOpacity="0.15" />

                {/* Google Dot */}
                <circle cx={ptG.x} cy={ptG.y} r="5" fill="var(--primary)" stroke="var(--bg-main)" strokeWidth="1.5" />
                <circle cx={ptG.x} cy={ptG.y} r="9" fill="var(--primary)" fillOpacity="0.15" />
              </g>
            );
          })()}
        </svg>
      </div>
    </div>
  );
};
