'use client';

import * as React from 'react';

export function ScrollGrowObserver() {
  React.useEffect(() => {
    const update = () => {
      const els = document.querySelectorAll<HTMLElement>('.scroll-grow');
      const vh = window.innerHeight || 700;
      const triggerStart = vh * 0.98;
      const triggerEnd = vh * 0.48;

      els.forEach((el) => {
        const rect = el.getBoundingClientRect();
        let t = (triggerStart - rect.top) / Math.max(1, triggerStart - triggerEnd);
        t = Math.max(0, Math.min(1, t));
        const scale = (0.93 + 0.07 * t).toFixed(3);
        const opacity = (0.62 + 0.38 * t).toFixed(2);
        el.style.transform = `scale(${scale})`;
        el.style.opacity = opacity;
      });
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return null;
}
