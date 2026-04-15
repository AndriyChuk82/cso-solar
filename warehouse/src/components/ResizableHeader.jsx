import { useState, useEffect, useRef, memo } from 'react';

/**
 * ResizableHeader — компонент для заголовка таблиці, який запам'ятовує ширину в localStorage.
 * Використовує ResizeObserver для відстеження змін ширини через CSS resize.
 */
function ResizableHeader({ children, columnId, pageId }) {
  const ref = useRef(null);
  const startX = useRef(0);
  const startWidth = useRef(0);

  useEffect(() => {
    if (!ref.current) return;
    
    // Завантажуємо збережену ширину
    const savedWidth = localStorage.getItem(`res-col-${pageId}-${columnId}`);
    if (savedWidth && savedWidth !== 'null') {
      ref.current.style.width = `${savedWidth}px`;
    } else {
      ref.current.style.width = 'auto';
    }
  }, [columnId, pageId]);

  const handleStart = (e) => {
    // Не даємо браузеру скролити при розтягуванні на мобільному
    if (e.cancelable) e.preventDefault();
    
    startX.current = e.touches ? e.touches[0].clientX : e.clientX;
    startWidth.current = ref.current.getBoundingClientRect().width;

    const handleMove = (moveEvent) => {
      const clientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const diff = clientX - startX.current;
      const newWidth = Math.max(50, startWidth.current + diff);
      
      if (ref.current) {
        ref.current.style.width = `${newWidth}px`;
      }
    };

    const handleEnd = () => {
      if (ref.current) {
        const finalWidth = Math.round(ref.current.getBoundingClientRect().width);
        localStorage.setItem(`res-col-${pageId}-${columnId}`, finalWidth);
      }
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
  };

  const handleRef = useRef(null);

  useEffect(() => {
    const el = handleRef.current;
    if (!el) return;

    // Використовуємо нативний слухач, щоб мати можливість передати { passive: false }
    const onTouchStart = (e) => handleStart(e);
    
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    return () => el.removeEventListener('touchstart', onTouchStart);
  }, []);

  return (
    <div ref={ref} className="resizable-header">
      <span className="resizer-label">{children}</span>
      <div
        ref={handleRef}
        className="resizer-handle"
        onMouseDown={handleStart}
      />
    </div>
  );
}

export default memo(ResizableHeader);

