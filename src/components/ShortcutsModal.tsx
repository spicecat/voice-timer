import {X} from 'lucide-react';
import {memo, useEffect, useMemo, useRef} from 'react';
import {useTranslation} from '../hooks/use-translation';
import {Kbd} from './Kbd';

export interface ShortcutsModalProps {
  isDark: boolean;
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  description: string;
  keys: string[];
}

interface ShortcutCategory {
  category: string;
  items: ShortcutItem[];
}

export const ShortcutsModal = memo(function ShortcutsModal({
  isOpen,
  onClose,
  isDark,
}: ShortcutsModalProps) {
  const {t} = useTranslation();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  const shortcutCategories: ShortcutCategory[] = useMemo(
    () => [
      {
        category: t('shortcuts.categories.timerPlayback'),
        items: [
          {description: t('shortcuts.items.playPause'), keys: ['Space']},
          {description: t('shortcuts.items.resetTimer'), keys: ['R']},
          {description: t('shortcuts.items.seek'), keys: ['←', '→']},
          {
            description: t('shortcuts.items.largeSeek'),
            keys: ['Shift', '← / →'],
          },
        ],
      },
      {
        category: t('shortcuts.categories.segmentsNavigation'),
        items: [
          {description: t('shortcuts.items.nextSegment'), keys: ['N']},
          {description: t('shortcuts.items.prevSegment'), keys: ['P']},
          {
            description: t('shortcuts.items.jumpToSegment'),
            keys: ['1', '–', '9'],
          },
          {description: t('shortcuts.items.restartSegment'), keys: ['0']},
        ],
      },
      {
        category: t('shortcuts.categories.audioControls'),
        items: [
          {description: t('shortcuts.items.toggleMute'), keys: ['M']},
          {description: t('shortcuts.items.cycleSound'), keys: ['S']},
          {description: t('shortcuts.items.volumeUpDown'), keys: ['↑', '↓']},
          {
            description: t('shortcuts.items.fineVolume'),
            keys: ['Shift', '↑ / ↓'],
          },
        ],
      },
      {
        category: t('shortcuts.categories.displayInterface'),
        items: [
          {description: t('shortcuts.items.toggleFullscreen'), keys: ['F']},
          {description: t('shortcuts.items.toggleTheme'), keys: ['T']},
          {
            description: t('shortcuts.items.toggleCheatsheet'),
            keys: ['?'],
          },
          {description: t('shortcuts.items.closeCheatsheet'), keys: ['Esc']},
        ],
      },
    ],
    [t],
  );

  useEffect(() => {
    if (!isOpen) return;

    if (document.activeElement instanceof HTMLElement) {
      previouslyFocusedElementRef.current = document.activeElement;
    }

    const timer = setTimeout(() => {
      const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      firstFocusable?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedElementRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      aria-labelledby="shortcuts-modal-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      ref={dialogRef}
      role="dialog"
    >
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-default"
        onClick={onClose}
      />
      <div
        className={`relative z-10 w-full max-w-lg rounded-xl border p-5 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${
          isDark
            ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        <div
          className={`flex items-center justify-between pb-3 border-b ${
            isDark ? 'border-zinc-800' : 'border-zinc-200'
          }`}
        >
          <div>
            <h2 className="text-base font-semibold" id="shortcuts-modal-title">
              {t('shortcuts.title')}
            </h2>
          </div>
          <button
            aria-label={t('shortcuts.close')}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDark
                ? 'border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                : 'border-zinc-200 text-zinc-500 hover:text-black hover:bg-zinc-100'
            }`}
            onClick={onClose}
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto py-3 space-y-4 pr-1">
          {shortcutCategories.map((section) => (
            <div className="space-y-2" key={section.category}>
              <h3
                className={`text-[11px] font-medium uppercase tracking-wider ${
                  isDark ? 'text-zinc-500' : 'text-zinc-400'
                }`}
              >
                {section.category}
              </h3>
              <div
                className={`rounded-lg border divide-y ${
                  isDark
                    ? 'border-zinc-800/80 bg-zinc-950/50 divide-zinc-800/60'
                    : 'border-zinc-100 bg-zinc-50/70 divide-zinc-100'
                }`}
              >
                {section.items.map((item) => (
                  <div
                    className="flex items-center justify-between py-2 px-3 text-xs"
                    key={item.description}
                  >
                    <span
                      className={isDark ? 'text-zinc-300' : 'text-zinc-700'}
                    >
                      {item.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k) =>
                        k === '–' || k === '+' ? (
                          <span
                            className={`text-[11px] ${
                              isDark ? 'text-zinc-500' : 'text-zinc-400'
                            }`}
                            key={k}
                          >
                            {k}
                          </span>
                        ) : (
                          <Kbd isDark={isDark} key={k}>
                            {k}
                          </Kbd>
                        ),
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
