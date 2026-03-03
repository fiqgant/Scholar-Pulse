import { useRef } from 'react';

export default function SpotlightCard({ children, className = '', spotlightColor = 'rgba(99, 102, 241, 0.18)', style }) {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--spotlight-x', `${x}px`);
    card.style.setProperty('--spotlight-y', `${y}px`);
    card.style.setProperty('--spotlight-color', spotlightColor);
  };

  return (
    <div
      ref={cardRef}
      className={`spotlight-card ${className}`}
      onMouseMove={handleMouseMove}
      style={style}
    >
      <div className="spotlight-card-bg" />
      <div className="spotlight-card-content">{children}</div>
    </div>
  );
}
