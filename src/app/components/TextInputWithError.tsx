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
      <label className="block text-sm font-medium text-gray-700 mb-1 pr-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full h-10 border-2 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 placeholder-gray-600 ${
          error 
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-400 focus:ring-purple-500 focus:border-purple-500'
        } ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
        }`}
        placeholder={placeholder}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
} 