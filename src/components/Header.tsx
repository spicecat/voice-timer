import {Moon, Sun} from 'lucide-react';
import {memo} from 'react';
import {sharedStyles} from '../constants';
import {useTranslation} from '../hooks/use-translation';
import {formatTime} from '../utils/format-time';

export interface HeaderProps {
  currentSegmentIndex?: number;
  elapsedDuration?: number;
  isDark: boolean;
  onToggleTheme: () => void;
  totalDuration?: number;
  totalSegments?: number;
}

export const Header = memo(function Header({
  currentSegmentIndex = 0,
  elapsedDuration = 0,
  isDark,
  onToggleTheme,
  totalDuration = 0,
  totalSegments = 1,
}: HeaderProps) {
  const {t} = useTranslation();
  const segment = currentSegmentIndex + 1;
  const remaining = Math.max(0, totalDuration - elapsedDuration);

  return (
    <header className="w-full max-w-sm flex items-center justify-between text-xs">
      <span
        className={`font-medium tracking-wide ${sharedStyles.textSubtle(isDark)}`}
      >
        {totalDuration > 0
          ? t('header.segmentProgressWithDuration', {
              remaining: formatTime(remaining, false),
              segment,
              totalDuration: formatTime(totalDuration, false),
              totalSegments,
            })
          : t('header.segmentProgress', {segment, totalSegments})}
      </span>

      <button
        aria-label={t('header.toggleTheme')}
        className={`p-2 rounded-lg border cursor-pointer ${
          isDark
            ? 'border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
            : 'border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
        }`}
        onClick={onToggleTheme}
        title={t('header.toggleThemeWithShortcut')}
        type="button"
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    </header>
  );
});
