/**
 * HYPERION ATELIER v4.0 — Pure Kinetic Math Helpers
 * Gaussian dock proximity magnification, Odometer metric formatting, and 3D card tilt optics.
 */

export function computeGaussianDockScale(
  distancePx: number,
  maxScale = 1.38,
  sigma = 68
): number {
  if (!Number.isFinite(distancePx)) return 1;
  const safeSigma = Math.max(1, sigma);
  const weight = Math.exp(-(distancePx * distancePx) / (2 * safeSigma * safeSigma));
  return 1 + (maxScale - 1) * weight;
}

export function computeGaussianDockLift(
  scale: number,
  maxScale = 1.38,
  maxLiftPx = 8
): number {
  if (maxScale <= 1) return 0;
  const normalized = Math.min(1, Math.max(0, (scale - 1) / (maxScale - 1)));
  return normalized * maxLiftPx;
}

export interface ParsedOdometerMetric {
  prefix: string;
  numeric: number;
  decimals: number;
  suffix: string;
  raw: string;
}

export function parseOdometerMetric(raw: string): ParsedOdometerMetric {
  const match = raw.trim().match(/^([^0-9.-]*)(-?\d+(?:\.\d+)?)(.*)$/);
  if (!match) {
    return { prefix: '', numeric: 0, decimals: 0, suffix: raw, raw };
  }
  const [, prefix, numPart, suffix] = match;
  const dotIdx = numPart.indexOf('.');
  const decimals = dotIdx >= 0 ? numPart.length - dotIdx - 1 : 0;
  return {
    prefix,
    numeric: Number.parseFloat(numPart),
    decimals,
    suffix,
    raw,
  };
}

export function easeOutQuint(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - clamped, 5);
}

export function formatOdometerValue(parsed: ParsedOdometerMetric, progress01: number): string {
  const clamped = Math.min(1, Math.max(0, progress01));
  if (clamped >= 1) {
    return `${parsed.prefix}${parsed.numeric.toFixed(parsed.decimals)}${parsed.suffix}`;
  }

  const eased = easeOutQuint(clamped);
  // For zero-error metrics like "0.00%", smoothly settle downward from 1.25% -> 0.00%
  const current =
    parsed.numeric === 0 && parsed.decimals > 0
      ? (1 - eased) * 1.25
      : parsed.numeric * eased;

  return `${parsed.prefix}${current.toFixed(parsed.decimals)}${parsed.suffix}`;
}

export interface CardTiltSample {
  rotateX: number;
  rotateY: number;
  sheenAngle: number;
}

export function computeCardTilt(
  relX01: number,
  relY01: number,
  maxDeg = 4.5
): CardTiltSample {
  const cx = Math.min(1, Math.max(0, relX01)) - 0.5;
  const cy = Math.min(1, Math.max(0, relY01)) - 0.5;
  const rotateY = cx * 2 * maxDeg;
  const rotateX = -cy * 2 * maxDeg;
  const sheenAngle = Math.round(((Math.atan2(cy, cx) * 180) / Math.PI + 360) % 360);
  return { rotateX, rotateY, sheenAngle };
}
