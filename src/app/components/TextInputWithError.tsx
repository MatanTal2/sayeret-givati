interface TextInputWithErrorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  type?: 'text' | 'password' | 'email' | 'tel';
  disabled?: boolean;
}

export default function TextInputWithError({
  label,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  type = 'text',
  disabled = false
}: TextInputWithErrorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1 pr-1.5">
        {label} {required && <span className="text-danger-500">*</span>}
      </label>
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full h-10 border-2 rounded-md px-3 py-2 text-neutral-800 focus:outline-none focus:ring-2 placeholder-neutral-600 ${
          error 
            ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500' 
            : 'border-neutral-400 focus:ring-primary-500 focus:border-primary-500'
        } ${
          disabled ? 'bg-neutral-100 cursor-not-allowed' : 'bg-white'
        }`}
        placeholder={placeholder}
      />
      {error && (
        <p className="mt-1 text-sm text-danger-600">{error}</p>
      )}
    </div>
  );
} 