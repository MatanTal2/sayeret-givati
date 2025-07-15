import { BsFillHouseFill } from "react-icons/bs";
import { GiTank } from "react-icons/gi";
import { MdNotListedLocation } from "react-icons/md";

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
    <div className="flex bg-gray-100 rounded-lg p-1">
      <button 
        onClick={() => !disabled && onStatusChange('בית')}
        disabled={disabled}
        className={`${buttonClass} ${
          currentStatus === 'בית' 
            ? 'bg-purple-600 text-white shadow-sm' 
            : 'text-gray-600 hover:bg-gray-200'
        }`}
        title="בית"
      >
        <BsFillHouseFill />
      </button>
      <button 
        onClick={() => !disabled && onStatusChange('משמר')}
        disabled={disabled}
        className={`${buttonClass} ${
          currentStatus === 'משמר' 
            ? 'bg-purple-600 text-white shadow-sm' 
            : 'text-gray-600 hover:bg-gray-200'
        }`}
        title="משמר"
      >
        <GiTank />
      </button>
      <button 
        onClick={() => !disabled && onStatusChange('אחר')}
        disabled={disabled}
        className={`${buttonClass} ${
          currentStatus === 'אחר' 
            ? 'bg-purple-600 text-white shadow-sm' 
            : 'text-gray-600 hover:bg-gray-200'
        }`}
        title="אחר"
      >
        <MdNotListedLocation />
      </button>
    </div>
  );
} 