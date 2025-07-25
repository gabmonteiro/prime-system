// components/ui/InputField.jsx
import {
  EnvelopeIcon,
  KeyIcon,
  UserIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";

const iconMap = {
  email: EnvelopeIcon,
  password: KeyIcon,
  text: UserIcon,
  tel: PhoneIcon,
};

export function InputField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  rightElement,
  className = "",
  icon,
  multiline = false,
  rows = 3,
  step,
  min,
  max,
}) {
  const IconComponent = icon || iconMap[type] || UserIcon;

  if (multiline) {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="block text-sm font-semibold text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          <textarea
            name={name}
            className="input-field w-full px-4 py-3.5 pl-12 bg-slate-50 border border-slate-200 rounded-xl focus-ring text-slate-900 placeholder-slate-400 font-medium resize-vertical"
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            placeholder={placeholder}
            rows={rows}
          />
          <div className="absolute top-3.5 left-0 flex items-center pl-4">
            <IconComponent className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          name={name}
          type={type}
          className="input-field w-full px-4 py-3.5 pl-12 bg-slate-50 border border-slate-200 rounded-xl focus-ring text-slate-900 placeholder-slate-400 font-medium"
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          step={step}
          min={min}
          max={max}
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-4">
          <IconComponent className="w-5 h-5 text-slate-400" />
        </div>
        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-4">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
}

export default InputField;
