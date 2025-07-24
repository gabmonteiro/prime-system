// components/ui/Card.jsx
export function Card({ children, className = "", hover = true, glass = true }) {
  return (
    <div
      className={`
      relative w-full max-w-md rounded-2xl shadow-strong p-8
      ${glass ? "glass" : "bg-white"}
      ${hover ? "card-hover" : ""}
      ${className}
    `}
    >
      {children}
    </div>
  );
}
