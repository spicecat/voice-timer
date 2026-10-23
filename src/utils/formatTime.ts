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

/**
 * Formats seconds into human readable duration e.g. "4m 15s" or "1h 20m"
 */
export function formatDurationHuman(totalSeconds: number): string {
  const safe = Math.round(totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}
