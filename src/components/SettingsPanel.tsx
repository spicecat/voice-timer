import {Sun} from 'lucide-react';
import {memo} from 'react';
import {SUPPORTED_LANGUAGES, sharedStyles} from '../constants';
import {useTranslation} from '../hooks/use-translation';
import type {SoundMode, SupportedLanguage} from '../types';

export interface SettingsPanelProps {
  isDark: boolean;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onSoundModeChange: (mode: SoundMode) => void;
  onTestSound: () => void;
  onVolumeChange: (volume: number) => void;
  onWakeLockChange?: (enabled: boolean) => void;
  soundMode: SoundMode;
  volume: number;
  wakeLockActive?: boolean;
  wakeLockEnabled?: boolean;
  wakeLockSupported?: boolean;
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
  language,
  isDark,
  onSoundModeChange,
  onVolumeChange,
  onLanguageChange,
  onTestSound,
  wakeLockActive = false,
  wakeLockEnabled = true,
  wakeLockSupported = true,
  onWakeLockChange,
}: SettingsPanelProps) {
  const {t} = useTranslation();

  return (
    <>
      {/* Sound Radio Options: Voice, Chime, Off */}
      <div className="space-y-3 pt-1">
        <div
          className={`flex items-center justify-between text-xs ${sharedStyles.textMuted(isDark)}`}
        >
          <span>{t('settings.sound')}</span>
          {soundMode !== 'off' && (
            <button
              className={`text-[11px] underline cursor-pointer ${
                isDark
                  ? 'text-zinc-400 hover:text-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
              onClick={onTestSound}
              type="button"
            >
              {t('settings.testSound')}
            </button>
          )}
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

      {/* Screen Wake Lock Option */}
      <div
        className={`flex items-center justify-between text-xs border-t pt-4 ${sharedStyles.sectionDivider(isDark)}`}
      >
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span className={sharedStyles.textMuted(isDark)}>
              {t('settings.keepAwake')}
            </span>
          </div>
          <span
            className={`text-[10px] mt-0.5 ${sharedStyles.textSubtle(isDark)}`}
          >
            {!wakeLockSupported
              ? t('settings.keepAwakeNotSupported')
              : wakeLockActive
                ? t('settings.keepAwakeActive')
                : t('settings.keepAwakeActiveWhenRunning')}
          </span>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            checked={wakeLockEnabled}
            className="sr-only peer"
            disabled={!wakeLockSupported}
            onChange={(e) => onWakeLockChange?.(e.target.checked)}
            type="checkbox"
          />
          <div
            className={`w-8 h-4 rounded-full transition-colors peer-focus:outline-none ${
              isDark
                ? 'bg-zinc-800 peer-checked:bg-zinc-200'
                : 'bg-zinc-300 peer-checked:bg-zinc-800'
            } peer-disabled:opacity-40 peer-disabled:cursor-not-allowed`}
          >
            <div
              className={`w-3 h-3 rounded-full transition-transform transform translate-x-0.5 translate-y-0.5 ${
                isDark
                  ? 'bg-zinc-400 peer-checked:bg-zinc-950 peer-checked:translate-x-4'
                  : 'bg-white peer-checked:translate-x-4'
              }`}
            />
          </div>
        </label>
      </div>

      {/* Global Language Option - extensible across SUPPORTED_LANGUAGES */}
      <div
        className={`flex items-center justify-between text-xs border-t pt-4 ${sharedStyles.sectionDivider(isDark)}`}
      >
        <span className={sharedStyles.textMuted(isDark)}>
          {t('settings.language')}
        </span>
        <select
          aria-label={t('settings.languageAriaLabel')}
          className={sharedStyles.selectInput(isDark)}
          onChange={(e) =>
            onLanguageChange(e.target.value as SupportedLanguage)
          }
          value={language}
        >
          {Object.values(SUPPORTED_LANGUAGES).map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
});
