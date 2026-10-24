/**
 * Formats a duration in seconds into MM:SS.d (or HH:MM:SS.d if >= 1 hour).
 */
export function formatTime(totalSeconds: number, showTenths = true): string {
  const safeTime = Math.max(0, totalSeconds);
  const roundedTenths = Math.round(safeTime * 10);
  const wholeSeconds = Math.floor(roundedTenths / 10);
  const tenths = roundedTenths % 10;

  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const seconds = wholeSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  const tenthsStr = showTenths ? `.${tenths}` : '';

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}${tenthsStr}`;
  }
  return `${pad(minutes)}:${pad(seconds)}${tenthsStr}`;
}
