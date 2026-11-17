// Cabeçalho padrão das páginas do dashboard (mesmo visual da v1).
export default function PageHeader({
  icon: Icon,
  color = "blue",
  title,
  subtitle,
  children,
}) {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    purple: "bg-purple-100 text-purple-600",
    indigo: "bg-indigo-100 text-indigo-600",
    orange: "bg-orange-100 text-orange-600",
    gray: "bg-gray-100 text-gray-600",
  };
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className={`p-2 rounded-lg shrink-0 ${colors[color]}`}>
              <Icon className="h-6 w-6" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm sm:text-base text-gray-600">{subtitle}</p>
            )}
          </div>
        </div>
        {children && (
          <div className="flex flex-wrap items-center gap-2">{children}</div>
        )}
      </div>
    </div>
  );
}
