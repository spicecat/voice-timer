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
  wakeLockActive?: boolean;
}

export const Header = memo(function Header({
  currentSegmentIndex = 0,
  elapsedDuration = 0,
  isDark,
  onToggleTheme,
  totalDuration = 0,
  totalSegments = 1,
  wakeLockActive = false,
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

      <div className="flex items-center gap-2">
        {wakeLockActive && (
          <span
            className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${
              isDark
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                : 'border-amber-600/30 bg-amber-50 text-amber-700'
            }`}
            title={t('settings.keepAwakeActive')}
          >
            <Sun className="w-3 h-3 animate-pulse text-amber-500" />
            <span className="hidden sm:inline">
              {t('settings.keepAwakeActive')}
            </span>
          </span>
        )}

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
      </div>
    </header>
  );
});
