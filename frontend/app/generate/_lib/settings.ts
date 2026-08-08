import type { CSSProperties } from "react";

/** Mirrors DEFAULT_SETTINGS in backend/email_service.py — the backend validates
 *  every value it stores, so both ends have to agree on the allowed options. */
export type Settings = {
  language: "en";
  fontFamily: "system" | "lato" | "roboto" | "georgia";
  fontSize: "browser" | "small" | "medium" | "large";
  appearance: "light" | "dark";
  themeColor: string;
  leftPanelColor: string;
  notifications: {
    enabled: boolean;
    sound: (typeof SOUNDS)[number]["id"];
    volume: number;
    silent: boolean;
    silentFrom: string;
    silentTo: string;
  };
  /** Learned from the mail you send, used to fill in generated drafts. */
  profile: { name: string };
  /** Recipient address -> their name. */
  contacts: Record<string, string>;
};

export const DEFAULT_SETTINGS: Settings = {
  language: "en",
  fontFamily: "system",
  fontSize: "browser",
  appearance: "light",
  themeColor: "#1a73c7",
  leftPanelColor: "#f7f9fb",
  notifications: {
    enabled: true,
    sound: "chime",
    volume: 0.6,
    silent: false,
    silentFrom: "22:00",
    silentTo: "07:00",
  },
  profile: { name: "" },
  contacts: {},
};

export const LANGUAGES = [{ id: "en", label: "English" }] as const;

export const FONT_FAMILIES = [
  { id: "system", label: "System UI", stack: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
  { id: "lato", label: "Lato", stack: 'var(--font-lato), "Lato", sans-serif' },
  { id: "roboto", label: "Roboto", stack: 'var(--font-roboto), "Roboto", sans-serif' },
  { id: "georgia", label: "Georgia", stack: 'Georgia, "Times New Roman", serif' },
] as const;

export const FONT_SIZES = [
  { id: "browser", label: "Browser", scale: 1 },
  { id: "small", label: "Small", scale: 0.9 },
  { id: "medium", label: "Medium", scale: 1.1 },
  { id: "large", label: "Large", scale: 1.25 },
] as const;

export const THEME_COLORS = [
  "#1a73c7",
  "#0b8043",
  "#8430ce",
  "#c5221f",
  "#e37400",
  "#16283d",
];

export const PANEL_COLORS = [
  "#f7f9fb",
  "#eef2f7",
  "#f3f1ea",
  "#eef5ef",
  "#f6eef7",
  "#e8eaf0",
];

export const SOUNDS = [
  { id: "chime", label: "Chime" },
  { id: "ding", label: "Ding" },
  { id: "pop", label: "Pop" },
  { id: "bell", label: "Bell" },
  { id: "tritone", label: "Tri-tone" },
  { id: "marimba", label: "Marimba" },
  { id: "bloop", label: "Bloop" },
  { id: "knock", label: "Knock" },
  { id: "pulse", label: "Pulse" },
  { id: "none", label: "Silent" },
] as const;

/** CSS the whole mail UI inherits: font, scale and the themeable colour vars. */
export function settingsStyle(settings: Settings): CSSProperties {
  const family =
    FONT_FAMILIES.find((f) => f.id === settings.fontFamily) ?? FONT_FAMILIES[0];
  const size = FONT_SIZES.find((s) => s.id === settings.fontSize) ?? FONT_SIZES[0];

  // the swatches are light tints; in dark mode they tint the dark base instead
  // of replacing it, so the pane stays readable either way
  const dark = settings.appearance === "dark";
  const panel = (base: string) =>
    dark
      ? `color-mix(in srgb, ${settings.leftPanelColor} 12%, ${base})`
      : settings.leftPanelColor;

  return {
    fontFamily: family.stack,
    // ponytail: zoom scales the whole pane, not only glyphs — swap for a rem
    // type scale if the chrome ever needs to stay put while text grows
    zoom: size.scale,
    "--mail-accent": settings.themeColor,
    "--mail-accent-strong": settings.themeColor,
    "--mail-accent-tint": `color-mix(in srgb, ${settings.themeColor} 12%, transparent)`,
    "--mail-rail": panel("#10192a"),
    "--mail-pane": panel("#131d2f"),
    // top bar carries white text, so it takes a darkened shade of the accent
    "--mail-topbar": `color-mix(in srgb, ${settings.themeColor} ${
      dark ? "45%" : "65%"
    }, #0d1926)`,
  } as CSSProperties;
}

function minutesOfDay(time: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** True while "silent hours" are running. The window may wrap past midnight. */
export function inSilentHours(
  notifications: Settings["notifications"],
  now: Date = new Date(),
): boolean {
  if (!notifications.silent) return false;

  const from = minutesOfDay(notifications.silentFrom);
  const to = minutesOfDay(notifications.silentTo);
  if (from === null || to === null) return false;
  if (from === to) return true; // silent all day

  const current = now.getHours() * 60 + now.getMinutes();
  return from < to
    ? current >= from && current < to
    : current >= from || current < to;
}

// Synthesised so no audio files ship with the app: each sound is a short
// sequence of notes — frequency, waveform, start offset and how long it rings.
type Tone = {
  freq: number;
  type: OscillatorType;
  at: number;
  dur: number;
};

const TONES: Record<string, Tone[]> = {
  chime: [
    { freq: 880, type: "sine", at: 0, dur: 0.35 },
    { freq: 1318.51, type: "sine", at: 0.14, dur: 0.35 },
  ],
  ding: [{ freq: 1046.5, type: "sine", at: 0, dur: 0.4 }],
  pop: [{ freq: 523.25, type: "triangle", at: 0, dur: 0.16 }],
  bell: [
    { freq: 1567.98, type: "sine", at: 0, dur: 0.9 },
    { freq: 2349.32, type: "sine", at: 0, dur: 0.5 },
  ],
  tritone: [
    { freq: 659.25, type: "sine", at: 0, dur: 0.2 },
    { freq: 830.61, type: "sine", at: 0.11, dur: 0.2 },
    { freq: 987.77, type: "sine", at: 0.22, dur: 0.32 },
  ],
  marimba: [
    { freq: 783.99, type: "triangle", at: 0, dur: 0.24 },
    { freq: 1174.66, type: "triangle", at: 0.12, dur: 0.3 },
  ],
  bloop: [
    { freq: 392, type: "sine", at: 0, dur: 0.14 },
    { freq: 587.33, type: "sine", at: 0.09, dur: 0.22 },
  ],
  knock: [
    { freq: 180, type: "square", at: 0, dur: 0.09 },
    { freq: 140, type: "square", at: 0.16, dur: 0.11 },
  ],
  pulse: [
    { freq: 440, type: "sine", at: 0, dur: 0.12 },
    { freq: 440, type: "sine", at: 0.2, dur: 0.12 },
  ],
};

/** Plays the configured alert. `force` is the settings page's Test button,
 *  which should be audible even during silent hours. */
export function playNotificationSound(settings: Settings, force = false) {
  const { enabled, sound, volume } = settings.notifications;
  if (sound === "none") return;
  if (!force && (!enabled || inSilentHours(settings.notifications))) return;

  const AudioCtx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return;

  const tones = TONES[sound];
  if (!tones) return;

  const ctx = new AudioCtx();
  // browsers hand back a suspended context until the page has been interacted
  // with; resuming is what makes the alert audible on a backgrounded tab
  void ctx.resume();

  const level = Math.min(1, Math.max(0.0001, volume));
  const end = Math.max(...tones.map((tone) => tone.at + tone.dur));

  tones.forEach((tone) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime + tone.at;

    osc.type = tone.type;
    osc.frequency.value = tone.freq;

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(level, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.dur);

    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + tone.dur + 0.05);
  });

  window.setTimeout(() => void ctx.close(), (end + 0.5) * 1000);
}
