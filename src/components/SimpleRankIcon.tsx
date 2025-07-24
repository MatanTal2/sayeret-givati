import React from 'react';

const RankSVGs = {
  'סמל': `<svg width="24" height="16" viewBox="0 0 32 20" fill="currentColor"><path d="M8 14 L16 6 L24 14 M8 10 L16 2 L24 10" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>`,
  'רב סמל': `<svg width="24" height="18" viewBox="0 0 32 24" fill="currentColor"><path d="M8 18 L16 10 L24 18 M8 14 L16 6 L24 14 M8 10 L16 2 L24 10" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>`,
  'רס"ל': `<svg width="24" height="16" viewBox="0 0 32 20" fill="currentColor"><rect x="6" y="9" width="20" height="2" fill="currentColor"/><path d="M16 2 L17.5 6 L22 6 L18.5 9 L20 13 L16 10 L12 13 L13.5 9 L10 6 L14.5 6 Z" fill="currentColor"/></svg>`,
  'סגן': `<svg width="24" height="16" viewBox="0 0 32 20" fill="currentColor"><rect x="8" y="9" width="16" height="3" fill="#d97706"/></svg>`,
};

interface SimpleRankIconProps {
  rank: string;
  className?: string;
}

export const SimpleRankIcon: React.FC<SimpleRankIconProps> = ({ rank, className = '' }) => {
  const svgString = RankSVGs[rank as keyof typeof RankSVGs] || '🎖️';
  
  if (typeof svgString === 'string' && svgString.startsWith('<svg')) {
    return (
      <span 
        className={className}
        dangerouslySetInnerHTML={{ __html: svgString }}
        title={rank}
      />
    );
  }
  
  return <span className={className}>{svgString}</span>;
}; 