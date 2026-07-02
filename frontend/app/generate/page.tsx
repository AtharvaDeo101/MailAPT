"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Moon, Sun } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/landing/loading-spinner";

import { fetchEmailDetail, fetchEmails, sendEmailRequest, API } from "./_lib/api";
import {
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
import { ComposeModal, EmailPreviewModal, ScheduleEmailModal } from "./_components/compose-components";

export default function EmailGenerator() {
  const auth = useAuth();
  const user = auth?.user;
  const loading = auth?.loading ?? false;

  const queryClient = useQueryClient();

  const [isDarkMode, setIsDarkMode] = useState(false);
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
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ActiveSection>("inbox");
  const detailCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    data: inboxEmails = [],
    isFetching: inboxLoading,
    refetch: refetchInbox,
  } = useQuery({
    queryKey: ["emails", "inbox"],
    queryFn: () => fetchEmails("in:inbox"),
    enabled: !!user && activeSection === "inbox",
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });

  const {
    data: sentEmails = [],
    isFetching: sentLoading,
    refetch: refetchSent,
  } = useQuery({
    queryKey: ["emails", "sent"],
    queryFn: () => fetchEmails("in:sent"),
    enabled: !!user && activeSection === "sent",
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });

  const {
    data: detailEmail,
    isLoading: detailLoading,
    isError: detailError,
    error: detailErrorValue,
  } = useQuery<GmailEmailDetail>({
    queryKey: ["email", selectedEmailId],
    queryFn: () => fetchEmailDetail(selectedEmailId as string),
    enabled: !!user && !!selectedEmailId,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const closeDetailPanel = () => {
    if (detailCloseTimerRef.current) clearTimeout(detailCloseTimerRef.current);
    detailCloseTimerRef.current = null;
    setDetailPanelVisible(false);
    detailCloseTimerRef.current = setTimeout(() => setSelectedEmailId(null), 500);
  };

  const handleOpenGmailEmail = (id: string) => {
    if (detailCloseTimerRef.current) clearTimeout(detailCloseTimerRef.current);
    detailCloseTimerRef.current = null;
    setSelectedEmailId(id);
    setActiveDraftId(null);
    setActiveScheduledId(null);
    setDetailPanelVisible(true);
  };

  const handleSectionSelect = (section: ActiveSection) => {
    setActiveSection(section);
    closeDetailPanel();
  };

  useEffect(() => {
    return () => {
      if (detailCloseTimerRef.current) clearTimeout(detailCloseTimerRef.current);
    };
  }, []);

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
    setSelectedEmailId(null);
    closeDetailPanel();
    setIsComposeOpen(true);
  };

  const handleSaveDraft = () => {
    if (!subject && !body) return;

    if (activeDraftId) {
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === activeDraftId ? { ...d, subject, body, recipientEmail, createdAt: new Date() } : d,
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
    }, 900);
  };

  const handleSelectDraft = (draft: DraftEmail) => {
    setSubject(draft.subject);
    setBody(draft.body);
    setRecipientEmail(draft.recipientEmail);
    setActiveDraftId(draft.id);
    setActiveScheduledId(null);
    setMessages([]);
    setSelectedEmailId(null);
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
    setSelectedEmailId(null);
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
        `Email successfully sent to ${recipientEmail}${attachments.length > 0 ? ` with ${attachments.length} attachment${attachments.length > 1 ? "s" : ""}.` : "."}`,
      );
      setAttachments([]);
      await queryClient.invalidateQueries({ queryKey: ["emails", "sent"] });

      setTimeout(() => {
        setIsComposeOpen(false);
        setActiveSection("sent");
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
    }, 1200);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasEmail = Boolean(subject || body);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={isDarkMode ? "dark h-screen bg-white flex flex-col overflow-hidden" : "h-screen bg-white flex flex-col overflow-hidden"}>
      <div className="flex items-center justify-end px-6 md:px-8 py-4 border-b border-border bg-white">
        <Button
          type="button"
          variant="outline"
          className="rounded-none gap-2 bg-white"
          onClick={() => setIsDarkMode((prev) => !prev)}
        >
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {isDarkMode ? "Light" : "Dark"}
        </Button>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden bg-white">
        <div className="h-full self-stretch">
          <LeftSidebar
            activeSection={activeSection}
            onSelect={handleSectionSelect}
            inboxCount={inboxEmails.length}
            sentCount={sentEmails.length}
            draftsCount={drafts.length}
            scheduledCount={scheduledEmails.length}
            onNewEmail={handleNewEmail}
          />
        </div>

        <div className="flex-1 min-w-0 relative overflow-hidden bg-white h-full">
          <main
            className="h-full transition-all duration-300"
            style={{
              filter: detailPanelVisible ? "blur(1.5px)" : "none",
              transform: detailPanelVisible ? "scale(0.995)" : "scale(1)",
            }}
          >
            <EmailListView
              activeSection={activeSection}
              inboxEmails={inboxEmails}
              sentEmails={sentEmails}
              drafts={drafts}
              scheduledEmails={scheduledEmails}
              activeDraftId={activeDraftId}
              activeScheduledId={activeScheduledId}
              inboxLoading={inboxLoading}
              sentLoading={sentLoading}
              selectedEmailId={selectedEmailId}
              onRefreshInbox={refetchInbox}
              onRefreshSent={refetchSent}
              onOpenGmailEmail={handleOpenGmailEmail}
              onSelectDraft={handleSelectDraft}
              onDeleteDraft={handleDeleteDraft}
              onSelectScheduled={handleSelectScheduled}
              onDeleteScheduled={handleDeleteScheduled}
            />
          </main>

          <EmailDetailOverlayPanel
            isVisible={detailPanelVisible}
            email={detailEmail ?? null}
            isLoading={!!selectedEmailId && detailLoading}
            onClose={closeDetailPanel}
          />
        </div>
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
        onRemoveAttachment={(i) => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
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