"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Navigation } from "@/components/landing/navigation";
import {
  Send,
  User,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Eye,
  PlusCircle,
  Save,
  X,
  Mail,
  Clock,
  Trash2,
  MailOpen,
  Inbox,
  SendHorizonal,
  RefreshCw,
  Code,
  Paperclip,
  FileText,
  Star,
  CalendarClock,
  Settings,
  Search,
  ChevronRight,
} from "lucide-react";

const API = "http://localhost:5000";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface DraftEmail {
  id: string;
  subject: string;
  body: string;
  recipientEmail: string;
  createdAt: Date;
}

interface GmailEmail {
  id: string;
  subject: string;
  from: string;
  date: string;
}

interface GmailEmailDetail {
  id: string;
  subject: string;
  from: string;
  date: string;
  body: string;
  plain_body?: string;
  html_body?: string;
}

type ActiveSection = "inbox" | "sent" | "drafts" | "scheduled" | "favorites" | "settings" | null;

function formatTime(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return String(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return date.toLocaleDateString();
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── ANIMATED WAVE ────────────────────────────────────────────────────────────
function AnimatedWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const chars = "·∜─╯╒╠╉";
    let time = 0;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);
    const render = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.font = "14px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const cols = Math.floor(rect.width / 20);
      const rows = Math.floor(rect.height / 20);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const px = (x + 0.5) * (rect.width / cols);
          const py = (y + 0.5) * (rect.height / rows);
          const wave1 = Math.sin(x * 0.2 + time * 2) * Math.cos(y * 0.15 + time);
          const wave2 = Math.sin((x + y) * 0.1 + time * 1.5);
          const wave3 = Math.cos(x * 0.1 - y * 0.1 + time * 0.8);
          const combined = (wave1 + wave2 + wave3) / 3;
          const normalized = (combined + 1) / 2;
          const charIndex = Math.floor(normalized * (chars.length - 1));
          const alpha = 0.15 + normalized * 0.5;
          ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
          ctx.fillText(chars[charIndex], px, py);
        }
      }
      time += 0.03;
      frameRef.current = requestAnimationFrame(render);
    };
    render();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" style={{ display: "block" }} />;
}

// ─── CHAT PROMPT ──────────────────────────────────────────────────────────────
function ChatPrompt({
  messages,
  onSendMessage,
  isLoading,
}: {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  isLoading: boolean;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  return (
    <div className="flex flex-col h-64 border border-border rounded-xl bg-card overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Describe the email you want to generate
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex gap-2.5 max-w-[85%]", msg.role === "user" ? "ml-auto flex-row-reverse" : "")}>
            <div className={cn("h-7 w-7 rounded-full flex items-center justify-center shrink-0", msg.role === "user" ? "bg-primary" : "bg-accent")}>
              {msg.role === "user" ? (
                <User className="h-3.5 w-3.5 text-primary-foreground" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-accent-foreground" />
              )}
            </div>
            <div className={cn("rounded-xl px-3.5 py-2.5 text-sm leading-relaxed", msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground")}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2.5">
            <div className="h-7 w-7 rounded-full bg-accent flex items-center justify-center shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-accent-foreground" />
            </div>
            <div className="bg-accent rounded-xl px-4 py-3 flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="border-t border-border p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe the email you want to generate…"
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          disabled={isLoading}
        />
        <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

// ─── EMAIL EDITOR ─────────────────────────────────────────────────────────────
function EmailEditor({
  subject,
  body,
  onSubjectChange,
  onBodyChange,
}: {
  subject: string;
  body: string;
  onSubjectChange: (v: string) => void;
  onBodyChange: (v: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [body]);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <span className="text-xs font-medium text-muted-foreground w-14 shrink-0">Subject</span>
        <Input
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          placeholder="Email subject…"
          className="border-none shadow-none focus-visible:ring-0 p-0 h-auto text-sm font-medium bg-transparent"
        />
      </div>
      <div className="flex gap-3">
        <span className="text-xs font-medium text-muted-foreground w-14 shrink-0 pt-0.5">Body</span>
        <Textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          placeholder="Email body…"
          className="border-none shadow-none focus-visible:ring-0 p-0 resize-none min-h-[180px] text-sm bg-transparent leading-relaxed"
        />
      </div>
    </div>
  );
}

// ─── EMAIL PREVIEW MODAL ──────────────────────────────────────────────────────
function EmailPreviewModal({
  isOpen,
  onClose,
  recipientEmail,
  subject,
  body,
  attachments,
}: {
  isOpen: boolean;
  onClose: () => void;
  recipientEmail: string;
  subject: string;
  body: string;
  attachments: File[];
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-border bg-card shadow-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Mail className="h-4 w-4 text-primary" />
            Email Preview
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="px-5 py-3 border-b border-border space-y-2 text-sm shrink-0">
          <div className="flex gap-3">
            <span className="text-muted-foreground w-14 shrink-0">To</span>
            <span className="font-medium">{recipientEmail || "—"}</span>
          </div>
          <div className="flex gap-3">
            <span className="text-muted-foreground w-14 shrink-0">Subject</span>
            <span className="font-medium">{subject || "—"}</span>
          </div>
          {attachments.length > 0 && (
            <div className="flex gap-3">
              <span className="text-muted-foreground w-14 shrink-0">Attachments</span>
              <div className="flex flex-wrap gap-1.5">
                {attachments.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-md">
                    <FileText className="h-3 w-3" />{f.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
            {body || <span className="text-muted-foreground">No body yet.</span>}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ─── GMAIL EMAIL DETAIL MODAL ─────────────────────────────────────────────────
function GmailEmailDetailModal({
  isOpen,
  onClose,
  email,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  email: GmailEmailDetail | null;
  isLoading: boolean;
}) {
  const [viewMode, setViewMode] = useState<"text" | "html">("text");

  useEffect(() => {
    if (isOpen) setViewMode("text");
  }, [isOpen, email?.id]);

  if (!isOpen) return null;

  const plain = email?.plain_body || email?.body || "";
  const html = email?.html_body || "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-border bg-card shadow-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Mail className="h-4 w-4 text-primary" />
            {email?.subject || "Email"}
          </div>
          <div className="flex items-center gap-2">
            {html && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setViewMode((p) => (p === "text" ? "html" : "text"))}
              >
                <Code className="h-3 w-3" />
                {viewMode === "text" ? "View HTML" : "View text"}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : email ? (
          <>
            <div className="px-5 py-3 border-b border-border space-y-2 text-sm shrink-0">
              <div className="flex gap-3"><span className="text-muted-foreground w-14 shrink-0">From</span><span className="font-medium">{email.from || "—"}</span></div>
              <div className="flex gap-3"><span className="text-muted-foreground w-14 shrink-0">Subject</span><span className="font-medium">{email.subject || "—"}</span></div>
              <div className="flex gap-3"><span className="text-muted-foreground w-14 shrink-0">Date</span><span>{email.date || "—"}</span></div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {viewMode === "text" || !html ? (
                <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
                  {plain || <span className="text-muted-foreground">No body content.</span>}
                </pre>
              ) : (
                <div className="prose max-w-none text-sm">
                  <div dangerouslySetInnerHTML={{ __html: html }} />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            Failed to load email.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ATTACHMENT LIST ──────────────────────────────────────────────────────────
function AttachmentList({ files, onRemove }: { files: File[]; onRemove: (i: number) => void }) {
  if (files.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {files.map((file, i) => (
        <div key={i} className="group flex items-center gap-1.5 bg-accent/60 border border-border/50 rounded-lg px-2.5 py-1.5 text-xs text-foreground/80 max-w-[200px] transition-all hover:border-border">
          <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="truncate flex-1">{file.name}</span>
          <span className="text-muted-foreground/50 tabular-nums">{formatFileSize(file.size)}</span>
          <button
            onClick={() => onRemove(i)}
            className="shrink-0 ml-0.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── LEFT SIDEBAR ─────────────────────────────────────────────────────────────
function LeftSidebar({
  activeSection,
  onSelect,
  inboxCount,
  sentCount,
  draftsCount,
}: {
  activeSection: ActiveSection;
  onSelect: (s: ActiveSection) => void;
  inboxCount: number;
  sentCount: number;
  draftsCount: number;
}) {
  const navItems = [
    { id: "inbox" as ActiveSection,     label: "Inbox",     icon: <Inbox className="h-4 w-4" />,         count: inboxCount },
    { id: "sent" as ActiveSection,      label: "Sent",      icon: <SendHorizonal className="h-4 w-4" />, count: sentCount },
    { id: "drafts" as ActiveSection,    label: "Drafts",    icon: <MailOpen className="h-4 w-4" />,      count: draftsCount },
    { id: "scheduled" as ActiveSection, label: "Scheduled", icon: <CalendarClock className="h-4 w-4" />, count: 0 },
    { id: "favorites" as ActiveSection, label: "Favorites", icon: <Star className="h-4 w-4" />,          count: 0 },
  ];

  return (
    <aside
      className="w-56 shrink-0 flex flex-col border-r border-border bg-card/50 h-full"
      aria-label="Email navigation"
    >
      <div className="px-4 pt-5 pb-3 border-b border-border/40">
        <span
          className="text-xs tracking-[0.2em] uppercase text-muted-foreground/50 font-medium select-none italic"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Mail
        </span>
      </div>

      <nav className="flex flex-col flex-1 py-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 mx-2 my-0.5 rounded-lg text-left transition-all duration-200 group",
                isActive
                  ? "bg-primary/10 text-foreground"
                  : "text-foreground/60 hover:bg-accent/60 hover:text-foreground/80",
              )}
            >
              <span className={cn("shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground/70")}>
                {item.icon}
              </span>
              <span className="flex-1 text-sm font-medium">{item.label}</span>
              {item.count > 0 && (
                <span
                  className={cn(
                    "text-xs tabular-nums px-1.5 py-0.5 rounded-full font-medium",
                    isActive ? "bg-primary/15 text-primary" : "bg-muted/60 text-muted-foreground/70",
                  )}
                >
                  {item.count}
                </span>
              )}
              {isActive && <ChevronRight className="h-3.5 w-3.5 text-primary/60 shrink-0" />}
            </button>
          );
        })}

        <div className="mx-4 my-2 h-px bg-border/40" />

        <button
          onClick={() => onSelect("settings")}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 mx-2 my-0.5 rounded-lg text-left transition-all duration-200 group",
            activeSection === "settings"
              ? "bg-primary/10 text-foreground"
              : "text-foreground/60 hover:bg-accent/60 hover:text-foreground/80",
          )}
        >
          <Settings className={cn("h-4 w-4 shrink-0 transition-colors", activeSection === "settings" ? "text-primary" : "text-muted-foreground group-hover:text-foreground/70")} />
          <span className="flex-1 text-sm font-medium">Settings</span>
          {activeSection === "settings" && <ChevronRight className="h-3.5 w-3.5 text-primary/60 shrink-0" />}
        </button>
      </nav>
    </aside>
  );
}

// ─── EMAIL CARD ───────────────────────────────────────────────────────────────
function EmailCard({ email, onClick }: { email: GmailEmail; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="mx-2 my-1 rounded-lg cursor-pointer overflow-hidden transition-all duration-150"
      style={{
        background: hovered ? "hsl(var(--accent))" : "transparent",
        border: "1px solid",
        borderColor: hovered ? "hsl(var(--border))" : "transparent",
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="px-3 py-3">
        <div className="flex items-start gap-2.5">
          <div
            className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold uppercase"
            style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))" }}
          >
            {(email.from || "?").charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate text-foreground/80 leading-snug">
              {email.from ? email.from.split("<")[0].trim() || email.from : "Unknown"}
            </p>
            <p className="text-sm font-medium truncate text-foreground leading-snug mt-0.5">
              {email.subject || "(No Subject)"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-2 pl-10">
          <Clock className="h-2.5 w-2.5 text-muted-foreground/35" />
          <span className="text-xs text-muted-foreground/50 tabular-nums">{formatTime(email.date)}</span>
        </div>
      </div>
      <div
        className="h-px transition-all duration-200"
        style={{
          background: "linear-gradient(90deg, hsl(var(--primary)) 0%, transparent 100%)",
          opacity: hovered ? 1 : 0,
        }}
      />
    </div>
  );
}

// ─── DRAFT CARD ───────────────────────────────────────────────────────────────
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
      className={cn(
        "group mx-2 my-1 rounded-lg cursor-pointer transition-all duration-150",
        isActive
          ? "bg-primary/8 border border-primary/20"
          : "border border-transparent hover:bg-accent hover:border-border",
      )}
      onClick={onClick}
    >
      <div className="px-3 py-3">
        <div className="flex items-start gap-2.5">
          <div className={cn("h-8 w-8 rounded-full shrink-0 flex items-center justify-center", isActive ? "bg-primary/15" : "bg-muted-foreground/10")}>
            <MailOpen className={cn("h-3.5 w-3.5", isActive ? "text-primary" : "text-muted-foreground/50")} />
          </div>
          <div className="min-w-0 flex-1">
            <p className={cn("text-sm font-medium truncate leading-snug", isActive ? "text-primary" : "text-foreground/85")}>
              {draft.subject || "Untitled"}
            </p>
            <p className="text-xs text-muted-foreground/60 truncate mt-0.5">
              {draft.recipientEmail || "No recipient"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            aria-label="Delete draft"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex items-center gap-1 mt-2 pl-10">
          <Clock className="h-2.5 w-2.5 text-muted-foreground/35" />
          <span className="text-xs text-muted-foreground/50 tabular-nums">{formatTime(draft.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── EMAIL LIST PANEL (Middle Panel) ─────────────────────────────────────────
function EmailListPanel({
  activeSection,
  inboxEmails,
  sentEmails,
  drafts,
  activeDraftId,
  inboxLoading,
  sentLoading,
  onRefreshInbox,
  onRefreshSent,
  onOpenGmailEmail,
  onSelectDraft,
  onDeleteDraft,
}: {
  activeSection: ActiveSection;
  inboxEmails: GmailEmail[];
  sentEmails: GmailEmail[];
  drafts: DraftEmail[];
  activeDraftId: string | null;
  inboxLoading: boolean;
  sentLoading: boolean;
  onRefreshInbox: (force?: boolean) => void;
  onRefreshSent: (force?: boolean) => void;
  onOpenGmailEmail: (id: string) => void;
  onSelectDraft: (d: DraftEmail) => void;
  onDeleteDraft: (id: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  if (!activeSection || activeSection === "settings") return null;

  const sectionMeta: Record<string, { label: string; icon: React.ReactNode }> = {
    inbox:     { label: "Inbox",     icon: <Inbox className="h-4 w-4" /> },
    sent:      { label: "Sent",      icon: <SendHorizonal className="h-4 w-4" /> },
    drafts:    { label: "Drafts",    icon: <MailOpen className="h-4 w-4" /> },
    scheduled: { label: "Scheduled", icon: <CalendarClock className="h-4 w-4" /> },
    favorites: { label: "Favorites", icon: <Star className="h-4 w-4" /> },
  };

  const meta = sectionMeta[activeSection!];

  const filterEmails = (emails: GmailEmail[]) => {
    if (!searchQuery.trim()) return emails;
    const q = searchQuery.toLowerCase();
    return emails.filter(
      (e) => e.subject?.toLowerCase().includes(q) || e.from?.toLowerCase().includes(q),
    );
  };

  const filterDrafts = (items: DraftEmail[]) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (d) => d.subject?.toLowerCase().includes(q) || d.recipientEmail?.toLowerCase().includes(q),
    );
  };

  const isLoading = activeSection === "inbox" ? inboxLoading : activeSection === "sent" ? sentLoading : false;
  const canRefresh = activeSection === "inbox" || activeSection === "sent";

  return (
    <div
      className="w-72 shrink-0 flex flex-col border-r border-border bg-background h-full"
      style={{ scrollbarWidth: "thin" }}
    >
      {/* Panel Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border/50 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-foreground">
            <span className="text-muted-foreground">{meta.icon}</span>
            <span
              className="text-sm font-semibold"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {meta.label}
            </span>
          </div>
          {canRefresh && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground/50 hover:text-foreground"
              onClick={() => activeSection === "inbox" ? onRefreshInbox(true) : onRefreshSent(true)}
              aria-label={`Refresh ${meta.label}`}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none" />
          <input
            type="text"
            placeholder={`Search ${meta.label.toLowerCase()}…`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/40 border border-border/40 rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/40 focus:bg-background transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div
        className="flex-1 overflow-y-auto py-2"
        style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(var(--border)) transparent" }}
      >
        {/* INBOX */}
        {activeSection === "inbox" && (
          isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
              <span className="text-xs text-muted-foreground/40">Loading inbox…</span>
            </div>
          ) : filterEmails(inboxEmails).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-4">
              <Inbox className="h-8 w-8 text-muted-foreground/20" />
              <p className="text-xs text-muted-foreground/40 italic" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                {searchQuery ? "No results found" : "No inbox emails"}
              </p>
            </div>
          ) : (
            filterEmails(inboxEmails).map((email) => (
              <EmailCard key={email.id} email={email} onClick={() => onOpenGmailEmail(email.id)} />
            ))
          )
        )}

        {/* SENT */}
        {activeSection === "sent" && (
          isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
              <span className="text-xs text-muted-foreground/40">Loading sent…</span>
            </div>
          ) : filterEmails(sentEmails).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-4">
              <SendHorizonal className="h-8 w-8 text-muted-foreground/20" />
              <p className="text-xs text-muted-foreground/40 italic" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                {searchQuery ? "No results found" : "No sent emails"}
              </p>
            </div>
          ) : (
            filterEmails(sentEmails).map((email) => (
              <EmailCard key={email.id} email={email} onClick={() => onOpenGmailEmail(email.id)} />
            ))
          )
        )}

        {/* DRAFTS */}
        {activeSection === "drafts" && (
          filterDrafts(drafts).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-4">
              <MailOpen className="h-8 w-8 text-muted-foreground/20" />
              <p className="text-xs text-muted-foreground/40 italic" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
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
          )
        )}

        {/* SCHEDULED */}
        {activeSection === "scheduled" && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-4">
            <CalendarClock className="h-8 w-8 text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground/40 italic" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              No scheduled emails
            </p>
          </div>
        )}

        {/* FAVORITES */}
        {activeSection === "favorites" && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-4">
            <Star className="h-8 w-8 text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground/40 italic" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              No favorites yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function EmailGenerator() {
  const isAuthenticated = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [drafts, setDrafts] = useState<DraftEmail[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inboxEmails, setInboxEmails] = useState<GmailEmail[]>([]);
  const [sentEmails, setSentEmails] = useState<GmailEmail[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [sentLoading, setSentLoading] = useState(false);
  const [inboxLoaded, setInboxLoaded] = useState(false);
  const [sentLoaded, setSentLoaded] = useState(false);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailEmail, setDetailEmail] = useState<GmailEmailDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [activeSection, setActiveSection] = useState<ActiveSection>(null);

  const fetchInbox = async (force = false) => {
    if (inboxLoading) return;
    if (inboxLoaded && !force) return;
    setInboxLoading(true);
    try {
      const res = await fetch(`${API}/list_emails?max_results=10&q=in:inbox`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setInboxEmails(data.emails || []);
      setInboxLoaded(true);
    } catch { setInboxEmails([]); }
    finally { setInboxLoading(false); }
  };

  const fetchSent = async (force = false) => {
    if (sentLoading) return;
    if (sentLoaded && !force) return;
    setSentLoading(true);
    try {
      const res = await fetch(`${API}/list_emails?max_results=10&q=in:sent`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setSentEmails(data.emails || []);
      setSentLoaded(true);
    } catch { setSentEmails([]); }
    finally { setSentLoading(false); }
  };

  const handleOpenGmailEmail = async (id: string) => {
    setDetailModalOpen(true);
    setDetailEmail(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`${API}/get_email/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setDetailEmail(data);
    } catch { setDetailEmail(null); }
    finally { setDetailLoading(false); }
  };

  const handleSectionSelect = (section: ActiveSection) => {
    if (section === activeSection) { setActiveSection(null); return; }
    setActiveSection(section);
    if (section === "inbox" && !inboxLoaded && !inboxLoading) fetchInbox();
    if (section === "sent" && !sentLoaded && !sentLoading) fetchSent();
  };

  useEffect(() => { if (!isAuthenticated) return; }, [isAuthenticated]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const addMessage = (role: ChatMessage["role"], content: string) => {
    setMessages((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, role, content }]);
  };

  const handleSendMessage = async (userMessage: string) => {
    addMessage("user", userMessage);
    setIsChatLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`${API}/generate_email`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Generation failed");
      const data = await res.json();
      setSubject(data.subject ?? "");
      setBody(data.body ?? "");
      addMessage("assistant", `I've drafted an email with the subject "${data.subject}". Review and edit it below, then send when ready.`);
    } catch (err: any) {
      const msg = err.message || "Unknown error";
      addMessage("assistant", `Sorry, something went wrong: ${msg}`);
      setStatus({ type: "error", message: msg });
    } finally { setIsChatLoading(false); }
  };

  const handleSaveDraft = () => {
    if (!subject && !body) return;
    if (activeDraftId) {
      setDrafts((prev) =>
        prev.map((d) => d.id === activeDraftId ? { ...d, subject, body, recipientEmail, createdAt: new Date() } : d),
      );
    } else {
      const nd: DraftEmail = { id: `${Date.now()}`, subject, body, recipientEmail, createdAt: new Date() };
      setDrafts((prev) => [nd, ...prev]);
      setActiveDraftId(nd.id);
    }
    setStatus({ type: "success", message: "Draft saved." });
    setTimeout(() => setStatus(null), 2000);
  };

  const handleNewEmail = () => {
    setSubject(""); setBody(""); setRecipientEmail("");
    setActiveDraftId(null); setMessages([]); setStatus(null); setAttachments([]);
  };

  const handleSelectDraft = (draft: DraftEmail) => {
    setSubject(draft.subject);
    setBody(draft.body);
    setRecipientEmail(draft.recipientEmail);
    setActiveDraftId(draft.id);
    setMessages([]);
  };

  const handleDeleteDraft = (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    if (activeDraftId === id) handleNewEmail();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    setAttachments((prev) => [...prev, ...selected]);
    e.target.value = "";
  };

  const handleSend = async () => {
    if (!body.trim() || !recipientEmail.trim()) return;
    setIsSending(true); setStatus(null);
    try {
      const formData = new FormData();
      formData.append("to", recipientEmail.trim());
      formData.append("subject", subject);
      formData.append("body", body);
      attachments.forEach((f) => formData.append("attachments", f));
      const res = await fetch(`${API}/send_email`, { method: "POST", credentials: "include", body: formData });
      if (!res.ok) throw new Error((await res.json()).error || "Sending failed");
      setStatus({ type: "success", message: `Email sent to ${recipientEmail}` });
      addMessage("assistant", `✓ Email successfully sent to ${recipientEmail}${attachments.length > 0 ? ` with ${attachments.length} attachment${attachments.length > 1 ? "s" : ""}` : ""}!`);
      setAttachments([]);
      fetchSent(true);
    } catch (err: any) {
      setStatus({ type: "error", message: err.message || "Unknown error" });
    } finally { setIsSending(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasEmail = Boolean(subject || body);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      <div className="flex flex-1 overflow-hidden pt-16">

        {/* PANEL 1 — Nav Sidebar */}
        <LeftSidebar
          activeSection={activeSection}
          onSelect={handleSectionSelect}
          inboxCount={inboxEmails.length}
          sentCount={sentEmails.length}
          draftsCount={drafts.length}
        />

        {/* PANEL 2 — Email List */}
        <EmailListPanel
          activeSection={activeSection}
          inboxEmails={inboxEmails}
          sentEmails={sentEmails}
          drafts={drafts}
          activeDraftId={activeDraftId}
          inboxLoading={inboxLoading}
          sentLoading={sentLoading}
          onRefreshInbox={fetchInbox}
          onRefreshSent={fetchSent}
          onOpenGmailEmail={handleOpenGmailEmail}
          onSelectDraft={handleSelectDraft}
          onDeleteDraft={handleDeleteDraft}
        />

        {/* PANEL 3 — Compose */}
        <main className="flex-1 overflow-y-auto">
          <div className="relative w-full h-40 overflow-hidden border-b border-border">
            <div className="absolute inset-0"><AnimatedWave /></div>
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/80" />
            <div className="relative z-10 flex items-center justify-between h-full px-8 max-w-2xl mx-auto w-full">
              <div>
                <h1
                  className="select-none"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontStyle: "italic",
                    fontSize: "clamp(1.4rem, 3vw, 2rem)",
                    letterSpacing: "-0.02em",
                    color: "hsl(var(--foreground))",
                  }}
                >
                  Email Generator
                </h1>
                <p
                  className="mt-1 select-none"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontStyle: "italic",
                    fontSize: "0.8rem",
                    letterSpacing: "0.06em",
                    color: "hsl(var(--muted-foreground) / 0.55)",
                  }}
                >
                  Describe what you want to say — get a professional email
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewEmail}
                className="gap-1.5 shrink-0 bg-background/70 backdrop-blur-sm"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                New
              </Button>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="max-w-2xl mx-auto space-y-6">

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">To</label>
                <Input
                  type="email"
                  placeholder="recipient@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Chat with AI</label>
                <ChatPrompt messages={messages} onSendMessage={handleSendMessage} isLoading={isChatLoading} />
              </div>

              {hasEmail && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">Edit Email</label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleCopy}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                      <button
                        onClick={() => setPreviewOpen(true)}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview
                      </button>
                    </div>
                  </div>
                  <EmailEditor
                    subject={subject}
                    body={body}
                    onSubjectChange={setSubject}
                    onBodyChange={setBody}
                  />
                </div>
              )}

              {hasEmail && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                    >
                      <Paperclip className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform duration-200" />
                      Attach files
                      {attachments.length > 0 && (
                        <span className="ml-1 bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums">
                          {attachments.length}
                        </span>
                      )}
                    </button>
                    <AttachmentList
                      files={attachments}
                      onRemove={(i) => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleSaveDraft} className="flex-1 h-11 gap-2">
                      <Save className="w-4 h-4" />
                      Save Draft
                    </Button>
                    <Button
                      onClick={handleSend}
                      disabled={!recipientEmail.trim() || isSending}
                      className="flex-1 h-11 gap-2"
                    >
                      {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {isSending ? "Sending…" : "Send Email"}
                    </Button>
                  </div>
                </div>
              )}

              {status && (
                <div
                  className={`text-sm text-center py-2 px-4 rounded-lg ${
                    status.type === "success" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {status.message}
                </div>
              )}

              <p className="text-center text-xs text-muted-foreground pb-4">
                Powered by AI · Review before sending
              </p>
            </div>
          </div>
        </main>
      </div>

      <EmailPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        recipientEmail={recipientEmail}
        subject={subject}
        body={body}
        attachments={attachments}
      />

      <GmailEmailDetailModal
        isOpen={detailModalOpen}
        onClose={() => { setDetailModalOpen(false); setDetailEmail(null); }}
        email={detailEmail}
        isLoading={detailLoading}
      />
    </div>
  );
}