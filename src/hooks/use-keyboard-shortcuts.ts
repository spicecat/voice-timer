import {useEffect, useRef} from 'react';

interface KeyboardShortcutOptions {
  onAdjustTime: (delta: number) => void;
  onAdjustVolume: (delta: number) => void;
  onCycleSoundMode: () => void;
  onGoToSegment: (index: number) => void;
  onNextSegment: () => void;
  onPrevSegment: () => void;
  onReset: () => void;
  onToggleFullscreen: () => void;
  onToggleHelp: () => void;
  onToggleMute: () => void;
  onTogglePlay: () => void;
  onToggleTheme: () => void;
}

/**
 * Handles global keyboard shortcuts:
 * - Space: Play / Pause
 * - R: Reset
 * - M: Mute toggle
 * - S: Sound mode cycle (Voice -> Chime -> Off)
 * - T: Theme toggle
 * - F: Fullscreen toggle
 * - N / ]: Next segment
 * - P / [: Previous segment
 * - 1-9: Jump directly to segment 1-9
 * - 0: Restart current segment
 * - ← / →: Seek ±1s (Shift: ±5s)
 * - ↑ / ↓: Volume ±10% (Shift: ±5%)
 * - ?: Help / shortcuts cheatsheet
 * Safely skips execution if focus is in an input, textarea, select, or editable element,
 * and avoids conflicting with button activation.
 */
export function useKeyboardShortcuts(options: KeyboardShortcutOptions): void {
  const optionsRef = useRef(options);
  optionsRef.current = options;

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

      // If a button is currently focused, allow native button keyboard activation on Space/Enter
      if (
        e.target instanceof HTMLButtonElement &&
        (e.code === 'Space' || e.key === 'Enter')
      ) {
        return;
      }

      const {
        onTogglePlay,
        onReset,
        onToggleMute,
        onCycleSoundMode,
        onToggleTheme,
        onToggleFullscreen,
        onNextSegment,
        onPrevSegment,
        onToggleHelp,
        onAdjustTime,
        onAdjustVolume,
        onGoToSegment,
      } = optionsRef.current;

      if (e.code === 'Space') {
        e.preventDefault();
        onTogglePlay();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        onReset();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        onToggleMute();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        onCycleSoundMode();
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        onToggleTheme();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        onToggleFullscreen();
      } else if (e.key === 'n' || e.key === 'N' || e.key === ']') {
        e.preventDefault();
        onNextSegment();
      } else if (e.key === 'p' || e.key === 'P' || e.key === '[') {
        e.preventDefault();
        onPrevSegment();
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        onToggleHelp();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onAdjustTime(e.shiftKey ? -5 : -1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onAdjustTime(e.shiftKey ? 5 : 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        onAdjustVolume(e.shiftKey ? 0.05 : 0.1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onAdjustVolume(e.shiftKey ? -0.05 : -0.1);
      } else if (/^[1-9]$/.test(e.key)) {
        e.preventDefault();
        onGoToSegment(Number.parseInt(e.key, 10) - 1);
      } else if (e.key === '0') {
        e.preventDefault();
        onGoToSegment(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
