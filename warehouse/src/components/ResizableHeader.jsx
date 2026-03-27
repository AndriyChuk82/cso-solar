import { useState, useEffect, useRef } from 'react';

/**
 * ResizableHeader — компонент для заголовка таблиці, який запам'ятовує ширину в localStorage.
 * Використовує ResizeObserver для відстеження змін ширини через CSS resize.
 */
export default function ResizableHeader({ children, columnId, pageId }) {
  const [initialWidth] = useState(() => {
    return localStorage.getItem(`res-col-${pageId}-${columnId}`) || 'auto';
  });
  
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    
    // Встановлюємо початкову ширину, якщо вона збережена
    if (initialWidth !== 'auto') {
      ref.current.style.width = `${initialWidth}px`;
    }

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        // Отримуємо ширину в пікселях
        const currentWidth = entry.contentRect.width;
        // Зберігаємо, якщо вона значущо змінилася (щоб уникнути спаму при ініціалізації)
        if (currentWidth > 10) {
           localStorage.setItem(`res-col-${pageId}-${columnId}`, Math.round(currentWidth));
        }
      }
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [columnId, pageId, initialWidth]);

  return (
    <div ref={ref} className="resizable-header">
      {children}
    </div>
  );
}
