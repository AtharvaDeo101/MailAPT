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
  ChevronDown,
  RefreshCw,
  Code,
  Paperclip,
  FileText,
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
          const wave1 =
            Math.sin(x * 0.2 + time * 2) * Math.cos(y * 0.15 + time);
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

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: "block" }}
    />
  );
}

interface ChatPromptProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

function ChatPrompt({ messages, onSendMessage, isLoading }: ChatPromptProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  return (
    <div className="flex flex-col h-64 border border-border rounded-xl bg-card overflow-hidden">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3"
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Describe the email you want to generate
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-2.5 max-w-[85%]",
              msg.role === "user" ? "ml-auto flex-row-reverse" : "",
            )}
          >
            <div
              className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center shrink-0",
                msg.role === "user" ? "bg-primary" : "bg-accent",
              )}
            >
              {msg.role === "user" ? (
                <User className="h-3.5 w-3.5 text-primary-foreground" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-accent-foreground" />
              )}
            </div>
            <div
              className={cn(
                "rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-accent-foreground",
              )}
            >
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
              <span
                className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-border p-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe the email you want to generate…"
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || isLoading}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

interface EmailEditorProps {
  subject: string;
  body: string;
  onSubjectChange: (val: string) => void;
  onBodyChange: (val: string) => void;
}

function EmailEditor({
  subject,
  body,
  onSubjectChange,
  onBodyChange,
}: EmailEditorProps) {
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
        <span className="text-xs font-medium text-muted-foreground w-14 shrink-0">
          Subject
        </span>
        <Input
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          placeholder="Email subject…"
          className="border-none shadow-none focus-visible:ring-0 p-0 h-auto text-sm font-medium bg-transparent"
        />
      </div>
      <div className="flex gap-3">
        <span className="text-xs font-medium text-muted-foreground w-14 shrink-0 pt-0.5">
          Body
        </span>
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

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientEmail: string;
  subject: string;
  body: string;
  attachments: File[];
}

function EmailPreviewModal({
  isOpen,
  onClose,
  recipientEmail,
  subject,
  body,
  attachments,
}: EmailPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Email Preview"
    >
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-border bg-card shadow-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Mail className="h-4 w-4 text-primary" />
            Email Preview
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-5 py-3 border-b border-border space-y-2 text-sm shrink-0">
          <div className="flex gap-3">
            <span className="text-muted-foreground w-14 shrink-0">To</span>
            <span className="text-foreground font-medium">
              {recipientEmail || "—"}
            </span>
          </div>
          <div className="flex gap-3">
            <span className="text-muted-foreground w-14 shrink-0">Subject</span>
            <span className="text-foreground font-medium">
              {subject || "—"}
            </span>
          </div>
          {attachments.length > 0 && (
            <div className="flex gap-3">
              <span className="text-muted-foreground w-14 shrink-0">
                Attachments
              </span>
              <div className="flex flex-wrap gap-1.5">
                {attachments.map((file, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-md"
                  >
                    <FileText className="h-3 w-3" />
                    {file.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
            {body || <span className="text-muted-foreground">No body yet.</span>}
          </pre>
        </div>
      </div>
    </div>
  );
}

interface GmailEmailDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: GmailEmailDetail | null;
  isLoading: boolean;
}

function GmailEmailDetailModal({
  isOpen,
  onClose,
  email,
  isLoading,
}: GmailEmailDetailModalProps) {
  const [viewMode, setViewMode] = useState<"text" | "html">("text");

  useEffect(() => {
    if (isOpen) setViewMode("text");
  }, [isOpen, email?.id]);

  if (!isOpen) return null;

  const plain = email?.plain_body || email?.body || "";
  const html = email?.html_body || "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Email Detail"
    >
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
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
                onClick={() =>
                  setViewMode((prev) => (prev === "text" ? "html" : "text"))
                }
              >
                <Code className="h-3 w-3" />
                {viewMode === "text" ? "View HTML" : "View text"}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : email ? (
          <>
            <div className="px-5 py-3 border-b border-border space-y-2 text-sm shrink-0">
              <div className="flex gap-3">
                <span className="text-muted-foreground w-14 shrink-0">From</span>
                <span className="text-foreground font-medium">
                  {email.from || "—"}
                </span>
              </div>
              <div className="flex gap-3">
                <span className="text-muted-foreground w-14 shrink-0">
                  Subject
                </span>
                <span className="text-foreground font-medium">
                  {email.subject || "—"}
                </span>
              </div>
              <div className="flex gap-3">
                <span className="text-muted-foreground w-14 shrink-0">Date</span>
                <span className="text-foreground">{email.date || "—"}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {viewMode === "text" || !html ? (
                <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
                  {plain || (
                    <span className="text-muted-foreground">
                      No body content.
                    </span>
                  )}
                </pre>
              ) : (
                <div className="prose max-w-none text-sm text-foreground">
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

function EmptyState({
  icon,
  message,
}: {
  icon: React.ReactNode;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 px-4 text-center">
      <div
        className="opacity-20"
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        {icon}
      </div>
      <p
        className="text-xs tracking-[0.18em] uppercase text-muted-foreground/40 italic"
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        {message}
      </p>
    </div>
  );
}

function GmailEmailItem({
  email,
  onOpen,
}: {
  email: GmailEmail;
  onOpen: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="mx-3 my-1.5 rounded-xl cursor-pointer overflow-hidden transition-all duration-300"
      style={{
        background: hovered
          ? "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--accent)) 100%)"
          : "hsl(var(--card))",
        border: hovered
          ? "1px solid hsl(var(--border))"
          : "1px solid hsl(var(--border) / 0.4)",
        transform: hovered
          ? "translateX(6px) scale(1.02)"
          : "translateX(0) scale(1)",
        boxShadow: hovered
          ? "0 4px 20px hsl(var(--foreground) / 0.08)"
          : "0 1px 4px hsl(var(--foreground) / 0.03)",
      }}
      onClick={() => onOpen(email.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="px-4 py-3">
        <p
          className="text-sm font-normal truncate leading-snug transition-colors duration-200"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontStyle: hovered ? "italic" : "normal",
            color: hovered
              ? "hsl(var(--foreground))"
              : "hsl(var(--foreground) / 0.85)",
            letterSpacing: "-0.01em",
          }}
        >
          {email.subject || "(No Subject)"}
        </p>
        <p className="text-xs text-muted-foreground/60 truncate mt-1 tracking-wide">
          {email.from || "—"}
        </p>
        <div className="flex items-center justify-between mt-2.5">
          <div className="flex items-center gap-1">
            <Clock className="h-2.5 w-2.5 text-muted-foreground/35" />
            <span className="text-xs text-muted-foreground/35 tabular-nums">
              {formatTime(email.date)}
            </span>
          </div>
          <span
            className="text-xs text-muted-foreground/40 transition-all duration-200"
            style={{
              opacity: hovered ? 1 : 0,
              transform: hovered ? "translateX(0)" : "translateX(-4px)",
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: "italic",
            }}
          >
            open →
          </span>
        </div>
      </div>
      <div
        className="h-px transition-all duration-300 origin-left"
        style={{
          background:
            "linear-gradient(90deg, hsl(var(--primary)) 0%, transparent 100%)",
          transform: hovered ? "scaleX(1)" : "scaleX(0)",
        }}
      />
    </div>
  );
}

interface EmailSidebarProps {
  drafts: DraftEmail[];
  activeDraftId: string | null;
  onSelectDraft: (draft: DraftEmail) => void;
  onDeleteDraft: (id: string) => void;
  inboxEmails: GmailEmail[];
  sentEmails: GmailEmail[];
  inboxLoading: boolean;
  sentLoading: boolean;
  onRefreshInbox: (force?: boolean) => void;
  onRefreshSent: (force?: boolean) => void;
  onOpenGmailEmail: (id: string) => void;
}

function EmailSidebar({
  drafts,
  activeDraftId,
  onSelectDraft,
  onDeleteDraft,
  inboxEmails,
  sentEmails,
  inboxLoading,
  sentLoading,
  onRefreshInbox,
  onRefreshSent,
  onOpenGmailEmail,
}: EmailSidebarProps) {
  const [draftsOpen, setDraftsOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [sentOpen, setSentOpen] = useState(false);

  const [draftsHovered, setDraftsHovered] = useState(false);
  const [inboxHovered, setInboxHovered] = useState(false);
  const [sentHovered, setSentHovered] = useState(false);

  const navItems = [
    {
      number: "01",
      label: "Drafts",
      isOpen: draftsOpen,
      isHovered: draftsHovered,
      setHovered: setDraftsHovered,
      onToggle: () => {
        setDraftsOpen((v) => !v);
        setInboxOpen(false);
        setSentOpen(false);
      },
      count: drafts.length,
      isLoading: false,
      onRefresh: undefined as (() => void) | undefined,
      content: (
        <div className="py-2">
          {drafts.length === 0 ? (
            <EmptyState
              icon={<MailOpen className="h-8 w-8" />}
              message="No drafts yet"
            />
          ) : (
            drafts.map((draft) => {
              const isActive = activeDraftId === draft.id;
              return (
                <div
                  key={draft.id}
                  className="group mx-3 my-1.5 rounded-xl overflow-hidden cursor-pointer transition-all duration-300"
                  style={{
                    background: isActive
                      ? "linear-gradient(135deg, hsl(var(--primary) / 0.12) 0%, hsl(var(--accent)) 100%)"
                      : "hsl(var(--card))",
                    border: isActive
                      ? "1px solid hsl(var(--primary) / 0.3)"
                      : "1px solid hsl(var(--border) / 0.4)",
                    transform: isActive ? "translateX(6px)" : "translateX(0)",
                    boxShadow: isActive
                      ? "0 4px 20px hsl(var(--primary) / 0.1)"
                      : "0 1px 4px hsl(var(--foreground) / 0.03)",
                  }}
                  onClick={() => onSelectDraft(draft)}
                >
                  <div className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-sm font-normal truncate leading-snug"
                          style={{
                            fontFamily: "'Playfair Display', Georgia, serif",
                            fontStyle: isActive ? "italic" : "normal",
                            color: isActive
                              ? "hsl(var(--primary))"
                              : "hsl(var(--foreground) / 0.85)",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {draft.subject || "Untitled"}
                        </p>
                        <p className="text-xs text-muted-foreground/60 truncate mt-1 tracking-wide">
                          {draft.recipientEmail || "No recipient"}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteDraft(draft.id);
                        }}
                        aria-label="Delete draft"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-1 mt-2.5">
                      <Clock className="h-2.5 w-2.5 text-muted-foreground/35" />
                      <span className="text-xs text-muted-foreground/35 tabular-nums">
                        {formatTime(draft.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div
                    className="h-px transition-all duration-300 origin-left"
                    style={{
                      background:
                        "linear-gradient(90deg, hsl(var(--primary)) 0%, transparent 100%)",
                      transform: isActive ? "scaleX(1)" : "scaleX(0)",
                    }}
                  />
                </div>
              );
            })
          )}
        </div>
      ),
    },
    {
      number: "02",
      label: "Inbox",
      isOpen: inboxOpen,
      isHovered: inboxHovered,
      setHovered: setInboxHovered,
      onToggle: () => {
        const next = !inboxOpen;
        setInboxOpen(next);
        setDraftsOpen(false);
        setSentOpen(false);

        if (next && !inboxLoading && inboxEmails.length === 0) {
          onRefreshInbox();
        }
      },
      count: inboxEmails.length,
      isLoading: inboxLoading,
      onRefresh: () => onRefreshInbox(true),
      content: (
        <div className="py-2">
          {inboxLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
              <p
                className="text-xs italic tracking-widest text-muted-foreground/30"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Loading…
              </p>
            </div>
          ) : inboxEmails.length === 0 ? (
            <EmptyState
              icon={<Inbox className="h-8 w-8" />}
              message="No inbox emails found"
            />
          ) : (
            inboxEmails.map((email) => (
              <GmailEmailItem
                key={email.id}
                email={email}
                onOpen={onOpenGmailEmail}
              />
            ))
          )}
        </div>
      ),
    },
    {
      number: "03",
      label: "Sent",
      isOpen: sentOpen,
      isHovered: sentHovered,
      setHovered: setSentHovered,
      onToggle: () => {
        const next = !sentOpen;
        setSentOpen(next);
        setDraftsOpen(false);
        setInboxOpen(false);

        if (next && !sentLoading && sentEmails.length === 0) {
          onRefreshSent();
        }
      },
      count: sentEmails.length,
      isLoading: sentLoading,
      onRefresh: () => onRefreshSent(true),
      content: (
        <div className="py-2">
          {sentLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
              <p
                className="text-xs italic tracking-widest text-muted-foreground/30"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Loading…
              </p>
            </div>
          ) : sentEmails.length === 0 ? (
            <EmptyState
              icon={<SendHorizonal className="h-8 w-8" />}
              message="No sent emails found"
            />
          ) : (
            sentEmails.map((email) => (
              <GmailEmailItem
                key={email.id}
                email={email}
                onOpen={onOpenGmailEmail}
              />
            ))
          )}
        </div>
      ),
    },
  ];

  return (
    <aside
      className="w-64 shrink-0 flex flex-col border-r border-border bg-card/50 h-full overflow-y-auto"
      aria-label="Email navigation"
    >
      <div className="px-5 pt-6 pb-4 border-b border-border/30">
        <span
          className="text-xs tracking-[0.22em] uppercase text-muted-foreground/40 font-medium select-none italic"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Mail
        </span>
      </div>

      <nav className="flex flex-col flex-1">
        {navItems.map((item) => (
          <div key={item.number} className="flex flex-col">
            <div
              role="button"
              aria-expanded={item.isOpen}
              aria-label={`Toggle ${item.label}`}
              onClick={item.onToggle}
              onMouseEnter={() => item.setHovered(true)}
              onMouseLeave={() => item.setHovered(false)}
              className="group relative flex items-center gap-3 px-5 py-5 cursor-pointer select-none border-b border-border/20 transition-all duration-300"
              style={{
                background: item.isOpen
                  ? "hsl(var(--accent) / 0.6)"
                  : item.isHovered
                    ? "hsl(var(--accent) / 0.3)"
                    : "transparent",
                transform: item.isOpen
                  ? "translateX(6px)"
                  : item.isHovered
                    ? "translateX(4px)"
                    : "translateX(0)",
                boxShadow:
                  item.isOpen || item.isHovered
                    ? "-3px 0 0 0 hsl(var(--primary) / 0.7), 4px 0 16px hsl(var(--foreground) / 0.06)"
                    : "none",
              }}
            >
              <span
                className="text-xs shrink-0 font-medium tabular-nums transition-colors duration-200"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  minWidth: "1.5rem",
                  color:
                    item.isOpen || item.isHovered
                      ? "hsl(var(--primary))"
                      : "hsl(var(--muted-foreground) / 0.35)",
                }}
              >
                {item.number}
              </span>

              <div className="flex-1 min-w-0 relative">
                <span
                  className="block transition-all duration-300 ease-in-out"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontWeight: 500,
                    fontSize:
                      item.isHovered || item.isOpen ? "1.3rem" : "1.05rem",
                    fontStyle:
                      item.isHovered || item.isOpen ? "italic" : "normal",
                    letterSpacing:
                      item.isHovered || item.isOpen ? "-0.03em" : "-0.01em",
                    color: item.isOpen
                      ? "hsl(var(--foreground))"
                      : item.isHovered
                        ? "hsl(var(--foreground))"
                        : "hsl(var(--foreground) / 0.6)",
                    lineHeight: 1.1,
                  }}
                >
                  {item.label}
                </span>
                <span
                  className="block h-px mt-1 origin-left transition-transform duration-300"
                  style={{
                    background:
                      "linear-gradient(90deg, hsl(var(--primary)) 0%, transparent 100%)",
                    transform:
                      item.isOpen || item.isHovered ? "scaleX(1)" : "scaleX(0)",
                    opacity: item.isOpen ? 1 : 0.6,
                  }}
                  aria-hidden="true"
                />
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {item.count > 0 && (
                  <span
                    className="text-xs tabular-nums transition-colors duration-200"
                    style={{
                      color:
                        item.isOpen || item.isHovered
                          ? "hsl(var(--primary) / 0.7)"
                          : "hsl(var(--muted-foreground) / 0.35)",
                    }}
                  >
                    {item.count}
                  </span>
                )}

                {item.onRefresh && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-muted-foreground/40 hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      item.onRefresh?.();
                    }}
                    aria-label={`Refresh ${item.label}`}
                  >
                    <RefreshCw
                      className={cn(
                        "h-2.5 w-2.5",
                        item.isLoading && "animate-spin",
                      )}
                    />
                  </Button>
                )}

                <ChevronDown
                  className="h-3 w-3 transition-all duration-300"
                  style={{
                    transform: item.isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    color:
                      item.isOpen || item.isHovered
                        ? "hsl(var(--primary) / 0.6)"
                        : "hsl(var(--muted-foreground) / 0.35)",
                  }}
                />
              </div>
            </div>

            <div
              className="transition-all duration-300 ease-in-out"
              style={{
                maxHeight: item.isOpen ? "320px" : "0px",
                opacity: item.isOpen ? 1 : 0,
                overflow: item.isOpen ? "auto" : "hidden",
                borderBottom: item.isOpen
                  ? "1px solid hsl(var(--border) / 0.3)"
                  : "none",
                scrollbarWidth: "thin",
                scrollbarColor: "hsl(var(--border)) transparent",
              }}
            >
              <div
                style={{
                  background:
                    "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--card) / 0.6) 100%)",
                  backdropFilter: "blur(4px)",
                }}
              >
                <div className="px-5 pt-3 pb-1">
                  <span
                    className="text-xs tracking-[0.18em] uppercase italic"
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      color: "hsl(var(--muted-foreground) / 0.35)",
                    }}
                  >
                    {item.label}
                  </span>
                </div>
                {item.content}
              </div>
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

interface AttachmentListProps {
  files: File[];
  onRemove: (index: number) => void;
}

function AttachmentList({ files, onRemove }: AttachmentListProps) {
  if (files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {files.map((file, i) => (
        <div
          key={i}
          className="group flex items-center gap-1.5 bg-accent/60 border border-border/50 rounded-lg px-2.5 py-1.5 text-xs text-foreground/80 max-w-[200px] transition-all duration-200 hover:border-border"
        >
          <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="truncate flex-1">{file.name}</span>
          <span className="text-muted-foreground/50 shrink-0 tabular-nums">
            {formatFileSize(file.size)}
          </span>
          <button
            onClick={() => onRemove(i)}
            aria-label={`Remove ${file.name}`}
            className="shrink-0 ml-0.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all duration-150"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

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
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
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

  const fetchInbox = async (force = false) => {
    if (inboxLoading) return;
    if (inboxLoaded && !force) return;

    setInboxLoading(true);
    try {
      const res = await fetch(`${API}/list_emails?max_results=10&q=in:inbox`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch inbox");
      const data = await res.json();
      setInboxEmails(data.emails || []);
      setInboxLoaded(true);
    } catch {
      setInboxEmails([]);
    } finally {
      setInboxLoading(false);
    }
  };

  const fetchSent = async (force = false) => {
    if (sentLoading) return;
    if (sentLoaded && !force) return;

    setSentLoading(true);
    try {
      const res = await fetch(`${API}/list_emails?max_results=10&q=in:sent`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch sent");
      const data = await res.json();
      setSentEmails(data.emails || []);
      setSentLoaded(true);
    } catch {
      setSentEmails([]);
    } finally {
      setSentLoading(false);
    }
  };

  const handleOpenGmailEmail = async (id: string) => {
    setDetailModalOpen(true);
    setDetailEmail(null);
    setDetailLoading(true);

    try {
      const res = await fetch(`${API}/get_email/${id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch email");
      const data = await res.json();
      setDetailEmail(data);
    } catch {
      setDetailEmail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
  }, [isAuthenticated]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const addMessage = (role: ChatMessage["role"], content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, role, content },
    ]);
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

      if (!res.ok) {
        throw new Error((await res.json()).error || "Generation failed");
      }

      const data = await res.json();
      setSubject(data.subject ?? "");
      setBody(data.body ?? "");
      addMessage(
        "assistant",
        `I've drafted an email with the subject "${data.subject}". Review and edit it below, then send when ready.`,
      );
    } catch (err: any) {
      const msg = err.message || "Unknown error";
      addMessage("assistant", `Sorry, something went wrong: ${msg}`);
      setStatus({ type: "error", message: msg });
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSaveDraft = () => {
    if (!subject && !body) return;

    if (activeDraftId) {
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === activeDraftId
            ? { ...d, subject, body, recipientEmail, createdAt: new Date() }
            : d,
        ),
      );
    } else {
      const newDraft: DraftEmail = {
        id: `${Date.now()}`,
        subject,
        body,
        recipientEmail,
        createdAt: new Date(),
      };
      setDrafts((prev) => [newDraft, ...prev]);
      setActiveDraftId(newDraft.id);
    }

    setStatus({ type: "success", message: "Draft saved." });
    setTimeout(() => setStatus(null), 2000);
  };

  const handleNewEmail = () => {
    setSubject("");
    setBody("");
    setRecipientEmail("");
    setActiveDraftId(null);
    setMessages([]);
    setStatus(null);
    setAttachments([]);
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

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    setAttachments((prev) => [...prev, ...selected]);
    e.target.value = "";
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!body.trim() || !recipientEmail.trim()) return;

    setIsSending(true);
    setStatus(null);

    try {
      const formData = new FormData();
      formData.append("to", recipientEmail.trim());
      formData.append("subject", subject);
      formData.append("body", body);
      attachments.forEach((file) => formData.append("attachments", file));

      const res = await fetch(`${API}/send_email`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        throw new Error((await res.json()).error || "Sending failed");
      }

      setStatus({
        type: "success",
        message: `Email sent to ${recipientEmail}`,
      });

      addMessage(
        "assistant",
        `✓ Email successfully sent to ${recipientEmail}${
          attachments.length > 0
            ? ` with ${attachments.length} attachment${attachments.length > 1 ? "s" : ""}`
            : ""
        }!`,
      );

      setAttachments([]);
      fetchSent(true);
    } catch (err: any) {
      setStatus({ type: "error", message: err.message || "Unknown error" });
    } finally {
      setIsSending(false);
    }
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
        <EmailSidebar
          drafts={drafts}
          activeDraftId={activeDraftId}
          onSelectDraft={handleSelectDraft}
          onDeleteDraft={handleDeleteDraft}
          inboxEmails={inboxEmails}
          sentEmails={sentEmails}
          inboxLoading={inboxLoading}
          sentLoading={sentLoading}
          onRefreshInbox={fetchInbox}
          onRefreshSent={fetchSent}
          onOpenGmailEmail={handleOpenGmailEmail}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="relative w-full h-44 overflow-hidden border-b border-border">
            <div className="absolute inset-0">
              <AnimatedWave />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/80" />
            <div className="relative z-10 flex items-center justify-between h-full px-8 md:px-12 max-w-2xl mx-auto w-full">
              <div>
                <h1 className="text-3xl font-semibold text-foreground tracking-tight">
                  <span
                    className="font-semi select-none"
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontStyle: "italic",
                      fontSize: "clamp(1.4rem, 3vw, 2.2rem)",
                      letterSpacing: "-0.02em",
                      color: "hsl(var(--foreground))",
                    }}
                  >
                    Email Generator
                  </span>
                </h1>
                <p className="mt-1.5">
                  <span
                    className="select-none"
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontStyle: "italic",
                      fontSize: "clamp(0.75rem, 1.2vw, 0.875rem)",
                      letterSpacing: "0.08em",
                      color: "hsl(var(--muted-foreground) / 0.55)",
                      fontWeight: 400,
                    }}
                  >
                    Describe what you want to say — get a professional email
                  </span>
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
                <label className="text-sm font-medium text-foreground">
                  Chat with AI
                </label>
                <ChatPrompt
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isChatLoading}
                />
              </div>

              {hasEmail && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">
                      Edit Email
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopy}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
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
                      aria-label="Attach files"
                    />

                    <button
                      onClick={handleAttachClick}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                      aria-label="Attach files"
                    >
                      <Paperclip className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-12" />
                      Attach files
                      {attachments.length > 0 && (
                        <span className="ml-1 bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums">
                          {attachments.length}
                        </span>
                      )}
                    </button>

                    <AttachmentList
                      files={attachments}
                      onRemove={handleRemoveAttachment}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleSaveDraft}
                      className="flex-1 h-11 gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save Draft
                    </Button>

                    <Button
                      onClick={handleSend}
                      disabled={!recipientEmail.trim() || isSending}
                      className="flex-1 h-11 gap-2"
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {isSending ? "Sending…" : "Send Email"}
                    </Button>
                  </div>
                </div>
              )}

              {status && (
                <div
                  className={`text-sm text-center py-2 px-4 rounded-lg ${
                    status.type === "success"
                      ? "bg-primary/10 text-primary"
                      : "bg-destructive/10 text-destructive"
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
        onClose={() => {
          setDetailModalOpen(false);
          setDetailEmail(null);
        }}
        email={detailEmail}
        isLoading={detailLoading}
      />
    </div>
  );
}