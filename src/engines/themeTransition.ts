export type AtelierTheme = 'obsidian' | 'paper';

type DocWithViewTransition = Document & {
  startViewTransition?: (cb: () => void) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

export function applyAtelierThemeWithTransition(
  nextTheme: AtelierTheme,
  originX?: number,
  originY?: number,
  onCommit?: (theme: AtelierTheme) => void
): void {
  const commit = () => {
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      localStorage.setItem('atelier_theme', nextTheme);
    } catch {
      // Ignore storage blocks
    }
    onCommit?.(nextTheme);
  };

  const doc = document as DocWithViewTransition;
  if (
    typeof window === 'undefined' ||
    !doc.startViewTransition ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    commit();
    return;
  }

  const x = originX ?? window.innerWidth - 120;
  const y = originY ?? 28;
  const maxRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  const transition = doc.startViewTransition(() => {
    commit();
  });

  transition.ready
    .then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${Math.ceil(maxRadius)}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 580,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    })
    .catch(() => {
      // Fallback already committed
    });
}
