/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {useEffect} from 'react';
import {
  Header,
  KeyboardHints,
  SettingsPanel,
  TimerConfigPanel,
  TimerControls,
  TimerDisplay,
} from './components';
import {sharedStyles} from './constants';
import {useCustomTimer} from './hooks/use-custom-timer';
import {useKeyboardShortcuts} from './hooks/use-keyboard-shortcuts';
import {useTheme} from './hooks/use-theme';
import {formatTime} from './utils/format-time';

export default function App() {
  const {isDark, toggleTheme} = useTheme();

  const {
    duration,
    soundMode,
    volume,
    language,
    status,
    timeLeft,
    currentDuration,
    circumference,
    isDragging,
    setDuration,
    setPresetSeconds,
    setSoundMode,
    setVolume,
    setLanguage,
    togglePlay,
    handleReset,
    handleTestSound,
    handleSeekStart,
    handleSeek,
    handleSeekEnd,
    handleAdjustTime,
  } = useCustomTimer();

  // Update document title dynamically based on timer state and time left
  useEffect(() => {
    const formatted = formatTime(timeLeft, false);
    if (status === 'running') {
      document.title = `[${formatted}] — Voice Timer`;
    } else if (status === 'paused') {
      document.title = `[Paused ${formatted}] — Voice Timer`;
    } else if (status === 'completed') {
      document.title = `[Completed] — Voice Timer`;
    } else {
      document.title = `Voice Timer`;
    }
  }, [timeLeft, status]);

  // Register hotkeys (Space for Play/Pause, R for Reset, T for Theme, ← → for Seek)
  useKeyboardShortcuts({
    onAdjustTime: handleAdjustTime,
    onReset: handleReset,
    onTogglePlay: togglePlay,
    onToggleTheme: toggleTheme,
  });

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-between p-6 select-none ${
        isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'
      }`}
    >
      {/* Top Bar: Title & Theme toggle */}
      <Header isDark={isDark} onToggleTheme={toggleTheme} />

      {/* Main Center Area */}
      <main className="w-full max-w-sm flex flex-col items-center my-auto py-4">
        {/* Continuous Progress Ring & Big Digits */}
        <TimerDisplay
          circumference={circumference}
          currentDuration={currentDuration}
          isDark={isDark}
          isDragging={isDragging}
          onAdjustTime={handleAdjustTime}
          onSeek={handleSeek}
          onSeekEnd={handleSeekEnd}
          onSeekStart={handleSeekStart}
          timeLeft={timeLeft}
        />

        {/* Play/Pause & Reset Action Controls */}
        <TimerControls
          isDark={isDark}
          onReset={handleReset}
          onTogglePlay={togglePlay}
          status={status}
        />

        {/* Configuration Controls Section */}
        <div
          className={`w-full mt-10 space-y-5 border-t pt-6 ${sharedStyles.sectionDivider(isDark)}`}
        >
          {/* Timer Duration: Quick presets + h/m/s input */}
          <TimerConfigPanel
            duration={duration}
            isDark={isDark}
            onSelectPreset={setPresetSeconds}
            onUpdateDuration={setDuration}
            status={status}
          />

          {/* Settings: Sound mode, Volume and Language */}
          <SettingsPanel
            isDark={isDark}
            language={language}
            onLanguageChange={setLanguage}
            onSoundModeChange={setSoundMode}
            onTestSound={handleTestSound}
            onVolumeChange={setVolume}
            soundMode={soundMode}
            volume={volume}
          />
        </div>
      </main>

      {/* Keyboard Shortcuts Legend Footer */}
      <KeyboardHints isDark={isDark} />
    </div>
  );
}
