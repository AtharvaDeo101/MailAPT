"use client";

import { useEffect, useState } from "react";
import {
  CalendarClock,
  ChevronRight,
  Inbox,
  MailOpen,
  PlusCircle,
  SendHorizonal,
} from "lucide-react";

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
        background: isActive ? "#121931" : "transparent",
        boxShadow: hovered && !isActive ? "0 10px 24px rgba(0,0,0,0.18)" : "none",
        transform: hovered ? "scale(1.02)" : "scale(1)",
      }}
    >
      <span
        className="relative z-10 shrink-0 transition-colors duration-200"
        style={{
          color: isActive
            ? "#ffffff"
            : hovered
              ? "var(--foreground)"
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
                  ? "var(--foreground)"
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
                ? "var(--foreground)"
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
          boxShadow: "0 1px 0 color-mix(in srgb, var(--border) 85%, transparent)",
        }}
      >
        <div className="mt-3">
          <button
            onClick={onNewEmail}
            onMouseEnter={() => setNewHovered(true)}
            onMouseLeave={() => setNewHovered(false)}
            className="relative flex w-full items-center justify-center gap-2 px-4 py-3 text-sm rounded-none overflow-hidden transition-all duration-300"
            style={{
              background: newHovered ? "#F0E7D5" : "#ffffff",
              color: "#000000",
              border: "none",
              boxShadow: newHovered
                ? "0 14px 30px rgba(0,0,0,0.18)"
                : "0 4px 12px rgba(0,0,0,0.08)",
              transform: newHovered ? "scale(1.05)" : "scale(1)",
              transition:
                "transform 300ms cubic-bezier(0.22,1,0.36,1), background-color 300ms ease, box-shadow 300ms ease",
            }}
          >
            <span className="relative z-10 flex items-center gap-2">
              <PlusCircle
                className="h-4 w-4 transition-transform duration-300"
                style={{
                  transform: newHovered ? "scale(1.12) rotate(90deg)" : "scale(1) rotate(0deg)",
                }}
              />
              New
            </span>
          </button>
        </div>
      </div>

      <nav className="flex flex-col flex-1 py-2 overflow-y-auto">
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.id}
            item={item}
            isActive={activeSection === item.id}
            onClick={() => onSelect(item.id)}
          />
        ))}
      </nav>
    </aside>
  );
}