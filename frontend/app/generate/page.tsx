"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";

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
  createDraftRequest,
  updateStoredEmail,
  deleteStoredEmail,
  fetchScheduledEmails,
  createScheduledEmail,
  deleteScheduledEmail,
  trashEmail,
  fetchLabels,
  fetchSettings,
  saveSettings,
} from "./_lib/api";
import {
  DEFAULT_SETTINGS,
  playNotificationSound,
  settingsStyle,
  type Settings,
} from "./_lib/settings";
import type {
  ActiveSection,
  ChatMessage,
  DbFolder,
  DraftEmail,
  FolderItem,
  GmailEmail,
  GmailEmailDetail,
  GmailLabel,
  ScheduledEmail,
  ScheduledRecord,
  StatusMessage,
  StoredEmail,
} from "./_lib/types";
import {
  formatScheduledDateTime,
  parseServerDate,
} from "./_lib/generate-utils";
import { usePersistentState } from "./_lib/use-persistent-state";

import {
  LeftSidebar,
  MailTopBar,
  useAccountEmail,
  type RailTab,
} from "./_components/sidebar-components";
import { SettingsView } from "./_components/settings-view";
import {
  PinnedTodos,
  TodoBoard,
  TodoEditorModal,
  useTodoLists,
  type TodoList,
} from "./_components/todo-components";
import {
  NoteEditorModal,
  NotesView,
  useNotes,
  type Note,
} from "./_components/notes-components";
import {
  EmailDetailOverlayPanel,
  EmailListView,
} from "./_components/list-components";
import {
  ComposeModal,
  EmailPreviewModal,
  ScheduleEmailModal,
} from "./_components/compose-components";

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
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [activeScheduledId, setActiveScheduledId] = useState<string | null>(
    null,
  );
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [detailPanelVisible, setDetailPanelVisible] = useState(false);
  const [openedEmailId, setOpenedEmailId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ActiveSection>("inbox");
  const detailCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<GmailLabel | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [paneOpen, setPaneOpen] = useState(true);
  const [railTab, setRailTab] = useState<RailTab>("mail");

  // ---------- to-do lists (local to the browser) ----------

  const [todoLists, setTodoLists] = useTodoLists();
  const [todoEditorOpen, setTodoEditorOpen] = useState(false);
  const [editingTodoList, setEditingTodoList] = useState<TodoList | null>(null);

  const patchTodoList = (id: string, patch: Partial<TodoList>) =>
    setTodoLists((prev) =>
      prev.map((list) => (list.id === id ? { ...list, ...patch } : list)),
    );

  const toggleTodoBlock = (listId: string, blockId: string) =>
    setTodoLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? {
              ...list,
              blocks: list.blocks.map((block) =>
                block.id === blockId ? { ...block, done: !block.done } : block,
              ),
            }
          : list,
      ),
    );

  const [notes, setNotes] = useNotes();
  const [noteEditorOpen, setNoteEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const saveNote = (note: Note) =>
    setNotes((prev) =>
      prev.some((existing) => existing.id === note.id)
        ? prev.map((existing) => (existing.id === note.id ? note : existing))
        : [note, ...prev],
    );

  const saveTodoList = (list: TodoList) =>
    setTodoLists((prev) =>
      prev.some((existing) => existing.id === list.id)
        ? prev.map((existing) => (existing.id === list.id ? list : existing))
        : [...prev, list],
    );

  const [emailFolderAssignments, setEmailFolderAssignments] =
    usePersistentState<Record<string, string | null>>(
      "mailly-folder-assignments",
      {},
    );
  const [readLaterEmailIds, setReadLaterEmailIds] = usePersistentState<string[]>(
    "mailly-read-later",
    [],
  );

  // ---------- user settings (display, theme, notifications) ----------

  const { setTheme } = useTheme();
  const accountEmail = useAccountEmail();

  const { data: settings = DEFAULT_SETTINGS } = useQuery<Settings>({
    queryKey: ["settings"],
    queryFn: fetchSettings,
    enabled: isAuthenticated === true,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });

  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const settingsSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Applies the change locally at once, then persists it (debounced, so
   *  dragging the volume slider is a single request). */
  const handleSettingsChange = useCallback(
    (patch: Partial<Settings>) => {
      const next: Settings = {
        ...settings,
        ...patch,
        notifications: {
          ...settings.notifications,
          ...(patch.notifications ?? {}),
        },
        profile: { ...settings.profile, ...(patch.profile ?? {}) },
        contacts: { ...settings.contacts, ...(patch.contacts ?? {}) },
      };

      queryClient.setQueryData(["settings"], next);
      setIsSavingSettings(true);

      if (settingsSaveTimer.current) clearTimeout(settingsSaveTimer.current);
      settingsSaveTimer.current = setTimeout(() => {
        saveSettings(next)
          .catch(() =>
            setStatus({
              type: "error",
              message: "Could not save settings. Check your connection.",
            }),
          )
          .finally(() => setIsSavingSettings(false));
      }, 400);
    },
    [queryClient, settings],
  );

  useEffect(() => {
    setTheme(settings.appearance);
  }, [setTheme, settings.appearance]);

  useEffect(() => {
    document.documentElement.lang = settings.language;
  }, [settings.language]);

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
    // the alert needs fresh inbox data to fire on; without it nothing polls
    refetchInterval: settings.notifications.enabled ? 60_000 : false,
    // keep polling while the tab sits in the background — the alert is for
    // mail that lands while you are looking at something else
    refetchIntervalInBackground: true,
  });

  // Ring once per batch of arrivals. The first load only seeds the baseline.
  const seenInboxIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (inboxEmails.length === 0) return;

    const ids = new Set(inboxEmails.map((email) => email.id));

    if (seenInboxIds.current === null) {
      seenInboxIds.current = ids;
      return;
    }

    const hasNew = inboxEmails.some(
      (email) => !seenInboxIds.current?.has(email.id),
    );
    seenInboxIds.current = ids;

    if (hasNew) playNotificationSound(settings);
  }, [inboxEmails, settings]);

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

  const {
    data: labelEmails = [],
    isFetching: labelLoading,
    refetch: refetchLabelEmails,
  } = useQuery({
    queryKey: ["emails", "label", selectedLabel?.id],
    queryFn: () => fetchEmails(`label:"${selectedLabel?.name}"`),
    enabled:
      isAuthenticated === true && activeSection === "label" && !!selectedLabel,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

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

  const {
    data: dbFolders = [],
    refetch: refetchFolders,
  } = useQuery<DbFolder[]>({
    queryKey: ["db-folders"],
    queryFn: () => fetchFolders(),
    enabled: isAuthenticated === true,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });

  const { data: gmailLabels = [], isFetching: labelsLoading } = useQuery<
    GmailLabel[]
  >({
    queryKey: ["gmail-labels"],
    queryFn: () => fetchLabels(),
    enabled: isAuthenticated === true,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });

  const { data: storedEmails = [] } = useQuery<StoredEmail[]>({
    queryKey: ["stored-emails"],
    queryFn: () => fetchStoredEmails(),
    enabled: isAuthenticated === true,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

  const { data: scheduledRecords = [] } = useQuery<ScheduledRecord[]>({
    queryKey: ["scheduled-emails"],
    queryFn: () => fetchScheduledEmails(),
    enabled: isAuthenticated === true,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  // Gmail's own folders duplicate the sidebar nav; only user tags belong there
  const userLabels = useMemo(
    () => gmailLabels.filter((label) => label.type === "user"),
    [gmailLabels],
  );

  // drafts come straight from Postgres now, so they survive a reload
  const drafts = useMemo<DraftEmail[]>(
    () =>
      storedEmails
        .filter((mail) => mail.is_draft)
        .map((mail) => ({
          id: String(mail.id),
          subject: mail.subject,
          body: mail.body,
          recipientEmail: mail.to_address,
          createdAt: parseServerDate(mail.created_at),
        })),
    [storedEmails],
  );

  // attachments cannot round-trip through the DB, so a schedule restored from
  // the server sends without them; ones queued this session keep theirs
  const sessionAttachmentsRef = useRef<Record<string, File[]>>({});

  const scheduledEmails = useMemo<ScheduledEmail[]>(
    () =>
      scheduledRecords.map((record) => ({
        id: String(record.id),
        subject: record.subject,
        body: record.body,
        recipientEmail: record.to_address,
        scheduledFor: record.scheduled_for,
        createdAt: parseServerDate(record.created_at),
        attachments: sessionAttachmentsRef.current[String(record.id)] ?? [],
      })),
    [scheduledRecords],
  );

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

  const flash = useCallback(
    (next: StatusMessage, ms = 2000) => {
      setStatus(next);
      if (next) setTimeout(() => setStatus(null), ms);
    },
    [],
  );

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

    // /get_email clears UNREAD in Gmail; mirror it in the cached list so the
    // row stops rendering as unread without waiting for a refetch
    queryClient.setQueryData<GmailEmail[]>(["emails", "inbox"], (emails) =>
      emails?.map((email) =>
        email.id === id
          ? {
              ...email,
              labelIds: email.labelIds?.filter((l) => l !== "UNREAD"),
            }
          : email,
      ),
    );
  };

  const handleSectionSelect = (section: ActiveSection) => {
    setActiveSection(section);

    if (section !== "folder") setSelectedFolderId(null);
    if (section !== "label") setSelectedLabel(null);

    // both are picked from inside the pane, so reaching them from the collapsed
    // rail has to reveal it or there is nothing to click next
    if (section === "folder" || section === "label") setPaneOpen(true);

    closeDetailPanel();
  };

  const handleSelectFolder = (folderId: string) => {
    setSelectedFolderId(folderId);
    setSelectedLabel(null);
    setActiveSection("folder");
    setActiveDraftId(null);
    setActiveScheduledId(null);
    closeDetailPanel();
  };

  const handleSelectLabel = (label: GmailLabel) => {
    setSelectedLabel(label);
    setSelectedFolderId(null);
    setActiveSection("label");
    setActiveDraftId(null);
    setActiveScheduledId(null);
    closeDetailPanel();
  };

  const handleAddFolder = async () => {
    const rawName = window.prompt("Enter folder name");
    if (!rawName?.trim()) return;

    const name = rawName.trim();
    try {
      setStatus(null);
      await createFolder({ name });
      await refetchFolders();
      flash({ type: "success", message: `Folder "${name}" created.` });
    } catch (err: any) {
      flash(
        { type: "error", message: err?.message || "Failed to create folder." },
        2200,
      );
    }
  };

  const handleRefresh = () => {
    if (activeSection === "sent") {
      refetchSent();
      return;
    }
    if (activeSection === "label") {
      refetchLabelEmails();
      return;
    }
    if (activeSection === "drafts") {
      queryClient.invalidateQueries({ queryKey: ["stored-emails"] });
      return;
    }
    if (activeSection === "scheduled") {
      queryClient.invalidateQueries({ queryKey: ["scheduled-emails"] });
      return;
    }
    refetchInbox();
  };

  useEffect(() => {
    return () => {
      if (detailCloseTimerRef.current) clearTimeout(detailCloseTimerRef.current);
    };
  }, []);

  // ponytail: due sends are drained by whichever tab is open, which is the
  // behaviour that already existed. Move it to a backend worker if schedules
  // must fire with the app closed.
  useEffect(() => {
    if (!scheduledRecords.length) return;

    const interval = setInterval(async () => {
      const now = Date.now();
      const due = scheduledRecords.filter(
        (item) => new Date(item.scheduled_for).getTime() <= now,
      );

      for (const item of due) {
        try {
          await sendEmailRequest({
            to: item.to_address,
            subject: item.subject,
            body: item.body,
            attachments: sessionAttachmentsRef.current[String(item.id)] ?? [],
          });

          await deleteScheduledEmail(item.id, true);
          delete sessionAttachmentsRef.current[String(item.id)];

          flash({
            type: "success",
            message: `Scheduled email sent to ${item.to_address}`,
          }, 2500);

          await queryClient.invalidateQueries({ queryKey: ["emails", "sent"] });
          await queryClient.invalidateQueries({ queryKey: ["stored-emails"] });
          await queryClient.invalidateQueries({
            queryKey: ["scheduled-emails"],
          });
        } catch (err: any) {
          flash(
            {
              type: "error",
              message:
                err?.message ||
                `Failed to send scheduled email to ${item.to_address}`,
            },
            3000,
          );
        }
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [scheduledRecords, queryClient, flash]);

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
        // the recipient lets the backend look up their remembered name
        body: JSON.stringify({ prompt: userMessage, to: recipientEmail }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) throw new Error(data?.error || "Generation failed");

      setSubject(data?.subject ?? "");
      setBody(data?.body ?? "");
      addMessage(
        "assistant",
        `I've drafted an email with the subject "${data?.subject ?? ""}". Review and edit it below, then send or schedule it.`,
      );
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

  const handleSaveDraft = async () => {
    if (!subject && !body) return;

    try {
      setStatus(null);

      if (activeDraftId) {
        // an existing row: update in place rather than piling up duplicates
        await updateStoredEmail(Number(activeDraftId), {
          subject,
          body,
          to_address: recipientEmail,
        });
      } else {
        // Gmail's drafts API needs all three; fall back to a DB-only draft
        if (recipientEmail.trim() && subject.trim() && body.trim()) {
          await createDraftRequest({
            to: recipientEmail,
            subject,
            body,
          });
        } else {
          throw new Error(
            "Add a recipient, subject and body to save this as a draft.",
          );
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["stored-emails"] });
      flash({ type: "success", message: "Draft saved." }, 900);

      setTimeout(() => {
        setIsComposeOpen(false);
        setActiveSection("drafts");
        setSelectedFolderId(null);
        setSelectedLabel(null);
        resetComposeFields();
      }, 900);
    } catch (err: any) {
      flash(
        { type: "error", message: err?.message || "Failed to save draft." },
        2600,
      );
    }
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

  const handleDeleteDraft = async (id: string) => {
    try {
      await deleteStoredEmail(Number(id));
      await queryClient.invalidateQueries({ queryKey: ["stored-emails"] });
      if (activeDraftId === id) resetComposeFields();
      flash({ type: "success", message: "Draft deleted." }, 1600);
    } catch (err: any) {
      flash(
        { type: "error", message: err?.message || "Failed to delete draft." },
        2600,
      );
    }
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

  const handleDeleteScheduled = async (id: string) => {
    try {
      await deleteScheduledEmail(Number(id));
      delete sessionAttachmentsRef.current[id];
      await queryClient.invalidateQueries({ queryKey: ["scheduled-emails"] });
      if (activeScheduledId === id) resetComposeFields();
      flash({ type: "success", message: "Schedule cancelled." }, 1600);
    } catch (err: any) {
      flash(
        {
          type: "error",
          message: err?.message || "Failed to cancel schedule.",
        },
        2600,
      );
    }
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

      // sending a draft consumes it
      if (activeDraftId) {
        await deleteStoredEmail(Number(activeDraftId)).catch(() => {});
      }

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
        setSelectedLabel(null);
        resetComposeFields();
      }, 900);
    } catch (err: any) {
      setStatus({ type: "error", message: err?.message || "Unknown error" });
    } finally {
      setIsSending(false);
    }
  };

  const handleScheduleConfirm = async (scheduledFor: string) => {
    if (!body.trim() || !recipientEmail.trim()) {
      flash({
        type: "error",
        message: "Recipient and email body are required to schedule.",
      }, 2600);
      return;
    }

    const when = new Date(scheduledFor);
    if (isNaN(when.getTime()) || when.getTime() <= Date.now()) {
      flash({
        type: "error",
        message: "Please choose a future date and time.",
      }, 2600);
      return;
    }

    try {
      const record = await createScheduledEmail({
        to: recipientEmail,
        subject,
        body,
        scheduledFor: when.toISOString(),
      });

      if (attachments.length) {
        sessionAttachmentsRef.current[String(record.id)] = [...attachments];
      }

      // the draft this was composed from is now queued instead
      if (activeDraftId) {
        await deleteStoredEmail(Number(activeDraftId)).catch(() => {});
      }

      await queryClient.invalidateQueries({ queryKey: ["scheduled-emails"] });
      await queryClient.invalidateQueries({ queryKey: ["stored-emails"] });

      setActiveScheduledId(String(record.id));
      setActiveDraftId(null);
      setScheduleOpen(false);
      flash(
        {
          type: "success",
          message: `Email scheduled for ${formatScheduledDateTime(scheduledFor)}`,
        },
        1200,
      );

      setTimeout(() => {
        setIsComposeOpen(false);
        setActiveSection("scheduled");
        setSelectedFolderId(null);
        setSelectedLabel(null);
        resetComposeFields();
      }, 1200);
    } catch (err: any) {
      flash(
        {
          type: "error",
          message: err?.message || "Failed to schedule this email.",
        },
        2600,
      );
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasEmail = Boolean(subject || body);

  const handleDeleteEmail = async (emailId: string) => {
    if (openedEmailId === emailId) {
      closeDetailPanel();
    }

    try {
      await trashEmail(emailId);

      // drop the row immediately; the refetch below confirms it
      for (const key of [
        ["emails", "inbox"],
        ["emails", "sent"],
        ["emails", "label", selectedLabel?.id],
      ]) {
        queryClient.setQueryData<GmailEmail[]>(key, (emails) =>
          emails?.filter((email) => email.id !== emailId),
        );
      }

      flash({ type: "success", message: "Email moved to Trash." }, 1800);

      await queryClient.invalidateQueries({ queryKey: ["emails"] });
    } catch (err: any) {
      flash(
        { type: "error", message: err?.message || "Failed to delete email." },
        2600,
      );
    }
  };

  const handleMoveEmailToFolder = (emailId: string, folderId: string) => {
    setEmailFolderAssignments((prev) => ({
      ...prev,
      [emailId]: folderId,
    }));

    const folderName =
      dbFolders.find((folder) => String(folder.id) === folderId)?.name ||
      "folder";

    flash({ type: "success", message: `Email added to ${folderName}.` }, 1600);
  };

  const handleMarkReadLater = (emailId: string) => {
    setReadLaterEmailIds((prev) =>
      prev.includes(emailId)
        ? prev.filter((id) => id !== emailId)
        : [...prev, emailId],
    );
  };

  const decorate = useCallback(
    (emails: GmailEmail[]) =>
      emails.map((email) => ({
        ...email,
        folderId:
          emailFolderAssignments[email.id] !== undefined
            ? emailFolderAssignments[email.id]
            : email.folderId ?? null,
        readLater: readLaterEmailIds.includes(email.id),
      })),
    [emailFolderAssignments, readLaterEmailIds],
  );

  const inboxWithFolders = useMemo(
    () => decorate(inboxEmails),
    [inboxEmails, decorate],
  );
  const sentWithFolders = useMemo(
    () => decorate(sentEmails),
    [sentEmails, decorate],
  );
  const labelWithFolders = useMemo(
    () => decorate(labelEmails),
    [labelEmails, decorate],
  );

  const computedFolders = useMemo<FolderItem[]>(() => {
    const allUiEmails = [
      ...inboxWithFolders,
      ...sentWithFolders,
      ...labelWithFolders,
    ];

    return dbFolders.map((folder) => {
      const id = String(folder.id);

      const dbCount = storedEmails.filter(
        (email) => String(email.folder_id) === id,
      ).length;

      const uiCount = allUiEmails.filter((email) => email.folderId === id)
        .length;

      return { id, name: folder.name, count: dbCount + uiCount };
    });
  }, [
    dbFolders,
    storedEmails,
    inboxWithFolders,
    sentWithFolders,
    labelWithFolders,
  ]);

  const panelIsLoading =
    detailPanelVisible && !!openedEmailId && (detailLoading || detailFetching);

  const panelEmail =
    detailPanelVisible &&
    openedEmailId &&
    !detailLoading &&
    !detailIsError &&
    detailEmail
      ? detailEmail
      : null;

  const panelError =
    detailPanelVisible && !!openedEmailId && !detailLoading && detailIsError
      ? detailErrorMessage
      : null;

  const isRefreshing =
    activeSection === "sent"
      ? sentLoading
      : activeSection === "label"
        ? labelLoading
        : inboxLoading;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div
      className="h-screen bg-card flex flex-col overflow-hidden"
      style={settingsStyle(settings)}
    >
      <MailTopBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search mail"
        onToggleSidebar={() => setPaneOpen((prev) => !prev)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        appearance={settings.appearance}
        onAppearanceChange={(appearance) =>
          handleSettingsChange({ appearance })
        }
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
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
          labels={userLabels}
          labelsLoading={labelsLoading}
          selectedLabelId={selectedLabel?.id ?? null}
          onSelectLabel={handleSelectLabel}
          paneOpen={paneOpen}
          onOpenPane={() => setPaneOpen(true)}
          railTab={railTab}
          onRailTabChange={setRailTab}
        />

        <div className="flex-1 min-w-0 relative overflow-hidden bg-card h-full">
          <main className="h-full">
            {railTab === "settings" ? (
              <SettingsView
                settings={settings}
                accountEmail={accountEmail}
                onChange={handleSettingsChange}
                isSaving={isSavingSettings}
              />
            ) : railTab === "todos" ? (
              <TodoBoard
                lists={todoLists}
                onCreate={() => {
                  setEditingTodoList(null);
                  setTodoEditorOpen(true);
                }}
                onEdit={(list) => {
                  setEditingTodoList(list);
                  setTodoEditorOpen(true);
                }}
                onDelete={(id) =>
                  setTodoLists((prev) => prev.filter((list) => list.id !== id))
                }
                onTogglePin={(id) =>
                  setTodoLists((prev) =>
                    prev.map((list) =>
                      list.id === id ? { ...list, pinned: !list.pinned } : list,
                    ),
                  )
                }
                onToggleBlock={toggleTodoBlock}
              />
            ) : railTab === "notes" ? (
              <NotesView
                notes={notes}
                onCreate={() => {
                  setEditingNote(null);
                  setNoteEditorOpen(true);
                }}
                onEdit={(note) => {
                  setEditingNote(note);
                  setNoteEditorOpen(true);
                }}
                onDelete={(id) =>
                  setNotes((prev) => prev.filter((note) => note.id !== id))
                }
              />
            ) : (
            <EmailListView
              activeSection={activeSection}
              searchQuery={searchQuery}
              inboxEmails={inboxWithFolders}
              sentEmails={sentWithFolders}
              labelEmails={labelWithFolders}
              labelName={selectedLabel?.name ?? null}
              labelLoading={labelLoading}
              drafts={drafts}
              scheduledEmails={scheduledEmails}
              activeDraftId={activeDraftId}
              activeScheduledId={activeScheduledId}
              inboxLoading={inboxLoading}
              sentLoading={sentLoading}
              selectedEmailId={openedEmailId}
              selectedFolderId={selectedFolderId}
              folders={computedFolders}
              onOpenGmailEmail={handleOpenGmailEmail}
              onSelectDraft={handleSelectDraft}
              onDeleteDraft={handleDeleteDraft}
              onSelectScheduled={handleSelectScheduled}
              onDeleteScheduled={handleDeleteScheduled}
              onDeleteEmail={handleDeleteEmail}
              onMoveEmailToFolder={handleMoveEmailToFolder}
              onMarkReadLater={handleMarkReadLater}
            />
            )}
          </main>

          <EmailDetailOverlayPanel
            isVisible={detailPanelVisible}
            email={panelEmail}
            isLoading={panelIsLoading}
            errorMessage={panelError}
            onClose={closeDetailPanel}
            folders={computedFolders}
            onMoveToFolder={handleMoveEmailToFolder}
            onTrash={handleDeleteEmail}
          />
        </div>
      </div>

      {/* stuck lists stay put whatever tab is open, so they can be worked
          alongside the inbox */}
      <PinnedTodos
        lists={todoLists}
        style={settingsStyle(settings)}
        onMove={(id, x, y) => patchTodoList(id, { x, y })}
        onToggleBlock={toggleTodoBlock}
        onToggleCollapse={(id) =>
          setTodoLists((prev) =>
            prev.map((list) =>
              list.id === id ? { ...list, collapsed: !list.collapsed } : list,
            ),
          )
        }
        onUnpin={(id) => patchTodoList(id, { pinned: false })}
      />

      <TodoEditorModal
        isOpen={todoEditorOpen}
        initial={editingTodoList}
        onClose={() => setTodoEditorOpen(false)}
        onSave={saveTodoList}
      />

      <NoteEditorModal
        isOpen={noteEditorOpen}
        initial={editingNote}
        onClose={() => setNoteEditorOpen(false)}
        onSave={saveNote}
      />

      {status && !isComposeOpen && (
        <div
          className="slide-down fixed bottom-4 left-1/2 z-[80] -translate-x-1/2 rounded-md border px-3.5 py-2 text-[12.5px] shadow-lg"
          style={{
            background: "var(--card)",
            borderColor:
              status.type === "success"
                ? "color-mix(in srgb, #1a7f37 40%, transparent)"
                : "color-mix(in srgb, #c5221f 40%, transparent)",
            color: status.type === "success" ? "#1a7f37" : "#c5221f",
          }}
          role="status"
        >
          {status.message}
        </div>
      )}

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
        hasAttachments={attachments.length > 0}
      />
    </div>
  );
}
