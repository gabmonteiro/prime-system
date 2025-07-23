// components/ui/Button.jsx
import { BiLoaderAlt } from "react-icons/bi";

export function Button({ 
  children, 
  type = "button", 
  loading = false, 
  disabled = false,
  variant = "primary",
  className = "",
  onClick,
  icon: Icon
}) {
  const variants = {
    primary: "btn-primary bg-gradient-to-r from-blue-600 to-blue-700 text-white",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200",
    outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
  };

  return (
    <button
      type={type}
      disabled={loading || disabled}
      onClick={onClick}
      className={`w-full py-3.5 px-4 rounded-xl font-semibold shadow-medium focus-ring transition-all duration-200 ${variants[variant]} ${
        (loading || disabled) ? 'opacity-60 cursor-not-allowed' : ''
      } ${className}`}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <BiLoaderAlt className="animate-spin mr-3 h-5 w-5" />
          Carregando...
        </div>
      ) : (
        <div className="flex items-center justify-center">
          {Icon && <Icon className="w-5 h-5 mr-2" />}
          {children}
        </div>
      )}
    </button>
  );
}