import React from 'react';

interface SpeedometerProps {
  downloadSpeed: number; // bytes/sec
  uploadSpeed: number; // bytes/sec
}

export const Speedometer: React.FC<SpeedometerProps> = ({
  downloadSpeed,
  uploadSpeed
}) => {
  // Convert bytes/sec to Megabits per second (Mbps)
  const toMbps = (bytesSec: number) => {
    return (bytesSec * 8) / 1000000;
  };

  const dlMbps = toMbps(downloadSpeed);
  const ulMbps = toMbps(uploadSpeed);

  // Gauge configurations
  const radius = 60;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  // We map speed to a max of 1000 Mbps (Gigabit connection)
  const getStrokeDashoffset = (mbps: number) => {
    const maxMbps = 1000;
    const percentage = Math.min(mbps / maxMbps, 1);
    // Draw only 3/4 circle (270 degrees) or full circle?
    // Let's do 270 degrees sweep.
    const sweepPercent = percentage * 0.75;
    return circumference - sweepPercent * circumference;
  };

  // We rotate -225deg for a classic dial starting bottom-left, sweeping to bottom-right
  const getDisplayValue = (mbps: number) => {
    if (mbps >= 100) return mbps.toFixed(0);
    if (mbps >= 1) return mbps.toFixed(1);
    return mbps.toFixed(2);
  };

  return (
    <div className="speedometer-container">
      {/* Download Gauge */}
      <div className="gauge-wrapper">
        <svg className="gauge-svg" style={{ transform: 'rotate(-225deg)', width: '160px', height: '160px' }}>
          {/* Track circle (270 deg sweep) */}
          <circle
            className="gauge-bg"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            r={normalizedRadius}
            cx={80}
            cy={80}
            style={{ stroke: 'rgba(255, 255, 255, 0.05)', strokeWidth: '10px' }}
          />
          {/* Fill circle with gradient */}
          <circle
            className="gauge-fill"
            stroke="url(#downloadGradient)"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={getStrokeDashoffset(dlMbps)}
            r={normalizedRadius}
            cx={80}
            cy={80}
            style={{ 
              strokeWidth: '10px',
              filter: 'drop-shadow(0px 0px 6px rgba(139, 92, 246, 0.4))'
            }}
          />
          <defs>
            <linearGradient id="downloadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="gauge-value-overlay">
          <span className="gauge-num" style={{ color: 'var(--primary)', textShadow: '0 0 10px rgba(139, 92, 246, 0.3)' }}>
            {getDisplayValue(dlMbps)}
          </span>
          <span className="gauge-unit">Mbps</span>
        </div>
        <div className="gauge-label">
          <svg style={{ width: '14px', height: '14px', fill: 'currentColor' }} viewBox="0 0 24 24">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/>
          </svg>
          Download
        </div>
      </div>

      {/* Upload Gauge */}
      <div className="gauge-wrapper">
        <svg className="gauge-svg" style={{ transform: 'rotate(-225deg)', width: '160px', height: '160px' }}>
          {/* Track circle */}
          <circle
            className="gauge-bg"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            r={normalizedRadius}
            cx={80}
            cy={80}
            style={{ stroke: 'rgba(255, 255, 255, 0.05)', strokeWidth: '10px' }}
          />
          {/* Fill circle with gradient */}
          <circle
            className="gauge-fill"
            stroke="url(#uploadGradient)"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={getStrokeDashoffset(ulMbps)}
            r={normalizedRadius}
            cx={80}
            cy={80}
            style={{ 
              strokeWidth: '10px',
              filter: 'drop-shadow(0px 0px 6px rgba(6, 182, 212, 0.4))'
            }}
          />
          <defs>
            <linearGradient id="uploadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="gauge-value-overlay">
          <span className="gauge-num" style={{ color: 'var(--accent)', textShadow: '0 0 10px rgba(6, 182, 212, 0.3)' }}>
            {getDisplayValue(ulMbps)}
          </span>
          <span className="gauge-unit">Mbps</span>
        </div>
        <div className="gauge-label">
          <svg style={{ width: '14px', height: '14px', fill: 'currentColor' }} viewBox="0 0 24 24">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM12 9l5 5h-3v4h-4v-4H7l5-5z"/>
          </svg>
          Upload
        </div>
      </div>
    </div>
  );
};
