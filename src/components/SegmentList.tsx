import {Copy, Plus, Trash2} from 'lucide-react';
import {memo} from 'react';
import {sharedStyles} from '../constants';
import type {TimerStatus, TimerStep} from '../types';
import {DecimalInput} from './DecimalInput';

export interface SegmentListProps {
  currentStepIndex: number;
  isDark: boolean;
  onAddSegment: () => void;
  onCopySegment: (id: string) => void;
  onRemoveSegment: (id: string) => void;
  onUpdateStep: (
    id: string,
    hours: number,
    minutes: number,
    seconds: number,
  ) => void;
  status: TimerStatus;
  steps: TimerStep[];
}

export const SegmentList = memo(function SegmentList({
  steps,
  currentStepIndex,
  status,
  isDark,
  onAddSegment,
  onUpdateStep,
  onRemoveSegment,
  onCopySegment,
}: SegmentListProps) {
  const disabled = status === 'running';
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className={sharedStyles.textMuted(isDark)}>Segments</span>
        <button
          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] border cursor-pointer disabled:opacity-50 ${
            isDark
              ? 'border-zinc-800 text-zinc-300 hover:bg-zinc-800'
              : 'border-zinc-200 text-zinc-700 hover:bg-zinc-100'
          }`}
          disabled={disabled}
          onClick={onAddSegment}
          type="button"
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            className={`flex items-center gap-2 rounded border p-2 ${
              index === currentStepIndex
                ? isDark
                  ? 'border-zinc-600 bg-zinc-900'
                  : 'border-zinc-400 bg-zinc-100'
                : isDark
                  ? 'border-zinc-800'
                  : 'border-zinc-200'
            }`}
            key={step.id}
          >
            <span
              className={`text-[11px] w-4 ${sharedStyles.textSubtle(isDark)}`}
            >
              {index + 1}
            </span>
            <div className="flex items-center gap-1 font-mono-numbers">
              <input
                aria-label="Segment hours"
                className={`w-9 ${sharedStyles.numberInput(isDark)} disabled:opacity-50`}
                disabled={disabled}
                max="23"
                min="0"
                onChange={(e) =>
                  onUpdateStep(
                    step.id,
                    Number.parseInt(e.target.value, 10) || 0,
                    step.minutes,
                    step.seconds,
                  )
                }
                type="number"
                value={step.hours ?? 0}
              />
              <span className={sharedStyles.textSubtle(isDark)}>h</span>
              <input
                aria-label="Segment minutes"
                className={`w-9 ${sharedStyles.numberInput(isDark)} disabled:opacity-50`}
                disabled={disabled}
                max="59"
                min="0"
                onChange={(e) =>
                  onUpdateStep(
                    step.id,
                    step.hours ?? 0,
                    Number.parseInt(e.target.value, 10) || 0,
                    step.seconds,
                  )
                }
                type="number"
                value={step.minutes}
              />
              <span className={sharedStyles.textSubtle(isDark)}>m</span>
              <DecimalInput
                aria-label="Segment seconds"
                className={`w-14 ${sharedStyles.numberInput(isDark)} ${disabled ? 'opacity-50' : ''}`}
                disabled={disabled}
                max={59.99}
                min={0}
                onChange={(val) =>
                  onUpdateStep(step.id, step.hours ?? 0, step.minutes, val)
                }
                step="any"
                value={step.seconds}
              />
              <span className={sharedStyles.textSubtle(isDark)}>s</span>
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <button
                aria-label="Copy segment"
                className={`p-1 rounded cursor-pointer disabled:opacity-50 ${
                  isDark
                    ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                }`}
                disabled={disabled}
                onClick={() => onCopySegment(step.id)}
                type="button"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                aria-label="Delete segment"
                className={`p-1 rounded cursor-pointer disabled:opacity-50 ${
                  isDark
                    ? 'text-zinc-400 hover:text-red-400 hover:bg-zinc-800'
                    : 'text-zinc-600 hover:text-red-600 hover:bg-zinc-100'
                }`}
                disabled={disabled || steps.length <= 1}
                onClick={() => onRemoveSegment(step.id)}
                type="button"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
