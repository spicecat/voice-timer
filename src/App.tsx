/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Header,
  KeyboardHints,
  SegmentList,
  SettingsPanel,
  ShortcutsModal,
  TimerControls,
  TimerDisplay,
} from './components';
import {sharedStyles} from './constants';
import {I18nProvider} from './contexts/i18n-context';
import {useKeyboardShortcuts} from './hooks/use-keyboard-shortcuts';
import {useSegmentTimer} from './hooks/use-segment-timer';
import {useTheme} from './hooks/use-theme';
import {useWakeLock} from './hooks/use-wake-lock';
import {translate} from './locales';
import {formatTime} from './utils/format-time';
import {getTimerDurationSeconds} from './utils/time-calculations';

export default function App() {
  const {isDark, toggleTheme} = useTheme();
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const {
    segments,
    currentSegmentIndex,
    soundMode,
    volume,
    language,
    status,
    timeLeft,
    currentDuration,
    isDragging,
    adjustTime,
    adjustVolume,
    cycleSoundMode,
    goToNextSegment,
    goToPreviousSegment,
    goToSegment,
    setSoundMode,
    setVolume,
    setLanguage,
    togglePlay,
    toggleMute,
    reset,
    updateSegment,
    addSegment,
    removeSegment,
    copySegment,
    moveSegment,
    testSound,
    startSeek,
    seek,
    endSeek,
  } = useSegmentTimer();

  const {
    isActive: wakeLockActive,
    isSupported: wakeLockSupported,
    wakeLockEnabled,
    setWakeLockEnabled,
  } = useWakeLock(status === 'running');

  const handleToggleHelp = useCallback(
    () => setIsHelpOpen((prev) => !prev),
    [],
  );
  const handleOpenHelp = useCallback(() => setIsHelpOpen(true), []);
  const handleCloseHelp = useCallback(() => setIsHelpOpen(false), []);

  // Update tab title only when whole-second string actually changes (avoids 60Hz redundant hook executions)
  const formattedSeconds = formatTime(timeLeft, false);

  useEffect(() => {
    let title: string;

    if (status === 'running') {
      title = translate(language, 'appTitle.running', {
        formatted: formattedSeconds,
      });
    } else if (status === 'paused') {
      title = translate(language, 'appTitle.paused', {
        formatted: formattedSeconds,
      });
    } else if (status === 'completed') {
      title = translate(language, 'appTitle.completed');
    } else {
      title = translate(language, 'appTitle.idle');
    }

    if (document.title !== title) {
      document.title = title;
    }
  }, [formattedSeconds, status, language]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useKeyboardShortcuts({
    onAdjustTime: adjustTime,
    onAdjustVolume: adjustVolume,
    onCycleSoundMode: cycleSoundMode,
    onGoToSegment: goToSegment,
    onNextSegment: goToNextSegment,
    onPrevSegment: goToPreviousSegment,
    onReset: reset,
    onToggleFullscreen: toggleFullscreen,
    onToggleHelp: handleToggleHelp,
    onToggleMute: toggleMute,
    onTogglePlay: togglePlay,
    onToggleTheme: toggleTheme,
  });

  const totalDuration = useMemo(
    () =>
      segments.reduce(
        (sum, segment) => sum + getTimerDurationSeconds(segment),
        0,
      ),
    [segments],
  );

  const elapsedBeforeCurrent = useMemo(
    () =>
      segments
        .slice(0, currentSegmentIndex)
        .reduce((sum, segment) => sum + getTimerDurationSeconds(segment), 0),
    [segments, currentSegmentIndex],
  );

  // Quantize elapsed duration to whole seconds so Header only re-renders when display changes (1Hz instead of 60Hz)
  const elapsedDuration = Math.floor(
    elapsedBeforeCurrent + (currentDuration - timeLeft),
  );

  return (
    <I18nProvider language={language}>
      <div
        className={`min-h-screen flex flex-col items-center justify-between p-6 select-none ${
          isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'
        }`}
      >
        <Header
          currentSegmentIndex={currentSegmentIndex}
          elapsedDuration={elapsedDuration}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          totalDuration={totalDuration}
          totalSegments={segments.length}
          wakeLockActive={wakeLockActive}
        />

        <main className="w-full max-w-sm flex flex-col items-center my-auto py-4">
          <TimerDisplay
            currentDuration={currentDuration}
            isDark={isDark}
            isDragging={isDragging}
            onAdjustTime={adjustTime}
            onSeek={seek}
            onSeekEnd={endSeek}
            onSeekStart={startSeek}
            timeLeft={timeLeft}
          />

          <TimerControls
            isDark={isDark}
            onReset={reset}
            onTogglePlay={togglePlay}
            status={status}
          />

          <div
            className={`w-full mt-10 space-y-5 border-t pt-6 ${sharedStyles.sectionDivider(isDark)}`}
          >
            <SegmentList
              currentSegmentIndex={currentSegmentIndex}
              isDark={isDark}
              onAddSegment={addSegment}
              onCopySegment={copySegment}
              onMoveSegment={moveSegment}
              onRemoveSegment={removeSegment}
              onUpdateSegment={updateSegment}
              segments={segments}
              status={status}
            />

            <SettingsPanel
              isDark={isDark}
              language={language}
              onLanguageChange={setLanguage}
              onSoundModeChange={setSoundMode}
              onTestSound={testSound}
              onVolumeChange={setVolume}
              onWakeLockChange={setWakeLockEnabled}
              soundMode={soundMode}
              volume={volume}
              wakeLockActive={wakeLockActive}
              wakeLockEnabled={wakeLockEnabled}
              wakeLockSupported={wakeLockSupported}
            />
          </div>
        </main>

        <KeyboardHints isDark={isDark} onOpenHelp={handleOpenHelp} />

        <ShortcutsModal
          isDark={isDark}
          isOpen={isHelpOpen}
          onClose={handleCloseHelp}
        />
      </div>
    </I18nProvider>
  );
}
