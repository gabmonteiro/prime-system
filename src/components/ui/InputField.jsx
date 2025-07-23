// components/ui/InputField.jsx
import { HiOutlineMail, HiOutlineKey, HiOutlineUser, HiOutlinePhone } from "react-icons/hi2";

const iconMap = {
  email: HiOutlineMail,
  password: HiOutlineKey,
  text: HiOutlineUser,
  tel: HiOutlinePhone,
};

export function InputField({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  required = false,
  rightElement,
  className = ""
}) {
  const IconComponent = iconMap[type] || HiOutlineUser;

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          className="input-field w-full px-4 py-3.5 pl-12 bg-slate-50 border border-slate-200 rounded-xl focus-ring text-slate-900 placeholder-slate-400 font-medium"
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
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