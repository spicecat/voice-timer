import {Copy, Plus, Trash2} from 'lucide-react';
import {memo} from 'react';
import {sharedStyles} from '../constants';
import {useTranslation} from '../hooks/use-translation';
import type {TimerSegment, TimerStatus} from '../types';
import {DecimalInput} from './DecimalInput';

export interface SegmentListProps {
  currentSegmentIndex?: number;
  isDark: boolean;
  onAddSegment: () => void;
  onCopySegment: (id: string) => void;
  onRemoveSegment: (id: string) => void;
  onUpdateSegment: (
    id: string,
    hours: number,
    minutes: number,
    seconds: number,
  ) => void;
  segments: TimerSegment[];
  status: TimerStatus;
}

export const SegmentList = memo(function SegmentList({
  segments,
  currentSegmentIndex = 0,
  status,
  isDark,
  onAddSegment,
  onUpdateSegment,
  onRemoveSegment,
  onCopySegment,
}: SegmentListProps) {
  const {t} = useTranslation();
  const activeSegments = segments;
  const activeIndex = currentSegmentIndex;
  const updateHandler = onUpdateSegment;
  const disabled = status === 'running';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className={sharedStyles.textMuted(isDark)}>
          {t('segments.title')}
        </span>
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
          <Plus className="w-3 h-3" /> {t('segments.add')}
        </button>
      </div>
      <div className="space-y-2">
        {activeSegments.map((segment, index) => (
          <div
            className={`flex items-center gap-2 rounded border p-2 ${
              index === activeIndex
                ? isDark
                  ? 'border-zinc-600 bg-zinc-900'
                  : 'border-zinc-400 bg-zinc-100'
                : isDark
                  ? 'border-zinc-800'
                  : 'border-zinc-200'
            }`}
            key={segment.id}
          >
            <span
              className={`text-[11px] w-4 ${sharedStyles.textSubtle(isDark)}`}
            >
              {index + 1}
            </span>
            <div className="flex items-center gap-1 font-mono-numbers">
              <input
                aria-label={t('segments.hoursAriaLabel')}
                className={`w-9 ${sharedStyles.numberInput(isDark)} disabled:opacity-50`}
                disabled={disabled}
                max="23"
                min="0"
                onChange={(e) =>
                  updateHandler(
                    segment.id,
                    Math.max(
                      0,
                      Math.min(23, Number.parseInt(e.target.value, 10) || 0),
                    ),
                    segment.minutes,
                    segment.seconds,
                  )
                }
                type="number"
                value={segment.hours ?? 0}
              />
              <span className={sharedStyles.textSubtle(isDark)}>
                {t('segments.hoursShort')}
              </span>
              <input
                aria-label={t('segments.minutesAriaLabel')}
                className={`w-9 ${sharedStyles.numberInput(isDark)} disabled:opacity-50`}
                disabled={disabled}
                max="59"
                min="0"
                onChange={(e) =>
                  updateHandler(
                    segment.id,
                    segment.hours ?? 0,
                    Math.max(
                      0,
                      Math.min(59, Number.parseInt(e.target.value, 10) || 0),
                    ),
                    segment.seconds,
                  )
                }
                type="number"
                value={segment.minutes}
              />
              <span className={sharedStyles.textSubtle(isDark)}>
                {t('segments.minutesShort')}
              </span>
              <DecimalInput
                aria-label={t('segments.secondsAriaLabel')}
                className={`w-14 ${sharedStyles.numberInput(isDark)} ${disabled ? 'opacity-50' : ''}`}
                disabled={disabled}
                max={59.99}
                min={0}
                onChange={(val) =>
                  updateHandler(
                    segment.id,
                    segment.hours ?? 0,
                    segment.minutes,
                    val,
                  )
                }
                step="any"
                value={segment.seconds}
              />
              <span className={sharedStyles.textSubtle(isDark)}>
                {t('segments.secondsShort')}
              </span>
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <button
                aria-label={t('segments.copy')}
                className={`p-1 rounded cursor-pointer disabled:opacity-50 ${
                  isDark
                    ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                }`}
                disabled={disabled}
                onClick={() => onCopySegment(segment.id)}
                type="button"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                aria-label={t('segments.delete')}
                className={`p-1 rounded cursor-pointer disabled:opacity-50 ${
                  isDark
                    ? 'text-zinc-400 hover:text-red-400 hover:bg-zinc-800'
                    : 'text-zinc-600 hover:text-red-600 hover:bg-zinc-100'
                }`}
                disabled={disabled || activeSegments.length <= 1}
                onClick={() => onRemoveSegment(segment.id)}
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
