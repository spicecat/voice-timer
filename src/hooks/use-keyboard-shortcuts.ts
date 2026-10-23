import {useEffect} from 'react';

interface KeyboardShortcutOptions {
  onAdjustTime: (delta: number) => void;
  onReset: () => void;
  onTogglePlay: () => void;
  onToggleTheme: () => void;
}

/**
 * Handles global keyboard shortcuts:
 * - Space: Play / Pause
 * - R: Reset
 * - T: Theme toggle
 * - ← / ↓ / → / ↑: Seek / adjust timer
 * Safely skips execution if focus is in an input, textarea, select, or editable element.
 */
export function useKeyboardShortcuts({
  onTogglePlay,
  onReset,
  onToggleTheme,
  onAdjustTime,
}: KeyboardShortcutOptions): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInteractiveElement =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable);

      if (isInteractiveElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        onTogglePlay();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        onReset();
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        onToggleTheme();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        onAdjustTime(e.shiftKey ? -5 : -1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        onAdjustTime(e.shiftKey ? 5 : 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTogglePlay, onReset, onToggleTheme, onAdjustTime]);
}
