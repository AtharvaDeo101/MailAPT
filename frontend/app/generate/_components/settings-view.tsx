"use client";

import React from "react";
import { Bell, Check, Palette, Settings as SettingsIcon, Type, Volume2 } from "lucide-react";

import {
  FONT_FAMILIES,
  FONT_SIZES,
  LANGUAGES,
  PANEL_COLORS,
  SOUNDS,
  THEME_COLORS,
  inSilentHours,
  playNotificationSound,
  type Settings,
} from "../_lib/settings";

const ACCENT = "var(--mail-accent)";

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5 rounded-md border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 h-10">
        <span style={{ color: ACCENT }}>{icon}</span>
        <h2 className="text-[13px] font-semibold">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 py-2.5 border-b border-border last:border-0">
      <div className="min-w-[150px] flex-1">
        <p className="text-[13px] font-medium">{label}</p>
        {hint && (
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">{hint}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}

function Select<T extends string>({
  value,
  options,
  onChange,
  style,
}: {
  value: T;
  options: readonly { id: T; label: string }[];
  onChange: (next: T) => void;
  style?: React.CSSProperties;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="h-8 min-w-[150px] rounded-md border border-border bg-card px-2 text-[12.5px] outline-none focus:border-[var(--mail-accent)]"
      style={style}
    >
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function Swatches({
  colors,
  value,
  onChange,
  label,
}: {
  colors: string[];
  value: string;
  onChange: (next: string) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5" role="radiogroup" aria-label={label}>
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={value.toLowerCase() === color.toLowerCase()}
          aria-label={color}
          title={color}
          onClick={() => onChange(color)}
          className="hover-pop flex h-6 w-6 items-center justify-center rounded-full border"
          style={{
            background: color,
            borderColor:
              value.toLowerCase() === color.toLowerCase()
                ? "var(--foreground)"
                : "var(--border)",
          }}
        >
          {value.toLowerCase() === color.toLowerCase() && (
            <Check className="h-3 w-3" style={{ color: "#fff" }} />
          )}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="hover-lift relative h-5 w-9 shrink-0 rounded-full transition-colors"
      style={{ background: checked ? ACCENT : "var(--border)" }}
    >
      <span
        className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-[left] duration-150"
        style={{ left: checked ? 18 : 2, boxShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
      />
    </button>
  );
}

export function SettingsView({
  settings,
  accountEmail,
  onChange,
  isSaving,
}: {
  settings: Settings;
  accountEmail: string | null;
  onChange: (patch: Partial<Settings>) => void;
  isSaving: boolean;
}) {
  const { notifications } = settings;
  const patchNotifications = (
    patch: Partial<Settings["notifications"]>,
  ) => onChange({ notifications: { ...notifications, ...patch } });

  return (
    <div className="h-full w-full overflow-y-auto bg-background">
      <div className="flex h-11 shrink-0 items-center gap-2.5 border-b border-border bg-card px-4">
        <SettingsIcon className="h-4 w-4" style={{ color: ACCENT }} />
        <h1 className="text-[14px] font-semibold tracking-tight">Settings</h1>
        <span className="ml-auto text-[11.5px] text-muted-foreground">
          {isSaving ? "Saving…" : "Saved"}
        </span>
      </div>

      <div className="mx-auto max-w-3xl p-4">
        <p className="mb-4 text-[13px] text-muted-foreground">
          Hi, <span className="font-semibold text-foreground">
            {accountEmail ?? "there"}
          </span>
        </p>

        <Section icon={<Type className="h-4 w-4" />} title="Display">
          <Row label="Display language" hint="Interface language">
            <Select
              value={settings.language}
              options={LANGUAGES}
              onChange={(language) => onChange({ language })}
            />
          </Row>

          <Row label="Font family" hint="Used across the mail interface">
            <Select
              value={settings.fontFamily}
              options={FONT_FAMILIES}
              onChange={(fontFamily) => onChange({ fontFamily })}
              style={{
                fontFamily: FONT_FAMILIES.find(
                  (f) => f.id === settings.fontFamily,
                )?.stack,
              }}
            />
          </Row>

          <Row label="Font size" hint="Browser keeps the default size">
            <Select
              value={settings.fontSize}
              options={FONT_SIZES}
              onChange={(fontSize) => onChange({ fontSize })}
            />
          </Row>
        </Section>

        <Section icon={<Palette className="h-4 w-4" />} title="Theme">
          <Row label="Appearance" hint="Light or dark interface">
            <Select
              value={settings.appearance}
              options={[
                { id: "light" as const, label: "Light" },
                { id: "dark" as const, label: "Dark" },
              ]}
              onChange={(appearance) => onChange({ appearance })}
            />
          </Row>

          <Row label="Theme color" hint="Accent used for highlights and buttons">
            <Swatches
              label="Theme color"
              colors={THEME_COLORS}
              value={settings.themeColor}
              onChange={(themeColor) => onChange({ themeColor })}
            />
          </Row>

          <Row label="Left panel" hint="Background of the rail and folder pane">
            <Swatches
              label="Left panel color"
              colors={PANEL_COLORS}
              value={settings.leftPanelColor}
              onChange={(leftPanelColor) => onChange({ leftPanelColor })}
            />
          </Row>
        </Section>

        <Section icon={<Bell className="h-4 w-4" />} title="Notifications">
          <Row
            label="New email alert"
            hint="Play a sound when a new message arrives"
          >
            <Toggle
              label="New email alert"
              checked={notifications.enabled}
              onChange={(enabled) => patchNotifications({ enabled })}
            />
          </Row>

          <Row label="Notification sound">
            <Select
              value={notifications.sound}
              options={SOUNDS}
              onChange={(sound) => patchNotifications({ sound })}
            />
            <button
              type="button"
              onClick={() => playNotificationSound(settings, true)}
              className="hover-press inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-[12px] font-medium"
            >
              <Volume2 className="h-3.5 w-3.5" />
              Test
            </button>
          </Row>

          <Row label="Volume">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={notifications.volume}
              onChange={(e) =>
                patchNotifications({ volume: Number(e.target.value) })
              }
              aria-label="Notification volume"
              className="w-40 accent-[var(--mail-accent)]"
            />
            <span className="w-10 text-right text-[12px] tabular-nums text-muted-foreground">
              {Math.round(notifications.volume * 100)}%
            </span>
          </Row>

          <Row
            label="Silent hours"
            hint={
              notifications.silent && inSilentHours(notifications)
                ? "Silent right now — alerts are muted"
                : "Mute alerts between the times below"
            }
          >
            <Toggle
              label="Silent hours"
              checked={notifications.silent}
              onChange={(silent) => patchNotifications({ silent })}
            />
          </Row>

          {notifications.silent && (
            <Row label="Silent from / to">
              <input
                type="time"
                value={notifications.silentFrom}
                onChange={(e) =>
                  patchNotifications({ silentFrom: e.target.value })
                }
                aria-label="Silent hours start"
                className="h-8 rounded-md border border-border bg-card px-2 text-[12.5px] outline-none focus:border-[var(--mail-accent)]"
              />
              <span className="text-[12px] text-muted-foreground">to</span>
              <input
                type="time"
                value={notifications.silentTo}
                onChange={(e) =>
                  patchNotifications({ silentTo: e.target.value })
                }
                aria-label="Silent hours end"
                className="h-8 rounded-md border border-border bg-card px-2 text-[12.5px] outline-none focus:border-[var(--mail-accent)]"
              />
            </Row>
          )}
        </Section>
      </div>
    </div>
  );
}
