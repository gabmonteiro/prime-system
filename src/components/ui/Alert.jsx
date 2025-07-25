// components/ui/Alert.jsx
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

const alertConfig = {
  error: {
    icon: XCircleIcon,
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    iconColor: "text-red-500",
    titleColor: "text-red-800",
    textColor: "text-red-700",
  },
  warning: {
    icon: ExclamationTriangleIcon,
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    iconColor: "text-yellow-500",
    titleColor: "text-yellow-800",
    textColor: "text-yellow-700",
  },
  success: {
    icon: CheckCircleIcon,
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    iconColor: "text-green-500",
    titleColor: "text-green-800",
    textColor: "text-green-700",
  },
  info: {
    icon: InformationCircleIcon,
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    iconColor: "text-blue-500",
    titleColor: "text-blue-800",
    textColor: "text-blue-700",
  },
};

export function Alert({ type = "info", title, message, className = "" }) {
  const config = alertConfig[type];
  const IconComponent = config.icon;

  return (
    <div
      className={`p-4 ${config.bgColor} border ${config.borderColor} rounded-xl animate-shake ${className}`}
    >
      <div className="flex items-start">
        <IconComponent
          className={`w-5 h-5 ${config.iconColor} mt-0.5 mr-3 flex-shrink-0`}
        />
        <div>
          {title && (
            <p className={`${config.titleColor} text-sm font-medium`}>
              {title}
            </p>
          )}
          <p className={`${config.textColor} text-sm ${title ? "mt-1" : ""}`}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Alert;
