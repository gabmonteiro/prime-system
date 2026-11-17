const COLORS = {
  blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600",
  red: "bg-red-100 text-red-600",
  purple: "bg-purple-100 text-purple-600",
  orange: "bg-orange-100 text-orange-600",
  indigo: "bg-indigo-100 text-indigo-600",
  yellow: "bg-yellow-100 text-yellow-600",
  gray: "bg-gray-100 text-gray-600",
};

/**
 * Card de estatística. `delta` (opcional) = variação vs período anterior (ex: 0.12 = +12%).
 * `invertDelta` deixa a variação positiva vermelha (ex: despesas).
 */
export default function StatCard({
  icon: Icon,
  color = "blue",
  label,
  value,
  hint,
  delta,
  invertDelta = false,
  valueClassName = "text-gray-900",
  loading = false,
}) {
  const hasDelta = typeof delta === "number" && isFinite(delta);
  const good = hasDelta && (invertDelta ? delta <= 0 : delta >= 0);
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6 min-w-0">
      <div className="flex items-center">
        {Icon && (
          <div
            className={`hidden sm:block p-2 rounded-lg shrink-0 ${COLORS[color]}`}
          >
            <Icon className="h-6 w-6" />
          </div>
        )}
        <div className={`${Icon ? "sm:ml-4" : ""} min-w-0 flex-1`}>
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
            {label}
          </p>
          {loading ? (
            <div className="h-7 w-24 mt-1 bg-gray-100 rounded animate-pulse" />
          ) : (
            <p
              className={`text-lg sm:text-2xl font-bold truncate ${valueClassName}`}
            >
              {value}
            </p>
          )}
          {(hint || hasDelta) && (
            <p className="text-xs text-gray-500 truncate">
              {hasDelta && (
                <span
                  className={`font-semibold mr-1 ${good ? "text-green-600" : "text-red-600"}`}
                >
                  {delta >= 0 ? "▲" : "▼"} {Math.abs(delta * 100).toFixed(0)}%
                </span>
              )}
              {hint}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
