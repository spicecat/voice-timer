import {Pause, Play, RotateCcw} from 'lucide-react';
import {memo} from 'react';
import type {TimerStatus} from '../types';

export interface TimerControlsProps {
  isDark: boolean;
  onReset: () => void;
  onTogglePlay: () => void;
  status: TimerStatus;
}

export const TimerControls = memo(function TimerControls({
  status,
  isDark,
  onTogglePlay,
  onReset,
}: TimerControlsProps) {
  const isRunning = status === 'running';

  return (
    <div className="flex items-center gap-4 mt-8">
      <button
        aria-label={isRunning ? 'Pause' : 'Start'}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-sm ${
          isDark
            ? 'bg-zinc-100 hover:bg-white text-zinc-950'
            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-50'
        }`}
        onClick={onTogglePlay}
        type="button"
      >
        {isRunning ? (
          <Pause className="w-6 h-6 fill-current" />
        ) : (
          <Play className="w-6 h-6 fill-current ml-0.5" />
        )}
      </button>

      <button
        aria-label="Reset timer"
        className={`w-12 h-12 rounded-full border flex items-center justify-center ${
          isDark
            ? 'border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-100'
            : 'border-zinc-300 hover:border-zinc-400 text-zinc-600 hover:text-zinc-950'
        }`}
        onClick={onReset}
        title="Reset timer without pausing (R)"
        type="button"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );
});
