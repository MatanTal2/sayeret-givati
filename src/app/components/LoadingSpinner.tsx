interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'white' | 'purple' | 'gray';
}

export default function LoadingSpinner({ size = 'md', color = 'white' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-12 w-12'
  };

  const colorClasses = {
    white: 'border-white',
    purple: 'border-primary-600',
    gray: 'border-neutral-600'
  };

  return (
    <div className={`animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[color]}`}></div>
  );
} 