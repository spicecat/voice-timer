/**
 * Centralized design tokens and reusable Tailwind class formulas.
 * Avoids duplicating dark/light conditional strings across components.
 */
export const sharedStyles = {
  /** Numerical input styles with focus rings and tabular numbers */
  numberInput: (isDark: boolean) =>
    `text-center border rounded py-0.5 focus:outline-none font-mono-numbers ${
      isDark
        ? 'bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-zinc-600'
        : 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-zinc-500'
    }`,

  /** Form select dropdown styles */
  selectInput: (isDark: boolean) =>
    `text-xs border rounded px-2 py-1 focus:outline-none cursor-pointer ${
      isDark
        ? 'bg-zinc-900 border-zinc-800 text-zinc-200 focus:border-zinc-600'
        : 'bg-white border-zinc-300 text-zinc-800 focus:border-zinc-500'
    }`,

  /** Dividing line between panel sections */
  sectionDivider: (isDark: boolean) => (isDark ? 'border-zinc-900' : 'border-zinc-200'),

  /** Secondary / muted text label */
  textMuted: (isDark: boolean) => (isDark ? 'text-zinc-400' : 'text-zinc-600'),

  /** Very subtle text (loop counts, kbd footer) */
  textSubtle: (isDark: boolean) => (isDark ? 'text-zinc-500' : 'text-zinc-400'),
} as const;
