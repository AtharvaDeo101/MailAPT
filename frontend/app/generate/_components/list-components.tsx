"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import DOMPurify from "dompurify";
import {
  ArrowDownUp,
  BookmarkPlus,
  CalendarClock,
  Folder,
  FolderInput,
  Inbox,
  Loader2,
  Mail,
  SendHorizontal,
  Sparkles,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { getGravatarUrl, summarizeEmail } from "../_lib/api";
import {
  decodeSnippet,
  extractEmailAddress,
  formatScheduledDateTime,
  formatTime,
  getLetterAvatarColors,
  getSenderDisplayName,
  getSenderInitial,
  isUnread,
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

type SidebarSection = ActiveSection;

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
      className="hover-pop inline-flex h-7 w-7 items-center justify-center rounded-full bg-transparent border-0 outline-none"
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
              className="hover-lift w-full flex items-center gap-2 px-3 h-8 text-left text-[13px] origin-left"
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

type ListFilter = "all" | "unread" | "readLater";

/** Injects a self-removing ripple span at the pointer position. */
function useRipple() {
  return useCallback((e: React.PointerEvent<HTMLElement>) => {
    const host = e.currentTarget;
    if (!host) return;

    const rect = host.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const span = document.createElement("span");

    span.className = "ripple";
    span.style.width = `${size}px`;
    span.style.height = `${size}px`;
    span.style.left = `${e.clientX - rect.left - size / 2}px`;
    span.style.top = `${e.clientY - rect.top - size / 2}px`;
    span.addEventListener("animationend", () => span.remove());

    host.appendChild(span);
  }, []);
}

function MailCheckbox({
  checked,
  indeterminate = false,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate && !checked;
  }, [indeterminate, checked]);

  return (
    <input
      ref={ref}
      type="checkbox"
      className="mail-check shrink-0"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      onClick={(e) => e.stopPropagation()}
      aria-label={label}
    />
  );
}

function ViewTab({
  label,
  count,
  isActive,
  onClick,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      onClick={onClick}
      className="zoho-tab inline-flex items-center gap-1.5 whitespace-nowrap"
      aria-selected={isActive}
    >
      {label}
      {count > 0 && <span className="tabular-nums opacity-65">{count}</span>}
    </button>
  );
}

function BulkButton({
  label,
  icon,
  onClick,
  destructive = false,
  innerRef,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  innerRef?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={innerRef}
      type="button"
      onClick={onClick}
      className="hover-press inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[12px] font-medium border"
      style={{
        borderColor: destructive
          ? "color-mix(in srgb, #c5221f 40%, transparent)"
          : "var(--border)",
        color: destructive ? "#c5221f" : "var(--foreground)",
        background: "var(--card)",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

/** Command bar above the message list: selection, bulk actions, filters, sort. */
function ListToolbar({
  totalCount,
  unreadCount,
  readLaterCount,
  checkedCount,
  allChecked,
  onToggleAll,
  filter,
  onFilterChange,
  sortDesc,
  onToggleSort,
  folders,
  onBulkDelete,
  onBulkReadLater,
  onBulkMove,
  onClearSelection,
}: {
  totalCount: number;
  unreadCount: number;
  readLaterCount: number;
  checkedCount: number;
  allChecked: boolean;
  onToggleAll: (next: boolean) => void;
  filter: ListFilter;
  onFilterChange: (f: ListFilter) => void;
  sortDesc: boolean;
  onToggleSort: () => void;
  folders: FolderItem[];
  onBulkDelete: () => void;
  onBulkReadLater: () => void;
  onBulkMove: (folderId: string) => void;
  onClearSelection: () => void;
}) {
  const [moveMenuOpen, setMoveMenuOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const moveTriggerRef = useRef<HTMLButtonElement | null>(null);

  const hasSelection = checkedCount > 0;

  return (
    <div className="shrink-0 flex items-center gap-3 px-3.5 h-11 border-b border-border bg-card">
      <MailCheckbox
        checked={allChecked && totalCount > 0}
        indeterminate={hasSelection}
        onChange={onToggleAll}
        label="Select all messages"
      />

      {hasSelection ? (
        <div className="slide-down flex items-center gap-2 min-w-0">
          <span
            className="text-[12px] font-semibold tabular-nums shrink-0"
            style={{ color: ACCENT }}
          >
            {checkedCount} selected
          </span>

          <BulkButton
            label="Delete"
            icon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={onBulkDelete}
            destructive
          />

          <BulkButton
            label="Read later"
            icon={<BookmarkPlus className="h-3.5 w-3.5" />}
            onClick={onBulkReadLater}
          />

          <div className="relative">
            <BulkButton
              innerRef={moveTriggerRef}
              label="Move"
              icon={<FolderInput className="h-3.5 w-3.5" />}
              onClick={() => {
                if (!moveMenuOpen && moveTriggerRef.current) {
                  setAnchorRect(moveTriggerRef.current.getBoundingClientRect());
                }
                setMoveMenuOpen((prev) => !prev);
              }}
            />

            {moveMenuOpen && anchorRect && (
              <FolderPicker
                folders={folders}
                anchorRect={anchorRect}
                onClose={() => setMoveMenuOpen(false)}
                onSelectFolder={onBulkMove}
              />
            )}
          </div>

          <button
            type="button"
            onClick={onClearSelection}
            className="hover-pop inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
            aria-label="Clear selection"
            title="Clear selection"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div
          role="tablist"
          className="flex items-end gap-4 min-w-0 self-stretch overflow-x-auto"
        >
          <ViewTab
            label="All"
            count={totalCount}
            isActive={filter === "all"}
            onClick={() => onFilterChange("all")}
          />
          <ViewTab
            label="Unread"
            count={unreadCount}
            isActive={filter === "unread"}
            onClick={() => onFilterChange("unread")}
          />
          <ViewTab
            label="Read later"
            count={readLaterCount}
            isActive={filter === "readLater"}
            onClick={() => onFilterChange("readLater")}
          />
        </div>
      )}

      <button
        type="button"
        onClick={onToggleSort}
        className="hover-lift ml-auto shrink-0 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[12px] text-muted-foreground hover:text-foreground border border-border"
        title="Toggle sort order"
      >
        <ArrowDownUp className="h-3.5 w-3.5" />
        {sortDesc ? "Newest" : "Oldest"}
      </button>
    </div>
  );
}

function EmailCard({
  email,
  index,
  onClick,
  isSelected,
  isChecked,
  onToggleCheck,
  folderName,
  folders,
  onDeleteEmail,
  onMoveToFolder,
  onReadLater,
}: {
  email: GmailEmailWithFolder;
  index: number;
  onClick: () => void;
  isSelected: boolean;
  isChecked: boolean;
  onToggleCheck: (next: boolean) => void;
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
  const ripple = useRipple();

  const keepRowActive = rowHovered || folderMenuOpen;
  const hoverOnly = keepRowActive && !isSelected && !isChecked;

  const senderName = getSenderDisplayName(email.from) || "Unknown Sender";
  const unread = isUnread(email.labelIds);
  const snippet = decodeSnippet(email.snippet);
  const highlighted = isSelected || isChecked;

  // Zoho reads unread as the bright row and read as the recessed one
  const background = highlighted
    ? ACCENT_TINT
    : email.readLater
      ? "color-mix(in srgb, #FF9E20 10%, transparent)"
      : hoverOnly
        ? HOVER_BG
        : unread
          ? "var(--mail-unread-bg)"
          : "var(--mail-read-bg)";

  const leftBar = highlighted
    ? ACCENT
    : email.readLater
      ? "#FF9E20"
      : unread
        ? ACCENT
        : "transparent";

  const textColor = highlighted ? ACCENT : "var(--foreground)";

  return (
    <div
      role="button"
      tabIndex={0}
      className="group hover-row row-in relative overflow-hidden w-full cursor-pointer outline-none"
      style={
        {
          background,
          borderBottom: "1px solid var(--border)",
          boxShadow: `inset 3px 0 0 ${leftBar}`,
          "--row-i": Math.min(index, 14),
        } as React.CSSProperties
      }
      onPointerDown={ripple}
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
      <div className="pl-3.5 pr-3 py-2 flex items-center gap-2.5">
        <MailCheckbox
          checked={isChecked}
          onChange={onToggleCheck}
          label={`Select email from ${senderName}`}
        />

        <span className="w-1.5 shrink-0 flex items-center justify-center">
          {unread && (
            <span
              className="pop-in h-1.5 w-1.5 rounded-full"
              style={{ background: ACCENT }}
              title="Unread"
            />
          )}
        </span>

        <SenderAvatar from={email.from} size={28} selected={highlighted} />

        <span
          className="w-32 md:w-40 shrink-0 truncate text-[13px]"
          style={{ color: textColor, fontWeight: unread ? 700 : 500 }}
        >
          {senderName}
        </span>

        <span className="min-w-0 flex-1 flex items-center gap-2">
          <span
            className="shrink-0 max-w-[45%] truncate text-[13px]"
            style={{ color: textColor, fontWeight: unread ? 600 : 400 }}
          >
            {email.subject || "(No Subject)"}
          </span>

          {snippet && (
            <span className="hidden sm:inline min-w-0 flex-1 truncate text-[12.5px] text-muted-foreground">
              — {snippet}
            </span>
          )}

          {folderName && (
            <span
              className="hidden lg:inline-flex shrink-0 items-center gap-1 rounded-sm px-1.5 py-px text-[10px] leading-4"
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
            <div className="slide-down flex items-center gap-0.5">
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
                  className="hover-pop inline-flex h-7 w-7 items-center justify-center rounded-full border-0 outline-none"
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
                color: highlighted ? ACCENT : "var(--muted-foreground)",
                fontWeight: unread ? 600 : 400,
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
      className="group hover-row w-full cursor-pointer outline-none"
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
      <span className="text-muted-foreground/25 [&_svg]:h-9 [&_svg]:w-9">
        {icon}
      </span>
      <p className="text-[13px] text-muted-foreground/70">{message}</p>
    </div>
  );
}

export function EmailListView({
  activeSection,
  searchQuery,
  inboxEmails,
  sentEmails,
  labelEmails,
  labelName,
  labelLoading,
  drafts,
  scheduledEmails,
  activeDraftId,
  activeScheduledId,
  inboxLoading,
  sentLoading,
  selectedEmailId,
  selectedFolderId,
  folders,
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
  searchQuery: string;
  inboxEmails: GmailEmailWithFolder[];
  sentEmails: GmailEmailWithFolder[];
  labelEmails: GmailEmailWithFolder[];
  labelName?: string | null;
  labelLoading?: boolean;
  drafts: DraftEmail[];
  scheduledEmails: ScheduledEmail[];
  activeDraftId: string | null;
  activeScheduledId: string | null;
  inboxLoading: boolean;
  sentLoading: boolean;
  selectedEmailId: string | null;
  selectedFolderId?: string | null;
  folders: FolderItem[];
  onOpenGmailEmail: (emailId: string) => void;
  onSelectDraft: (d: DraftEmail) => void;
  onDeleteDraft: (id: string) => void;
  onSelectScheduled: (d: ScheduledEmail) => void;
  onDeleteScheduled: (id: string) => void;
  onDeleteEmail: (emailId: string) => void;
  onMoveEmailToFolder: (emailId: string, folderId: string) => void;
  onMarkReadLater?: (emailId: string) => void;
}) {
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<ListFilter>("all");
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    setCheckedIds([]);
    setFilter("all");
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
        e.from?.toLowerCase().includes(q) ||
        e.to?.toLowerCase().includes(q),
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
    const combined = dedupeById([
      ...inboxEmails,
      ...sentEmails,
      ...labelEmails,
    ]);
    return filterEmails(combined.filter((e) => e.folderId === selectedFolderId));
  }, [inboxEmails, sentEmails, labelEmails, selectedFolderId, searchQuery]);

  const visibleEmails = useMemo(() => {
    if (activeSection === "inbox") return filterEmails(dedupeById(inboxEmails));
    if (activeSection === "sent") return filterEmails(dedupeById(sentEmails));
    if (activeSection === "label") return filterEmails(dedupeById(labelEmails));
    return [];
  }, [activeSection, inboxEmails, sentEmails, labelEmails, searchQuery]);

  // emails for the active mail section, before the toolbar's filter/sort
  const baseEmails =
    activeSection === "folder"
      ? folderEmails
      : activeSection === "inbox" ||
          activeSection === "sent" ||
          activeSection === "label"
        ? visibleEmails
        : [];

  const unreadCount = baseEmails.filter((e) => isUnread(e.labelIds)).length;
  const readLaterCount = baseEmails.filter((e) => e.readLater).length;

  const listEmails = useMemo(() => {
    const kept =
      filter === "unread"
        ? baseEmails.filter((e) => isUnread(e.labelIds))
        : filter === "readLater"
          ? baseEmails.filter((e) => e.readLater)
          : baseEmails;

    return [...kept].sort((a, b) => {
      const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
      return sortDesc ? diff : -diff;
    });
  }, [baseEmails, filter, sortDesc]);

  const checkedSet = useMemo(() => new Set(checkedIds), [checkedIds]);

  const toggleChecked = (emailId: string, next: boolean) =>
    setCheckedIds((prev) =>
      next ? [...prev, emailId] : prev.filter((id) => id !== emailId),
    );

  const runBulk = (action: (emailId: string) => void) => {
    checkedIds.forEach(action);
    setCheckedIds([]);
  };

  const renderEmailCard = (email: GmailEmailWithFolder, index: number) => (
    <EmailCard
      key={email.id}
      email={email}
      index={index}
      isSelected={selectedEmailId === email.id}
      isChecked={checkedSet.has(email.id)}
      onToggleCheck={(next) => toggleChecked(email.id, next)}
      onClick={() => onOpenGmailEmail(email.id)}
      folderName={folders.find((f) => f.id === email.folderId)?.name ?? null}
      folders={folders}
      onDeleteEmail={onDeleteEmail}
      onMoveToFolder={onMoveEmailToFolder}
      onReadLater={onMarkReadLater}
    />
  );

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
        : activeSection === "label"
          ? Boolean(labelLoading)
          : false;

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
    label: {
      label: labelName || "Tags",
      icon: <Tag className="h-4 w-4" />,
      description: labelName
        ? `Gmail messages tagged ${labelName}`
        : "Choose a tag from the sidebar",
    },
  };

  const meta = sectionMeta[activeSection];

  const itemCount =
    activeSection === "drafts"
      ? filteredDrafts.length
      : activeSection === "scheduled"
        ? filteredScheduled.length
        : listEmails.length;

  const showToolbar =
    activeSection === "inbox" ||
    activeSection === "sent" ||
    activeSection === "label" ||
    (activeSection === "folder" && !!selectedFolderId);

  return (
    <div className="relative h-full w-full bg-card text-foreground flex flex-col">
      <div className="shrink-0 flex items-center gap-2.5 px-4 h-11 border-b border-border bg-card">
        <span className="shrink-0" style={{ color: ACCENT }}>
          {meta.icon}
        </span>

        <h1 className="truncate text-[14px] font-semibold tracking-tight">
          {meta.label}
        </h1>

        {itemCount > 0 && (
          <span className="shrink-0 text-[12px] tabular-nums text-muted-foreground">
            ({itemCount})
          </span>
        )}

        {isLoading && (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
        )}

        <p className="ml-auto hidden truncate text-[11.5px] text-muted-foreground lg:block">
          {searchQuery
            ? `Filtering by "${searchQuery}"`
            : meta.description}
        </p>
      </div>

      {showToolbar && (
        <ListToolbar
          totalCount={baseEmails.length}
          unreadCount={unreadCount}
          readLaterCount={readLaterCount}
          checkedCount={checkedIds.length}
          allChecked={
            listEmails.length > 0 &&
            listEmails.every((e) => checkedSet.has(e.id))
          }
          onToggleAll={(next) =>
            setCheckedIds(next ? listEmails.map((e) => e.id) : [])
          }
          filter={filter}
          onFilterChange={setFilter}
          sortDesc={sortDesc}
          onToggleSort={() => setSortDesc((prev) => !prev)}
          folders={folders}
          onBulkDelete={() => runBulk(onDeleteEmail)}
          onBulkReadLater={() =>
            onMarkReadLater && runBulk(onMarkReadLater)
          }
          onBulkMove={(folderId) =>
            runBulk((id) => onMoveEmailToFolder(id, folderId))
          }
          onClearSelection={() => setCheckedIds([])}
        />
      )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-card">
        {(activeSection === "inbox" ||
          activeSection === "sent" ||
          activeSection === "label" ||
          activeSection === "folder") &&
          (isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2.5">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
              <span className="text-[13px] text-muted-foreground/70">
                Loading {meta.label.toLowerCase()}...
              </span>
            </div>
          ) : activeSection === "folder" && !selectedFolderId ? (
            <EmptyState
              icon={<Folder className="h-9 w-9" />}
              message="Select a folder from the sidebar"
            />
          ) : activeSection === "label" && !labelName ? (
            <EmptyState
              icon={<Tag className="h-9 w-9" />}
              message="Select a tag from the sidebar"
            />
          ) : listEmails.length === 0 ? (
            <EmptyState
              icon={meta.icon}
              message={
                searchQuery || filter !== "all"
                  ? "No results found"
                  : `No emails in ${meta.label}`
              }
            />
          ) : (
            listEmails.map(renderEmailCard)
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

/** Zia-style summary card: calls /summarize_email for the open message. */
function SummaryCard({
  content,
  emailId,
}: {
  content: string;
  emailId: string;
}) {
  const [summary, setSummary] = useState("");
  const [type, setType] = useState<"brief" | "detailed">("brief");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // a different message invalidates whatever was summarised before
  useEffect(() => {
    setSummary("");
    setError(null);
  }, [emailId]);

  const run = async (next: "brief" | "detailed") => {
    if (!content.trim()) {
      setError("This email has no text to summarise.");
      return;
    }

    setType(next);
    setLoading(true);
    setError(null);

    try {
      setSummary(await summarizeEmail(content, next));
    } catch (err: any) {
      setError(err?.message || "Could not summarise this email.");
    } finally {
      setLoading(false);
    }
  };

  if (!summary && !loading && !error) {
    return (
      <button
        type="button"
        onClick={() => run("brief")}
        className="hover-press mb-4 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border text-[12px] font-medium"
        style={{
          borderColor: `color-mix(in srgb, ${ACCENT} 40%, transparent)`,
          color: ACCENT,
          background: ACCENT_TINT,
        }}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Summarize
      </button>
    );
  }

  return (
    <div
      className="slide-down mb-4 rounded-md border p-3"
      style={{
        borderColor: `color-mix(in srgb, ${ACCENT} 28%, transparent)`,
        background: ACCENT_TINT,
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 shrink-0" style={{ color: ACCENT }} />
        <span
          className="text-[11px] font-bold uppercase tracking-[0.06em]"
          style={{ color: ACCENT }}
        >
          Summary
        </span>

        <div className="ml-auto flex items-center gap-1">
          {(["brief", "detailed"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => run(option)}
              disabled={loading}
              className="hover-lift h-6 rounded-md px-2 text-[11px] capitalize disabled:opacity-40"
              style={{
                background: type === option ? "var(--card)" : "transparent",
                color: type === option ? ACCENT : "var(--muted-foreground)",
                fontWeight: type === option ? 600 : 400,
              }}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Summarizing...
        </p>
      ) : error ? (
        <p className="text-[12.5px]" style={{ color: "#c5221f" }}>
          {error}
        </p>
      ) : (
        <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-foreground">
          {summary}
        </p>
      )}
    </div>
  );
}

function DetailActionButton({
  label,
  icon,
  onClick,
  destructive = false,
  innerRef,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  innerRef?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={innerRef}
      type="button"
      onClick={onClick}
      title={label}
      className="hover-press inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border text-[12px] font-medium"
      style={{
        borderColor: destructive
          ? "color-mix(in srgb, #c5221f 40%, transparent)"
          : "var(--border)",
        color: destructive ? "#c5221f" : "var(--foreground)",
        background: "var(--card)",
      }}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export function EmailDetailOverlayPanel({
  isVisible,
  email,
  isLoading,
  errorMessage,
  onClose,
  folders,
  onMoveToFolder,
  onTrash,
}: {
  isVisible: boolean;
  email: GmailEmailDetail | null;
  isLoading: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  folders: FolderItem[];
  onMoveToFolder: (emailId: string, folderId: string) => void;
  onTrash: (emailId: string) => void;
}) {
  const [moveMenuOpen, setMoveMenuOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const moveTriggerRef = useRef<HTMLButtonElement | null>(null);

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

  // the summarizer wants prose, not markup
  const summaryText = useMemo(() => {
    if (plain.trim()) return plain;
    if (!sanitizedHtml || typeof window === "undefined") return "";

    return (
      new DOMParser().parseFromString(sanitizedHtml, "text/html").body
        .textContent || ""
    ).trim();
  }, [plain, sanitizedHtml]);

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

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            {email && (
              <>
                <div className="relative">
                  <DetailActionButton
                    innerRef={moveTriggerRef}
                    label="Move"
                    icon={<FolderInput className="h-3.5 w-3.5" />}
                    onClick={() => {
                      if (!moveMenuOpen && moveTriggerRef.current) {
                        setAnchorRect(
                          moveTriggerRef.current.getBoundingClientRect(),
                        );
                      }
                      setMoveMenuOpen((prev) => !prev);
                    }}
                  />

                  {moveMenuOpen && anchorRect && (
                    <FolderPicker
                      folders={folders}
                      anchorRect={anchorRect}
                      onClose={() => setMoveMenuOpen(false)}
                      onSelectFolder={(folderId) =>
                        onMoveToFolder(email.id, folderId)
                      }
                    />
                  )}
                </div>

                <DetailActionButton
                  label="Delete"
                  icon={<Trash2 className="h-3.5 w-3.5" />}
                  destructive
                  onClick={() => onTrash(email.id)}
                />
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="hover-pop inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-[var(--mail-hover)] hover:text-foreground"
              aria-label="Close"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
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
                    {email.to ? `To: ${email.to}` : email.subject || "(No Subject)"}
                  </p>
                </div>

                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {email.date || "—"}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <SummaryCard content={summaryText} emailId={email.id} />

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
