interface SelectAllCheckboxProps {
  allSelected: boolean;
  someSelected: boolean;
  onToggle: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function SelectAllCheckbox({ 
  allSelected, 
  someSelected, 
  onToggle, 
  className = "",
  size = 'md'
}: SelectAllCheckboxProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <input 
      type="checkbox"
      checked={allSelected}
      ref={(input) => {
        if (input) {
          input.indeterminate = someSelected && !allSelected;
        }
      }}
      onChange={onToggle}
      className={`${sizeClasses[size]} text-primary-600 border-neutral-300 rounded focus:ring-primary-500 ${className}`}
    />
  );
} 