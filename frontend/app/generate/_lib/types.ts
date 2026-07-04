export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface DraftEmail {
  id: string;
  subject: string;
  body: string;
  recipientEmail: string;
  createdAt: Date;
}

export interface ScheduledEmail {
  id: string;
  subject: string;
  body: string;
  recipientEmail: string;
  scheduledFor: string;
  createdAt: Date;
  attachments: File[];
}

export interface GmailEmail {
  id: string;
  subject: string;
  from: string;
  date: string;
  folderId?: string | null;
}

export interface GmailEmailDetail {
  id: string;
  subject: string;
  from: string;
  date: string;
  body: string;
  plain_body?: string;
  html_body?: string;
}

export interface FolderItem {
  id: string;
  name: string;
  count?: number;
}

export type ActiveSection = "inbox" | "sent" | "drafts" | "scheduled" | "folder";

export type StatusMessage = {
  type: "success" | "error";
  message: string;
} | null;