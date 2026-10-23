import {Moon, Sun} from 'lucide-react';
import {memo} from 'react';
import {sharedStyles} from '../constants';

export interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Header = memo(function Header({
  isDark,
  onToggleTheme,
}: HeaderProps) {
  return (
    <header className="w-full max-w-sm flex items-center justify-between text-xs">
      <span
        className={`font-medium tracking-wide ${sharedStyles.textSubtle(isDark)}`}
      >
        Custom Timer
      </span>

      <button
        aria-label="Toggle Theme"
        className={`p-2 rounded-lg border ${
          isDark
            ? 'border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
            : 'border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
        }`}
        onClick={onToggleTheme}
        title="Toggle Theme (T)"
        type="button"
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    </header>
  );
});
