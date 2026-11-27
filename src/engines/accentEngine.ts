/**
 * HYPERION ATELIER v5.0 — Dynamic Accent Engine & Chrome EyeDropper API
 * Synchronizes CSS custom properties (--accent, --accent-soft, --glass-chroma-a),
 * WebGL2 SDF shader u_accent RGB vector, and Navier-Stokes fluid dye hue live across the site.
 */

export interface AccentSwatch {
  name: string;
  hex: string;
}

export const DEFAULT_ACCENT_OBSIDIAN = '#FF4D00';
export const DEFAULT_ACCENT_PAPER = '#C83700';

export const ACCENT_SWATCHES: AccentSwatch[] = [
  { name: 'Vermilion', hex: '#FF4D00' },
  { name: 'Cyan', hex: '#38BDF8' },
  { name: 'Violet', hex: '#A78BFA' },
  { name: 'Emerald', hex: '#22C55E' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Crimson', hex: '#F43F5E' },
];

export function normalizeHex(input: string): string {
  const cleaned = input.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    const expanded = cleaned
      .split('')
      .map((c) => c + c)
      .join('');
    return `#${expanded.toUpperCase()}`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return `#${cleaned.toUpperCase()}`;
  }
  return DEFAULT_ACCENT_OBSIDIAN;
}

export function hexToRgb255(hex: string): [number, number, number] {
  const norm = normalizeHex(hex).slice(1);
  const r = Number.parseInt(norm.slice(0, 2), 16);
  const g = Number.parseInt(norm.slice(2, 4), 16);
  const b = Number.parseInt(norm.slice(4, 6), 16);
  return [r, g, b];
}

export function hexToRgb01(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb255(hex);
  return [
    Number((r / 255).toFixed(4)),
    Number((g / 255).toFixed(4)),
    Number((b / 255).toFixed(4)),
  ];
}

export function hexToRgbaString(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb255(hex);
  const a = Math.min(1, Math.max(0, alpha));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function applyAccentToDocument(customHex: string | null): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement.style;

  if (!customHex) {
    root.removeProperty('--accent');
    root.removeProperty('--accent-soft');
    root.removeProperty('--glass-chroma-a');
    return;
  }

  const norm = normalizeHex(customHex);
  root.setProperty('--accent', norm);
  root.setProperty('--accent-soft', hexToRgbaString(norm, 0.14));
  root.setProperty('--glass-chroma-a', hexToRgbaString(norm, 0.24));
}

interface EyeDropperResult {
  sRGBHex: string;
}

interface EyeDropperCtor {
  new (): { open: () => Promise<EyeDropperResult> };
}

export function isEyeDropperSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper === 'function'
  );
}

export async function pickColorWithEyeDropper(): Promise<string | null> {
  if (!isEyeDropperSupported()) return null;
  try {
    const Ctor = (window as unknown as { EyeDropper: EyeDropperCtor }).EyeDropper;
    const dropper = new Ctor();
    const result = await dropper.open();
    return result?.sRGBHex ? normalizeHex(result.sRGBHex) : null;
  } catch {
    // User cancelled or blocked
    return null;
  }
}
