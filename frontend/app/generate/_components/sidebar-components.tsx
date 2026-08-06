"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Inbox,
  Loader2,
  MailOpen,
  Menu,
  Moon,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SendHorizonal,
  Sun,
  Tag,
  UserRoundCog,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";

import { ActiveSection, FolderItem, GmailLabel } from "../_lib/types";
import { API } from "../_lib/api";

const ACCENT = "var(--mail-accent)";
const ACCENT_TINT = "var(--mail-accent-tint)";
const HOVER_BG = "var(--mail-hover)";

type SectionId = ActiveSection;

/* ------------------------------------------------------------------ */
/* Top bar                                                             */
/* ------------------------------------------------------------------ */

function TopBarIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="hover-pop inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
      style={{ color: "var(--mail-topbar-fg)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}

function TopBarThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // render the slot before mount so the bar does not reflow
  if (!mounted) return <span className="h-8 w-8 shrink-0" />;

  const isDark = (theme === "system" ? resolvedTheme : theme) === "dark";

  return (
    <TopBarIconButton
      label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </TopBarIconButton>
  );
}

function TopBarAccount() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/me`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setEmail(data?.emailAddress ?? null))
      .catch(() => setEmail(null));
  }, []);

  // Google's own account chooser is the account list — /login sends
  // prompt=select_account, so the old session just has to be dropped first.
  const switchAccount = async () => {
    try {
      await fetch(`${API}/logout`, { method: "POST", credentials: "include" });
    } catch {
      // logout failed — Google's chooser still lets them pick another account
    }
    window.location.href = `${API}/login`;
  };

  const initial = (email?.trim()?.charAt(0) || "?").toUpperCase();

  return (
    <button
      type="button"
      onClick={switchAccount}
      aria-label="Switch Google account"
      title={email ? `Signed in as ${email} — switch account` : "Switch account"}
      className="hover-pop flex shrink-0 items-center gap-2 h-8 pl-1 pr-2 rounded-full"
      style={{ color: "var(--mail-topbar-fg)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <span
        className="inline-flex items-center justify-center rounded-full text-[11px] font-bold"
        style={{
          width: 26,
          height: 26,
          background: "var(--mail-accent)",
          color: "#fff",
        }}
      >
        {initial}
      </span>
      <span
        className="hidden lg:block max-w-[150px] truncate text-[12px]"
        style={{ color: "var(--mail-topbar-muted)" }}
      >
        {email ?? "Sign in"}
      </span>
      <UserRoundCog
        className="h-3.5 w-3.5 shrink-0 lg:hidden"
        style={{ color: "var(--mail-topbar-muted)" }}
      />
    </button>
  );
}

export function MailTopBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  onToggleSidebar,
  onRefresh,
  isRefreshing,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  onToggleSidebar: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <header
      className="flex h-12 shrink-0 items-center gap-2 px-2.5"
      style={{ background: "var(--mail-topbar)" }}
    >
      <TopBarIconButton label="Toggle folder pane" onClick={onToggleSidebar}>
        <Menu style={{ width: 18, height: 18 }} />
      </TopBarIconButton>

      <div className="flex shrink-0 items-center gap-2 pl-0.5 pr-2">
        <img src="/icon.png" alt="" className="h-6 w-6 shrink-0" />
        <span
          className="hidden sm:block text-[15px] font-semibold tracking-tight"
          style={{ color: "var(--mail-topbar-fg)" }}
        >
          Mailly
        </span>
      </div>

      <div className="mx-auto w-full max-w-[620px] min-w-0 px-1">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
            style={{ color: "var(--mail-topbar-muted)" }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={searchPlaceholder}
            className="h-8 w-full rounded-md pl-9 pr-8 text-[13px] outline-none transition-colors duration-150"
            style={{
              background: focused ? "#fff" : "var(--mail-topbar-field)",
              color: focused ? "#16283d" : "var(--mail-topbar-fg)",
              border: `1px solid ${focused ? "var(--mail-accent)" : "transparent"}`,
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="hover-pop absolute right-2.5 top-1/2 -translate-y-1/2"
              style={{ color: focused ? "#5b6b7f" : "var(--mail-topbar-muted)" }}
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <TopBarIconButton label="Refresh" onClick={onRefresh}>
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </TopBarIconButton>
        <TopBarThemeToggle />
        <TopBarAccount />
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Icon rail                                                           */
/* ------------------------------------------------------------------ */

function RailButton({
  label,
  icon,
  count,
  isActive,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  count?: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={isActive}
      className="hover-pop relative inline-flex h-9 w-9 items-center justify-center rounded-md"
      style={{
        background: isActive ? ACCENT_TINT : "transparent",
        color: isActive ? ACCENT : "var(--muted-foreground)",
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = HOVER_BG;
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = "transparent";
      }}
    >
      {icon}
      {!!count && count > 0 && (
        <span
          className="absolute -right-0.5 -top-0.5 min-w-[15px] rounded-full px-1 text-[9px] font-bold leading-[15px] text-white"
          style={{ background: ACCENT }}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Folder pane                                                         */
/* ------------------------------------------------------------------ */

function PaneNavItem({
  label,
  count,
  icon,
  isActive,
  onClick,
  indented = false,
}: {
  label: string;
  count?: number;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  indented?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hover-row group flex h-8 w-full items-center gap-2.5 pr-2.5 text-left select-none origin-left"
      style={{
        paddingLeft: indented ? 28 : 14,
        background: isActive ? ACCENT_TINT : "transparent",
        color: isActive ? ACCENT : "var(--foreground)",
        fontWeight: isActive ? 600 : 400,
        boxShadow: isActive ? `inset 3px 0 0 ${ACCENT}` : "none",
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = HOVER_BG;
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = "transparent";
      }}
    >
      <span className="shrink-0 opacity-80">{icon}</span>
      <span className="truncate text-[13px]">{label}</span>
      {!!count && count > 0 && (
        <span
          className="ml-auto shrink-0 tabular-nums text-[11px] font-semibold"
          style={{ color: isActive ? ACCENT : "var(--muted-foreground)" }}
        >
          {count > 999 ? "999+" : count}
        </span>
      )}
    </button>
  );
}

function PaneSection({
  title,
  onAdd,
  addLabel,
  children,
}: {
  title: string;
  onAdd?: () => void;
  addLabel?: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mt-1.5 border-t border-border pt-1.5">
      <div className="flex items-center pr-1.5">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="hover-lift flex h-7 flex-1 items-center gap-1.5 pl-2.5 text-left text-[10.5px] font-bold uppercase tracking-[0.07em] text-muted-foreground hover:text-foreground origin-left"
        >
          {isOpen ? (
            <ChevronDown className="h-3 w-3 shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0" />
          )}
          {title}
        </button>

        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="hover-pop inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-[var(--mail-hover)] hover:text-foreground"
            aria-label={addLabel}
            title={addLabel}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isOpen && <div className="mt-0.5">{children}</div>}
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
  labels,
  labelsLoading = false,
  selectedLabelId = null,
  onSelectLabel,
  paneOpen = true,
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
  labels: GmailLabel[];
  labelsLoading?: boolean;
  selectedLabelId?: string | null;
  onSelectLabel: (label: GmailLabel) => void;
  paneOpen?: boolean;
}) {
  const navItems = useMemo(
    () => [
      {
        id: "inbox" as SectionId,
        label: "Inbox",
        icon: <Inbox style={{ width: 16, height: 16 }} />,
        count: inboxCount,
      },
      {
        id: "sent" as SectionId,
        label: "Sent",
        icon: <SendHorizonal style={{ width: 16, height: 16 }} />,
        count: sentCount,
      },
      {
        id: "drafts" as SectionId,
        label: "Drafts",
        icon: <MailOpen style={{ width: 16, height: 16 }} />,
        count: draftsCount,
      },
      {
        id: "scheduled" as SectionId,
        label: "Scheduled",
        icon: <CalendarClock style={{ width: 16, height: 16 }} />,
        count: scheduledCount,
      },
    ],
    [inboxCount, sentCount, draftsCount, scheduledCount],
  );

  return (
    <div className="flex h-full shrink-0" aria-label="Email navigation">
      {/* icon rail — always visible, mirrors the pane when it is collapsed */}
      <nav
        className="flex w-[52px] shrink-0 flex-col items-center gap-1 border-r border-border py-2.5"
        style={{ background: "var(--mail-rail)" }}
      >
        <button
          type="button"
          onClick={onNewEmail}
          aria-label="Compose"
          title="Compose"
          className="hover-press mb-1.5 inline-flex h-9 w-9 items-center justify-center rounded-md text-white"
          style={{
            background: ACCENT,
            boxShadow: "0 1px 3px rgba(0,0,0,0.20)",
          }}
        >
          <Pencil style={{ width: 16, height: 16 }} />
        </button>

        {navItems.map((item) => (
          <RailButton
            key={item.id}
            label={item.label}
            icon={item.icon}
            count={item.id === "inbox" ? item.count : undefined}
            isActive={activeSection === item.id}
            onClick={() => onSelect(item.id)}
          />
        ))}

        <div className="my-1 h-px w-6 bg-border" />

        <RailButton
          label="Folders"
          icon={<Folder style={{ width: 16, height: 16 }} />}
          isActive={activeSection === "folder"}
          onClick={() => onSelect("folder")}
        />
        <RailButton
          label="Tags"
          icon={<Tag style={{ width: 16, height: 16 }} />}
          isActive={activeSection === "label"}
          onClick={() => onSelect("label")}
        />
      </nav>

      {/* folder pane — collapsible from the top bar */}
      <aside
        className="flex h-full flex-col overflow-hidden border-r border-border transition-[width] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          width: paneOpen ? 216 : 0,
          background: "var(--mail-pane)",
        }}
        aria-hidden={!paneOpen}
      >
        <div className="w-[216px] shrink-0 px-2.5 py-2.5">
          <button
            type="button"
            onClick={onNewEmail}
            className="hover-press flex h-9 w-full items-center justify-center gap-2 rounded-md text-[13px] font-semibold text-white"
            style={{
              background: ACCENT,
              boxShadow: "0 1px 3px rgba(0,0,0,0.16)",
            }}
          >
            <Pencil style={{ width: 15, height: 15 }} />
            New Mail
          </button>
        </div>

        <div className="w-[216px] flex-1 overflow-y-auto overflow-x-hidden pb-3">
          {navItems.map((item) => (
            <PaneNavItem
              key={item.id}
              label={item.label}
              count={item.count}
              icon={item.icon}
              isActive={activeSection === item.id}
              onClick={() => onSelect(item.id)}
            />
          ))}

          <PaneSection title="Folders" onAdd={onAddFolder} addLabel="Create folder">
            {folders.length === 0 ? (
              <p className="py-1.5 pl-7 text-[12px] text-muted-foreground/70">
                No folders yet
              </p>
            ) : (
              folders.map((folder) => {
                const isSelected =
                  activeSection === "folder" && selectedFolderId === folder.id;

                return (
                  <PaneNavItem
                    key={folder.id}
                    label={folder.name}
                    count={folder.count}
                    indented
                    icon={
                      isSelected ? (
                        <FolderOpen style={{ width: 15, height: 15 }} />
                      ) : (
                        <Folder style={{ width: 15, height: 15 }} />
                      )
                    }
                    isActive={isSelected}
                    onClick={() => onSelectFolder(folder.id)}
                  />
                );
              })
            )}
          </PaneSection>

          <PaneSection title="Tags">
            {labelsLoading ? (
              <p className="flex items-center gap-1.5 py-1.5 pl-7 text-[12px] text-muted-foreground/70">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading
              </p>
            ) : labels.length === 0 ? (
              <p className="py-1.5 pl-7 text-[12px] text-muted-foreground/70">
                No tags in Gmail
              </p>
            ) : (
              labels.map((label) => (
                <PaneNavItem
                  key={label.id}
                  label={label.name}
                  indented
                  icon={<Tag style={{ width: 14, height: 14 }} />}
                  isActive={
                    activeSection === "label" && selectedLabelId === label.id
                  }
                  onClick={() => onSelectLabel(label)}
                />
              ))
            )}
          </PaneSection>
        </div>
      </aside>
    </div>
  );
}
