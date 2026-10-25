import {memo} from 'react';
import {useTranslation} from '../hooks/use-translation';

export interface KeyboardHintsProps {
  isDark: boolean;
  onOpenHelp?: () => void;
}

export const KeyboardHints = memo(function KeyboardHints({
  isDark,
  onOpenHelp,
}: KeyboardHintsProps) {
  const {t} = useTranslation();
  const kbdClass = `px-1.5 py-0.5 rounded border text-[10px] ${
    isDark
      ? 'bg-zinc-900 border-zinc-800 text-zinc-300'
      : 'bg-zinc-100 border-zinc-200 text-zinc-700'
  }`;

  return (
    <footer
      className={`hidden sm:flex w-full max-w-md flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] font-mono-numbers py-2 ${
        isDark ? 'text-zinc-500' : 'text-zinc-400'
      }`}
    >
      <span>
        <kbd className={kbdClass}>Space</kbd> {t('keyboardHints.play')}
      </span>
      <span>·</span>
      <span>
        <kbd className={kbdClass}>←</kbd> <kbd className={kbdClass}>→</kbd>{' '}
        {t('keyboardHints.seek')}
      </span>
      <span>·</span>
      <span>
        <kbd className={kbdClass}>↑</kbd> <kbd className={kbdClass}>↓</kbd>{' '}
        {t('keyboardHints.vol')}
      </span>
      <span>·</span>
      <span>
        <kbd className={kbdClass}>N</kbd> {t('keyboardHints.next')}
      </span>
      <span>·</span>
      <span>
        <kbd className={kbdClass}>M</kbd> {t('keyboardHints.mute')}
      </span>
      {onOpenHelp && (
        <>
          <span>·</span>
          <button
            className={`cursor-pointer hover:underline inline-flex items-center gap-1 ${
              isDark
                ? 'text-zinc-400 hover:text-zinc-200'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
            onClick={onOpenHelp}
            type="button"
          >
            <kbd className={kbdClass}>?</kbd> {t('keyboardHints.all')}
          </button>
        </>
      )}
    </footer>
  );
});
