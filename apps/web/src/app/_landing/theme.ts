/* HangUp landing — day-and-night MODE behaviour & content.
 *
 * Colours, gradients and shadows live entirely in `hangup-design-system.css`
 * (the `--m-*` tokens, resolved from `data-mode`). This module holds only the
 * things CSS can't express: which mode the current local time falls into,
 * where the sun/moon sits in its arc, and the per-mode copy/atmosphere config.
 */

export type Mode = "dawn" | "day" | "dusk" | "night";

export interface ModeConfig {
  /** Atmosphere drawn behind the celestial body. */
  atmo: "clouds" | "stars" | "starsDim";
  /** Deterministic seed so the starfield renders identically on server+client. */
  seed: number;
  /** Uppercase eyebrow above the hero headline. */
  eyebrow: string;
  /** Label on the product-card "Auto" badge. */
  badge: string;
  /** Which Google-compliant button treatment this mode calls for. */
  googleTheme: "light" | "dark";
}

/** One self-contained config per position of the sun/moon in the sky. */
export const MODES: Record<Mode, ModeConfig> = {
  dawn: {
    atmo: "clouds",
    seed: 19,
    eyebrow: "For the calls that ran clear through the night",
    badge: "Early hours",
    googleTheme: "light",
  },
  day: {
    atmo: "clouds",
    seed: 19,
    eyebrow: "For the calls that eat into your afternoon",
    badge: "On a timer",
    googleTheme: "light",
  },
  dusk: {
    atmo: "starsDim",
    seed: 7,
    eyebrow: "For the calls that slip past sunset",
    badge: "Winding down",
    googleTheme: "dark",
  },
  night: {
    atmo: "stars",
    seed: 19,
    eyebrow: "For the calls that drift past midnight",
    badge: "After hours",
    googleTheme: "dark",
  },
};

/**
 * Minutes-since-midnight (server-stable) used until the client reports local
 * time. 1290 = 9:30 PM → night, the brand's home look.
 */
export const DEFAULT_MINUTES = 1290;

/** Map a minutes-since-midnight value to its mode. */
export function phaseFromMinutes(m: number): Mode {
  if (m >= 300 && m < 480) return "dawn";
  if (m >= 480 && m < 1020) return "day";
  if (m >= 1020 && m < 1200) return "dusk";
  return "night";
}

export interface BodyPosition {
  type: "sun" | "moon";
  /** Horizontal position, percentage across the sky. */
  x: number;
  /** Vertical offset in px from the top of the sky band. */
  top: number;
}

/**
 * Position the sun (05:00–20:00) or moon (20:00–05:00) along a gentle arc.
 * Ported from the design's `bodyPos`.
 */
export function bodyPos(m: number): BodyPosition {
  const isSun = m >= 300 && m < 1200;
  const nm = m < 300 ? m + 1440 : m;
  const p = isSun ? (m - 300) / 900 : (nm - 1200) / 540;
  const type: BodyPosition["type"] = isSun ? "sun" : "moon";
  const x = 6 + p * 78;
  const hf = Math.sin(p * Math.PI);
  const top = 300 - hf * 340;
  return { type, x, top };
}

/** Format minutes-since-midnight as a 12-hour clock, e.g. `11:15 PM`. */
export function fmt(m: number): string {
  const mins = ((Math.round(m) % 1440) + 1440) % 1440;
  const h24 = Math.floor(mins / 60);
  const mm = Math.floor(mins % 60);
  const ap = h24 < 12 ? "AM" : "PM";
  const h12 = ((h24 + 11) % 12) + 1;
  return `${h12}:${String(mm).padStart(2, "0")} ${ap}`;
}

export interface Star {
  left: number;
  top: number;
  size: number;
  opacity: number;
  glow: boolean;
  twinkle: number | null;
}

/**
 * Deterministic starfield (seeded LCG) — identical output on server and client,
 * so it never triggers a hydration mismatch. Ported from the design's `starfield`.
 */
export function starfield(count: number, seed: number, bright: number): Star[] {
  let s = seed;
  const rnd = () => {
    // Deterministic LCG — bitwise mask is intentional (matches the design).
    // eslint-disable-next-line no-bitwise
    s = (s * 1103515245 + 12345) & 0x7fffffff;

    return s / 0x7fffffff;
  };
  const stars: Star[] = [];
  for (let i = 0; i < count; i += 1) {
    const left = rnd() * 100;
    const top = rnd() * 72;
    const r = rnd();
    const standout = r > 0.86;
    const size = standout ? 2.6 + rnd() * 1.8 : 0.9 + rnd() * 1.7;
    const opacity =
      (standout ? 0.85 + rnd() * 0.15 : 0.4 + rnd() * 0.5) * bright;
    const glow = size > 1.8 && bright > 0.8;
    const twinkle =
      standout && bright > 0.8 ? Number((4 + rnd() * 4).toFixed(1)) : null;
    stars.push({ left, top, size, opacity, glow, twinkle });
  }
  return stars;
}

export interface Cloud {
  left: number;
  top: number;
  scale: number;
  dur: number;
  delay: number;
}

/** Fixed cloud layout for the light (dawn/day) modes. */
export const CLOUDS: Cloud[] = [
  { left: 8, top: 150, scale: 1.05, dur: 26, delay: 0 },
  { left: 30, top: 250, scale: 0.7, dur: 32, delay: 3 },
  { left: 60, top: 120, scale: 0.85, dur: 30, delay: 1.5 },
  { left: 78, top: 300, scale: 0.6, dur: 36, delay: 2 },
];
