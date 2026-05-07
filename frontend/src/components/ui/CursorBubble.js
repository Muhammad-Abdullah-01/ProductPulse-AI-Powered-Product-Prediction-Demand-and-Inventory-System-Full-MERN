import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

/* Glowing green bubble that follows cursor in dark mode */
export function CursorBubble() {
  const { theme } = useTheme();
  const bubbleRef = useRef(null);
  const pos  = useRef({ x: 0, y: 0 });
  const curr = useRef({ x: 0, y: 0 });
  const raf  = useRef(null);

  useEffect(() => {
    if (theme !== 'dark') return;

    const onMove = (e) => { pos.current = { x: e.clientX, y: e.clientY }; };

    const animate = () => {
      curr.current.x += (pos.current.x - curr.current.x) * 0.08;
      curr.current.y += (pos.current.y - curr.current.y) * 0.08;
      if (bubbleRef.current) {
        bubbleRef.current.style.left = curr.current.x + 'px';
        bubbleRef.current.style.top  = curr.current.y + 'px';
      }
      raf.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMove);
    raf.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf.current);
    };
  }, [theme]);

  if (theme !== 'dark') return null;

  return (
    <div
      ref={bubbleRef}
      className="cursor-bubble"
      style={{ left: '-200px', top: '-200px' }}
    />
  );
}

/* Twinkling green star field for dark mode */
export function StarField() {
  const { theme } = useTheme();

  if (theme !== 'dark') return null;

  const stars = Array.from({ length: 80 }, (_, i) => ({
    id:    i,
    x:     Math.random() * 100,
    y:     Math.random() * 100,
    size:  Math.random() * 2 + 0.6,
    dur:   (Math.random() * 3 + 2).toFixed(1),
    delay: (Math.random() * 4).toFixed(1),
  }));

  return (
    <div className="star-field">
      {stars.map(s => (
        <div
          key={s.id}
          className="star"
          style={{
            left:              s.x + '%',
            top:               s.y + '%',
            width:             s.size + 'px',
            height:            s.size + 'px',
            '--dur':           s.dur + 's',
            animationDuration: s.dur + 's',
            animationDelay:    s.delay + 's',
          }}
        />
      ))}
    </div>
  );
}
