/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {useEffect} from 'react';
import {
  Header,
  KeyboardHints,
  SegmentList,
  SettingsPanel,
  TimerControls,
  TimerDisplay,
} from './components';
import {sharedStyles} from './constants';
import {useIntervalTimer} from './hooks/use-interval-timer';
import {useKeyboardShortcuts} from './hooks/use-keyboard-shortcuts';
import {useTheme} from './hooks/use-theme';
import {formatTime} from './utils/format-time';

export default function App() {
  const {isDark, toggleTheme} = useTheme();

  const {
    steps,
    currentStepIndex,
    soundMode,
    volume,
    language,
    status,
    timeLeft,
    currentDuration,
    isDragging,
    setSoundMode,
    setVolume,
    setLanguage,
    togglePlay,
    handleReset,
    updateStep,
    addSegment,
    removeSegment,
    copySegment,
    handleTestSound,
    handleSeekStart,
    handleSeek,
    handleSeekEnd,
    handleAdjustTime,
  } = useIntervalTimer();

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
      <Header isDark={isDark} onToggleTheme={toggleTheme} />

      <main className="w-full max-w-sm flex flex-col items-center my-auto py-4">
        <TimerDisplay
          currentDuration={currentDuration}
          isDark={isDark}
          isDragging={isDragging}
          onAdjustTime={handleAdjustTime}
          onSeek={handleSeek}
          onSeekEnd={handleSeekEnd}
          onSeekStart={handleSeekStart}
          timeLeft={timeLeft}
        />

        <TimerControls
          isDark={isDark}
          onReset={handleReset}
          onTogglePlay={togglePlay}
          status={status}
        />

        <div
          className={`w-full mt-10 space-y-5 border-t pt-6 ${sharedStyles.sectionDivider(isDark)}`}
        >
          <SegmentList
            currentStepIndex={currentStepIndex}
            isDark={isDark}
            onAddSegment={addSegment}
            onCopySegment={copySegment}
            onRemoveSegment={removeSegment}
            onUpdateStep={updateStep}
            status={status}
            steps={steps}
          />

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

      <KeyboardHints isDark={isDark} />
    </div>
  );
}
