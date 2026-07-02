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
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ChatMessage, StatusMessage } from "../_lib/types";
import { formatFileSize, toDateTimeLocalValue } from "../_lib/generate-utils";

function ChatBoxBackgroundAnimation() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-none pointer-events-none">
      <div className="absolute inset-0 opacity-100" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom right, color-mix(in srgb, var(--background) 52%, transparent), color-mix(in srgb, var(--card) 42%, transparent))",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          boxShadow: "inset 0 0 40px color-mix(in srgb, var(--background) 35%, transparent)",
        }}
      />
    </div>
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
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  const submitMessage = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  return (
    <div
      className="relative flex flex-col h-64 rounded-none overflow-hidden border border-border bg-card/30 backdrop-blur-sm"
      style={{
        boxShadow:
          "0 0 0 1px color-mix(in srgb, var(--border) 70%, transparent), 0 8px 22px color-mix(in srgb, var(--foreground) 6%, transparent)",
      }}
    >
      <ChatBoxBackgroundAnimation />

      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm text-center px-6">
            Describe the email that you want to generate
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn("flex gap-2.5 max-w-[85%]", msg.role === "user" ? "ml-auto flex-row-reverse" : "")}
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
                "rounded-none px-3.5 py-2.5 text-sm leading-relaxed backdrop-blur-[2px]",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent/90 text-accent-foreground",
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
            <div className="bg-accent/90 rounded-none px-4 py-3 flex gap-1 backdrop-blur-[2px]">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitMessage();
        }}
        className="relative z-10 px-4 py-3 flex items-end gap-3 bg-background/10 backdrop-blur-md"
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
          className="flex-1 resize-none overflow-y-auto max-h-[120px] bg-transparent border-0 border-b border-muted-foreground/30 rounded-none px-0 py-2 text-sm leading-6 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="shrink-0 pb-2 text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Send prompt"
        >
          <Send className="h-4 w-4" />
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
    <div
      className="flex flex-col gap-4 rounded-none bg-card/90 p-4 border border-border"
      style={{
        boxShadow:
          "0 0 0 1px color-mix(in srgb, var(--border) 70%, transparent), 0 8px 22px color-mix(in srgb, var(--foreground) 6%, transparent)",
      }}
    >
      <div className="flex items-center gap-3 pb-3 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground w-14 shrink-0">Subject</span>
        <Input
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          placeholder="Email subject..."
          className="border-none shadow-none focus-visible:ring-0 p-0 h-auto text-sm font-medium bg-transparent text-foreground rounded-none"
        />
      </div>

      <div className="flex gap-3">
        <span className="text-xs font-medium text-muted-foreground w-14 shrink-0 pt-0.5">Body</span>
        <Textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          placeholder="Email body..."
          className="border-none shadow-none focus-visible:ring-0 p-0 resize-none min-h-[180px] text-sm bg-transparent leading-relaxed text-foreground rounded-none"
        />
      </div>
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
    <div className="flex flex-wrap gap-2 mt-2">
      {files.map((file, i) => (
        <div
          key={i}
          className="group flex items-center gap-1.5 bg-accent/60 rounded-none px-2.5 py-1.5 text-xs text-foreground/80 max-w-[200px] transition-all hover:bg-accent border border-border"
          style={{
            boxShadow: "0 0 0 1px color-mix(in srgb, var(--border) 60%, transparent)",
          }}
        >
          <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="truncate flex-1">{file.name}</span>
          <span className="text-muted-foreground/70 tabular-nums">{formatFileSize(file.size)}</span>
          <button
            onClick={() => onRemove(i)}
            className="shrink-0 ml-0.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
            type="button"
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-none bg-card shadow-2xl flex flex-col max-h-[90vh] border border-border">
        <div className="flex items-center justify-between px-5 py-4 shrink-0 border-b border-border">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Mail className="h-4 w-4 text-primary" />
            Email Preview
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-none">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-5 py-3 space-y-2 text-sm shrink-0 bg-background/30 border-b border-border">
          <div className="flex gap-3">
            <span className="text-muted-foreground w-14 shrink-0">To</span>
            <span className="font-medium text-foreground">{recipientEmail || "—"}</span>
          </div>
          <div className="flex gap-3">
            <span className="text-muted-foreground w-14 shrink-0">Subject</span>
            <span className="font-medium text-foreground">{subject || "—"}</span>
          </div>

          {attachments.length > 0 && (
            <div className="flex gap-3">
              <span className="text-muted-foreground w-14 shrink-0">Attachments</span>
              <div className="flex flex-wrap gap-1.5">
                {attachments.map((f, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-none border border-border"
                  >
                    <FileText className="h-3 w-3" />
                    {f.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed text-foreground">
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
      setScheduledFor(toDateTimeLocalValue(new Date(Date.now() + 10 * 60 * 1000)));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!scheduledFor) return;
    onConfirm(new Date(scheduledFor).toISOString());
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-none bg-card shadow-2xl border border-border">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <CalendarClock className="h-4 w-4 text-primary" />
            Schedule Email
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-none">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Date and time</label>
            <Input
              type="datetime-local"
              value={scheduledFor}
              min={toDateTimeLocalValue(new Date())}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="rounded-none"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            This UI version sends scheduled emails only while this app stays open.
          </p>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="rounded-none">
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!scheduledFor} className="rounded-none">
            Confirm Schedule
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl rounded-none bg-card shadow-2xl flex flex-col max-h-[92vh] border border-border">
        <div className="flex items-center justify-between px-5 py-4 shrink-0 border-b border-border">
          <div
            className="flex items-center gap-2 text-base font-medium text-foreground"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            <Sparkles className="h-4 w-4 text-primary" />
            New Email
          </div>

          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close" className="rounded-none">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">To</p>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => onRecipientChange(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full bg-transparent border-0 border-b border-muted-foreground/30 rounded-none px-0 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Chat with AI</label>
            <ChatPrompt messages={messages} onSendMessage={onSendMessage} isLoading={isChatLoading} />
          </div>

          {hasEmail && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Edit Email</label>

                <div className="flex items-center gap-3">
                  <Button type="button" variant="ghost" size="sm" onClick={onCopy} className="gap-2 rounded-none">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>

                  <Button type="button" variant="ghost" size="sm" onClick={onPreview} className="gap-2 rounded-none">
                    <Mail className="h-4 w-4" />
                    Preview
                  </Button>
                </div>
              </div>

              <EmailEditor
                subject={subject}
                body={body}
                onSubjectChange={onSubjectChange}
                onBodyChange={onBodyChange}
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
                  onChange={onFileChange}
                />

                <Button type="button" variant="outline" onClick={onAddAttachmentClick} className="gap-2 rounded-none">
                  <Paperclip className="h-4 w-4" />
                  Add Attachment
                </Button>

                <AttachmentList files={attachments} onRemove={onRemoveAttachment} />
              </div>

              {status && (
                <div
                  className={cn(
                    "rounded-none px-3 py-2 text-sm border",
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
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border shrink-0 flex-wrap">
            <Button type="button" variant="outline" onClick={onSaveDraft} className="gap-2 rounded-none">
              <Save className="h-4 w-4" />
              Save Draft
            </Button>

            <Button type="button" variant="outline" onClick={onSchedule} className="gap-2 rounded-none">
              <CalendarClock className="h-4 w-4" />
              Schedule
            </Button>

            <Button
              type="button"
              onClick={onSend}
              disabled={isSending || !recipientEmail.trim() || !body.trim()}
              className="gap-2 rounded-none"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isSending ? "Sending..." : "Send Email"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}