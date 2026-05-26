import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  theme?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  icon,
  theme = 'primary'
}) => {
  const getThemeColors = () => {
    switch (theme) {
      case 'secondary':
        return {
          bg: 'rgba(59, 130, 246, 0.1)',
          color: 'var(--secondary)',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        };
      case 'success':
        return {
          bg: 'rgba(16, 185, 129, 0.1)',
          color: 'var(--success)',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        };
      case 'warning':
        return {
          bg: 'rgba(245, 158, 11, 0.1)',
          color: 'var(--warning)',
          border: '1px solid rgba(245, 158, 11, 0.2)'
        };
      case 'danger':
        return {
          bg: 'rgba(239, 68, 68, 0.1)',
          color: 'var(--danger)',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        };
      case 'primary':
      default:
        return {
          bg: 'rgba(139, 92, 246, 0.1)',
          color: 'var(--primary)',
          border: '1px solid rgba(139, 92, 246, 0.2)'
        };
    }
  };

  const themeStyle = getThemeColors();

  return (
    <div className="metric-card-inner">
      <div 
        className="metric-icon-box"
        style={{
          backgroundColor: themeStyle.bg,
          color: themeStyle.color,
          border: themeStyle.border
        }}
      >
        {icon}
      </div>
      <div className="metric-info">
        <span className="metric-label">{label}</span>
        <span className="metric-value">{value}</span>
        {subtext && <span className="metric-subtext">{subtext}</span>}
      </div>
    </div>
  );
};
