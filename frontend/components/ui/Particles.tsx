import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const PARTICLES = [
  // Top area
  { top: '5%',  left: '10%',  size: 6,  from: '#60a5fa', to: '#0ea5e9' },
  { top: '9%',  left: '28%',  size: 4,  from: '#a78bfa', to: '#ec4899' },
  { top: '7%',  right: '15%', size: 7,  from: '#22d3ee', to: '#3b82f6' },
  { top: '13%', right: '5%',  size: 6,  from: '#fb7185', to: '#ec4899' },
  { top: '16%', left: '52%',  size: 4,  from: '#818cf8', to: '#3b82f6' },
  // Left area
  { top: '25%', left: '5%',   size: 6,  from: '#86efac', to: '#10b981' },
  { top: '45%', left: '3%',   size: 8,  from: '#f87171', to: '#e11d48' },
  { bottom: '40%', left: '7%', size: 6, from: '#fde047', to: '#f59e0b' },
  { bottom: '15%', left: '9%', size: 8, from: '#a3e635', to: '#22c55e' },
  // Right area
  { top: '20%', right: '5%',  size: 5,  from: '#c4b5fd', to: '#8b5cf6' },
  { top: '40%', right: '3%',  size: 7,  from: '#67e8f9', to: '#06b6d4' },
  { bottom: '35%', right: '6%', size: 5, from: '#fca5a5', to: '#f43f5e' },
  { bottom: '8%', right: '5%', size: 8,  from: '#e879f9', to: '#7c3aed' },
  { bottom: '22%', right: '10%', size: 6, from: '#60a5fa', to: '#4f46e5' },
  // Center spread
  { top: '22%', left: '70%',  size: 6,  from: '#fde047', to: '#f97316' },
  { top: '50%', left: '60%',  size: 8,  from: '#7dd3fc', to: '#3b82f6' },
  { top: '65%', left: '20%',  size: 5,  from: '#86efac', to: '#059669' },
  { top: '33%', right: '35%', size: 4,  from: '#6ee7b7', to: '#16a34a' },
  { bottom: '45%', left: '35%', size: 10, from: '#c084fc', to: '#ec4899' },
  { top: '60%', right: '30%', size: 6,  from: '#bef264', to: '#22c55e' },
  { bottom: '20%', right: '40%', size: 8, from: '#fca5a5', to: '#f43f5e' },
  { top: '38%', left: '18%',  size: 8,  from: '#93c5fd', to: '#2563eb' },
  { bottom: '28%', right: '50%', size: 4, from: '#a5b4fc', to: '#7c3aed' },
];

const Particles: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const dots = ref.current.querySelectorAll('.particle-dot');
    dots.forEach((dot, i) => {
      gsap.to(dot, {
        y: `random(-18, 18)`,
        x: `random(-12, 12)`,
        rotation: `random(-180, 180)`,
        scale: `random(0.6, 1.4)`,
        duration: `random(3, 7)`,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: i * 0.3,
      });
    });
    return () => { gsap.killTweensOf(dots); };
  }, []);

  return (
    <div ref={ref} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {PARTICLES.map((p, i) => {
        const style: React.CSSProperties = {
          position: 'absolute',
          width: p.size,
          height: p.size,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${p.from}, ${p.to})`,
          opacity: 0.7,
          top: (p as any).top,
          left: (p as any).left,
          right: (p as any).right,
          bottom: (p as any).bottom,
        };
        return <div key={i} className="particle-dot" style={style} />;
      })}
    </div>
  );
};

export default Particles;
