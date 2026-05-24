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
  Paperclip,
  FileText,
  Star,
  CalendarClock,
  Settings,
  Search,
  ChevronRight,
  PanelRightOpen,
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

type ActiveSection =
  | "inbox"
  | "sent"
  | "drafts"
  | "scheduled"
  | "favorites"
  | "settings"
  | null;

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

function extractEmailAddress(from: string): string {
  if (!from) return "";
  const match = from.match(/<([^>]+)>/);
  if (match?.[1]) return match[1].trim().toLowerCase();
  if (from.includes("@")) return from.trim().toLowerCase();
  return "";
}

function getSenderDisplayName(from: string): string {
  if (!from) return "Unknown";
  return from.split("<")[0].trim() || from;
}

function getSenderInitial(from: string): string {
  const name = getSenderDisplayName(from);
  return name.charAt(0).toUpperCase() || "?";
}

function getLetterAvatarColors(letter: string) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    A: { bg: "#FDE68A", text: "#92400E" },
    B: { bg: "#BFDBFE", text: "#1E3A8A" },
    C: { bg: "#C7D2FE", text: "#3730A3" },
    D: { bg: "#FBCFE8", text: "#9D174D" },
    E: { bg: "#A7F3D0", text: "#065F46" },
    F: { bg: "#DDD6FE", text: "#5B21B6" },
    G: { bg: "#FED7AA", text: "#9A3412" },
    H: { bg: "#FECACA", text: "#991B1B" },
    I: { bg: "#BBF7D0", text: "#166534" },
    J: { bg: "#E9D5FF", text: "#6B21A8" },
    K: { bg: "#BAE6FD", text: "#075985" },
    L: { bg: "#FEF3C7", text: "#92400E" },
    M: { bg: "#FBCFE8", text: "#9D174D" },
    N: { bg: "#CFFAFE", text: "#155E75" },
    O: { bg: "#D9F99D", text: "#3F6212" },
    P: { bg: "#E5E7EB", text: "#374151" },
    Q: { bg: "#F5D0FE", text: "#86198F" },
    R: { bg: "#FDE68A", text: "#92400E" },
    S: { bg: "#BFDBFE", text: "#1E40AF" },
    T: { bg: "#A7F3D0", text: "#065F46" },
    U: { bg: "#C4B5FD", text: "#5B21B6" },
    V: { bg: "#FDBA74", text: "#9A3412" },
    W: { bg: "#FCA5A5", text: "#991B1B" },
    X: { bg: "#86EFAC", text: "#166534" },
    Y: { bg: "#93C5FD", text: "#1D4ED8" },
    Z: { bg: "#F9A8D4", text: "#9D174D" },
    "?": { bg: "#E5E7EB", text: "#374151" },
  };

  return colorMap[letter] || colorMap["?"];
}


// Lightweight md5 for gravatar
function md5cycle(x: number[], k: number[]) {
  let [a, b, c, d] = x;

  const ff = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => {
    a = a + ((b & c) | (~b & d)) + x + t;
    return (((a << s) | (a >>> (32 - s))) + b) | 0;
  };

  const gg = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => {
    a = a + ((b & d) | (c & ~d)) + x + t;
    return (((a << s) | (a >>> (32 - s))) + b) | 0;
  };

  const hh = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => {
    a = a + (b ^ c ^ d) + x + t;
    return (((a << s) | (a >>> (32 - s))) + b) | 0;
  };

  const ii = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => {
    a = a + (c ^ (b | ~d)) + x + t;
    return (((a << s) | (a >>> (32 - s))) + b) | 0;
  };

  a = ff(a, b, c, d, k[0], 7, -680876936);
  d = ff(d, a, b, c, k[1], 12, -389564586);
  c = ff(c, d, a, b, k[2], 17, 606105819);
  b = ff(b, c, d, a, k[3], 22, -1044525330);
  a = ff(a, b, c, d, k[4], 7, -176418897);
  d = ff(d, a, b, c, k[5], 12, 1200080426);
  c = ff(c, d, a, b, k[6], 17, -1473231341);
  b = ff(b, c, d, a, k[7], 22, -45705983);
  a = ff(a, b, c, d, k[8], 7, 1770035416);
  d = ff(d, a, b, c, k[9], 12, -1958414417);
  c = ff(c, d, a, b, k[10], 17, -42063);
  b = ff(b, c, d, a, k[11], 22, -1990404162);
  a = ff(a, b, c, d, k[12], 7, 1804603682);
  d = ff(d, a, b, c, k[13], 12, -40341101);
  c = ff(c, d, a, b, k[14], 17, -1502002290);
  b = ff(b, c, d, a, k[15], 22, 1236535329);

  a = gg(a, b, c, d, k[1], 5, -165796510);
  d = gg(d, a, b, c, k[6], 9, -1069501632);
  c = gg(c, d, a, b, k[11], 14, 643717713);
  b = gg(b, c, d, a, k[0], 20, -373897302);
  a = gg(a, b, c, d, k[5], 5, -701558691);
  d = gg(d, a, b, c, k[10], 9, 38016083);
  c = gg(c, d, a, b, k[15], 14, -660478335);
  b = gg(b, c, d, a, k[4], 20, -405537848);
  a = gg(a, b, c, d, k[9], 5, 568446438);
  d = gg(d, a, b, c, k[14], 9, -1019803690);
  c = gg(c, d, a, b, k[3], 14, -187363961);
  b = gg(b, c, d, a, k[8], 20, 1163531501);
  a = gg(a, b, c, d, k[13], 5, -1444681467);
  d = gg(d, a, b, c, k[2], 9, -51403784);
  c = gg(c, d, a, b, k[7], 14, 1735328473);
  b = gg(b, c, d, a, k[12], 20, -1926607734);

  a = hh(a, b, c, d, k[5], 4, -378558);
  d = hh(d, a, b, c, k[8], 11, -2022574463);
  c = hh(c, d, a, b, k[11], 16, 1839030562);
  b = hh(b, c, d, a, k[14], 23, -35309556);
  a = hh(a, b, c, d, k[1], 4, -1530992060);
  d = hh(d, a, b, c, k[4], 11, 1272893353);
  c = hh(c, d, a, b, k[7], 16, -155497632);
  b = hh(b, c, d, a, k[10], 23, -1094730640);
  a = hh(a, b, c, d, k[13], 4, 681279174);
  d = hh(d, a, b, c, k[0], 11, -358537222);
  c = hh(c, d, a, b, k[3], 16, -722521979);
  b = hh(b, c, d, a, k[6], 23, 76029189);
  a = hh(a, b, c, d, k[9], 4, -640364487);
  d = hh(d, a, b, c, k[12], 11, -421815835);
  c = hh(c, d, a, b, k[15], 16, 530742520);
  b = hh(b, c, d, a, k[2], 23, -995338651);

  a = ii(a, b, c, d, k[0], 6, -198630844);
  d = ii(d, a, b, c, k[7], 10, 1126891415);
  c = ii(c, d, a, b, k[14], 15, -1416354905);
  b = ii(b, c, d, a, k[5], 21, -57434055);
  a = ii(a, b, c, d, k[12], 6, 1700485571);
  d = ii(d, a, b, c, k[3], 10, -1894986606);
  c = ii(c, d, a, b, k[10], 15, -1051523);
  b = ii(b, c, d, a, k[1], 21, -2054922799);
  a = ii(a, b, c, d, k[8], 6, 1873313359);
  d = ii(d, a, b, c, k[15], 10, -30611744);
  c = ii(c, d, a, b, k[6], 15, -1560198380);
  b = ii(b, c, d, a, k[13], 21, 1309151649);
  a = ii(a, b, c, d, k[4], 6, -145523070);
  d = ii(d, a, b, c, k[11], 10, -1120210379);
  c = ii(c, d, a, b, k[2], 15, 718787259);
  b = ii(b, c, d, a, k[9], 21, -343485551);

  x[0] = (x[0] + a) | 0;
  x[1] = (x[1] + b) | 0;
  x[2] = (x[2] + c) | 0;
  x[3] = (x[3] + d) | 0;
}

function md5blk(s: string) {
  const md5blks = [];
  for (let i = 0; i < 64; i += 4) {
    md5blks[i >> 2] =
      s.charCodeAt(i) +
      (s.charCodeAt(i + 1) << 8) +
      (s.charCodeAt(i + 2) << 16) +
      (s.charCodeAt(i + 3) << 24);
  }
  return md5blks;
}

function md51(s: string) {
  let n = s.length;
  const state = [1732584193, -271733879, -1732584194, 271733878];
  let i;

  for (i = 64; i <= n; i += 64) {
    md5cycle(state, md5blk(s.substring(i - 64, i)));
  }

  s = s.substring(i - 64);
  const tail = new Array(16).fill(0);

  for (i = 0; i < s.length; i++) {
    tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
  }

  tail[i >> 2] |= 0x80 << ((i % 4) << 3);

  if (i > 55) {
    md5cycle(state, tail);
    for (i = 0; i < 16; i++) tail[i] = 0;
  }

  tail[14] = n * 8;
  md5cycle(state, tail);
  return state;
}

function rhex(n: number) {
  const hexChr = "0123456789abcdef";
  let s = "";
  for (let j = 0; j < 4; j++) {
    s +=
      hexChr.charAt((n >> (j * 8 + 4)) & 0x0f) +
      hexChr.charAt((n >> (j * 8)) & 0x0f);
  }
  return s;
}

function md5(s: string) {
  return md51(unescape(encodeURIComponent(s))).map(rhex).join("");
}

function getGravatarUrl(from: string, size = 80) {
  const email = extractEmailAddress(from);
  if (!email) return null;
  const hash = md5(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=404`;
}

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
            ? "2px solid hsl(var(--primary) / 0.25)"
            : "1px solid hsl(var(--border) / 0.5)",
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
          ? "2px solid hsl(var(--primary) / 0.25)"
          : "1px solid rgba(0,0,0,0.06)",
        fontSize: size >= 44 ? "16px" : size >= 32 ? "12px" : "10px",
      }}
      title={getSenderDisplayName(from)}
    >
      {initial}
    </div>
  );
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
    <div className="flex flex-col h-64 rounded-xl bg-card/90 overflow-hidden shadow-sm">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
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
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="p-3 flex gap-2 bg-background/40">
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
    <div className="flex flex-col gap-4 rounded-xl bg-card/90 p-4 shadow-sm">
      <div className="flex items-center gap-3 pb-3">
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
      <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-card shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 shrink-0">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Mail className="h-4 w-4 text-primary" />
            Email Preview
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="px-5 py-3 space-y-2 text-sm shrink-0 bg-background/30">
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

function AttachmentList({ files, onRemove }: { files: File[]; onRemove: (i: number) => void }) {
  if (files.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {files.map((file, i) => (
        <div key={i} className="group flex items-center gap-1.5 bg-accent/60 rounded-lg px-2.5 py-1.5 text-xs text-foreground/80 max-w-[200px] transition-all hover:bg-accent">
          <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="truncate flex-1">{file.name}</span>
          <span className="text-muted-foreground/50 tabular-nums">{formatFileSize(file.size)}</span>
          <button onClick={() => onRemove(i)} className="shrink-0 ml-0.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

function SidebarNavItem({
  item,
  isActive,
  onClick,
}: {
  item: { label: string; icon: React.ReactNode; count?: number };
  isActive: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  const handleItemClick = () => {
    setIsRotating(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsRotating(true);
        onClick();
      });
    });
  };

  useEffect(() => {
    if (!isRotating) return;
    const timer = setTimeout(() => setIsRotating(false), 1200);
    return () => clearTimeout(timer);
  }, [isRotating]);

  return (
    <button
      onClick={handleItemClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative flex w-full items-center gap-3 px-5 py-4 my-0.5 rounded-none text-left select-none transition-all duration-300"
      style={{
        background: isActive
          ? "hsl(var(--primary) / 0.18)"
          : hovered
            ? "hsl(var(--accent) / 0.45)"
            : "transparent",
        boxShadow: "none",
        border: "none",
      }}
    >
      <span
        className="shrink-0 transition-colors duration-200"
        style={{
          color: isActive
            ? "hsl(var(--primary))"
            : hovered
              ? "hsl(var(--primary))"
              : "hsl(var(--muted-foreground) / 0.45)",
        }}
      >
        {item.icon}
      </span>
      <div className="flex-1 min-w-0 relative">
        <span className="block" style={{ perspective: "1200px" }}>
          <span
            className="block"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 500,
              fontSize: isActive || hovered ? "1.16rem" : "0.94rem",
              fontStyle: isActive || hovered ? "italic" : "normal",
              letterSpacing: isActive || hovered ? "-0.03em" : "-0.01em",
              color: isActive
                ? "hsl(var(--primary))"
                : hovered
                  ? "hsl(var(--foreground))"
                  : "hsl(var(--foreground) / 0.68)",
              lineHeight: 1.1,
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
              willChange: "transform",
              transform: isRotating ? "rotateY(360deg)" : "rotateY(0deg)",
              transition: isRotating
                ? "transform 1200ms cubic-bezier(0.16, 1, 0.3, 1)"
                : "color 300ms ease, font-size 300ms ease, letter-spacing 300ms ease",
            }}
          >
            {item.label}
          </span>
        </span>
      </div>
      {item.count !== undefined && item.count > 0 && (
        <span
          className="text-xs tabular-nums shrink-0 transition-colors duration-200"
          style={{
            color: isActive
              ? "hsl(var(--primary) / 0.85)"
              : hovered
                ? "hsl(var(--primary) / 0.75)"
                : "hsl(var(--muted-foreground) / 0.4)",
          }}
        >
          {item.count}
        </span>
      )}
      {isActive && (
        <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(var(--primary) / 0.75)" }} />
      )}
    </button>
  );
}

function LeftSidebar({
  activeSection,
  onSelect,
  inboxCount,
  sentCount,
  draftsCount,
  onNewEmail,
}: {
  activeSection: ActiveSection;
  onSelect: (s: ActiveSection) => void;
  inboxCount: number;
  sentCount: number;
  draftsCount: number;
  onNewEmail: () => void;
}) {
  const navItems = [
    { id: "inbox" as ActiveSection, label: "Inbox", icon: <Inbox className="h-4 w-4" />, count: inboxCount },
    { id: "sent" as ActiveSection, label: "Sent", icon: <SendHorizonal className="h-4 w-4" />, count: sentCount },
    { id: "drafts" as ActiveSection, label: "Drafts", icon: <MailOpen className="h-4 w-4" />, count: draftsCount },
    { id: "scheduled" as ActiveSection, label: "Scheduled", icon: <CalendarClock className="h-4 w-4" />, count: 0 },
    { id: "favorites" as ActiveSection, label: "Favorites", icon: <Star className="h-4 w-4" />, count: 0 },
  ];

  return (
    <aside className="w-60 shrink-0 flex flex-col bg-card/40 h-full z-10 relative shadow-sm" aria-label="Email navigation">
      <div
        className="px-5 pt-5 pb-4 shrink-0"
        style={{ background: "hsl(var(--primary) / 0.08)" }}
      >
        <span
          className="text-[10px] tracking-[0.22em] uppercase font-medium select-none italic"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            color: "hsl(var(--primary) / 0.7)",
          }}
        >
          Mail
        </span>

        <div className="mt-3">
          <Button
            onClick={onNewEmail}
            className="w-full justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm text-sm"
          >
            <PlusCircle className="h-4 w-4" />
            New
          </Button>
        </div>
      </div>

      <nav className="flex flex-col flex-1 py-2 overflow-y-auto">
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.id}
            item={item}
            isActive={activeSection === item.id}
            onClick={() => onSelect(item.id)}
          />
        ))}
        <div className="mx-4 my-2 h-px bg-muted/30" />
        <SidebarNavItem
          item={{ label: "Settings", icon: <Settings className="h-4 w-4" /> }}
          isActive={activeSection === "settings"}
          onClick={() => onSelect("settings")}
        />
      </nav>
    </aside>
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
      className="w-full cursor-pointer overflow-hidden transition-all duration-150"
      style={{
        background: isSelected
          ? "hsl(var(--primary) / 0.18)"
          : hovered
            ? "hsl(var(--accent))"
            : "transparent",
        border: "none",
        boxShadow: "none",
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="px-4 py-3">
        <div className="flex items-start gap-2.5">
          <SenderAvatar from={email.from} size={32} selected={isSelected} />
          <div className="min-w-0 flex-1">
            <p
              className="text-[10px] font-semibold truncate leading-snug"
              style={{ color: isSelected ? "hsl(var(--primary))" : "hsl(var(--foreground) / 0.8)" }}
            >
              {getSenderDisplayName(email.from)}
            </p>
            <p
              className="text-xs font-medium truncate leading-snug mt-0.5"
              style={{ color: isSelected ? "hsl(var(--primary))" : "hsl(var(--foreground))" }}
            >
              {email.subject || "(No Subject)"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-2 pl-10">
          <Clock className="h-2.5 w-2.5" style={{ color: isSelected ? "hsl(var(--primary) / 0.75)" : "hsl(var(--muted-foreground) / 0.35)" }} />
          <span className="text-[10px] tabular-nums" style={{ color: isSelected ? "hsl(var(--primary) / 0.85)" : "hsl(var(--muted-foreground) / 0.5)" }}>
            {formatTime(email.date)}
          </span>
        </div>
      </div>
    </div>
  );
}

function DraftCard({ draft, isActive, onClick, onDelete }: { draft: DraftEmail; isActive: boolean; onClick: () => void; onDelete: () => void }) {
  return (
    <div
      className={cn("group w-full cursor-pointer transition-all duration-150", !isActive && "hover:bg-accent")}
      style={{ background: isActive ? "hsl(var(--primary) / 0.18)" : undefined, border: "none", boxShadow: "none" }}
      onClick={onClick}
    >
      <div className="px-4 py-3">
        <div className="flex items-start gap-2.5">
          <div
            className={cn("h-8 w-8 rounded-full shrink-0 flex items-center justify-center", !isActive && "bg-muted-foreground/10")}
            style={{ background: isActive ? "hsl(var(--primary) / 0.22)" : undefined }}
          >
            <MailOpen className="h-3.5 w-3.5" style={{ color: isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.5)" }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate leading-snug" style={{ color: isActive ? "hsl(var(--primary))" : "hsl(var(--foreground) / 0.85)" }}>
              {draft.subject || "Untitled"}
            </p>
            <p className="text-[10px] truncate mt-0.5" style={{ color: isActive ? "hsl(var(--primary) / 0.78)" : "hsl(var(--muted-foreground) / 0.6)" }}>
              {draft.recipientEmail || "No recipient"}
            </p>
          </div>
          <Button
            variant="ghost" size="icon"
            className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            aria-label="Delete draft"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex items-center gap-1 mt-2 pl-10">
          <Clock className="h-2.5 w-2.5" style={{ color: isActive ? "hsl(var(--primary) / 0.75)" : "hsl(var(--muted-foreground) / 0.35)" }} />
          <span className="text-[10px] tabular-nums" style={{ color: isActive ? "hsl(var(--primary) / 0.85)" : "hsl(var(--muted-foreground) / 0.5)" }}>
            {formatTime(draft.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

function EmailListPanel({
  activeSection, panelVisible, inboxEmails, sentEmails, drafts,
  activeDraftId, inboxLoading, sentLoading, selectedEmailId,
  onRefreshInbox, onRefreshSent, onOpenGmailEmail, onSelectDraft, onDeleteDraft,
}: {
  activeSection: ActiveSection;
  panelVisible: boolean;
  inboxEmails: GmailEmail[];
  sentEmails: GmailEmail[];
  drafts: DraftEmail[];
  activeDraftId: string | null;
  inboxLoading: boolean;
  sentLoading: boolean;
  selectedEmailId: string | null;
  onRefreshInbox: (force?: boolean) => void;
  onRefreshSent: (force?: boolean) => void;
  onOpenGmailEmail: (id: string) => void;
  onSelectDraft: (d: DraftEmail) => void;
  onDeleteDraft: (id: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const shouldRenderPanel = activeSection && activeSection !== "settings";
  const effectiveSection = shouldRenderPanel ? activeSection : "inbox";

  const sectionMeta: Record<string, { label: string; icon: React.ReactNode }> = {
    inbox:     { label: "Inbox",     icon: <Inbox className="h-4 w-4" /> },
    sent:      { label: "Sent",      icon: <SendHorizonal className="h-4 w-4" /> },
    drafts:    { label: "Drafts",    icon: <MailOpen className="h-4 w-4" /> },
    scheduled: { label: "Scheduled", icon: <CalendarClock className="h-4 w-4" /> },
    favorites: { label: "Favorites", icon: <Star className="h-4 w-4" /> },
  };

  const meta = sectionMeta[effectiveSection!];

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

  const isLoading = effectiveSection === "inbox" ? inboxLoading : effectiveSection === "sent" ? sentLoading : false;
  const canRefresh = effectiveSection === "inbox" || effectiveSection === "sent";

  return (
    <div
      className="shrink-0 overflow-hidden bg-background/70 h-full text-[0.875rem] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] shadow-sm"
      style={{
        width: panelVisible ? "18rem" : "0rem",
        minWidth: panelVisible ? "18rem" : "0rem",
        opacity: panelVisible ? 1 : 0,
        transform: panelVisible ? "translateX(0px)" : "translateX(-100%)",
      }}
      aria-hidden={!panelVisible}
    >
      <div
        className="flex flex-col h-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          opacity: panelVisible ? 1 : 0,
          transform: panelVisible ? "translateX(0px)" : "translateX(-24px)",
        }}
      >
        <div
          className="px-4 pt-4 pb-3 shrink-0"
          style={{ background: "hsl(var(--primary) / 0.08)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span style={{ color: "hsl(var(--primary))" }}>{meta.icon}</span>
              <span
                className="text-xs font-semibold"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "hsl(var(--primary))" }}
              >
                {meta.label}
              </span>
            </div>
            {canRefresh && (
              <Button
                variant="ghost" size="icon"
                className="h-6 w-6 text-muted-foreground/50 hover:text-foreground"
                onClick={() => effectiveSection === "inbox" ? onRefreshInbox(true) : onRefreshSent(true)}
                aria-label={`Refresh ${meta.label}`}
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
              </Button>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none" />
            <input
              type="text"
              placeholder={`Search ${meta.label.toLowerCase()}…`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background/50 rounded-lg pl-8 pr-3 py-1.5 text-[10px] text-foreground placeholder:text-muted-foreground/40 outline-none focus:bg-background transition-all duration-200"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(var(--muted)) transparent" }}>
          {effectiveSection === "inbox" && (
            isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
                <span className="text-[10px] text-muted-foreground/40">Loading inbox…</span>
              </div>
            ) : filterEmails(inboxEmails).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-4">
                <Inbox className="h-8 w-8 text-muted-foreground/20" />
                <p className="text-[10px] text-muted-foreground/40 italic" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {searchQuery ? "No results found" : "No inbox emails"}
                </p>
              </div>
            ) : filterEmails(inboxEmails).map((email) => (
              <EmailCard key={email.id} email={email} isSelected={selectedEmailId === email.id} onClick={() => onOpenGmailEmail(email.id)} />
            ))
          )}

          {effectiveSection === "sent" && (
            isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
                <span className="text-[10px] text-muted-foreground/40">Loading sent…</span>
              </div>
            ) : filterEmails(sentEmails).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-4">
                <SendHorizonal className="h-8 w-8 text-muted-foreground/20" />
                <p className="text-[10px] text-muted-foreground/40 italic" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {searchQuery ? "No results found" : "No sent emails"}
                </p>
              </div>
            ) : filterEmails(sentEmails).map((email) => (
              <EmailCard key={email.id} email={email} isSelected={selectedEmailId === email.id} onClick={() => onOpenGmailEmail(email.id)} />
            ))
          )}

          {effectiveSection === "drafts" && (
            filterDrafts(drafts).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-4">
                <MailOpen className="h-8 w-8 text-muted-foreground/20" />
                <p className="text-[10px] text-muted-foreground/40 italic" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {searchQuery ? "No results found" : "No drafts yet"}
                </p>
              </div>
            ) : filterDrafts(drafts).map((draft) => (
              <DraftCard key={draft.id} draft={draft} isActive={activeDraftId === draft.id} onClick={() => onSelectDraft(draft)} onDelete={() => onDeleteDraft(draft.id)} />
            ))
          )}

          {effectiveSection === "scheduled" && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-4">
              <CalendarClock className="h-8 w-8 text-muted-foreground/20" />
              <p className="text-[10px] text-muted-foreground/40 italic" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>No scheduled emails</p>
            </div>
          )}

          {effectiveSection === "favorites" && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-4">
              <Star className="h-8 w-8 text-muted-foreground/20" />
              <p className="text-[10px] text-muted-foreground/40 italic" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>No favorites yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmailDetailOverlayPanel({
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
  const plain = email?.plain_body || email?.body || "";
  const html = email?.html_body || "";
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
        className="absolute inset-y-0 left-0 w-full bg-background shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col"
        style={{
          transform: isVisible ? "translateX(0%)" : "translateX(-100%)",
          opacity: isVisible ? 1 : 0.98,
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ background: "hsl(var(--primary) / 0.08)" }}
        >
          <div className="flex items-center gap-2 text-sm font-medium min-w-0">
            <PanelRightOpen
              className="h-4 w-4 shrink-0"
              style={{ color: "hsl(var(--primary))" }}
            />
            <span
              className="truncate"
              style={{ color: "hsl(var(--primary))" }}
            >
              {email?.subject || "Email details"}
            </span>
          </div>

          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading email…</p>
          </div>
        ) : !email ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 text-center">
            <Mail className="h-10 w-10 text-muted-foreground/30" />
            <div>
              <p className="text-sm font-medium text-foreground">No email selected</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click any inbox or sent email to show it here.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div
              className="mx-5 mt-5 rounded-xl px-4 py-4 text-sm shrink-0 shadow-sm"
              style={{ background: "hsl(var(--primary) / 0.10)" }}
            >
              <div className="flex items-start gap-3">
                <SenderAvatar from={email.from} size={44} />
                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <p className="font-medium break-words">
                      {getSenderDisplayName(email.from)}
                    </p>
                    {extractEmailAddress(email.from) && (
                      <p className="text-xs text-muted-foreground break-all">
                        {extractEmailAddress(email.from)}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <span className="text-muted-foreground w-14 shrink-0">Subject</span>
                    <span className="font-medium break-words">
                      {email.subject || "—"}
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <span className="text-muted-foreground w-14 shrink-0">Date</span>
                    <span className="break-words">{email.date || "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="rounded-xl min-h-full px-4 py-4 bg-card/70 shadow-sm">
                {hasHtml ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div dangerouslySetInnerHTML={{ __html: html }} />
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed text-foreground">
                    {plain || <span className="text-muted-foreground">No body content.</span>}
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
  const [detailEmail, setDetailEmail] = useState<GmailEmailDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailPanelVisible, setDetailPanelVisible] = useState(false);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);
  const [panelVisible, setPanelVisible] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const detailCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchInbox = async (force = false) => {
    if (inboxLoading) return;
    if (inboxLoaded && !force) return;
    setInboxLoading(true);
    try {
      const res = await fetch(`${API}/list_emails?max_results=10&q=in:inbox`, { credentials: "include" });
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
      const res = await fetch(`${API}/list_emails?max_results=10&q=in:sent`, { credentials: "include" });
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

  const closeDetailPanel = () => {
    if (detailCloseTimerRef.current) {
      clearTimeout(detailCloseTimerRef.current);
      detailCloseTimerRef.current = null;
    }
    setDetailPanelVisible(false);
    detailCloseTimerRef.current = setTimeout(() => {
      setDetailEmail(null);
      setSelectedEmailId(null);
    }, 500);
  };

  const handleOpenGmailEmail = async (id: string) => {
    if (detailCloseTimerRef.current) {
      clearTimeout(detailCloseTimerRef.current);
      detailCloseTimerRef.current = null;
    }
    setSelectedEmailId(id);
    setDetailLoading(true);
    if (!detailPanelVisible) requestAnimationFrame(() => setDetailPanelVisible(true));
    try {
      const res = await fetch(`${API}/get_email/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch email");
      const data = await res.json();
      setDetailEmail(data);
      setDetailPanelVisible(true);
    } catch {
      setDetailEmail(null);
      setDetailPanelVisible(true);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSectionSelect = (section: ActiveSection) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (section === activeSection && panelVisible) {
      setPanelVisible(false);
      closeDetailPanel();
      closeTimerRef.current = setTimeout(() => setActiveSection(null), 500);
      return;
    }
    setActiveSection(section);
    requestAnimationFrame(() => setPanelVisible(section !== "settings" && section !== null));
    closeDetailPanel();
    if (section === "inbox" && !inboxLoaded && !inboxLoading) fetchInbox();
    if (section === "sent" && !sentLoaded && !sentLoading) fetchSent();
  };

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      if (detailCloseTimerRef.current) clearTimeout(detailCloseTimerRef.current);
    };
  }, []);

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
            : d
        )
      );
    } else {
      const nd: DraftEmail = {
        id: `${Date.now()}`,
        subject,
        body,
        recipientEmail,
        createdAt: new Date(),
      };
      setDrafts((prev) => [nd, ...prev]);
      setActiveDraftId(nd.id);
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
    setSelectedEmailId(null);
    closeDetailPanel();
  };

  const handleSelectDraft = (draft: DraftEmail) => {
    setSubject(draft.subject);
    setBody(draft.body);
    setRecipientEmail(draft.recipientEmail);
    setActiveDraftId(draft.id);
    setMessages([]);
    setSelectedEmailId(null);
    closeDetailPanel();
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
    setIsSending(true);
    setStatus(null);
    try {
      const formData = new FormData();
      formData.append("to", recipientEmail.trim());
      formData.append("subject", subject);
      formData.append("body", body);
      attachments.forEach((f) => formData.append("attachments", f));
      const res = await fetch(`${API}/send_email`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error((await res.json()).error || "Sending failed");
      setStatus({ type: "success", message: `Email sent to ${recipientEmail}` });
      addMessage(
        "assistant",
        `✓ Email successfully sent to ${recipientEmail}${attachments.length > 0 ? ` with ${attachments.length} attachment${attachments.length > 1 ? "s" : ""}` : ""}!`
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
        <LeftSidebar
          activeSection={activeSection}
          onSelect={handleSectionSelect}
          inboxCount={inboxEmails.length}
          sentCount={sentEmails.length}
          draftsCount={drafts.length}
          onNewEmail={handleNewEmail}
        />

        <EmailListPanel
          activeSection={activeSection}
          panelVisible={panelVisible}
          inboxEmails={inboxEmails}
          sentEmails={sentEmails}
          drafts={drafts}
          activeDraftId={activeDraftId}
          inboxLoading={inboxLoading}
          sentLoading={sentLoading}
          selectedEmailId={selectedEmailId}
          onRefreshInbox={fetchInbox}
          onRefreshSent={fetchSent}
          onOpenGmailEmail={handleOpenGmailEmail}
          onSelectDraft={handleSelectDraft}
          onDeleteDraft={handleDeleteDraft}
        />

        <div className="flex-1 min-w-0 relative overflow-hidden bg-background/50">
          <main
            className="h-full overflow-y-auto min-w-0 transition-all duration-300"
            style={{
              filter: detailPanelVisible ? "blur(1.5px)" : "none",
              transform: detailPanelVisible ? "scale(0.995)" : "scale(1)",
            }}
          >
            <div className="relative w-full h-40 overflow-hidden">
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
                    className="h-11 shadow-sm border-0 bg-card/80"
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
                        <button onClick={handleCopy} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied ? "Copied" : "Copy"}
                        </button>
                        <button onClick={() => setPreviewOpen(true)} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                          <Eye className="w-3.5 h-3.5" />Preview
                        </button>
                      </div>
                    </div>
                    <EmailEditor subject={subject} body={body} onSubjectChange={setSubject} onBodyChange={setBody} />
                  </div>
                )}

                {hasEmail && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div>
                      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                      >
                        <Paperclip className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform duration-200" />
                        Attach files
                        {attachments.length > 0 && (
                          <span className="ml-1 bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums">{attachments.length}</span>
                        )}
                      </button>
                      <AttachmentList files={attachments} onRemove={(i) => setAttachments((prev) => prev.filter((_, idx) => idx !== i))} />
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={handleSaveDraft} className="flex-1 h-11 gap-2 border-0 shadow-sm bg-card/80">
                        <Save className="w-4 h-4" />Save Draft
                      </Button>
                      <Button onClick={handleSend} disabled={!recipientEmail.trim() || isSending} className="flex-1 h-11 gap-2">
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {isSending ? "Sending…" : "Send Email"}
                      </Button>
                    </div>
                  </div>
                )}

                {status && (
                  <div className={`text-sm text-center py-2 px-4 rounded-lg ${status.type === "success" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                    {status.message}
                  </div>
                )}

                <p className="text-center text-xs text-muted-foreground pb-4">Powered by AI · Review before sending</p>
              </div>
            </div>
          </main>

          <EmailDetailOverlayPanel
            isVisible={detailPanelVisible}
            email={detailEmail}
            isLoading={detailLoading}
            onClose={closeDetailPanel}
          />
        </div>
      </div>

      <EmailPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        recipientEmail={recipientEmail}
        subject={subject}
        body={body}
        attachments={attachments}
      />
    </div>
  );
}