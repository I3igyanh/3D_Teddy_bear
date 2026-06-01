import { useState, useEffect } from 'react';

export function useScrollProgress(sectionRef) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handler = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const pct = Math.max(0, Math.min(1, -rect.top / total));
      setProgress(pct);
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [sectionRef]);

  return progress;
}