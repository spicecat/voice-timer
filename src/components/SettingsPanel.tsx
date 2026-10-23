import { memo } from 'react';
import { SUPPORTED_LANGUAGES, sharedStyles } from '../constants';
import type { SoundMode, SupportedLanguage } from '../types';

export interface SettingsPanelProps {
  soundMode: SoundMode;
  volume: number;
  language: SupportedLanguage;
  isDark: boolean;
  onSoundModeChange: (mode: SoundMode) => void;
  onVolumeChange: (volume: number) => void;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onTestSound: () => void;
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
              type="button"
              onClick={onTestSound}
              className={`text-[11px] underline cursor-pointer ${
                isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Test Sound
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="soundMode"
              value="voice"
              checked={soundMode === 'voice'}
              onChange={() => onSoundModeChange('voice')}
              className="w-3.5 h-3.5 cursor-pointer"
            />
            <span className={isDark ? 'text-zinc-200' : 'text-zinc-800'}>Voice</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="soundMode"
              value="chime"
              checked={soundMode === 'chime'}
              onChange={() => onSoundModeChange('chime')}
              className="w-3.5 h-3.5 cursor-pointer"
            />
            <span className={isDark ? 'text-zinc-200' : 'text-zinc-800'}>Chime</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="soundMode"
              value="off"
              checked={soundMode === 'off'}
              onChange={() => onSoundModeChange('off')}
              className="w-3.5 h-3.5 cursor-pointer"
            />
            <span className={isDark ? 'text-zinc-200' : 'text-zinc-800'}>Off</span>
          </label>
        </div>

        {/* Volume Option under Sound */}
        {soundMode !== 'off' && (
          <div className="flex items-center justify-between text-xs pt-1">
            <span className={sharedStyles.textMuted(isDark)}>Volume</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={Math.round(volume * 100)}
                onChange={(e) => onVolumeChange(Number.parseInt(e.target.value, 10) / 100)}
                aria-label="Sound volume"
                className={`w-28 h-1.5 rounded-lg appearance-none cursor-pointer ${
                  isDark ? 'bg-zinc-800 accent-zinc-200' : 'bg-zinc-200 accent-zinc-800'
                }`}
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
          value={language}
          onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
          aria-label="Voice language"
          className={sharedStyles.selectInput(isDark)}
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
