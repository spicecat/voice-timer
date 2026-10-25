import {memo} from 'react';
import {useTranslation} from '../hooks/use-translation';
import {Kbd} from './Kbd';

export interface KeyboardHintsProps {
  isDark: boolean;
  onOpenHelp?: () => void;
}

export const KeyboardHints = memo(function KeyboardHints({
  isDark,
  onOpenHelp,
}: KeyboardHintsProps) {
  const {t} = useTranslation();

  return (
    <footer
      className={`hidden sm:flex w-full max-w-sm flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] font-mono-numbers py-2 ${
        isDark ? 'text-zinc-500' : 'text-zinc-400'
      }`}
    >
      <span className="inline-flex items-center gap-1">
        <Kbd isDark={isDark} size="sm">
          Space
        </Kbd>{' '}
        {t('keyboardHints.play')}
      </span>
      <span>·</span>
      <span className="inline-flex items-center gap-1">
        <Kbd isDark={isDark} size="sm">
          ←
        </Kbd>
        <Kbd isDark={isDark} size="sm">
          →
        </Kbd>{' '}
        {t('keyboardHints.seek')}
      </span>
      <span>·</span>
      <span className="inline-flex items-center gap-1">
        <Kbd isDark={isDark} size="sm">
          ↑
        </Kbd>
        <Kbd isDark={isDark} size="sm">
          ↓
        </Kbd>{' '}
        {t('keyboardHints.vol')}
      </span>
      <span>·</span>
      <span className="inline-flex items-center gap-1">
        <Kbd isDark={isDark} size="sm">
          N
        </Kbd>{' '}
        {t('keyboardHints.next')}
      </span>
      <span>·</span>
      <span className="inline-flex items-center gap-1">
        <Kbd isDark={isDark} size="sm">
          M
        </Kbd>{' '}
        {t('keyboardHints.mute')}
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
            <Kbd isDark={isDark} size="sm">
              ?
            </Kbd>{' '}
            {t('keyboardHints.all')}
          </button>
        </>
      )}
    </footer>
  );
});
