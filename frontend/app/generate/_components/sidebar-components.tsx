"use client";

import { useEffect, useState } from "react";
import {
  CalendarClock,
  ChevronRight,
  Inbox,
  MailOpen,
  Moon,
  PlusCircle,
  SendHorizonal,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";

import { ActiveSection } from "../_lib/types";

function SidebarNavItem({
  item,
  isActive,
  onClick,
}: {
  item: {
    label: string;
    icon: React.ReactNode;
    count?: number;
  };
  isActive: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  const handleItemClick = () => {
    setIsRotating(false);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsRotating(true);
        onClick();
      });
    });
  };

  useEffect(() => {
    if (!isRotating) return;

    const timer = setTimeout(() => setIsRotating(false), 1200);
    return () => clearTimeout(timer);
  }, [isRotating]);

  return (
    <button
      onClick={handleItemClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative flex w-auto items-center gap-3 px-5 py-4 my-1 mx-2 rounded-none text-left select-none overflow-hidden transition-all duration-300"
      style={{
        background: isActive
          ? "#121931"
          : hovered
            ? "color-mix(in oklab, #121931 14%, white)"
            : "transparent",
        boxShadow: hovered && !isActive
          ? "0 12px 28px color-mix(in srgb, #121931 16%, transparent)"
          : "none",
        transform: hovered ? "scale(1.02)" : "scale(1)",
        borderLeft: isActive
          ? "2px solid #ffffff"
          : hovered
            ? "2px solid color-mix(in oklab, #121931 72%, white)"
            : "2px solid transparent",
      }}
    >
      <span
        className="absolute inset-0 pointer-events-none"
        style={{
          background: !isActive && hovered
            ? "linear-gradient(90deg, color-mix(in oklab, #121931 18%, white) 0%, transparent 72%)"
            : "transparent",
          opacity: hovered ? 1 : 0,
          transition: "opacity 280ms ease",
        }}
      />

      <span
        className="relative z-10 shrink-0 transition-colors duration-200"
        style={{
          color: isActive
            ? "#ffffff"
            : hovered
              ? "#121931"
              : "var(--muted-foreground)",
        }}
      >
        {item.icon}
      </span>

      <div className="relative z-10 flex-1 min-w-0">
        <span className="block" style={{ perspective: "1200px" }}>
          <span
            className="block"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 500,
              fontSize: isActive || hovered ? "1.16rem" : "0.94rem",
              fontStyle: isActive || hovered ? "italic" : "normal",
              letterSpacing: isActive || hovered ? "-0.03em" : "-0.01em",
              color: isActive
                ? "#ffffff"
                : hovered
                  ? "#121931"
                  : "var(--muted-foreground)",
              lineHeight: 1.1,
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
              willChange: "transform",
              transform: isRotating ? "rotateY(360deg)" : "rotateY(0deg)",
              transition: isRotating
                ? "transform 1200ms cubic-bezier(0.16, 1, 0.3, 1)"
                : "color 300ms ease, font-size 300ms ease, letter-spacing 300ms ease",
            }}
          >
            {item.label}
          </span>
        </span>
      </div>

      {item.count !== undefined && item.count > 0 && (
        <span
          className="relative z-10 text-xs tabular-nums shrink-0 transition-colors duration-200"
          style={{
            color: isActive
              ? "rgba(255,255,255,0.88)"
              : hovered
                ? "#121931"
                : "var(--muted-foreground)",
          }}
        >
          {item.count}
        </span>
      )}

      {isActive && (
        <ChevronRight
          className="relative z-10 h-3.5 w-3.5 shrink-0"
          style={{ color: "#ffffff" }}
        />
      )}
    </button>
  );
}

function SidebarThemeDockButton() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = (theme === "system" ? resolvedTheme : theme) === "dark";

  return (
    <div className="absolute bottom-3 left-3 z-20">
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="Toggle theme"
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className="relative flex items-center justify-center rounded-full border border-border bg-card transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          width: hovered ? 56 : 40,
          height: hovered ? 56 : 40,
          boxShadow: hovered
            ? "0 16px 32px color-mix(in srgb, var(--foreground) 18%, transparent)"
            : "0 4px 10px color-mix(in srgb, var(--foreground) 8%, transparent)",
          transform: hovered
            ? "translateY(-2px) scale(1.08)"
            : "translateY(0) scale(1)",
        }}
      >
        <span
          className="absolute inset-0 rounded-full transition-all duration-300"
          style={{
            background: hovered
              ? "color-mix(in oklab, #121931 18%, white)"
              : "transparent",
          }}
        />
        <span
          className="relative z-10 transition-transform duration-300"
          style={{
            transform: hovered
              ? "scale(1.15) rotate(12deg)"
              : "scale(1) rotate(0deg)",
          }}
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-foreground" />
          ) : (
            <Moon className="h-4 w-4 text-foreground" />
          )}
        </span>
      </button>
    </div>
  );
}

export function LeftSidebar({
  activeSection,
  onSelect,
  inboxCount,
  sentCount,
  draftsCount,
  scheduledCount,
  onNewEmail,
}: {
  activeSection: ActiveSection;
  onSelect: (s: ActiveSection) => void;
  inboxCount: number;
  sentCount: number;
  draftsCount: number;
  scheduledCount: number;
  onNewEmail: () => void;
}) {
  const [newHovered, setNewHovered] = useState(false);

  const navItems = [
    {
      id: "inbox" as ActiveSection,
      label: "Inbox",
      icon: <Inbox className="h-4 w-4" />,
      count: inboxCount,
    },
    {
      id: "sent" as ActiveSection,
      label: "Sent",
      icon: <SendHorizonal className="h-4 w-4" />,
      count: sentCount,
    },
    {
      id: "drafts" as ActiveSection,
      label: "Drafts",
      icon: <MailOpen className="h-4 w-4" />,
      count: draftsCount,
    },
    {
      id: "scheduled" as ActiveSection,
      label: "Scheduled",
      icon: <CalendarClock className="h-4 w-4" />,
      count: scheduledCount,
    },
  ];

  return (
    <aside
      className="w-60 shrink-0 flex flex-col bg-card h-full z-10 relative border-r border-border rounded-none"
      aria-label="Email navigation"
      style={{
        boxShadow:
          "inset -1px 0 0 color-mix(in srgb, var(--border) 90%, transparent), 6px 0 18px color-mix(in srgb, var(--foreground) 6%, transparent)",
      }}
    >
      <div
        className="px-5 pt-5 pb-4 shrink-0 border-b border-border rounded-none"
        style={{
          background: "transparent",
          boxShadow:
            "0 1px 0 color-mix(in srgb, var(--border) 85%, transparent)",
        }}
      >
        <div className="mt-3">
          <button
            onClick={onNewEmail}
            onMouseEnter={() => setNewHovered(true)}
            onMouseLeave={() => setNewHovered(false)}
            className="relative flex w-full items-center justify-center gap-2 px-4 py-3 text-sm rounded-none overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              background: "var(--card)",
              color: newHovered ? "#ffffff" : "var(--foreground)",
              border: "1px solid var(--border)",
              boxShadow: newHovered
                ? "0 18px 36px color-mix(in srgb, black 22%, transparent)"
                : "0 4px 12px color-mix(in srgb, var(--foreground) 8%, transparent)",
              transform: newHovered
                ? "scale(1.04) translateY(-1px)"
                : "scale(1) translateY(0)",
              transition:
                "transform 500ms cubic-bezier(0.22,1,0.36,1), color 350ms ease, box-shadow 400ms ease, background-color 350ms ease",
            }}
          >
            <span
              className="absolute inset-0 z-0"
              style={{
                background: "black",
                transform: newHovered ? "scaleX(1)" : "scaleX(0.08)",
                transformOrigin: "left center",
                opacity: newHovered ? 1 : 0,
                transition:
                  "transform 550ms cubic-bezier(0.22,1,0.36,1), opacity 350ms ease",
              }}
            />

            <span
              className="absolute inset-0 z-0"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
                transform: newHovered
                  ? "translateX(0%) skewX(-18deg)"
                  : "translateX(-140%) skewX(-18deg)",
                transition: "transform 700ms cubic-bezier(0.22,1,0.36,1)",
                mixBlendMode: "screen",
                opacity: newHovered ? 1 : 0,
              }}
            />

            <span
              className="absolute inset-0 z-0"
              style={{
                border: newHovered
                  ? "1px solid rgba(255,255,255,0.18)"
                  : "1px solid transparent",
                transform: newHovered ? "scale(1.02)" : "scale(1)",
                transition: "transform 450ms ease, border-color 350ms ease",
              }}
            />

            <span className="relative z-10 flex items-center gap-2">
              <PlusCircle
                className="h-4 w-4 transition-transform duration-500"
                style={{
                  transform: newHovered
                    ? "scale(1.18) rotate(180deg)"
                    : "scale(1) rotate(0deg)",
                }}
              />
              <span
                style={{
                  letterSpacing: newHovered ? "0.08em" : "0.01em",
                  transform: newHovered ? "translateX(1px)" : "translateX(0)",
                  transition: "letter-spacing 350ms ease, transform 350ms ease",
                }}
              >
                New
              </span>
            </span>
          </button>
        </div>
      </div>

      <nav className="flex flex-col flex-1 py-2 pr-1 overflow-y-auto pb-16">
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.id}
            item={item}
            isActive={activeSection === item.id}
            onClick={() => onSelect(item.id)}
          />
        ))}
      </nav>

      <SidebarThemeDockButton />
    </aside>
  );
}
