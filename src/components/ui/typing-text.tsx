import { useEffect, useState, ReactNode } from 'react';

interface TypingTextProps {
  text: string;
  speed?: number;
  className?: string;
  as?: 'span' | 'div';
  suffix?: ReactNode;
}

/**
 * One-shot typing text animation. Purely presentational —
 * does not change the underlying text value or any logic.
 */
export function TypingText({ text, speed = 38, className, as = 'span', suffix }: TypingTextProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
    if (!text) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setCount(text.length);
      return;
    }
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= text.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, [text, speed]);

  const done = count >= text.length;
  const Tag = as as any;
  return (
    <Tag className={className} aria-label={text}>
      <span aria-hidden="true">{text.slice(0, count)}</span>
      <span
        aria-hidden="true"
        className={`inline-block w-[2px] h-[0.9em] align-[-0.1em] ml-0.5 bg-primary ${done ? 'opacity-0' : 'animate-pulse'}`}
      />
      {suffix}
    </Tag>
  );
}
