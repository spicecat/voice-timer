import {memo} from 'react';

export interface KeyboardHintsProps {
  isDark: boolean;
}

export const KeyboardHints = memo(function KeyboardHints({
  isDark,
}: KeyboardHintsProps) {
  const kbdClass = `px-1.5 py-0.5 rounded border text-[10px] ${
    isDark
      ? 'bg-zinc-900 border-zinc-800 text-zinc-300'
      : 'bg-zinc-100 border-zinc-200 text-zinc-700'
  }`;

  return (
    <footer
      className={`w-full max-w-sm flex items-center justify-center gap-2.5 text-[11px] font-mono-numbers py-2 ${
        isDark ? 'text-zinc-500' : 'text-zinc-400'
      }`}
    >
      <span>
        <kbd className={kbdClass}>Space</kbd> Play
      </span>
      <span>·</span>
      <span>
        <kbd className={kbdClass}>R</kbd> Reset
      </span>
      <span>·</span>
      <span>
        <kbd className={kbdClass}>←</kbd> <kbd className={kbdClass}>→</kbd> Seek
      </span>
      <span>·</span>
      <span>
        <kbd className={kbdClass}>T</kbd> Theme
      </span>
    </footer>
  );
});
