"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Inbox,
  MailOpen,
  Moon,
  Pencil,
  Plus,
  SendHorizonal,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";

import { ActiveSection, FolderItem } from "../_lib/types";

const ACCENT = "var(--mail-accent)";
const ACCENT_TINT = "var(--mail-accent-tint)";
const HOVER_BG = "var(--mail-hover)";
const BRAND = "#121931";

function ItemCount({
  count,
  isActive = false,
}: {
  count: number;
  isActive?: boolean;
}) {
  if (!count || count <= 0) return null;

  return (
    <span
      className="ml-auto shrink-0 tabular-nums text-[11px] font-semibold"
      style={{
        color: isActive ? ACCENT : "var(--muted-foreground)",
      }}
    >
      {count > 999 ? "999+" : count}
    </span>
  );
}

function SidebarBrand() {
  return (
    <div
      className="flex items-center gap-2.5 px-4 h-12 shrink-0"
      style={{ backgroundColor: BRAND }}
    >
      <img src="icon.png" alt="" className="h-6 w-6 shrink-0" />
      <span className="text-[15px] font-semibold tracking-tight text-white">
        Mailly
      </span>
    </div>
  );
}

function SidebarNavItem({
  item,
  isActive,
  onClick,
  indented = false,
  icon,
}: {
  item: { label: string; count?: number };
  isActive: boolean;
  onClick: () => void;
  indented?: boolean;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group hover-lift flex w-full items-center gap-3 h-8 pr-3 rounded-r-full text-left select-none origin-left"
      style={{
        paddingLeft: indented ? 36 : 20,
        background: isActive ? ACCENT_TINT : "transparent",
        color: isActive ? ACCENT : "var(--muted-foreground)",
        fontWeight: isActive ? 600 : 400,
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = HOVER_BG;
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = "transparent";
      }}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate text-[13px]">{item.label}</span>
      <ItemCount count={item.count ?? 0} isActive={isActive} />
    </button>
  );
}

function SidebarFolderSection({
  folders,
  selectedFolderId,
  onSelectFolder,
  onAddFolder,
}: {
  folders: FolderItem[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string) => void;
  onAddFolder: () => void;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mt-2 pt-2 border-t border-border">
      <div className="flex items-center pr-2">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="hover-lift flex flex-1 items-center gap-2 h-8 pl-4 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground hover:text-foreground origin-left"
        >
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          )}
          Folders
        </button>

        <button
          type="button"
          onClick={onAddFolder}
          className="hover-pop inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-[var(--mail-hover)] hover:text-foreground"
          aria-label="Create folder"
          title="Create folder"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {isOpen && (
        <div className="mt-0.5">
          {folders.length === 0 && (
            <p className="pl-9 py-1.5 text-[12px] text-muted-foreground/70">
              No folders yet
            </p>
          )}

          {folders.map((folder) => {
            const isSelected = selectedFolderId === folder.id;

            return (
              <SidebarNavItem
                key={folder.id}
                item={{ label: folder.name, count: folder.count }}
                isActive={isSelected}
                indented
                icon={
                  isSelected ? (
                    <FolderOpen className="h-4 w-4" />
                  ) : (
                    <Folder className="h-4 w-4" />
                  )
                }
                onClick={() => onSelectFolder(folder.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function SidebarThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = (theme === "system" ? resolvedTheme : theme) === "dark";

  return (
    <div className="shrink-0 border-t border-border px-3 py-2">
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label="Toggle theme"
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className="hover-lift flex w-full items-center gap-2.5 h-8 px-2 rounded-md text-[12px] text-muted-foreground hover:bg-[var(--mail-hover)] hover:text-foreground origin-left"
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        {isDark ? "Light mode" : "Dark mode"}
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
  folders,
  selectedFolderId = null,
  onSelectFolder,
  onAddFolder,
}: {
  activeSection: ActiveSection;
  onSelect: (s: ActiveSection) => void;
  inboxCount: number;
  sentCount: number;
  draftsCount: number;
  scheduledCount: number;
  onNewEmail: () => void;
  folders: FolderItem[];
  selectedFolderId?: string | null;
  onSelectFolder: (folderId: string) => void;
  onAddFolder: () => void;
}) {
  const navItems = useMemo(
    () => [
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
    ],
    [inboxCount, sentCount, draftsCount, scheduledCount],
  );

  return (
    <aside
      className="w-56 shrink-0 flex flex-col bg-card h-full z-10 relative border-r border-border"
      aria-label="Email navigation"
    >
      <SidebarBrand />

      <div className="px-3 py-3 shrink-0">
        <button
          type="button"
          onClick={onNewEmail}
          className="hover-press flex items-center gap-2.5 h-9 pl-3.5 pr-5 rounded-full text-[13px] font-medium text-white"
          style={{
            backgroundColor: BRAND,
            boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.28)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.18)";
          }}
        >
          <Pencil className="h-4 w-4" />
          Compose
        </button>
      </div>

      <nav className="flex flex-col flex-1 pr-2 pb-3 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.id}
            item={{ label: item.label, count: item.count }}
            icon={item.icon}
            isActive={activeSection === item.id}
            onClick={() => onSelect(item.id)}
          />
        ))}

        <SidebarFolderSection
          folders={folders}
          selectedFolderId={selectedFolderId}
          onSelectFolder={onSelectFolder}
          onAddFolder={onAddFolder}
        />
      </nav>

      <SidebarThemeToggle />
    </aside>
  );
}
