export function LoadingState({ text = "Carregando..." }) {
  return (
    <div className="flex items-center justify-center h-48">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-600">{text}</span>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, children }) {
  return (
    <div className="text-center py-12 px-4">
      {Icon && <Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {text && <p className="text-gray-600">{text}</p>}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
