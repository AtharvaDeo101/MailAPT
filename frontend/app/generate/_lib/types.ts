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
  // returned by /list_emails; used for unread state and row previews
  snippet?: string;
  labelIds?: string[];
  threadId?: string;
}

export interface GmailEmailDetail {
  id: string;
  subject: string;
  from: string;
  date: string;
  body: string;
  to?: string;
  cc?: string;
  snippet?: string;
  labelIds?: string[];
  plain_body?: string;
  html_body?: string;
}

export interface FolderItem {
  id: string;
  name: string;
  count?: number;
}

/** A Gmail label from /list_labels. */
export interface GmailLabel {
  id: string;
  name: string;
  type?: string;
}

/** A row in the Postgres `emails` table, as returned by /stored_emails. */
export interface StoredEmail {
  id: number;
  subject: string;
  body: string;
  to_address: string;
  from_address: string;
  is_draft: boolean;
  created_at: string | null;
  updated_at: string | null;
  folder_id: number | null;
  gmail_message_id?: string | null;
  gmail_draft_id?: string | null;
}

/** A row in the Postgres `folders` table, as returned by /folders. */
export interface DbFolder {
  id: number;
  name: string;
  description?: string | null;
}

/** A pending row from /scheduled_emails, joined with its email payload. */
export interface ScheduledRecord {
  id: number;
  email_id: number;
  subject: string;
  body: string;
  to_address: string;
  scheduled_for: string;
  status: string;
  created_at?: string | null;
}

export type ActiveSection =
  | "inbox"
  | "sent"
  | "drafts"
  | "scheduled"
  | "folder"
  | "label";

export type StatusMessage = {
  type: "success" | "error";
  message: string;
} | null;
