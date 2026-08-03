"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import DOMPurify from "dompurify";
import {
  BookmarkPlus,
  CalendarClock,
  Folder,
  Inbox,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  SendHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getGravatarUrl } from "../_lib/api";
import {
  extractEmailAddress,
  formatScheduledDateTime,
  formatTime,
  getLetterAvatarColors,
  getSenderDisplayName,
  getSenderInitial,
} from "../_lib/generate-utils";
import type {
  ActiveSection,
  DraftEmail,
  FolderItem,
  GmailEmail,
  GmailEmailDetail,
  ScheduledEmail,
} from "../_lib/types";

const ACCENT = "var(--mail-accent)";
const ACCENT_TINT = "var(--mail-accent-tint)";
const HOVER_BG = "var(--mail-hover)";

type SidebarSection = ActiveSection | "folder";

type SectionMetaMap = Record<
  SidebarSection,
  { label: string; icon: React.ReactNode; description: string }
>;

type GmailEmailWithFolder = GmailEmail & {
  folderId?: string | null;
  readLater?: boolean;
};

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

function SenderAvatar({
  from,
  size = 28,
  selected = false,
}: {
  from: string;
  size?: number;
  selected?: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const safeFrom = from || "";
  const imageUrl = getGravatarUrl(safeFrom, size * 2);
  const initial = getSenderInitial(safeFrom) || "?";
  const colors = getLetterAvatarColors(initial);

  useEffect(() => {
    setImgError(false);
  }, [from]);

  if (imageUrl && !imgError) {
    return (
      <img
        src={imageUrl}
        alt={getSenderDisplayName(safeFrom) || "Unknown Sender"}
        width={size}
        height={size}
        onError={() => setImgError(true)}
        className="rounded-full shrink-0 object-cover"
        style={{
          width: size,
          height: size,
          border: selected
            ? `1px solid color-mix(in srgb, ${ACCENT} 30%, transparent)`
            : "1px solid var(--border)",
        }}
      />
    );
  }

  return (
    <div
      className="rounded-full shrink-0 flex items-center justify-center font-semibold uppercase select-none"
      style={{
        width: size,
        height: size,
        backgroundColor: colors.bg,
        color: colors.text,
        border: selected
          ? `1px solid color-mix(in srgb, ${ACCENT} 30%, transparent)`
          : "1px solid var(--border)",
        fontSize: size >= 40 ? "14px" : size >= 28 ? "11px" : "10px",
      }}
      title={getSenderDisplayName(safeFrom) || "Unknown Sender"}
    >
      {initial}
    </div>
  );
}

function RowActionButton({
  label,
  icon,
  onClick,
  destructive = false,
  active = false,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-transparent border-0 outline-none transition-colors duration-150"
      style={{
        color: destructive
          ? "#c5221f"
          : active
            ? "#b06000"
            : "var(--muted-foreground)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = HOVER_BG;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}

function FolderPicker({
  folders,
  anchorRect,
  onSelectFolder,
  onClose,
}: {
  folders: FolderItem[];
  anchorRect: DOMRect;
  onSelectFolder: (folderId: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const MENU_WIDTH = 210;
  const MARGIN = 8;

  const [coords, setCoords] = useState(() =>
    computeCoords(anchorRect, MENU_WIDTH, MARGIN),
  );

  useLayoutEffect(() => {
    setCoords(computeCoords(anchorRect, MENU_WIDTH, MARGIN));
  }, [anchorRect]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const onScrollOrResize = () => onClose();

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[999] overflow-hidden rounded-md border bg-card"
      style={{
        top: coords.top,
        left: coords.left,
        width: MENU_WIDTH,
        borderColor: "var(--border)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground border-b border-border">
        Move to folder
      </div>

      <div className="max-h-60 overflow-y-auto py-1">
        {folders.length === 0 ? (
          <div className="px-3 py-2.5 text-[12px] text-muted-foreground">
            No folders available
          </div>
        ) : (
          folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => {
                onSelectFolder(folder.id);
                onClose();
              }}
              className="w-full flex items-center gap-2 px-3 h-8 text-left text-[13px] transition-colors"
              style={{ color: "var(--foreground)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = HOVER_BG;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <Folder className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{folder.name}</span>
            </button>
          ))
        )}
      </div>
    </div>,
    document.body,
  );
}

function computeCoords(anchorRect: DOMRect, menuWidth: number, margin: number) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = anchorRect.right - menuWidth;
  left = Math.max(margin, Math.min(left, viewportWidth - menuWidth - margin));

  let top = anchorRect.bottom + margin;
  const estimatedMenuHeight = 260;
  if (top + estimatedMenuHeight > viewportHeight - margin) {
    top = Math.max(margin, anchorRect.top - estimatedMenuHeight - margin);
  }

  return { top, left };
}

function EmailCard({
  email,
  onClick,
  isSelected,
  folderName,
  folders,
  onDeleteEmail,
  onMoveToFolder,
  onReadLater,
}: {
  email: GmailEmailWithFolder;
  onClick: () => void;
  isSelected: boolean;
  folderName?: string | null;
  folders: FolderItem[];
  onDeleteEmail: (emailId: string) => void;
  onMoveToFolder: (emailId: string, folderId: string) => void;
  onReadLater?: (emailId: string) => void;
}) {
  const [rowHovered, setRowHovered] = useState(false);
  const [folderMenuOpen, setFolderMenuOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const folderTriggerRef = useRef<HTMLButtonElement | null>(null);

  const keepRowActive = rowHovered || folderMenuOpen;
  const hoverOnly = keepRowActive && !isSelected;

  const senderName = getSenderDisplayName(email.from) || "Unknown Sender";

  const background = isSelected
    ? ACCENT_TINT
    : email.readLater
      ? "color-mix(in srgb, #FF9E20 10%, transparent)"
      : hoverOnly
        ? HOVER_BG
        : "transparent";

  const leftBar = isSelected
    ? ACCENT
    : email.readLater
      ? "#FF9E20"
      : "transparent";

  return (
    <div
      role="button"
      tabIndex={0}
      className="group w-full cursor-pointer outline-none transition-colors duration-150"
      style={{
        background,
        borderBottom: "1px solid var(--border)",
        boxShadow: `inset 3px 0 0 ${leftBar}`,
      }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      onMouseEnter={() => setRowHovered(true)}
      onMouseLeave={() => {
        if (!folderMenuOpen) {
          setRowHovered(false);
        }
      }}
      aria-pressed={isSelected}
      aria-label={`Open email ${email.subject || "(No Subject)"}`}
    >
      <div className="pl-3.5 pr-3 py-2 flex items-center gap-3">
        <SenderAvatar from={email.from} size={28} selected={isSelected} />

        <span
          className="w-36 shrink-0 truncate text-[13px] font-semibold"
          style={{ color: isSelected ? ACCENT : "var(--foreground)" }}
        >
          {senderName}
        </span>

        <span className="min-w-0 flex-1 flex items-center gap-2">
          <span
            className="truncate text-[13px]"
            style={{ color: isSelected ? ACCENT : "var(--foreground)" }}
          >
            {email.subject || "(No Subject)"}
          </span>

          {folderName && (
            <span
              className="hidden md:inline-flex shrink-0 items-center gap-1 rounded-sm px-1.5 py-px text-[10px] leading-4"
              style={{
                background: `color-mix(in srgb, ${ACCENT} 8%, transparent)`,
                color: "var(--muted-foreground)",
              }}
            >
              <Folder className="h-2.5 w-2.5" />
              {folderName}
            </span>
          )}

          {email.readLater && (
            <span
              className="shrink-0 rounded-sm px-1.5 py-px text-[10px] leading-4"
              style={{
                background: "color-mix(in srgb, #FF9E20 18%, transparent)",
                color: "var(--mail-warn-text)",
              }}
            >
              Read later
            </span>
          )}
        </span>

        <div className="shrink-0 flex items-center justify-end w-[104px]">
          {keepRowActive ? (
            <div className="flex items-center gap-0.5">
              <RowActionButton
                label="Delete"
                icon={<Trash2 className="h-3.5 w-3.5" />}
                destructive
                onClick={() => onDeleteEmail(email.id)}
              />

              <RowActionButton
                label={email.readLater ? "Remove read later" : "Read later"}
                icon={<BookmarkPlus className="h-3.5 w-3.5" />}
                onClick={() => onReadLater?.(email.id)}
                active={Boolean(email.readLater)}
              />

              <div className="relative">
                <button
                  ref={folderTriggerRef}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!folderMenuOpen && folderTriggerRef.current) {
                      setAnchorRect(
                        folderTriggerRef.current.getBoundingClientRect(),
                      );
                    }
                    setFolderMenuOpen((prev) => !prev);
                  }}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border-0 outline-none transition-colors duration-150"
                  style={{
                    color: folderMenuOpen ? ACCENT : "var(--muted-foreground)",
                    background: folderMenuOpen ? HOVER_BG : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = HOVER_BG;
                  }}
                  onMouseLeave={(e) => {
                    if (!folderMenuOpen)
                      e.currentTarget.style.background = "transparent";
                  }}
                  aria-label="Move to folder"
                  title="Move to folder"
                >
                  <Folder className="h-3.5 w-3.5" />
                </button>

                {folderMenuOpen && anchorRect && (
                  <FolderPicker
                    folders={folders}
                    anchorRect={anchorRect}
                    onClose={() => setFolderMenuOpen(false)}
                    onSelectFolder={(folderId) =>
                      onMoveToFolder(email.id, folderId)
                    }
                  />
                )}
              </div>
            </div>
          ) : (
            <span
              className="text-[11px] tabular-nums"
              style={{
                color: isSelected ? ACCENT : "var(--muted-foreground)",
              }}
            >
              {formatTime(email.date)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SimpleRow({
  icon,
  title,
  subtitle,
  meta,
  isActive,
  onClick,
  onDelete,
  deleteLabel,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  meta: string;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  deleteLabel: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      className="group w-full cursor-pointer outline-none transition-colors duration-150"
      style={{
        background: isActive
          ? ACCENT_TINT
          : hovered
            ? HOVER_BG
            : "transparent",
        borderBottom: "1px solid var(--border)",
        boxShadow: `inset 3px 0 0 ${isActive ? ACCENT : "transparent"}`,
      }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="pl-3.5 pr-3 py-2 flex items-center gap-3">
        <span
          className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center"
          style={{
            background: `color-mix(in srgb, ${ACCENT} 8%, transparent)`,
            color: isActive ? ACCENT : "var(--muted-foreground)",
          }}
        >
          {icon}
        </span>

        <span
          className="w-36 shrink-0 truncate text-[13px] font-semibold"
          style={{ color: isActive ? ACCENT : "var(--foreground)" }}
        >
          {subtitle}
        </span>

        <span
          className="min-w-0 flex-1 truncate text-[13px]"
          style={{ color: isActive ? ACCENT : "var(--foreground)" }}
        >
          {title}
        </span>

        <div className="shrink-0 flex items-center justify-end gap-1 w-[104px]">
          {hovered ? (
            <RowActionButton
              label={deleteLabel}
              icon={<Trash2 className="h-3.5 w-3.5" />}
              destructive
              onClick={onDelete}
            />
          ) : (
            <span
              className="text-[11px] tabular-nums"
              style={{
                color: isActive ? ACCENT : "var(--muted-foreground)",
              }}
            >
              {meta}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  message,
}: {
  icon: React.ReactNode;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-2.5 text-center px-4">
      <span className="text-muted-foreground/25">{icon}</span>
      <p className="text-[13px] text-muted-foreground/70">{message}</p>
    </div>
  );
}

export function EmailListView({
  activeSection,
  inboxEmails,
  sentEmails,
  drafts,
  scheduledEmails,
  activeDraftId,
  activeScheduledId,
  inboxLoading,
  sentLoading,
  selectedEmailId,
  selectedFolderId,
  folders,
  onRefreshInbox,
  onRefreshSent,
  onOpenGmailEmail,
  onSelectDraft,
  onDeleteDraft,
  onSelectScheduled,
  onDeleteScheduled,
  onDeleteEmail,
  onMoveEmailToFolder,
  onMarkReadLater,
}: {
  activeSection: SidebarSection;
  inboxEmails: GmailEmailWithFolder[];
  sentEmails: GmailEmailWithFolder[];
  drafts: DraftEmail[];
  scheduledEmails: ScheduledEmail[];
  activeDraftId: string | null;
  activeScheduledId: string | null;
  inboxLoading: boolean;
  sentLoading: boolean;
  selectedEmailId: string | null;
  selectedFolderId?: string | null;
  folders: FolderItem[];
  onRefreshInbox: () => void;
  onRefreshSent: () => void;
  onOpenGmailEmail: (emailId: string) => void;
  onSelectDraft: (d: DraftEmail) => void;
  onDeleteDraft: (id: string) => void;
  onSelectScheduled: (d: ScheduledEmail) => void;
  onDeleteScheduled: (id: string) => void;
  onDeleteEmail: (emailId: string) => void;
  onMoveEmailToFolder: (emailId: string, folderId: string) => void;
  onMarkReadLater?: (emailId: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    setSearchQuery("");
  }, [activeSection, selectedFolderId]);

  const selectedFolder = useMemo(
    () => folders.find((folder) => folder.id === selectedFolderId) ?? null,
    [folders, selectedFolderId],
  );

  const filterEmails = (emails: GmailEmailWithFolder[]) => {
    if (!searchQuery.trim()) return emails;
    const q = searchQuery.toLowerCase();

    return emails.filter(
      (e) =>
        e.subject?.toLowerCase().includes(q) ||
        e.from?.toLowerCase().includes(q),
    );
  };

  const filterDrafts = (items: DraftEmail[]) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();

    return items.filter(
      (d) =>
        d.subject?.toLowerCase().includes(q) ||
        d.recipientEmail?.toLowerCase().includes(q),
    );
  };

  const filterScheduled = (items: ScheduledEmail[]) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();

    return items.filter(
      (d) =>
        d.subject?.toLowerCase().includes(q) ||
        d.recipientEmail?.toLowerCase().includes(q),
    );
  };

  const folderEmails = useMemo(() => {
    if (!selectedFolderId) return [];
    const combined = dedupeById([...inboxEmails, ...sentEmails]);
    return filterEmails(combined.filter((e) => e.folderId === selectedFolderId));
  }, [inboxEmails, sentEmails, selectedFolderId, searchQuery]);

  const visibleEmails = useMemo(() => {
    if (activeSection === "inbox") return filterEmails(dedupeById(inboxEmails));
    if (activeSection === "sent") return filterEmails(dedupeById(sentEmails));
    return [];
  }, [activeSection, inboxEmails, sentEmails, searchQuery]);

  const filteredDrafts = useMemo(
    () => filterDrafts(drafts),
    [drafts, searchQuery],
  );

  const filteredScheduled = useMemo(
    () => filterScheduled(scheduledEmails),
    [scheduledEmails, searchQuery],
  );

  const isLoading =
    activeSection === "inbox"
      ? inboxLoading
      : activeSection === "sent"
        ? sentLoading
        : false;

  const canRefresh = activeSection === "inbox" || activeSection === "sent";

  const sectionMeta: SectionMetaMap = {
    inbox: {
      label: "Inbox",
      icon: <Inbox className="h-4 w-4" />,
      description: "Everything that's landed in your inbox",
    },
    sent: {
      label: "Sent",
      icon: <SendHorizontal className="h-4 w-4" />,
      description: "Emails you've already sent",
    },
    drafts: {
      label: "Drafts",
      icon: <Mail className="h-4 w-4" />,
      description: "Unfinished emails, ready to pick back up",
    },
    scheduled: {
      label: "Scheduled",
      icon: <CalendarClock className="h-4 w-4" />,
      description: "Queued up to send automatically",
    },
    folder: {
      label: selectedFolder?.name || "Folder",
      icon: <Folder className="h-4 w-4" />,
      description: selectedFolder
        ? `Emails inside ${selectedFolder.name}`
        : "Choose a folder from the sidebar",
    },
  };

  const meta = sectionMeta[activeSection];

  const itemCount =
    activeSection === "drafts"
      ? filteredDrafts.length
      : activeSection === "scheduled"
        ? filteredScheduled.length
        : activeSection === "folder"
          ? folderEmails.length
          : visibleEmails.length;

  return (
    <div className="relative h-full w-full bg-card text-foreground flex flex-col">
      <div className="shrink-0 border-b border-border bg-card">
        <div className="flex items-center gap-3 px-4 h-12">
          <span
            className="shrink-0 flex items-center justify-center h-7 w-7 rounded-md"
            style={{
              background: `color-mix(in srgb, ${ACCENT} 10%, transparent)`,
              color: ACCENT,
            }}
          >
            {meta.icon}
          </span>

          <div className="min-w-0 flex items-baseline gap-2">
            <h1 className="truncate text-[15px] font-semibold tracking-tight">
              {meta.label}
            </h1>
            {itemCount > 0 && (
              <span className="text-[12px] tabular-nums text-muted-foreground shrink-0">
                {itemCount}
              </span>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2 min-w-0">
            <div className="relative w-[220px] sm:w-[300px] md:w-[380px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none text-muted-foreground" />
              <input
                type="text"
                placeholder={`Search ${meta.label.toLowerCase()}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full h-8 rounded-full pl-9 pr-8 text-[13px] outline-none transition-colors duration-150 border placeholder:text-muted-foreground/70"
                style={{
                  background: searchFocused
                    ? "var(--card)"
                    : "color-mix(in srgb, var(--foreground) 5%, transparent)",
                  borderColor: searchFocused ? ACCENT : "transparent",
                  color: "var(--foreground)",
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {canRefresh && (
              <button
                type="button"
                className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-[var(--mail-hover)] hover:text-foreground transition-colors"
                onClick={
                  activeSection === "inbox" ? onRefreshInbox : onRefreshSent
                }
                aria-label={`Refresh ${meta.label}`}
                title={`Refresh ${meta.label}`}
              >
                <RefreshCw
                  className={cn("h-3.5 w-3.5", isLoading && "animate-spin")}
                />
              </button>
            )}
          </div>
        </div>

        <p className="px-4 pb-2 text-[11px] text-muted-foreground truncate">
          {meta.description}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto bg-card">
        {activeSection === "inbox" &&
          (isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2.5">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
              <span className="text-[13px] text-muted-foreground/70">
                Loading inbox...
              </span>
            </div>
          ) : visibleEmails.length === 0 ? (
            <EmptyState
              icon={<Inbox className="h-9 w-9" />}
              message={searchQuery ? "No results found" : "No inbox emails"}
            />
          ) : (
            visibleEmails.map((email) => (
              <EmailCard
                key={email.id}
                email={email}
                isSelected={selectedEmailId === email.id}
                onClick={() => onOpenGmailEmail(email.id)}
                folderName={
                  folders.find((f) => f.id === email.folderId)?.name ?? null
                }
                folders={folders}
                onDeleteEmail={onDeleteEmail}
                onMoveToFolder={onMoveEmailToFolder}
                onReadLater={onMarkReadLater}
              />
            ))
          ))}

        {activeSection === "sent" &&
          (isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2.5">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
              <span className="text-[13px] text-muted-foreground/70">
                Loading emails...
              </span>
            </div>
          ) : visibleEmails.length === 0 ? (
            <EmptyState
              icon={<SendHorizontal className="h-9 w-9" />}
              message={searchQuery ? "No results found" : "No sent emails"}
            />
          ) : (
            visibleEmails.map((email) => (
              <EmailCard
                key={email.id}
                email={email}
                isSelected={selectedEmailId === email.id}
                onClick={() => onOpenGmailEmail(email.id)}
                folderName={
                  folders.find((f) => f.id === email.folderId)?.name ?? null
                }
                folders={folders}
                onDeleteEmail={onDeleteEmail}
                onMoveToFolder={onMoveEmailToFolder}
                onReadLater={onMarkReadLater}
              />
            ))
          ))}

        {activeSection === "folder" &&
          (!selectedFolderId ? (
            <EmptyState
              icon={<Folder className="h-9 w-9" />}
              message="Select a folder from the sidebar"
            />
          ) : folderEmails.length === 0 ? (
            <EmptyState
              icon={<Folder className="h-9 w-9" />}
              message={
                searchQuery ? "No results found" : "No emails in this folder"
              }
            />
          ) : (
            folderEmails.map((email) => (
              <EmailCard
                key={email.id}
                email={email}
                isSelected={selectedEmailId === email.id}
                onClick={() => onOpenGmailEmail(email.id)}
                folderName={selectedFolder?.name ?? null}
                folders={folders}
                onDeleteEmail={onDeleteEmail}
                onMoveToFolder={onMoveEmailToFolder}
                onReadLater={onMarkReadLater}
              />
            ))
          ))}

        {activeSection === "drafts" &&
          (filteredDrafts.length === 0 ? (
            <EmptyState
              icon={<Mail className="h-9 w-9" />}
              message={searchQuery ? "No results found" : "No drafts yet"}
            />
          ) : (
            filteredDrafts.map((draft) => (
              <SimpleRow
                key={draft.id}
                icon={<Mail className="h-3.5 w-3.5" />}
                title={draft.subject || "(No Subject)"}
                subtitle={draft.recipientEmail || "No recipient"}
                meta={formatTime(draft.createdAt)}
                isActive={activeDraftId === draft.id}
                onClick={() => onSelectDraft(draft)}
                onDelete={() => onDeleteDraft(draft.id)}
                deleteLabel="Delete draft"
              />
            ))
          ))}

        {activeSection === "scheduled" &&
          (filteredScheduled.length === 0 ? (
            <EmptyState
              icon={<CalendarClock className="h-9 w-9" />}
              message={searchQuery ? "No results found" : "No scheduled emails"}
            />
          ) : (
            filteredScheduled.map((item) => (
              <SimpleRow
                key={item.id}
                icon={<CalendarClock className="h-3.5 w-3.5" />}
                title={item.subject || "(No Subject)"}
                subtitle={item.recipientEmail || "No recipient"}
                meta={formatScheduledDateTime(item.scheduledFor)}
                isActive={activeScheduledId === item.id}
                onClick={() => onSelectScheduled(item)}
                onDelete={() => onDeleteScheduled(item.id)}
                deleteLabel="Delete scheduled email"
              />
            ))
          ))}
      </div>
    </div>
  );
}

export function EmailDetailOverlayPanel({
  isVisible,
  email,
  isLoading,
  errorMessage,
  onClose,
}: {
  isVisible: boolean;
  email: GmailEmailDetail | null;
  isLoading: boolean;
  errorMessage?: string | null;
  onClose: () => void;
}) {
  const plain = email?.plain_body || email?.body || "";
  const html = email?.html_body || "";
  const hasHtml = Boolean(html && html.trim());

  const sanitizedHtml = useMemo(() => {
    if (!hasHtml) return "";
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
    });
  }, [hasHtml, html]);

  const shouldRenderEmptyState =
    isVisible && !isLoading && !errorMessage && !email;

  return (
    <div
      className="absolute inset-0 z-30 overflow-hidden"
      aria-hidden={!isVisible}
      style={{ pointerEvents: isVisible ? "auto" : "none" }}
    >
      <div
        className="absolute inset-0 bg-black/10 transition-opacity duration-300"
        style={{ opacity: isVisible ? 1 : 0 }}
        onClick={onClose}
      />
      <aside
        className="absolute inset-y-0 right-0 w-full h-full bg-background transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col border-l border-border overflow-hidden"
        style={{
          transform: isVisible ? "translateX(0)" : "translateX(100%)",
          boxShadow: "-2px 0 12px rgba(0,0,0,0.10)",
        }}
      >
        <div className="flex items-center gap-2 px-4 h-12 shrink-0 border-b border-border bg-card">
          <span className="truncate text-[14px] font-semibold">
            {email?.subject || "Email details"}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="ml-auto shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-[var(--mail-hover)] hover:text-foreground transition-colors"
            aria-label="Close"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2.5 px-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <p className="text-[13px] text-muted-foreground">Loading email...</p>
          </div>
        ) : errorMessage ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 px-8 text-center">
            <Mail className="h-9 w-9 text-muted-foreground/25" />
            <p className="text-[13px] font-semibold">Unable to load email</p>
            <p className="text-[12px] text-muted-foreground">{errorMessage}</p>
          </div>
        ) : shouldRenderEmptyState ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 px-8 text-center">
            <Mail className="h-9 w-9 text-muted-foreground/25" />
            <p className="text-[13px] font-semibold">No email selected</p>
            <p className="text-[12px] text-muted-foreground">
              Select an email to view its details.
            </p>
          </div>
        ) : email ? (
          <>
            <div className="px-5 py-3.5 shrink-0 border-b border-border bg-card">
              <div className="flex items-start gap-3">
                <SenderAvatar from={email.from} size={40} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <p className="text-[13px] font-semibold truncate">
                      {getSenderDisplayName(email.from) || "Unknown Sender"}
                    </p>
                    {extractEmailAddress(email.from) && (
                      <p className="text-[12px] text-muted-foreground truncate">
                        &lt;{extractEmailAddress(email.from)}&gt;
                      </p>
                    )}
                  </div>

                  <p className="text-[12px] text-muted-foreground mt-0.5 truncate">
                    {email.subject || "(No Subject)"}
                  </p>
                </div>

                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {email.date || "—"}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {hasHtml ? (
                <div
                  className="prose prose-sm max-w-none dark:prose-invert text-[13px]"
                  dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                />
              ) : (
                <pre className="whitespace-pre-wrap text-[13px] font-sans leading-relaxed text-foreground">
                  {plain || "No body content."}
                </pre>
              )}
            </div>
          </>
        ) : null}
      </aside>
    </div>
  );
}
