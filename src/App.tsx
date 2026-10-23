/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import {
  Header,
  KeyboardHints,
  SegmentList,
  SettingsPanel,
  TimerControls,
  TimerDisplay,
} from './components';
import { sharedStyles } from './constants';
import { useIntervalTimer } from './hooks/useIntervalTimer';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useTheme } from './hooks/useTheme';
import { formatTime } from './utils/formatTime';

export default function App() {
  const { isDark, toggleTheme } = useTheme();

  const {
    steps,
    currentStepIndex,
    targetLoops,
    currentLoop,
    soundMode,
    volume,
    language,
    status,
    timeLeft,
    currentDuration,
    circumference,
    isDragging,
    setTargetLoops,
    setSoundMode,
    setVolume,
    setLanguage,
    togglePlay,
    handleReset,
    updateStep,
    addSegment,
    removeSegment,
    handleTestSound,
    handleSeekStart,
    handleSeek,
    handleSeekEnd,
    handleAdjustTime,
  } = useIntervalTimer();

  // Update document title dynamically based on timer state and time left
  useEffect(() => {
    const formatted = formatTime(timeLeft, false);
    if (status === 'running') {
      document.title = `[${formatted}] (Loop ${currentLoop}/${targetLoops}) — Custom Timer`;
    } else if (status === 'paused') {
      document.title = `[Paused ${formatted}] — Custom Timer`;
    } else if (status === 'completed') {
      document.title = `[Completed] — Custom Timer`;
    } else {
      document.title = `Custom Timer`;
    }
  }, [timeLeft, status, currentLoop, targetLoops]);

  // Register hotkeys (Space for Play/Pause, R for Reset, T for Theme, ← → for Seek)
  useKeyboardShortcuts({
    onTogglePlay: togglePlay,
    onReset: handleReset,
    onToggleTheme: toggleTheme,
    onAdjustTime: handleAdjustTime,
  });

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-between p-6 select-none ${
        isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'
      }`}
    >
      {/* Top Bar: Loop tracker & Theme toggle */}
      <Header
        currentLoop={currentLoop}
        targetLoops={targetLoops}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      {/* Main Center Area */}
      <main className="w-full max-w-sm flex flex-col items-center my-auto py-4">
        {/* Continuous Progress Ring & Big Digits */}
        <TimerDisplay
          timeLeft={timeLeft}
          currentDuration={currentDuration}
          circumference={circumference}
          isDark={isDark}
          isDragging={isDragging}
          onSeekStart={handleSeekStart}
          onSeek={handleSeek}
          onSeekEnd={handleSeekEnd}
          onAdjustTime={handleAdjustTime}
        />

        {/* Play/Pause & Reset Action Controls */}
        <TimerControls
          status={status}
          isDark={isDark}
          onTogglePlay={togglePlay}
          onReset={handleReset}
        />

        {/* Configuration Controls Section */}
        <div
          className={`w-full mt-10 space-y-5 border-t pt-6 ${sharedStyles.sectionDivider(isDark)}`}
        >
          {/* Segments Management */}
          <SegmentList
            steps={steps}
            currentStepIndex={currentStepIndex}
            status={status}
            isDark={isDark}
            onAddSegment={addSegment}
            onUpdateStep={updateStep}
            onRemoveSegment={removeSegment}
          />

          {/* Settings: Loops count, Sound mode, Volume, and Language */}
          <SettingsPanel
            targetLoops={targetLoops}
            soundMode={soundMode}
            volume={volume}
            language={language}
            isDark={isDark}
            onTargetLoopsChange={setTargetLoops}
            onSoundModeChange={setSoundMode}
            onVolumeChange={setVolume}
            onLanguageChange={setLanguage}
            onTestSound={handleTestSound}
          />
        </div>
      </main>

      {/* Keyboard Shortcuts Legend Footer */}
      <KeyboardHints isDark={isDark} />
    </div>
  );
}
