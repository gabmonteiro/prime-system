export const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent";

export default function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className = "",
}) {
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs mt-1 text-red-600">{error}</p>
      ) : (
        hint && <p className="text-xs mt-1 text-gray-500">{hint}</p>
      )}
    </div>
  );
}

export function Toggle({ checked, onChange, labelOn, labelOff, disabled }) {
  return (
    <div className="flex items-center">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-12 border-2 border-transparent rounded-full cursor-pointer transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
          checked ? "bg-green-500" : "bg-gray-300"
        }`}
        aria-pressed={checked}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
            checked ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </button>
      {(labelOn || labelOff) && (
        <span
          className={`ml-3 text-sm font-medium ${checked ? "text-green-600" : "text-gray-600"}`}
        >
          {checked ? labelOn : labelOff}
        </span>
      )}
    </div>
  );
}
