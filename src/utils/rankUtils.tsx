import React from 'react';

// Import SVG files as React components
import SamalIcon from '@/assets/ranks/samal.svg';
import RavSamalIcon from '@/assets/ranks/rav-samal.svg';
import SamalRishonIcon from '@/assets/ranks/samal-rishon.svg';
import RasalIcon from '@/assets/ranks/rasal.svg';
import RasarIcon from '@/assets/ranks/rasar.svg';
import RasamIcon from '@/assets/ranks/rasam.svg';
import SagamIcon from '@/assets/ranks/sagam.svg';
import SegenIcon from '@/assets/ranks/segen.svg';
import SarenIcon from '@/assets/ranks/saren.svg';
import DefaultIcon from '@/assets/ranks/default.svg';

/**
 * Maps IDF ranks to their corresponding SVG components
 */
const getRankComponent = (rank: string) => {
  const rankMapping: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
    'סמל': SamalIcon,
    'רב סמל': RavSamalIcon,
    'סמל ראשון': SamalRishonIcon,
    'רס"ל': RasalIcon,
    'רס"ר': RasarIcon,
    'רס"מ': RasamIcon,
    'סג"מ': SagamIcon,
    'סגן': SegenIcon,
    'סרן': SarenIcon,
  };

  return rankMapping[rank] || DefaultIcon;
};

/**
 * Gets the English name for an IDF rank (for alt text)
 */
export const getRankEnglishName = (rank: string): string => {
  const rankNames: Record<string, string> = {
    'סמל': 'Samal (Sergeant)',
    'רב סמל': 'Rav Samal (Staff Sergeant)',
    'סמל ראשון': 'Samal Rishon (First Sergeant)', 
    'רס"ל': 'Rasal (Master Sergeant)',
    'רס"ר': 'Rasar (Sergeant First Class)',
    'רס"מ': 'Rasam (Sergeant Major)',
    'סג"מ': 'Sagam (Command Sergeant Major)',
    'סגן': 'Segen (Lieutenant)',
    'סרן': 'Saren (Captain)',
  };

  return rankNames[rank] || rank;
};

/**
 * Component for displaying rank icon
 */
interface RankIconProps {
  rank: string;
  className?: string;
  size?: number;
}

export const RankIcon: React.FC<RankIconProps> = ({ 
  rank, 
  className = '', 
  size = 24 
}) => {
  const IconComponent = getRankComponent(rank);
  const englishName = getRankEnglishName(rank);

  return (
    <span 
      className={`inline-flex items-center ${className}`}
      title={englishName}
      aria-label={englishName}
    >
      <IconComponent
        width={size}
        height={size}
        style={{ color: 'inherit' }}
      />
    </span>
  );
}; 