"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/landing/loading-spinner";

import {
  fetchEmailDetail,
  fetchEmails,
  sendEmailRequest,
  API,
  fetchStoredEmails,
  fetchFolders,
  createFolder,
} from "./_lib/api";
import type {
  ActiveSection,
  ChatMessage,
  DraftEmail,
  GmailEmailDetail,
  ScheduledEmail,
  StatusMessage,
} from "./_lib/types";
import { formatScheduledDateTime } from "./_lib/generate-utils";

import { LeftSidebar } from "./_components/sidebar-components";
import { EmailDetailOverlayPanel, EmailListView } from "./_components/list-components";
import {
  ComposeModal,
  EmailPreviewModal,
  ScheduleEmailModal,
} from "./_components/compose-components";

type SidebarSection = ActiveSection | "folder";

type FolderItem = {
  id: string;
  name: string;
  count?: number;
};

type FolderCapableEmail = {
  id: string;
  folderId?: string | null;
  labelIds?: string[];
  [key: string]: any;
};

function normalizeFolderId(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

// DB-backed types (mirroring api.ts)
type StoredEmail = {
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
};

type DbFolder = {
  id: number;
  name: string;
  description?: string | null;
};

export default function EmailGenerator() {
  const isAuthenticated = useAuth();
  const authLoading = isAuthenticated === null;

  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [status, setStatus] = useState<StatusMessage>(null);
  const [drafts, setDrafts] = useState<DraftEmail[]>([]);
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [activeScheduledId, setActiveScheduledId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [detailPanelVisible, setDetailPanelVisible] = useState(false);
  const [openedEmailId, setOpenedEmailId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SidebarSection>("inbox");
  const detailCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Gmail inbox emails
  const {
    data: inboxEmails = [],
    isFetching: inboxLoading,
    refetch: refetchInbox,
  } = useQuery({
    queryKey: ["emails", "inbox"],
    queryFn: () => fetchEmails("in:inbox"),
    enabled: isAuthenticated === true,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });

  // Gmail sent emails
  const {
    data: sentEmails = [],
    isFetching: sentLoading,
    refetch: refetchSent,
  } = useQuery({
    queryKey: ["emails", "sent"],
    queryFn: () => fetchEmails("in:sent"),
    enabled: isAuthenticated === true,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });

  // Gmail email detail
  const {
    data: detailEmail,
    isLoading: detailLoading,
    isFetching: detailFetching,
    isError: detailIsError,
    error: detailError,
  } = useQuery<GmailEmailDetail>({
    queryKey: ["email-detail", openedEmailId],
    queryFn: async () => {
      if (!openedEmailId) {
        throw new Error("No email selected.");
      }
      return await fetchEmailDetail(openedEmailId);
    },
    enabled: isAuthenticated === true && !!openedEmailId && detailPanelVisible,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: false,
  });

  // DB-backed folders
  const {
    data: dbFolders = [],
    isFetching: foldersLoading,
    refetch: refetchFolders,
  } = useQuery<DbFolder[]>({
    queryKey: ["db-folders"],
    queryFn: () => fetchFolders(),
    enabled: isAuthenticated === true,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });

  // DB-backed stored emails (filtered by selectedFolderId when in folder section)
  const {
    data: storedEmails = [],
    isFetching: storedLoading,
    refetch: refetchStored,
  } = useQuery<StoredEmail[]>({
    queryKey: ["stored-emails", selectedFolderId],
    queryFn: () =>
      fetchStoredEmails({
        folder_id:
          activeSection === "folder" && selectedFolderId
            ? Number(selectedFolderId)
            : undefined,
      }),
    enabled: isAuthenticated === true,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

  const detailErrorMessage = useMemo(() => {
    if (!detailIsError) return null;
    if (detailError instanceof Error) return detailError.message;
    return "Failed to load email details.";
  }, [detailIsError, detailError]);

  useEffect(() => {
    if (detailIsError) {
      setStatus({
        type: "error",
        message:
          detailError instanceof Error
            ? detailError.message
            : "Failed to load email details.",
      });
    }
  }, [detailIsError, detailError]);

  const closeDetailPanel = () => {
    setDetailPanelVisible(false);

    if (detailCloseTimerRef.current) {
      clearTimeout(detailCloseTimerRef.current);
    }

    detailCloseTimerRef.current = setTimeout(() => {
      setOpenedEmailId(null);
      detailCloseTimerRef.current = null;
    }, 400);
  };

  const handleOpenGmailEmail = (id: string) => {
    if (!id) return;

    if (detailCloseTimerRef.current) {
      clearTimeout(detailCloseTimerRef.current);
      detailCloseTimerRef.current = null;
    }

    setStatus(null);
    setActiveDraftId(null);
    setActiveScheduledId(null);
    setOpenedEmailId(id);
    setDetailPanelVisible(true);
  };

  const handleSectionSelect = (section: SidebarSection) => {
    if (section === "folder") {
      setActiveSection("folder");
    } else {
      setActiveSection(section);
      setSelectedFolderId(null);
    }

    closeDetailPanel();
  };

  const handleSelectFolder = (folderId: string) => {
    setSelectedFolderId(folderId); // folderId = DbFolder.id as string
    setActiveSection("folder");
    setActiveDraftId(null);
    setActiveScheduledId(null);
    closeDetailPanel();
    // storedEmails query will refetch based on selectedFolderId
    queryClient.invalidateQueries({ queryKey: ["stored-emails", folderId] });
  };

  const handleAddFolder = async () => {
    const rawName = window.prompt("Enter folder name");
    if (!rawName?.trim()) return;

    const name = rawName.trim();
    try {
      setStatus(null);
      await createFolder({ name });
      await refetchFolders();
      setStatus({ type: "success", message: `Folder "${name}" created.` });
      setTimeout(() => setStatus(null), 2000);
    } catch (err: any) {
      setStatus({
        type: "error",
        message: err?.message || "Failed to create folder.",
      });
      setTimeout(() => setStatus(null), 2200);
    }
  };

  useEffect(() => {
    return () => {
      if (detailCloseTimerRef.current) clearTimeout(detailCloseTimerRef.current);
    };
  }, []);

  // Local scheduled sending (frontend only; backend can later handle scheduled DB sends)
  useEffect(() => {
    if (!scheduledEmails.length) return;

    const interval = setInterval(async () => {
      const now = Date.now();
      const dueEmails = scheduledEmails.filter(
        (item) => new Date(item.scheduledFor).getTime() <= now,
      );

      for (const item of dueEmails) {
        try {
          await sendEmailRequest({
            to: item.recipientEmail,
            subject: item.subject,
            body: item.body,
            attachments: item.attachments,
          });

          setScheduledEmails((prev) => prev.filter((s) => s.id !== item.id));
          setStatus({
            type: "success",
            message: `Scheduled email sent to ${item.recipientEmail}`,
          });
          setTimeout(() => setStatus(null), 2500);
          await queryClient.invalidateQueries({ queryKey: ["emails", "sent"] });
          await queryClient.invalidateQueries({ queryKey: ["stored-emails"] });
        } catch (err: any) {
          setStatus({
            type: "error",
            message: err?.message || `Failed to send scheduled email to ${item.recipientEmail}`,
          });
        }
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [scheduledEmails, queryClient]);

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

      const data = await res.json().catch(() => null);

      if (!res.ok) throw new Error(data?.error || "Generation failed");

      setSubject(data?.subject ?? "");
      setBody(data?.body ?? "");
      addMessage(
        "assistant",
        `I've drafted an email with the subject "${data?.subject ?? ""}". Review and edit it below, then send or schedule it.`,
      );
      // After generate_email, backend stores generated draft → refresh stored emails
      await queryClient.invalidateQueries({ queryKey: ["stored-emails"] });
    } catch (err: any) {
      const msg = err?.message || "Unknown error";
      addMessage("assistant", `Sorry, something went wrong. ${msg}`);
      setStatus({ type: "error", message: msg });
    } finally {
      setIsChatLoading(false);
    }
  };

  const resetComposeFields = () => {
    setSubject("");
    setBody("");
    setRecipientEmail("");
    setActiveDraftId(null);
    setActiveScheduledId(null);
    setMessages([]);
    setStatus(null);
    setAttachments([]);
  };

  const handleNewEmail = () => {
    resetComposeFields();
    closeDetailPanel();
    setIsComposeOpen(true);
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
      const nd: DraftEmail = {
        id: `${Date.now()}-${Math.random()}`,
        subject,
        body,
        recipientEmail,
        createdAt: new Date(),
      };
      setDrafts((prev) => [nd, ...prev]);
      setActiveDraftId(nd.id);
    }

    setActiveScheduledId(null);
    setStatus({ type: "success", message: "Draft saved." });
    setTimeout(() => {
      setStatus(null);
      setIsComposeOpen(false);
      setActiveSection("drafts");
      setSelectedFolderId(null);
    }, 900);
  };

  const handleSelectDraft = (draft: DraftEmail) => {
    setSubject(draft.subject);
    setBody(draft.body);
    setRecipientEmail(draft.recipientEmail);
    setActiveDraftId(draft.id);
    setActiveScheduledId(null);
    setMessages([]);
    closeDetailPanel();
    setIsComposeOpen(true);
  };

  const handleDeleteDraft = (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    if (activeDraftId === id) resetComposeFields();
  };

  const handleSelectScheduled = (item: ScheduledEmail) => {
    setSubject(item.subject);
    setBody(item.body);
    setRecipientEmail(item.recipientEmail);
    setAttachments(item.attachments);
    setActiveScheduledId(item.id);
    setActiveDraftId(null);
    setMessages([]);
    closeDetailPanel();
    setIsComposeOpen(true);
  };

  const handleDeleteScheduled = (id: string) => {
    setScheduledEmails((prev) => prev.filter((d) => d.id !== id));
    if (activeScheduledId === id) resetComposeFields();
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
      await sendEmailRequest({ to: recipientEmail, subject, body, attachments });
      setStatus({ type: "success", message: `Email sent to ${recipientEmail}` });
      addMessage(
        "assistant",
        `Email successfully sent to ${recipientEmail}${
          attachments.length > 0
            ? ` with ${attachments.length} attachment${attachments.length > 1 ? "s" : ""}.`
            : "."
        }`,
      );
      setAttachments([]);
      await queryClient.invalidateQueries({ queryKey: ["emails", "sent"] });
      await queryClient.invalidateQueries({ queryKey: ["stored-emails"] });

      setTimeout(() => {
        setIsComposeOpen(false);
        setActiveSection("sent");
        setSelectedFolderId(null);
        resetComposeFields();
      }, 900);
    } catch (err: any) {
      setStatus({ type: "error", message: err?.message || "Unknown error" });
    } finally {
      setIsSending(false);
    }
  };

  const handleScheduleConfirm = (scheduledFor: string) => {
    if (!body.trim() || !recipientEmail.trim()) {
      setStatus({
        type: "error",
        message: "Recipient and email body are required to schedule.",
      });
      return;
    }

    const when = new Date(scheduledFor);
    if (isNaN(when.getTime()) || when.getTime() <= Date.now()) {
      setStatus({
        type: "error",
        message: "Please choose a future date and time.",
      });
      return;
    }

    const newScheduled: ScheduledEmail = {
      id: `${Date.now()}-${Math.random()}`,
      subject,
      body,
      recipientEmail,
      scheduledFor,
      createdAt: new Date(),
      attachments: [...attachments],
    };

    setScheduledEmails((prev) =>
      [...prev, newScheduled].sort(
        (a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime(),
      ),
    );

    setActiveScheduledId(newScheduled.id);
    setActiveDraftId(null);
    setScheduleOpen(false);
    setStatus({
      type: "success",
      message: `Email scheduled for ${formatScheduledDateTime(scheduledFor)}`,
    });

    setTimeout(() => {
      setStatus(null);
      setIsComposeOpen(false);
      setActiveSection("scheduled");
      setSelectedFolderId(null);
    }, 1200);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasEmail = Boolean(subject || body);

  // Gmail emails with "folderId" info removed (folders are DB-only now)
  const inboxWithFolders = useMemo(() => {
    return inboxEmails.map((email: FolderCapableEmail) => ({
      ...email,
      folderId: email.folderId ?? null,
    }));
  }, [inboxEmails]);

  const sentWithFolders = useMemo(() => {
    return sentEmails.map((email: FolderCapableEmail) => ({
      ...email,
      folderId: email.folderId ?? null,
    }));
  }, [sentEmails]);

  // Sidebar folders: DB folders + count based on storedEmails only
  const computedFolders = useMemo<FolderItem[]>(() => {
    const baseFolders: FolderItem[] = dbFolders.map((f) => ({
      id: String(f.id),
      name: f.name,
    }));

    return baseFolders.map((folder) => ({
      ...folder,
      count: storedEmails.filter(
        (email: StoredEmail) => String(email.folder_id) === folder.id,
      ).length,
    }));
  }, [dbFolders, storedEmails]);

  const panelIsLoading =
    detailPanelVisible && !!openedEmailId && (detailLoading || detailFetching);

  const panelEmail =
    detailPanelVisible && openedEmailId && !detailLoading && !detailIsError && detailEmail
      ? detailEmail
      : null;

  const panelError =
    detailPanelVisible &&
    !!openedEmailId &&
    !detailLoading &&
    detailIsError
      ? detailErrorMessage
      : null;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      <div className="h-full self-stretch">
        <LeftSidebar
          activeSection={activeSection}
          onSelect={handleSectionSelect}
          inboxCount={inboxWithFolders.length}
          sentCount={sentWithFolders.length}
          draftsCount={drafts.length}
          scheduledCount={scheduledEmails.length}
          onNewEmail={handleNewEmail}
          folders={computedFolders}
          selectedFolderId={selectedFolderId}
          onSelectFolder={handleSelectFolder}
          onAddFolder={handleAddFolder}
        />
      </div>

      <div className="flex-1 min-w-0 relative overflow-hidden bg-white h-full">
        <main
          className="h-full transition-all duration-300"
          style={{
            filter: "none",
            transform: "scale(1)",
          }}
        >
          <EmailListView
            activeSection={activeSection}
            inboxEmails={inboxWithFolders}
            sentEmails={sentWithFolders}
            drafts={drafts}
            scheduledEmails={scheduledEmails}
            activeDraftId={activeDraftId}
            activeScheduledId={activeScheduledId}
            inboxLoading={inboxLoading}
            sentLoading={sentLoading}
            selectedEmailId={openedEmailId}
            selectedFolderId={selectedFolderId}
            folders={computedFolders}
            onRefreshInbox={() => refetchInbox()}
            onRefreshSent={() => refetchSent()}
            onOpenGmailEmail={handleOpenGmailEmail}
            onSelectDraft={handleSelectDraft}
            onDeleteDraft={handleDeleteDraft}
            onSelectScheduled={handleSelectScheduled}
            onDeleteScheduled={handleDeleteScheduled}
            // NEW: DB-backed emails for folder view
            storedEmails={storedEmails}
            storedLoading={storedLoading}
          />
        </main>

        <EmailDetailOverlayPanel
          isVisible={detailPanelVisible}
          email={panelEmail}
          isLoading={panelIsLoading}
          errorMessage={panelError}
          onClose={closeDetailPanel}
        />
      </div>

      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        messages={messages}
        isChatLoading={isChatLoading}
        onSendMessage={handleSendMessage}
        recipientEmail={recipientEmail}
        onRecipientChange={setRecipientEmail}
        subject={subject}
        onSubjectChange={setSubject}
        body={body}
        onBodyChange={setBody}
        hasEmail={hasEmail}
        copied={copied}
        onCopy={handleCopy}
        onPreview={() => setPreviewOpen(true)}
        attachments={attachments}
        fileInputRef={fileInputRef}
        onAddAttachmentClick={() => fileInputRef.current?.click()}
        onFileChange={handleFileChange}
        onRemoveAttachment={(i) =>
          setAttachments((prev) => prev.filter((_, idx) => idx !== i))
        }
        onSaveDraft={handleSaveDraft}
        onSchedule={() => setScheduleOpen(true)}
        onSend={handleSend}
        isSending={isSending}
        status={status}
      />

      <EmailPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        recipientEmail={recipientEmail}
        subject={subject}
        body={body}
        attachments={attachments}
      />

      <ScheduleEmailModal
        isOpen={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        onConfirm={handleScheduleConfirm}
      />
    </div>
  );
}