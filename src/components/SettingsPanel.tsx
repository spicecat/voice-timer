import {memo} from 'react';
import {SUPPORTED_LANGUAGES, sharedStyles} from '../constants';
import type {SoundMode, SupportedLanguage} from '../types';

export interface SettingsPanelProps {
  isDark: boolean;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onSoundModeChange: (mode: SoundMode) => void;
  onTestSound: () => void;
  onVolumeChange: (volume: number) => void;
  soundMode: SoundMode;
  volume: number;
}

export const SettingsPanel = memo(function SettingsPanel({
  soundMode,
  volume,
  language,
  isDark,
  onSoundModeChange,
  onVolumeChange,
  onLanguageChange,
  onTestSound,
}: SettingsPanelProps) {
  return (
    <>
      {/* Sound Radio Options: Voice, Chime, Off */}
      <div className={`space-y-3 pt-1`}>
        <div
          className={`flex items-center justify-between text-xs ${sharedStyles.textMuted(isDark)}`}
        >
          <span>Sound</span>
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
              Test Sound
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              checked={soundMode === 'voice'}
              className="w-3.5 h-3.5 cursor-pointer"
              name="soundMode"
              onChange={() => onSoundModeChange('voice')}
              type="radio"
              value="voice"
            />
            <span className={isDark ? 'text-zinc-200' : 'text-zinc-800'}>
              Voice
            </span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              checked={soundMode === 'chime'}
              className="w-3.5 h-3.5 cursor-pointer"
              name="soundMode"
              onChange={() => onSoundModeChange('chime')}
              type="radio"
              value="chime"
            />
            <span className={isDark ? 'text-zinc-200' : 'text-zinc-800'}>
              Chime
            </span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              checked={soundMode === 'off'}
              className="w-3.5 h-3.5 cursor-pointer"
              name="soundMode"
              onChange={() => onSoundModeChange('off')}
              type="radio"
              value="off"
            />
            <span className={isDark ? 'text-zinc-200' : 'text-zinc-800'}>
              Off
            </span>
          </label>
        </div>

        {/* Volume Option under Sound */}
        {soundMode !== 'off' && (
          <div className="flex items-center justify-between text-xs pt-1">
            <span className={sharedStyles.textMuted(isDark)}>Volume</span>
            <div className="flex items-center gap-2">
              <input
                aria-label="Sound volume"
                className={`w-28 h-1.5 rounded-lg appearance-none cursor-pointer ${
                  isDark
                    ? 'bg-zinc-800 accent-zinc-200'
                    : 'bg-zinc-200 accent-zinc-800'
                }`}
                max="100"
                min="0"
                onChange={(e) =>
                  onVolumeChange(Number.parseInt(e.target.value, 10) / 100)
                }
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

      {/* Global Language Option - extensible across SUPPORTED_LANGUAGES */}
      <div
        className={`flex items-center justify-between text-xs border-t pt-4 ${sharedStyles.sectionDivider(isDark)}`}
      >
        <span className={sharedStyles.textMuted(isDark)}>Language</span>
        <select
          aria-label="Voice language"
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
