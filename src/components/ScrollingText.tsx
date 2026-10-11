'use client';

import { useEffect, useRef } from 'react';
import styles from './ScrollingText.module.css';

interface ScrollingTextProps {
  text: string;
  className?: string;
  innerClassName?: string;
}

export function ScrollingText({ text, className = '', innerClassName = '' }: ScrollingTextProps) {
  const outerRef = useRef<HTMLSpanElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const measure = () => {
      const overflow = inner.scrollWidth - outer.clientWidth;
      if (overflow > 1) {
        inner.style.setProperty('--scroll-x', `-${overflow}px`);
        inner.classList.add(styles.scrolling);
      } else {
        inner.classList.remove(styles.scrolling);
        inner.style.removeProperty('--scroll-x');
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    return () => ro.disconnect();
  }, [text]);

  return (
    <span ref={outerRef} className={className}>
      <span ref={innerRef} className={innerClassName}>
        {text}
      </span>
    </span>
  );
}
