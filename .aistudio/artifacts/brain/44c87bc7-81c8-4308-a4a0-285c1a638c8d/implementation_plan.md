# Implementation Plan - Remove Cadence Option & Set Default Cadence

## User Request
Remove the cadence option and just use a single default cadence.
Default cadence rule: Announce every second at 60 seconds and below, and every minute above 60 seconds.

## Proposed Changes

### 1. Types (`src/types/index.ts`)
- Remove `VoiceCadence` type export.

### 2. Constants (`src/constants/index.ts`)
- Remove `DEFAULT_VOICE_CADENCE`.

### 3. Voice Announcement Logic (`src/hooks/useIntervalTimer.ts`)
- Remove `voiceCadence` state and `setVoiceCadence`.
- Update announcement condition in `requestAnimationFrame` loop when `soundMode === 'voice'`:
  - If `currentWholeSecond <= 60`: announce every second (`shouldSpeak = true`).
  - If `currentWholeSecond > 60`: announce only when `currentWholeSecond % 60 === 0` (every minute).

### 4. Settings Panel (`src/components/SettingsPanel.tsx`)
- Remove `VoiceCadence` props and the Cadence select dropdown section.

### 5. Main App (`src/App.tsx`)
- Remove `voiceCadence` and `setVoiceCadence` destructuring and `SettingsPanel` props.

## Verification Plan
- Compile applet with `compile_applet`.
- Verify linting and build success.
