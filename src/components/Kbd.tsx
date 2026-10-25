import {ArrowDown, ArrowLeft, ArrowRight, ArrowUp} from 'lucide-react';
import {memo} from 'react';

export interface KbdProps {
  children?: React.ReactNode;
  className?: string;
  isDark?: boolean;
  size?: 'sm' | 'md';
}

export const Kbd = memo(function Kbd({
  children,
  className = '',
  isDark = false,
  size = 'md',
}: KbdProps) {
  const sizeClasses =
    size === 'sm'
      ? 'min-w-[1.25rem] h-[1.25rem] px-1 text-[10px]'
      : 'min-w-[1.4rem] h-[1.4rem] px-1.5 text-[11px]';

  const baseStyle = `inline-flex items-center justify-center rounded border font-mono font-semibold tracking-tight shadow-2xs select-none transition-colors shrink-0 ${sizeClasses} ${
    isDark
      ? 'bg-zinc-800/90 border-zinc-700/80 text-zinc-200 shadow-zinc-950/40'
      : 'bg-zinc-100 border-zinc-300/80 text-zinc-800 shadow-zinc-200/50'
  } ${className}`;

  const iconSizeClass =
    size === 'sm' ? 'w-3 h-3 stroke-[2.5]' : 'w-3.5 h-3.5 stroke-[2.5]';

  const renderContent = (val: React.ReactNode): React.ReactNode => {
    if (typeof val !== 'string') return val;

    const trimmed = val.trim();

    // Check if compound string like "← / →" or "↑ / ↓"
    if (trimmed.includes(' / ')) {
      const parts = trimmed.split(' / ');
      return (
        <span className="inline-flex items-center gap-1 font-normal text-xs">
          {parts.map((part, idx) => (
            <span className="inline-flex items-center gap-1" key={idx}>
              {idx > 0 && (
                <span
                  className={`px-0.5 text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}
                >
                  /
                </span>
              )}
              <Kbd isDark={isDark} size={size}>
                {part}
              </Kbd>
            </span>
          ))}
        </span>
      );
    }

    switch (trimmed) {
      case '←':
      case 'Left':
        return (
          <ArrowLeft aria-label="Left arrow key" className={iconSizeClass} />
        );
      case '→':
      case 'Right':
        return (
          <ArrowRight aria-label="Right arrow key" className={iconSizeClass} />
        );
      case '↑':
      case 'Up':
        return <ArrowUp aria-label="Up arrow key" className={iconSizeClass} />;
      case '↓':
      case 'Down':
        return (
          <ArrowDown aria-label="Down arrow key" className={iconSizeClass} />
        );
      default:
        return val;
    }
  };

  if (typeof children === 'string' && children.trim().includes(' / ')) {
    return <>{renderContent(children)}</>;
  }

  return <kbd className={baseStyle}>{renderContent(children)}</kbd>;
});
