"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  PanelRightOpen,
  RefreshCw,
  Search,
  SendHorizonal,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getGravatarUrl, fetchEmailDetail } from "../_lib/api";
import {
  extractEmailAddress,
  formatScheduledDateTime,
  formatTime,
  getLetterAvatarColors,
  getSenderDisplayName,
  getSenderInitial,
} from "../_lib/generate-utils";
import {
  ActiveSection,
  DraftEmail,
  GmailEmail,
  GmailEmailDetail,
  ScheduledEmail,
} from "../_lib/types";

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
  const imageUrl = getGravatarUrl(from, size * 2);
  const initial = getSenderInitial(from);
  const colors = getLetterAvatarColors(initial);

  useEffect(() => {
    setImgError(false);
  }, [from]);

  if (imageUrl && !imgError) {
    return (
      <img
        src={imageUrl}
        alt={getSenderDisplayName(from)}
        width={size}
        height={size}
        onError={() => setImgError(true)}
        className="rounded-full shrink-0 object-cover"
        style={{
          width: size,
          height: size,
          border: selected
            ? "2px solid color-mix(in srgb, var(--primary) 28%, transparent)"
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
          ? "2px solid color-mix(in srgb, var(--primary) 28%, transparent)"
          : "1px solid var(--border)",
        fontSize: size >= 44 ? "16px" : size >= 32 ? "12px" : "10px",
      }}
      title={getSenderDisplayName(from)}
    >
      {initial}
    </div>
  );
}

function EmailCard({
  email,
  onClick,
  isSelected,
}: {
  email: GmailEmail;
  onClick: () => void;
  isSelected: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="w-full cursor-pointer overflow-hidden transition-all duration-150 rounded-none"
      style={{
        background: isSelected
          ? "color-mix(in srgb, var(--primary) 16%, transparent)"
          : hovered
            ? "color-mix(in srgb, var(--foreground) 6%, transparent)"
            : "transparent",
        border: isSelected
          ? "1px solid color-mix(in srgb, var(--primary) 28%, var(--border))"
          : "1px solid color-mix(in srgb, var(--border) 70%, transparent)",
        boxShadow:
          hovered || isSelected
            ? "0 6px 18px color-mix(in srgb, var(--foreground) 5%, transparent)"
            : "none",
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="px-4 py-3 flex items-center gap-3">
        <SenderAvatar from={email.from} size={36} selected={isSelected} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p
              className="text-xs font-semibold truncate leading-snug"
              style={{ color: isSelected ? "var(--primary)" : "var(--foreground)" }}
            >
              {getSenderDisplayName(email.from)}
            </p>
            <span
              className="text-[10px] tabular-nums shrink-0"
              style={{ color: isSelected ? "var(--primary)" : "var(--muted-foreground)" }}
            >
              {formatTime(email.date)}
            </span>
          </div>
          <p
            className="text-sm truncate leading-snug mt-0.5"
            style={{ color: isSelected ? "var(--primary)" : "var(--foreground)" }}
          >
            {email.subject || "(No Subject)"}
          </p>
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
  return (
    <div
      className={cn("group w-full cursor-pointer transition-all duration-150 rounded-none", !isActive && "hover:bg-accent")}
      style={{
        background: isActive ? "color-mix(in srgb, var(--primary) 16%, transparent)" : undefined,
        border: `1px solid ${
          isActive
            ? "color-mix(in srgb, var(--primary) 28%, var(--border))"
            : "color-mix(in srgb, var(--border) 70%, transparent)"
        }`,
        boxShadow: isActive ? "0 6px 18px color-mix(in srgb, var(--foreground) 5%, transparent)" : "none",
      }}
      onClick={onClick}
    >
      <div className="px-4 py-3">
        <div className="flex items-start gap-2.5">
          <div
            className={cn("h-8 w-8 rounded-full shrink-0 flex items-center justify-center", !isActive && "bg-muted-foreground/10")}
            style={{
              background: isActive ? "color-mix(in srgb, var(--primary) 18%, transparent)" : undefined,
            }}
          >
            <MailOpen
              className="h-3.5 w-3.5"
              style={{ color: isActive ? "var(--primary)" : "var(--muted-foreground)" }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate leading-snug" style={{ color: isActive ? "var(--primary)" : "var(--foreground)" }}>
              {draft.subject || "Untitled"}
            </p>
            <p className="text-xs truncate mt-0.5" style={{ color: isActive ? "var(--primary)" : "var(--muted-foreground)" }}>
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
        <div className="flex items-center gap-1 mt-2 pl-10">
          <span className="text-[10px] tabular-nums" style={{ color: isActive ? "var(--primary)" : "var(--muted-foreground)" }}>
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
  return (
    <div
      className={cn("group w-full cursor-pointer transition-all duration-150 rounded-none", !isActive && "hover:bg-accent")}
      style={{
        background: isActive ? "color-mix(in srgb, var(--primary) 16%, transparent)" : undefined,
        border: `1px solid ${
          isActive
            ? "color-mix(in srgb, var(--primary) 28%, var(--border))"
            : "color-mix(in srgb, var(--border) 70%, transparent)"
        }`,
        boxShadow: isActive ? "0 6px 18px color-mix(in srgb, var(--foreground) 5%, transparent)" : "none",
      }}
      onClick={onClick}
    >
      <div className="px-4 py-3">
        <div className="flex items-start gap-2.5">
          <div
            className={cn("h-8 w-8 rounded-full shrink-0 flex items-center justify-center", !isActive && "bg-muted-foreground/10")}
            style={{
              background: isActive ? "color-mix(in srgb, var(--primary) 18%, transparent)" : undefined,
            }}
          >
            <CalendarClock
              className="h-3.5 w-3.5"
              style={{ color: isActive ? "var(--primary)" : "var(--muted-foreground)" }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate leading-snug" style={{ color: isActive ? "var(--primary)" : "var(--foreground)" }}>
              {item.subject || "Untitled"}
            </p>
            <p className="text-xs truncate mt-0.5" style={{ color: isActive ? "var(--primary)" : "var(--muted-foreground)" }}>
              {item.recipientEmail || "No recipient"}
            </p>
            <p className="text-[10px] truncate mt-1" style={{ color: isActive ? "var(--primary)" : "var(--muted-foreground)" }}>
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
  onRefreshInbox,
  onRefreshSent,
  onSelectDraft,
  onDeleteDraft,
  onSelectScheduled,
  onDeleteScheduled,
}: {
  activeSection: ActiveSection;
  inboxEmails: GmailEmail[];
  sentEmails: GmailEmail[];
  drafts: DraftEmail[];
  scheduledEmails: ScheduledEmail[];
  activeDraftId: string | null;
  activeScheduledId: string | null;
  inboxLoading: boolean;
  sentLoading: boolean;
  selectedEmailId: string | null;
  onRefreshInbox: () => void;
  onRefreshSent: () => void;
  onSelectDraft: (d: DraftEmail) => void;
  onDeleteDraft: (id: string) => void;
  onSelectScheduled: (d: ScheduledEmail) => void;
  onDeleteScheduled: (id: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailEmail, setDetailEmail] = useState<GmailEmailDetail | null>(null);
  const [localSelectedEmailId, setLocalSelectedEmailId] = useState<string | null>(null);

  useEffect(() => {
    setSearchQuery("");
    setDetailOpen(false);
    setDetailLoading(false);
    setDetailEmail(null);
    setLocalSelectedEmailId(null);
  }, [activeSection]);

  const sectionMeta: Record<ActiveSection, { label: string; icon: React.ReactNode; description: string }> = {
    inbox: { label: "Inbox", icon: <Inbox className="h-5 w-5" />, description: "Everything that's landed in your inbox" },
    sent: { label: "Sent", icon: <SendHorizonal className="h-5 w-5" />, description: "Emails you've already sent" },
    drafts: { label: "Drafts", icon: <MailOpen className="h-5 w-5" />, description: "Unfinished emails, ready to pick back up" },
    scheduled: { label: "Scheduled", icon: <CalendarClock className="h-5 w-5" />, description: "Queued up to send automatically" },
  };

  const meta = sectionMeta[activeSection];

  const filterEmails = (emails: GmailEmail[]) => {
    if (!searchQuery.trim()) return emails;
    const q = searchQuery.toLowerCase();
    return emails.filter((e) => e.subject?.toLowerCase().includes(q) || e.from?.toLowerCase().includes(q));
  };

  const filterDrafts = (items: DraftEmail[]) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((d) => d.subject?.toLowerCase().includes(q) || d.recipientEmail?.toLowerCase().includes(q));
  };

  const filterScheduled = (items: ScheduledEmail[]) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((d) => d.subject?.toLowerCase().includes(q) || d.recipientEmail?.toLowerCase().includes(q));
  };

  const visibleEmails = useMemo(() => {
    if (activeSection === "inbox") return filterEmails(inboxEmails);
    if (activeSection === "sent") return filterEmails(sentEmails);
    return [];
  }, [activeSection, inboxEmails, sentEmails, searchQuery]);

  const isLoading = activeSection === "inbox" ? inboxLoading : activeSection === "sent" ? sentLoading : false;
  const canRefresh = activeSection === "inbox" || activeSection === "sent";

  const handleOpenGmailEmail = async (emailId: string) => {
    setLocalSelectedEmailId(emailId);
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailEmail(null);

    try {
      const fullEmail = await fetchEmailDetail(emailId);
      setDetailEmail(fullEmail);
    } catch (error) {
      console.error("Failed to load email detail:", error);
      setDetailEmail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
  };

  const activeSelectedId = selectedEmailId ?? localSelectedEmailId;

  return (
    <div className="relative h-full overflow-y-auto bg-white">
      <div className="w-full px-6 md:px-8 py-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span
              className="flex items-center justify-center h-10 w-10 rounded-none border border-border bg-white"
              style={{
                color: "var(--primary)",
                boxShadow: "0 0 0 1px color-mix(in srgb, var(--border) 70%, transparent)",
              }}
            >
              {meta.icon}
            </span>
            <div>
              <h1
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: "1.5rem",
                  letterSpacing: "-0.02em",
                  color: "var(--foreground)",
                }}
              >
                {meta.label}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
            </div>
          </div>

          {canRefresh && (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-none bg-white"
              onClick={activeSection === "inbox" ? onRefreshInbox : onRefreshSent}
              aria-label={`Refresh ${meta.label}`}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          )}
        </div>

        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 pointer-events-none" />
          <input
            type="text"
            placeholder={`Search ${meta.label.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white rounded-none pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-all duration-200 border border-border"
            style={{
              boxShadow: "0 0 0 1px color-mix(in srgb, var(--border) 70%, transparent)",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="space-y-1">
          {activeSection === "inbox" &&
            (isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
                <span className="text-sm text-muted-foreground/40">Loading inbox...</span>
              </div>
            ) : visibleEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
                <Inbox className="h-10 w-10 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground/40 italic" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {searchQuery ? "No results found" : "No inbox emails"}
                </p>
              </div>
            ) : (
              visibleEmails.map((email) => (
                <EmailCard
                  key={email.id}
                  email={email}
                  isSelected={activeSelectedId === email.id}
                  onClick={() => handleOpenGmailEmail(email.id)}
                />
              ))
            ))}

          {activeSection === "sent" &&
            (isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
                <span className="text-sm text-muted-foreground/40">Loading emails...</span>
              </div>
            ) : visibleEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
                <SendHorizonal className="h-10 w-10 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground/40 italic" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {searchQuery ? "No results found" : "No sent emails"}
                </p>
              </div>
            ) : (
              visibleEmails.map((email) => (
                <EmailCard
                  key={email.id}
                  email={email}
                  isSelected={activeSelectedId === email.id}
                  onClick={() => handleOpenGmailEmail(email.id)}
                />
              ))
            ))}

          {activeSection === "drafts" &&
            (filterDrafts(drafts).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
                <MailOpen className="h-10 w-10 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground/40 italic" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {searchQuery ? "No results found" : "No drafts yet"}
                </p>
              </div>
            ) : (
              filterDrafts(drafts).map((draft) => (
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
            (filterScheduled(scheduledEmails).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
                <CalendarClock className="h-10 w-10 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground/40 italic" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {searchQuery ? "No results found" : "No scheduled emails"}
                </p>
              </div>
            ) : (
              filterScheduled(scheduledEmails).map((item) => (
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

      <EmailDetailOverlayPanel
        isVisible={detailOpen}
        email={detailEmail}
        isLoading={detailLoading}
        onClose={handleCloseDetail}
      />
    </div>
  );
}

export function EmailDetailOverlayPanel({
  isVisible,
  email,
  isLoading,
  onClose,
}: {
  isVisible: boolean;
  email: GmailEmailDetail | null;
  isLoading: boolean;
  onClose: () => void;
}) {
  const plain = email?.plain_body || email?.body;
  const html = email?.html_body;
  const hasHtml = Boolean(html && html.trim());

  return (
    <div
      className="absolute inset-0 z-30 overflow-hidden"
      aria-hidden={!isVisible}
      style={{ pointerEvents: isVisible ? "auto" : "none" }}
    >
      <div
        className="absolute inset-0 bg-background/55 backdrop-blur-[2px] transition-opacity duration-500"
        style={{ opacity: isVisible ? 1 : 0 }}
        onClick={onClose}
      />
      <aside
        className="absolute inset-y-0 right-0 w-full max-w-3xl bg-white shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col border-l border-border"
        style={{
          transform: isVisible ? "translateX(0)" : "translateX(100%)",
          opacity: isVisible ? 1 : 0.98,
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0 border-b border-border bg-white"
          style={{
            boxShadow: "0 1px 0 color-mix(in srgb, var(--border) 85%, transparent)",
          }}
        >
          <div className="flex items-center gap-2 text-sm font-medium min-w-0">
            <PanelRightOpen className="h-4 w-4 shrink-0" style={{ color: "var(--foreground)" }} />
            <span className="truncate" style={{ color: "var(--primary)" }}>
              {email?.subject || "Email details"}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-none">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading email</p>
          </div>
        ) : !email ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 text-center">
            <Mail className="h-10 w-10 text-muted-foreground/30" />
            <div>
              <p className="text-sm font-medium text-foreground">Unable to load email</p>
              <p className="text-xs text-muted-foreground mt-1">The message details could not be fetched.</p>
            </div>
          </div>
        ) : (
          <>
            <div
              className="mx-5 mt-5 rounded-none px-4 py-4 text-sm shrink-0 border border-border"
              style={{
                background: "color-mix(in srgb, var(--primary) 10%, transparent)",
                boxShadow:
                  "0 0 0 1px color-mix(in srgb, var(--border) 70%, transparent), 0 8px 22px color-mix(in srgb, var(--foreground) 6%, transparent)",
              }}
            >
              <div className="flex items-start gap-3">
                <SenderAvatar from={email.from} size={44} />
                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <p className="font-medium break-words text-foreground">{getSenderDisplayName(email.from)}</p>
                    {extractEmailAddress(email.from) && (
                      <p className="text-xs text-muted-foreground break-all">{extractEmailAddress(email.from)}</p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <span className="text-muted-foreground w-14 shrink-0">Subject</span>
                    <span className="font-medium break-words text-foreground">{email.subject || "—"}</span>
                  </div>

                  <div className="flex gap-3">
                    <span className="text-muted-foreground w-14 shrink-0">Date</span>
                    <span className="break-words text-foreground">{email.date}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div
                className="rounded-none min-h-full px-4 py-4 bg-card/70 border border-border"
                style={{
                  boxShadow:
                    "0 0 0 1px color-mix(in srgb, var(--border) 70%, transparent), 0 8px 22px color-mix(in srgb, var(--foreground) 6%, transparent)",
                }}
              >
                {hasHtml ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: html! }} />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed text-foreground">
                    {plain || "No body content."}
                  </pre>
                )}
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}