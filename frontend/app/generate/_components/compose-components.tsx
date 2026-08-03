"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalendarClock,
  Check,
  Copy,
  FileText,
  Loader2,
  Mail,
  Paperclip,
  Save,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChatMessage, StatusMessage } from "../_lib/types";
import { formatFileSize, toDateTimeLocalValue } from "../_lib/generate-utils";

const ACCENT_COLOR = "#121931";
const AI_BUBBLE_BG = "var(--mail-accent-tint)";

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 h-10 border-b border-border">
      <span className="w-14 shrink-0 text-[12px] text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

function ToolbarIconButton({
  label,
  onClick,
  children,
  type = "button",
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      aria-label={label}
      title={label}
      className="hover-pop inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-[var(--mail-hover)] hover:text-foreground"
    >
      {children}
    </button>
  );
}

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }, [input]);

  const submitMessage = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  return (
    <div
      className="flex flex-col h-52 overflow-hidden rounded-md border border-border"
      style={{
        background: "color-mix(in srgb, var(--foreground) 3%, transparent)",
      }}
    >
      <div className="flex items-center gap-1.5 px-3 h-8 shrink-0 border-b border-border">
        <Sparkles className="h-3 w-3" style={{ color: ACCENT_COLOR }} />
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          AI assistant
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2.5 space-y-2">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full px-6 text-center text-[12px] text-muted-foreground">
            Describe the email you want to generate
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "max-w-[85%] px-3 py-2 rounded-lg text-[12.5px] leading-relaxed",
              msg.role === "user" ? "ml-auto" : "",
            )}
            style={
              msg.role === "user"
                ? { backgroundColor: ACCENT_COLOR, color: "#ffffff" }
                : {
                    backgroundColor: AI_BUBBLE_BG,
                    color: "var(--foreground)",
                  }
            }
          >
            {msg.content}
          </div>
        ))}

        {isLoading && (
          <div
            className="w-fit px-3 py-2.5 rounded-lg flex gap-1"
            style={{ backgroundColor: AI_BUBBLE_BG }}
          >
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
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitMessage();
        }}
        className="shrink-0 flex items-end gap-2 px-3 py-2 border-t border-border bg-card"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submitMessage();
            }
          }}
          placeholder="Describe the email you want to generate..."
          rows={1}
          disabled={isLoading}
          className="flex-1 resize-none overflow-y-auto max-h-24 bg-transparent border-0 px-0 py-1.5 text-[13px] leading-5 text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="hover-pop shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full text-white disabled:opacity-35 disabled:cursor-not-allowed"
          aria-label="Send prompt"
          style={{ backgroundColor: ACCENT_COLOR }}
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}

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
    <div className="rounded-md border border-border overflow-hidden">
      <div className="flex items-center gap-3 px-3 h-9 border-b border-border">
        <span className="w-14 shrink-0 text-[12px] text-muted-foreground">
          Subject
        </span>
        <input
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          placeholder="Email subject"
          className="flex-1 min-w-0 bg-transparent border-0 text-[13px] font-medium text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
        />
      </div>

      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => onBodyChange(e.target.value)}
        placeholder="Email body..."
        className="w-full resize-none border-0 bg-transparent px-3 py-2.5 min-h-[160px] text-[13px] leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
      />
    </div>
  );
}

function AttachmentList({
  files,
  onRemove,
}: {
  files: File[];
  onRemove: (i: number) => void;
}) {
  if (files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {files.map((file, i) => (
        <div
          key={i}
          className="group flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11.5px] text-foreground/80 max-w-[200px]"
          style={{
            background: "color-mix(in srgb, var(--foreground) 4%, transparent)",
          }}
        >
          <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="truncate flex-1">{file.name}</span>
          <span className="text-muted-foreground tabular-nums">
            {formatFileSize(file.size)}
          </span>
          <button
            onClick={() => onRemove(i)}
            className="hover-pop shrink-0 text-muted-foreground hover:text-destructive"
            type="button"
            aria-label={`Remove ${file.name}`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function EmailPreviewModal({
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
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      <div
        className="relative z-10 w-full max-w-2xl rounded-lg bg-card flex flex-col max-h-[90vh] border border-border overflow-hidden"
        style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.24)" }}
      >
        <div
          className="flex items-center gap-2 px-4 h-10 shrink-0"
          style={{ backgroundColor: ACCENT_COLOR }}
        >
          <Mail className="h-3.5 w-3.5 text-white" />
          <span className="text-[13px] font-medium text-white">
            Email preview
          </span>
          <button
            type="button"
            onClick={onClose}
            className="hover-pop ml-auto inline-flex h-7 w-7 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="shrink-0 border-b border-border">
          <FieldRow label="To">
            <span className="truncate text-[13px] font-medium">
              {recipientEmail || "—"}
            </span>
          </FieldRow>
          <FieldRow label="Subject">
            <span className="truncate text-[13px] font-medium">
              {subject || "—"}
            </span>
          </FieldRow>

          {attachments.length > 0 && (
            <div className="flex items-start gap-3 px-4 py-2.5">
              <span className="w-14 shrink-0 text-[12px] text-muted-foreground">
                Files
              </span>
              <div className="flex flex-wrap gap-1.5">
                {attachments.map((f, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[11.5px]"
                  >
                    <FileText className="h-3 w-3" />
                    {f.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <pre className="whitespace-pre-wrap text-[13px] font-sans leading-relaxed text-foreground">
            {body || <span className="text-muted-foreground">No body yet.</span>}
          </pre>
        </div>
      </div>
    </div>
  );
}

export function ScheduleEmailModal({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (scheduledFor: string) => void;
}) {
  const [scheduledFor, setScheduledFor] = useState(
    toDateTimeLocalValue(new Date(Date.now() + 10 * 60 * 1000)),
  );

  useEffect(() => {
    if (isOpen) {
      setScheduledFor(
        toDateTimeLocalValue(new Date(Date.now() + 10 * 60 * 1000)),
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!scheduledFor) return;
    onConfirm(new Date(scheduledFor).toISOString());
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      <div
        className="relative z-10 w-full max-w-md rounded-lg bg-card border border-border overflow-hidden"
        style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.24)" }}
      >
        <div
          className="flex items-center gap-2 px-4 h-10"
          style={{ backgroundColor: ACCENT_COLOR }}
        >
          <CalendarClock className="h-3.5 w-3.5 text-white" />
          <span className="text-[13px] font-medium text-white">
            Schedule send
          </span>
          <button
            type="button"
            onClick={onClose}
            className="hover-pop ml-auto inline-flex h-7 w-7 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-3">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-foreground">
              Date and time
            </label>
            <Input
              type="datetime-local"
              value={scheduledFor}
              min={toDateTimeLocalValue(new Date())}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="h-9 rounded-md text-[13px]"
            />
          </div>

          <p className="text-[11.5px] text-muted-foreground">
            Scheduled emails are sent only while this app stays open.
          </p>
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            className="hover-press h-8 rounded-full text-[13px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!scheduledFor}
            className="hover-press h-8 rounded-full text-[13px] text-white"
            style={{ backgroundColor: ACCENT_COLOR }}
          >
            Schedule
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ComposeModal({
  isOpen,
  onClose,
  messages,
  isChatLoading,
  onSendMessage,
  recipientEmail,
  onRecipientChange,
  subject,
  onSubjectChange,
  body,
  onBodyChange,
  hasEmail,
  copied,
  onCopy,
  onPreview,
  attachments,
  fileInputRef,
  onAddAttachmentClick,
  onFileChange,
  onRemoveAttachment,
  onSaveDraft,
  onSchedule,
  onSend,
  isSending,
  status,
}: {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  isChatLoading: boolean;
  onSendMessage: (msg: string) => void;
  recipientEmail: string;
  onRecipientChange: (v: string) => void;
  subject: string;
  onSubjectChange: (v: string) => void;
  body: string;
  onBodyChange: (v: string) => void;
  hasEmail: boolean;
  copied: boolean;
  onCopy: () => void;
  onPreview: () => void;
  attachments: File[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onAddAttachmentClick: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: (i: number) => void;
  onSaveDraft: () => void;
  onSchedule: () => void;
  onSend: () => void;
  isSending: boolean;
  status: StatusMessage;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-end sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-transparent" onClick={onClose} />

      <div
        className="relative z-10 w-full sm:w-[560px] rounded-t-lg sm:rounded-lg bg-card flex flex-col max-h-[92vh] border border-border overflow-hidden"
        style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.26)" }}
      >
        <div
          className="flex items-center gap-2 px-4 h-10 shrink-0"
          style={{ backgroundColor: ACCENT_COLOR }}
        >
          <span className="text-[13px] font-medium text-white">
            New message
          </span>

          <button
            type="button"
            onClick={onClose}
            className="hover-pop ml-auto inline-flex h-7 w-7 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="shrink-0">
          <FieldRow label="To">
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => onRecipientChange(e.target.value)}
              placeholder="recipient@example.com"
              className="flex-1 min-w-0 bg-transparent border-0 text-[13px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
            />
          </FieldRow>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          <ChatPrompt
            messages={messages}
            onSendMessage={onSendMessage}
            isLoading={isChatLoading}
          />

          {hasEmail && (
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  Draft
                </span>

                <div className="flex items-center gap-0.5">
                  <ToolbarIconButton
                    label={copied ? "Copied" : "Copy"}
                    onClick={onCopy}
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </ToolbarIconButton>

                  <ToolbarIconButton label="Preview" onClick={onPreview}>
                    <Mail className="h-3.5 w-3.5" />
                  </ToolbarIconButton>
                </div>
              </div>

              <EmailEditor
                subject={subject}
                body={body}
                onSubjectChange={onSubjectChange}
                onBodyChange={onBodyChange}
              />

              <AttachmentList
                files={attachments}
                onRemove={onRemoveAttachment}
              />

              {status && (
                <div
                  className={cn(
                    "rounded-md px-3 py-2 text-[12.5px] border",
                    status.type === "success"
                      ? "bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400"
                      : "bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-400",
                  )}
                >
                  {status.message}
                </div>
              )}
            </div>
          )}
        </div>

        {hasEmail && (
          <div className="flex items-center gap-1 px-3 py-2.5 border-t border-border shrink-0">
            <button
              type="button"
              onClick={onSend}
              disabled={isSending || !recipientEmail.trim() || !body.trim()}
              className="hover-press inline-flex items-center gap-2 h-8 pl-4 pr-4 rounded-full text-[13px] font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: ACCENT_COLOR }}
            >
              {isSending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              {isSending ? "Sending..." : "Send"}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={onFileChange}
            />

            <ToolbarIconButton
              label="Attach files"
              onClick={onAddAttachmentClick}
            >
              <Paperclip className="h-4 w-4" />
            </ToolbarIconButton>

            <ToolbarIconButton label="Schedule send" onClick={onSchedule}>
              <CalendarClock className="h-4 w-4" />
            </ToolbarIconButton>

            <ToolbarIconButton label="Save draft" onClick={onSaveDraft}>
              <Save className="h-4 w-4" />
            </ToolbarIconButton>
          </div>
        )}
      </div>
    </div>
  );
}
