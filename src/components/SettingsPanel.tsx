import {memo} from 'react';
import {sharedStyles} from '../constants';
import {useTranslation} from '../hooks/use-translation';
import type {SoundMode} from '../types';

export interface SettingsPanelProps {
  isDark: boolean;
  onSoundModeChange: (mode: SoundMode) => void;
  onVolumeChange: (volume: number) => void;
  soundMode: SoundMode;
  volume: number;
}

const SOUND_MODES: {
  labelKey: 'settings.voice' | 'settings.chime' | 'settings.off';
  mode: SoundMode;
}[] = [
  {labelKey: 'settings.voice', mode: 'voice'},
  {labelKey: 'settings.chime', mode: 'chime'},
  {labelKey: 'settings.off', mode: 'off'},
];

export const SettingsPanel = memo(function SettingsPanel({
  soundMode,
  volume,
  isDark,
  onSoundModeChange,
  onVolumeChange,
}: SettingsPanelProps) {
  const {t} = useTranslation();

  return (
    <div className="space-y-3 pt-1">
      <div
        className={`flex items-center justify-between text-xs ${sharedStyles.textMuted(isDark)}`}
      >
        <span>{t('settings.sound')}</span>
      </div>

      <div className="flex items-center gap-4 text-xs">
        {SOUND_MODES.map(({mode, labelKey}) => (
          <label
            className="flex items-center gap-1.5 cursor-pointer"
            key={mode}
          >
            <input
              checked={soundMode === mode}
              className="w-3.5 h-3.5 cursor-pointer"
              name="soundMode"
              onChange={() => onSoundModeChange(mode)}
              type="radio"
              value={mode}
            />
            <span className={isDark ? 'text-zinc-200' : 'text-zinc-800'}>
              {t(labelKey)}
            </span>
          </label>
        ))}
      </div>

      {/* Volume Option under Sound */}
      {soundMode !== 'off' && (
        <div className="flex items-center justify-between text-xs pt-1">
          <span className={sharedStyles.textMuted(isDark)}>
            {t('settings.volume')}
          </span>
          <div className="flex items-center gap-2">
            <input
              aria-label={t('settings.volumeAriaLabel')}
              className={`w-28 h-1.5 rounded-lg appearance-none cursor-pointer ${
                isDark
                  ? 'bg-zinc-800 accent-zinc-200'
                  : 'bg-zinc-200 accent-zinc-800'
              }`}
              max="100"
              min="0"
              onChange={(e) => {
                const parsed = Number.parseInt(e.target.value, 10);
                if (!Number.isNaN(parsed)) onVolumeChange(parsed / 100);
              }}
              step="5"
              type="range"
              value={Math.round(volume * 100)}
            />
            <span
              className={`w-8 text-right font-mono text-[11px] ${sharedStyles.textSubtle(isDark)}`}
            >
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
});
