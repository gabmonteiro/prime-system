// Componente wrapper para forçar tamanhos de ícones
export function Icon({ Component, size = 20, className = "", ...props }) {
  const style = {
    width: `${size}px`,
    height: `${size}px`,
    flexShrink: 0,
  };

  return <Component {...props} className={className} style={style} />;
}

// Tamanhos pré-definidos
export const IconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};
