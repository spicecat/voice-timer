import {memo} from 'react';
import {sharedStyles} from '../constants';
import type {TimerDuration, TimerStatus} from '../types';
import {DecimalInput} from './DecimalInput';

export interface TimerConfigPanelProps {
  duration: TimerDuration;
  isDark: boolean;
  onUpdateDuration: (hours: number, minutes: number, seconds: number) => void;
  status: TimerStatus;
}

export const TimerConfigPanel = memo(function TimerConfigPanel({
  duration,
  status,
  isDark,
  onUpdateDuration,
}: TimerConfigPanelProps) {
  const disabled = status === 'running';

  return (
    <div className="space-y-4">
      {/* Duration h/m/s entry, aligned with the left-label layout of SettingsPanel */}
      <div className="flex items-center justify-between text-xs">
        <span className={sharedStyles.textMuted(isDark)}>Duration</span>
        <div className="flex items-center gap-1.5 font-mono-numbers">
          <input
            aria-label="Timer hours"
            className={`w-9 ${sharedStyles.numberInput(isDark)} disabled:opacity-50`}
            disabled={disabled}
            max="23"
            min="0"
            onChange={(e) =>
              onUpdateDuration(
                Number.parseInt(e.target.value, 10) || 0,
                duration.minutes,
                duration.seconds,
              )
            }
            type="number"
            value={duration.hours ?? 0}
          />
          <span className={sharedStyles.textSubtle(isDark)}>h</span>
          <input
            aria-label="Timer minutes"
            className={`w-9 ${sharedStyles.numberInput(isDark)} disabled:opacity-50`}
            disabled={disabled}
            max="59"
            min="0"
            onChange={(e) =>
              onUpdateDuration(
                duration.hours ?? 0,
                Number.parseInt(e.target.value, 10) || 0,
                duration.seconds,
              )
            }
            type="number"
            value={duration.minutes}
          />
          <span className={sharedStyles.textSubtle(isDark)}>m</span>
          <DecimalInput
            aria-label="Timer seconds"
            className={`w-14 ${sharedStyles.numberInput(isDark)} ${disabled ? 'opacity-50' : ''}`}
            max={59.99}
            min={0}
            onChange={(val) =>
              onUpdateDuration(duration.hours ?? 0, duration.minutes, val)
            }
            step="any"
            value={duration.seconds}
          />
          <span className={sharedStyles.textSubtle(isDark)}>s</span>
        </div>
      </div>
    </div>
  );
});
