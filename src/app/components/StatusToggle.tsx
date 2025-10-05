import { BsFillHouseFill } from "react-icons/bs";
import { GiTank } from "react-icons/gi";
import { MdNotListedLocation } from "react-icons/md";
import { TEXT_CONSTANTS } from '@/constants/text';

interface StatusToggleProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export default function StatusToggle({ 
  currentStatus, 
  onStatusChange, 
  size = 'md',
  disabled = false 
}: StatusToggleProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-base',
    md: 'px-3 py-2 text-lg',
    lg: 'px-4 py-3 text-xl'
  };

  const buttonClass = `${sizeClasses[size]} rounded-md transition-colors ${
    disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
  }`;

  return (
    <div className="flex bg-neutral-100 rounded-lg p-1">
      <button 
        onClick={() => !disabled && onStatusChange(TEXT_CONSTANTS.STATUS_PAGE.STATUS_HOME)}
        disabled={disabled}
        className={`${buttonClass} ${
          currentStatus === TEXT_CONSTANTS.STATUS_PAGE.STATUS_HOME 
            ? 'bg-primary-600 text-white shadow-sm' 
            : 'text-neutral-600 hover:bg-neutral-200'
        }`}
        title={TEXT_CONSTANTS.STATUS_PAGE.STATUS_HOME}
      >
        <BsFillHouseFill />
      </button>
      <button 
        onClick={() => !disabled && onStatusChange(TEXT_CONSTANTS.STATUS_PAGE.STATUS_GUARD)}
        disabled={disabled}
        className={`${buttonClass} ${
          currentStatus === TEXT_CONSTANTS.STATUS_PAGE.STATUS_GUARD 
            ? 'bg-primary-600 text-white shadow-sm' 
            : 'text-neutral-600 hover:bg-neutral-200'
        }`}
        title={TEXT_CONSTANTS.STATUS_PAGE.STATUS_GUARD}
      >
        <GiTank />
      </button>
      <button 
        onClick={() => !disabled && onStatusChange(TEXT_CONSTANTS.STATUS_PAGE.STATUS_OTHER)}
        disabled={disabled}
        className={`${buttonClass} ${
          currentStatus === TEXT_CONSTANTS.STATUS_PAGE.STATUS_OTHER 
            ? 'bg-primary-600 text-white shadow-sm' 
            : 'text-neutral-600 hover:bg-neutral-200'
        }`}
        title={TEXT_CONSTANTS.STATUS_PAGE.STATUS_OTHER}
      >
        <MdNotListedLocation />
      </button>
    </div>
  );
} 