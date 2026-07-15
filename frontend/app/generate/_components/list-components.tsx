"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import {
  BookmarkPlus,
  CalendarClock,
  Folder,
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  PanelRightOpen,
  RefreshCw,
  Search,
  SendHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useTheme } from "next-themes";

type SidebarSection = ActiveSection | "folder";

type SectionMetaMap = Record<
  SidebarSection,
  { label: string; icon: React.ReactNode; description: string }
>;

type GmailEmailWithFolder = GmailEmail & {
  folderId?: string | null;
  readLater?: boolean;
};

function SenderAvatar({
  from,
  size = 32,
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
            ? "2px solid color-mix(in srgb, #121931 34%, white 8%)"
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
          ? "2px solid color-mix(in srgb, #121931 34%, white 8%)"
          : "1px solid var(--border)",
        fontSize: size >= 44 ? "16px" : size >= 32 ? "12px" : "10px",
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
      className="inline-flex h-8 w-8 items-center justify-center rounded-none bg-transparent border-0 shadow-none outline-none transition-all duration-200"
      style={{
        color: destructive
          ? "#dc2626"
          : active
            ? "#121931"
            : "var(--muted-foreground)",
        opacity: active ? 1 : 0.92,
        transform: active ? "scale(1.06)" : "scale(1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = destructive ? "#dc2626" : "#121931";
        e.currentTarget.style.opacity = "1";
        e.currentTarget.style.transform = "scale(1.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = destructive
          ? "#dc2626"
          : active
            ? "#121931"
            : "var(--muted-foreground)";
        e.currentTarget.style.opacity = active ? "1" : "0.92";
        e.currentTarget.style.transform = active ? "scale(1.06)" : "scale(1)";
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
  onSelectFolder,
  onClose,
}: {
  folders: FolderItem[];
  onSelectFolder: (folderId: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-40 min-w-[210px] overflow-hidden border bg-card"
      style={{
        marginTop: 8,
        borderColor: "var(--border)",
        boxShadow:
          "0 18px 40px color-mix(in srgb, #121931 14%, transparent)",
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-2 text-[11px] uppercase tracking-[0.08em] text-muted-foreground border-b border-border">
        Select folder
      </div>

      <div className="max-h-60 overflow-y-auto">
        {folders.length === 0 ? (
          <div className="px-3 py-3 text-sm text-muted-foreground">
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
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors"
              style={{ color: "var(--foreground)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  "color-mix(in srgb, #121931 10%, transparent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <Folder className="h-4 w-4 shrink-0" />
              <span className="truncate">{folder.name}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
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
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [rowHovered, setRowHovered] = useState(false);
  const [folderMenuOpen, setFolderMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = mounted
    ? theme === "system"
      ? resolvedTheme
      : theme
    : "light";

  const isDark = activeTheme === "dark";
  const keepRowActive = rowHovered || folderMenuOpen;
  const hoverOnly = keepRowActive && !isSelected;

  const senderName = getSenderDisplayName(email.from) || "Unknown Sender";

  return (
    <div
      role="button"
      tabIndex={0}
      className="group w-full cursor-pointer overflow-visible transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none"
      style={{
        background: isSelected
          ? "#121931"
          : email.readLater
            ? isDark
              ? "color-mix(in srgb, #FF9E20 12%, transparent)"
              : "color-mix(in srgb, #FF9E20 10%, transparent)"
            : hoverOnly
              ? isDark
                ? "color-mix(in oklab, #121931 18%, white)"
                : "color-mix(in srgb, #121931 16%, transparent)"
              : "transparent",
        borderBottom:
          "1px solid color-mix(in srgb, var(--border) 60%, transparent)",
        boxShadow: isSelected
          ? "inset 3px 0 0 #ffffff, 0 10px 24px color-mix(in srgb, #121931 18%, transparent)"
          : hoverOnly
            ? isDark
              ? "inset 3px 0 0 color-mix(in oklab, #121931 72%, white), 0 8px 18px color-mix(in srgb, #121931 12%, transparent)"
              : "inset 3px 0 0 #121931, 0 8px 18px color-mix(in srgb, #121931 8%, transparent)"
            : email.readLater
              ? "inset 3px 0 0 #FF9E20"
              : "none",
        transform: hoverOnly
          ? "scale(1.003) translateX(1px)"
          : "scale(1) translateX(0)",
        transformOrigin: "left center",
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
      <div className="px-5 py-4 flex items-center gap-3">
        <SenderAvatar from={email.from} size={44} selected={isSelected} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p
                className="text-xs font-semibold truncate leading-snug transition-colors duration-200"
                style={{
                  color: isSelected
                    ? "#ffffff"
                    : hoverOnly
                      ? "#121931"
                      : "var(--foreground)",
                }}
              >
                {senderName}
              </p>

              <p
                className="text-base truncate leading-snug mt-1 transition-colors duration-200"
                style={{
                  color: isSelected
                    ? "#ffffff"
                    : hoverOnly
                      ? "#121931"
                      : "var(--foreground)",
                }}
              >
                {email.subject || "(No Subject)"}
              </p>

              <div className="flex items-center gap-2 mt-1.5">
                {folderName && (
                  <p
                    className="text-[11px] truncate transition-colors duration-200"
                    style={{
                      color: isSelected
                        ? "rgba(255,255,255,0.75)"
                        : hoverOnly
                          ? "#121931"
                          : "var(--muted-foreground)",
                    }}
                  >
                    Folder: {folderName}
                  </p>
                )}

                {email.readLater && (
                  <span
                    className="text-[10px] px-1.5 py-0.5"
                    style={{
                      color: isSelected ? "rgba(255,255,255,0.88)" : "#9a5d00",
                      background: isSelected
                        ? "rgba(255,255,255,0.08)"
                        : "color-mix(in srgb, #FF9E20 16%, transparent)",
                    }}
                  >
                    Read later
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span
                className="text-[11px] tabular-nums shrink-0 transition-colors duration-200"
                style={{
                  color: isSelected
                    ? "rgba(255,255,255,0.82)"
                    : hoverOnly
                      ? "#121931"
                      : "var(--muted-foreground)",
                }}
              >
                {formatTime(email.date)}
              </span>

              <div
                className={cn(
                  "flex items-center gap-1 transition-all duration-200",
                  keepRowActive
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 translate-x-2 pointer-events-none",
                )}
                onMouseEnter={() => setRowHovered(true)}
              >
                <RowActionButton
                  label="Delete"
                  icon={<Trash2 className="h-4 w-4" />}
                  destructive
                  onClick={() => onDeleteEmail(email.id)}
                />

                <RowActionButton
                  label={email.readLater ? "Remove read later" : "Read later"}
                  icon={<BookmarkPlus className="h-4 w-4" />}
                  onClick={() => onReadLater?.(email.id)}
                  active={Boolean(email.readLater)}
                />

                <div className="relative">
                  <RowActionButton
                    label="Add in folder"
                    icon={<Folder className="h-4 w-4" />}
                    onClick={() => setFolderMenuOpen((prev) => !prev)}
                    active={folderMenuOpen}
                  />

                  {folderMenuOpen && (
                    <FolderPicker
                      folders={folders}
                      onClose={() => setFolderMenuOpen(false)}
                      onSelectFolder={(folderId) =>
                        onMoveToFolder(email.id, folderId)
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DraftCard({
  draft,
  isActive,
  onClick,
  onDelete,
}: {
  draft: DraftEmail;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="group w-full cursor-pointer transition-all duration-200"
      style={{
        background: isActive
          ? "color-mix(in oklab, #121931 14%, white)"
          : hovered
            ? "color-mix(in oklab, #121931 8%, white)"
            : "transparent",
        borderBottom:
          "1px solid color-mix(in srgb, var(--border) 60%, transparent)",
        boxShadow:
          hovered && !isActive
            ? "inset 3px 0 0 color-mix(in oklab, #121931 70%, white)"
            : isActive
              ? "inset 3px 0 0 #121931"
              : "none",
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="px-5 py-4">
        <div className="flex items-start gap-2.5">
          <div
            className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center"
            style={{
              background:
                isActive || hovered
                  ? "color-mix(in oklab, #121931 14%, white)"
                  : "color-mix(in srgb, var(--muted-foreground) 10%, transparent)",
            }}
          >
            <MailOpen
              className="h-4 w-4"
              style={{
                color:
                  isActive || hovered ? "#121931" : "var(--muted-foreground)",
              }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-medium truncate leading-snug"
              style={{
                color: isActive || hovered ? "#121931" : "var(--foreground)",
              }}
            >
              {draft.subject || "Untitled"}
            </p>
            <p
              className="text-xs truncate mt-0.5"
              style={{
                color:
                  isActive || hovered ? "#121931" : "var(--muted-foreground)",
              }}
            >
              {draft.recipientEmail || "No recipient"}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-destructive rounded-none"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete draft"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        <div className="flex items-center gap-1 mt-2 pl-11">
          <span
            className="text-[10px] tabular-nums"
            style={{
              color:
                isActive || hovered ? "#121931" : "var(--muted-foreground)",
            }}
          >
            {formatTime(draft.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

function ScheduledEmailCard({
  item,
  isActive,
  onClick,
  onDelete,
}: {
  item: ScheduledEmail;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="group w-full cursor-pointer transition-all duration-200"
      style={{
        background: isActive
          ? "color-mix(in oklab, #121931 14%, white)"
          : hovered
            ? "color-mix(in oklab, #121931 8%, white)"
            : "transparent",
        borderBottom:
          "1px solid color-mix(in srgb, var(--border) 60%, transparent)",
        boxShadow:
          hovered && !isActive
            ? "inset 3px 0 0 color-mix(in oklab, #121931 70%, white)"
            : isActive
              ? "inset 3px 0 0 #121931"
              : "none",
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="px-5 py-4">
        <div className="flex items-start gap-2.5">
          <div
            className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center"
            style={{
              background:
                isActive || hovered
                  ? "color-mix(in oklab, #121931 14%, white)"
                  : "color-mix(in srgb, var(--muted-foreground) 10%, transparent)",
            }}
          >
            <CalendarClock
              className="h-4 w-4"
              style={{
                color:
                  isActive || hovered ? "#121931" : "var(--muted-foreground)",
              }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-medium truncate leading-snug"
              style={{
                color: isActive || hovered ? "#121931" : "var(--foreground)",
              }}
            >
              {item.subject || "Untitled"}
            </p>
            <p
              className="text-xs truncate mt-0.5"
              style={{
                color:
                  isActive || hovered ? "#121931" : "var(--muted-foreground)",
              }}
            >
              {item.recipientEmail || "No recipient"}
            </p>
            <p
              className="text-[10px] truncate mt-1"
              style={{
                color:
                  isActive || hovered ? "#121931" : "var(--muted-foreground)",
              }}
            >
              Scheduled {formatScheduledDateTime(item.scheduledFor)}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-destructive rounded-none"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete scheduled email"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
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
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setSearchQuery("");
  }, [activeSection, selectedFolderId]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = mounted
    ? theme === "system"
      ? resolvedTheme
      : theme
    : "light";
  const isDark = activeTheme === "dark";
  const topAccentColor = isDark ? "#FF9E20" : "#121931";

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
    const combined = [...inboxEmails, ...sentEmails];
    return filterEmails(combined.filter((e) => e.folderId === selectedFolderId));
  }, [inboxEmails, sentEmails, selectedFolderId, searchQuery]);

  const visibleEmails = useMemo(() => {
    if (activeSection === "inbox") return filterEmails(inboxEmails);
    if (activeSection === "sent") return filterEmails(sentEmails);
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
      icon: <Inbox className="h-5 w-5" style={{ color: topAccentColor }} />,
      description: "Everything that's landed in your inbox",
    },
    sent: {
      label: "Sent",
      icon: (
        <SendHorizontal className="h-5 w-5" style={{ color: topAccentColor }} />
      ),
      description: "Emails you've already sent",
    },
    drafts: {
      label: "Drafts",
      icon: <MailOpen className="h-5 w-5" style={{ color: topAccentColor }} />,
      description: "Unfinished emails, ready to pick back up",
    },
    scheduled: {
      label: "Scheduled",
      icon: (
        <CalendarClock className="h-5 w-5" style={{ color: topAccentColor }} />
      ),
      description: "Queued up to send automatically",
    },
    folder: {
      label: selectedFolder?.name || "Folder",
      icon: <Folder className="h-5 w-5" style={{ color: topAccentColor }} />,
      description: selectedFolder
        ? `Emails inside folder: ${selectedFolder.name}`
        : "Choose a folder from the sidebar",
    },
  };

  const meta = sectionMeta[activeSection];

  return (
    <div className="relative h-full w-full bg-card text-foreground">
      <div className="h-full w-full overflow-y-auto bg-card">
        <div className="w-full h-full px-0 py-0">
          <div className="flex items-start justify-between gap-4 flex-wrap px-6 md:px-8 py-5 border-b border-border bg-card">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="flex items-center justify-center h-10 w-10 rounded-none border border-border bg-card shrink-0"
                style={{
                  color: topAccentColor,
                  boxShadow:
                    "0 0 0 1px color-mix(in srgb, #121931 10%, var(--border))",
                }}
              >
                {meta.icon}
              </span>

              <div className="min-w-0">
                <h1
                  className="truncate"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontStyle: "italic",
                    fontSize: "1.35rem",
                    letterSpacing: "-0.02em",
                    color: "var(--foreground)",
                  }}
                >
                  {meta.label}
                </h1>
                <p
                  className="text-xs mt-0.5 truncate"
                  style={{ color: topAccentColor }}
                >
                  {meta.description}
                </p>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-3 w-full sm:w-auto sm:min-w-[360px] justify-end">
              <div className="relative w-full sm:w-[360px] md:w-[420px]">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                  style={{ color: "#121931" }}
                />
                <input
                  type="text"
                  placeholder={`Search ${meta.label.toLowerCase()}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-none pl-10 pr-10 py-2.5 text-sm text-foreground outline-none transition-all duration-200 border"
                  style={{
                    background: "color-mix(in srgb, #121931 14%, transparent)",
                    borderColor:
                      "color-mix(in srgb, #121931 30%, var(--border))",
                    boxShadow:
                      "0 8px 20px color-mix(in srgb, #121931 12%, transparent), inset 0 0 0 1px color-mix(in srgb, #121931 8%, white)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    color: "var(--foreground)",
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-none"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" style={{ color: "#121931" }} />
                  </button>
                )}
              </div>

              {canRefresh && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-none bg-transparent border-0 shadow-none ring-0 outline-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-110 shrink-0"
                  onClick={
                    activeSection === "inbox" ? onRefreshInbox : onRefreshSent
                  }
                  aria-label={`Refresh ${meta.label}`}
                >
                  <RefreshCw
                    className={cn("h-4 w-4", isLoading && "animate-spin")}
                    style={{ color: topAccentColor }}
                  />
                </Button>
              )}
            </div>
          </div>

          <div className="w-full bg-card">
            {activeSection === "inbox" &&
              (isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
                  <span className="text-sm text-muted-foreground/40">
                    Loading inbox...
                  </span>
                </div>
              ) : visibleEmails.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
                  <Inbox className="h-10 w-10 text-muted-foreground/20" />
                  <p
                    className="text-sm text-muted-foreground/40 italic"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {searchQuery ? "No results found" : "No inbox emails"}
                  </p>
                </div>
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
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
                  <span className="text-sm text-muted-foreground/40">
                    Loading emails...
                  </span>
                </div>
              ) : visibleEmails.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
                  <SendHorizontal className="h-10 w-10 text-muted-foreground/20" />
                  <p
                    className="text-sm text-muted-foreground/40 italic"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {searchQuery ? "No results found" : "No sent emails"}
                  </p>
                </div>
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
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
                  <Folder className="h-10 w-10 text-muted-foreground/20" />
                  <p
                    className="text-sm text-muted-foreground/40 italic"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    Select a folder from the sidebar
                  </p>
                </div>
              ) : folderEmails.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
                  <Folder className="h-10 w-10 text-muted-foreground/20" />
                  <p
                    className="text-sm text-muted-foreground/40 italic"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {searchQuery
                      ? "No results found"
                      : "No emails in this folder"}
                  </p>
                </div>
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
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
                  <MailOpen className="h-10 w-10 text-muted-foreground/20" />
                  <p
                    className="text-sm text-muted-foreground/40 italic"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {searchQuery ? "No results found" : "No drafts yet"}
                  </p>
                </div>
              ) : (
                filteredDrafts.map((draft) => (
                  <DraftCard
                    key={draft.id}
                    draft={draft}
                    isActive={activeDraftId === draft.id}
                    onClick={() => onSelectDraft(draft)}
                    onDelete={() => onDeleteDraft(draft.id)}
                  />
                ))
              ))}

            {activeSection === "scheduled" &&
              (filteredScheduled.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
                  <CalendarClock className="h-10 w-10 text-muted-foreground/20" />
                  <p
                    className="text-sm text-muted-foreground/40 italic"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {searchQuery ? "No results found" : "No scheduled emails"}
                  </p>
                </div>
              ) : (
                filteredScheduled.map((item) => (
                  <ScheduledEmailCard
                    key={item.id}
                    item={item}
                    isActive={activeScheduledId === item.id}
                    onClick={() => onSelectScheduled(item)}
                    onDelete={() => onDeleteScheduled(item.id)}
                  />
                ))
              ))}
          </div>
        </div>
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
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = mounted
    ? theme === "system"
      ? resolvedTheme
      : theme
    : "light";
  const isDark = activeTheme === "dark";
  const detailAccentColor = isDark ? "#FF9E20" : "#121931";

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
        className="absolute inset-0 bg-black/10 backdrop-blur-[1px] transition-opacity duration-500"
        style={{ opacity: isVisible ? 1 : 0 }}
        onClick={onClose}
      />
      <aside
        className="absolute inset-y-0 right-0 w-full h-full bg-background shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col border-l border-border overflow-hidden"
        style={{
          transform: isVisible ? "translateX(0)" : "translateX(100%)",
          opacity: isVisible ? 1 : 0.98,
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0 border-b border-border bg-card"
          style={{
            boxShadow: "0 1px 0 color-mix(in srgb, #121931 8%, var(--border))",
          }}
        >
          <div className="flex items-center gap-2 text-sm font-medium min-w-0">
            <PanelRightOpen
              className="h-4 w-4 shrink-0"
              style={{ color: detailAccentColor }}
            />
            <span className="truncate" style={{ color: detailAccentColor }}>
              {email?.subject || "Email details"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-none"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading email...</p>
          </div>
        ) : errorMessage ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 text-center">
            <Mail className="h-10 w-10 text-muted-foreground/30" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Unable to load email
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {errorMessage}
              </p>
            </div>
          </div>
        ) : shouldRenderEmptyState ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 text-center">
            <Mail className="h-10 w-10 text-muted-foreground/30" />
            <div>
              <p className="text-sm font-medium text-foreground">
                No email selected
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Select an email to view its details.
              </p>
            </div>
          </div>
        ) : email ? (
          <>
            <div
              className="mx-5 mt-5 rounded-none px-4 py-4 text-sm shrink-0 border border-border bg-card"
              style={{
                background: isDark
                  ? "color-mix(in oklab, #2a2b28 82%, black)"
                  : "color-mix(in oklab, #2a2b28 8%, white)",
                boxShadow:
                  "0 0 0 1px color-mix(in srgb, #2a2b28 8%, var(--border)), 0 8px 22px color-mix(in srgb, #121931 8%, transparent)",
              }}
            >
              <div className="flex items-start gap-3">
                <SenderAvatar from={email.from} size={44} />
                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <p className="font-medium break-words text-foreground">
                      {getSenderDisplayName(email.from) || "Unknown Sender"}
                    </p>
                    {extractEmailAddress(email.from) && (
                      <p className="text-xs text-muted-foreground break-all">
                        {extractEmailAddress(email.from)}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <span className="text-muted-foreground w-14 shrink-0">
                      Subject
                    </span>
                    <span className="font-medium break-words text-foreground">
                      {email.subject || "—"}
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <span className="text-muted-foreground w-14 shrink-0">
                      Date
                    </span>
                    <span className="break-words text-foreground">
                      {email.date || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div
                className="rounded-none min-h-full px-4 py-4 bg-card border border-border"
                style={{
                  boxShadow:
                    "0 0 0 1px color-mix(in srgb, #121931 8%, var(--border)), 0 8px 22px color-mix(in srgb, #121931 8%, transparent)",
                }}
              >
                {hasHtml ? (
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed text-foreground">
                    {plain || "No body content."}
                  </pre>
                )}
              </div>
            </div>
          </>
        ) : null}
      </aside>
    </div>
  );
}