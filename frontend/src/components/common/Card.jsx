export default function Card({ children, className = '' }) {
  return <div className={`glass-card ${className}`}>{children}</div>;
}
