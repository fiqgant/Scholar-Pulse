export default function ShinyText({ text, className = '', speed = 3 }) {
  return (
    <span
      className={`shiny-text ${className}`}
      style={{ '--shiny-speed': `${speed}s` }}
    >
      {text}
    </span>
  );
}
