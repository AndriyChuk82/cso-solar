import { useState, useEffect, useRef } from 'react';

/**
 * ResizableHeader — компонент для заголовка таблиці, який запам'ятовує ширину в localStorage.
 * Використовує ResizeObserver для відстеження змін ширини через CSS resize.
 */
export default function ResizableHeader({ children, columnId, pageId }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    
    // Початкове завантаження збереженої ширини
    const savedWidth = localStorage.getItem(`res-col-${pageId}-${columnId}`);
    if (savedWidth && savedWidth !== 'null') {
      ref.current.style.width = `${savedWidth}px`;
    } else {
      ref.current.style.width = 'auto'; // Скидаємо до авто, якщо немає збереженого значення
    }

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        // Ми відстежуємо зміну ширини самого елемента
        // Браузер при resize: horizontal сам змінює style.width
        const element = entry.target;
        const currentWidth = Math.round(element.getBoundingClientRect().width);
        
        // Перевіряємо, чи ширина була встановлена вручну (через інлайн-стиль)
        // CSS resize змінює інлайн-стиль style.width
        if (element.style.width && element.style.width !== 'auto') {
           localStorage.setItem(`res-col-${pageId}-${columnId}`, currentWidth);
        }
      }
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [columnId, pageId]);

  return (
    <div ref={ref} className="resizable-header">
      {children}
    </div>
  );
}

