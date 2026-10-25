import {
  ChevronDown,
  ChevronUp,
  Copy,
  GripVertical,
  Plus,
  Trash2,
} from 'lucide-react';
import {memo, useState} from 'react';
import {sharedStyles} from '../constants';
import {useTranslation} from '../hooks/use-translation';
import type {TimerSegment, TimerStatus} from '../types';
import {DecimalInput} from './DecimalInput';

export interface SegmentListProps {
  currentSegmentIndex?: number;
  isDark: boolean;
  onAddSegment: () => void;
  onCopySegment: (id: string) => void;
  onMoveSegment: (fromIndex: number, toIndex: number) => void;
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
  onMoveSegment,
}: SegmentListProps) {
  const {t} = useTranslation();
  const disabled = status === 'running';

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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
      <ul className="space-y-2">
        {segments.map((segment, index) => (
          <li
            className={`flex items-center gap-1.5 rounded border p-2 transition-colors ${
              index === currentSegmentIndex
                ? isDark
                  ? 'border-zinc-600 bg-zinc-900'
                  : 'border-zinc-400 bg-zinc-100'
                : isDark
                  ? 'border-zinc-800 bg-zinc-950/40'
                  : 'border-zinc-200 bg-white'
            } ${
              dragOverIndex === index && draggedIndex !== index
                ? isDark
                  ? 'ring-2 ring-zinc-400 border-zinc-400'
                  : 'ring-2 ring-zinc-600 border-zinc-600'
                : ''
            } ${draggedIndex === index ? 'opacity-40' : ''}`}
            draggable={!disabled}
            key={segment.id}
            onDragEnd={() => {
              setDraggedIndex(null);
              setDragOverIndex(null);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (!disabled && dragOverIndex !== index) {
                setDragOverIndex(index);
              }
            }}
            onDragStart={(e) => {
              if (disabled) return;
              setDraggedIndex(index);
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (
                !disabled &&
                draggedIndex !== null &&
                draggedIndex !== index
              ) {
                onMoveSegment(draggedIndex, index);
              }
              setDraggedIndex(null);
              setDragOverIndex(null);
            }}
          >
            {/* Move handle & Up/Down reorder controls */}
            <div className="flex items-center gap-0.5 text-zinc-400">
              <button
                aria-label={t('segments.dragHandle')}
                className={`p-0.5 rounded cursor-grab active:cursor-grabbing disabled:opacity-30 disabled:cursor-not-allowed ${
                  isDark
                    ? 'hover:text-zinc-200 hover:bg-zinc-800'
                    : 'hover:text-zinc-800 hover:bg-zinc-100'
                }`}
                disabled={disabled || segments.length <= 1}
                title={t('segments.dragHandle')}
                type="button"
              >
                <GripVertical className="w-3.5 h-3.5" />
              </button>
              <div className="flex flex-col -space-y-1">
                <button
                  aria-label={t('segments.moveUp')}
                  className={`p-0.5 rounded cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed ${
                    isDark
                      ? 'hover:text-zinc-200 hover:bg-zinc-800'
                      : 'hover:text-zinc-800 hover:bg-zinc-100'
                  }`}
                  disabled={disabled || index === 0}
                  onClick={() => onMoveSegment(index, index - 1)}
                  title={t('segments.moveUp')}
                  type="button"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  aria-label={t('segments.moveDown')}
                  className={`p-0.5 rounded cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed ${
                    isDark
                      ? 'hover:text-zinc-200 hover:bg-zinc-800'
                      : 'hover:text-zinc-800 hover:bg-zinc-100'
                  }`}
                  disabled={disabled || index === segments.length - 1}
                  onClick={() => onMoveSegment(index, index + 1)}
                  title={t('segments.moveDown')}
                  type="button"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </div>

            <span
              className={`text-[11px] w-4 font-mono font-medium ${sharedStyles.textSubtle(
                isDark,
              )}`}
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
                  onUpdateSegment(
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
                  onUpdateSegment(
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
                  onUpdateSegment(
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
                disabled={disabled || segments.length <= 1}
                onClick={() => onRemoveSegment(segment.id)}
                type="button"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
});
