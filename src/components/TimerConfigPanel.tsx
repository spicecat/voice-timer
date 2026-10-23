import { memo } from 'react';
import { sharedStyles, TIMER_PRESETS } from '../constants';
import type { TimerDuration, TimerStatus } from '../types';
import { formatTime, getTimerDurationSec } from '../utils';
import { DecimalInput } from './DecimalInput';

export interface TimerConfigPanelProps {
  duration: TimerDuration;
  status: TimerStatus;
  isDark: boolean;
  onUpdateDuration: (hours: number, minutes: number, seconds: number) => void;
  onSelectPreset: (totalSeconds: number) => void;
}

export const TimerConfigPanel = memo(function TimerConfigPanel({
  duration,
  status,
  isDark,
  onUpdateDuration,
  onSelectPreset,
}: TimerConfigPanelProps) {
  const totalDurationSec = getTimerDurationSec(duration);

  return (
    <div className="space-y-4">
      {/* Quick Presets */}
      <div className="space-y-1.5">
        <div className={`text-xs ${sharedStyles.textMuted(isDark)}`}>Quick Presets</div>
        <div className="grid grid-cols-4 gap-1.5">
          {TIMER_PRESETS.map((preset) => {
            const isSelected = totalDurationSec === preset.seconds;
            return (
              <button
                key={preset.label}
                type="button"
                disabled={status === 'running'}
                onClick={() => onSelectPreset(preset.seconds)}
                className={`py-1 px-2 rounded text-xs font-mono-numbers transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border ${
                  isSelected
                    ? isDark
                      ? 'bg-zinc-800 border-zinc-600 text-white font-medium'
                      : 'bg-zinc-200 border-zinc-400 text-zinc-950 font-medium'
                    : isDark
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                      : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Duration Input */}
      <div className="space-y-1.5">
        <div
          className={`flex items-center justify-between text-xs ${sharedStyles.textMuted(isDark)}`}
        >
          <span>Custom Duration</span>
          <span className={`text-[11px] font-mono-numbers ${sharedStyles.textSubtle(isDark)}`}>
            ({formatTime(totalDurationSec)})
          </span>
        </div>

        <div
          className={`flex items-center justify-between py-2 px-3 rounded-lg border ${
            isDark
              ? 'border-zinc-800 bg-zinc-900 text-white'
              : 'border-zinc-200 bg-white text-zinc-900'
          }`}
        >
          <span className={`text-xs ${sharedStyles.textMuted(isDark)}`}>Duration</span>

          <div className="flex items-center gap-1.5 text-xs font-mono-numbers">
            <input
              type="number"
              min="0"
              max="59"
              disabled={status === 'running'}
              value={duration.hours ?? 0}
              onChange={(e) =>
                onUpdateDuration(
                  Number.parseInt(e.target.value, 10) || 0,
                  duration.minutes,
                  duration.seconds,
                )
              }
              aria-label="Timer hours"
              className={`w-10 ${sharedStyles.numberInput(isDark)} disabled:opacity-50`}
            />
            <span className={sharedStyles.textSubtle(isDark)}>h</span>

            <input
              type="number"
              min="0"
              max="59"
              disabled={status === 'running'}
              value={duration.minutes}
              onChange={(e) =>
                onUpdateDuration(
                  duration.hours ?? 0,
                  Number.parseInt(e.target.value, 10) || 0,
                  duration.seconds,
                )
              }
              aria-label="Timer minutes"
              className={`w-10 ${sharedStyles.numberInput(isDark)} disabled:opacity-50`}
            />
            <span className={sharedStyles.textSubtle(isDark)}>m</span>

            <DecimalInput
              value={duration.seconds}
              min={0}
              max={59.99}
              step="any"
              onChange={(val) => onUpdateDuration(duration.hours ?? 0, duration.minutes, val)}
              aria-label="Timer seconds"
              className={`w-14 ${sharedStyles.numberInput(isDark)}`}
            />
            <span className={sharedStyles.textSubtle(isDark)}>s</span>
          </div>
        </div>
      </div>
    </div>
  );
});
