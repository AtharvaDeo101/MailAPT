"use client";

import React, { useEffect, useState } from "react";
import { Plus, StickyNote, Trash2, X } from "lucide-react";

import { usePersistentState } from "../_lib/use-persistent-state";

const ACCENT = "var(--mail-accent)";

export type Note = {
  id: string;
  title: string;
  body: string;
  updatedAt: string;
};

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now() + Math.random());

export function useNotes() {
  return usePersistentState<Note[]>("mailly-notes-list", []);
}

export function NoteEditorModal({
  isOpen,
  initial,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  initial: Note | null;
  onClose: () => void;
  onSave: (note: Note) => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setTitle(initial?.title ?? "");
    setBody(initial?.body ?? "");
  }, [isOpen, initial]);

  if (!isOpen) return null;

  const save = () => {
    if (!title.trim() && !body.trim()) {
      onClose();
      return;
    }

    onSave({
      id: initial?.id ?? newId(),
      title: title.trim() || "Untitled note",
      body,
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Note editor"
    >
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      <div
        className="relative z-10 flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-lg border border-border bg-card"
        style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.24)" }}
      >
        <div
          className="flex h-10 shrink-0 items-center gap-2 px-4"
          style={{ background: ACCENT }}
        >
          <StickyNote className="h-4 w-4 text-white" />
          <span className="text-[13px] font-semibold text-white">
            {initial ? "Edit note" : "New note"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="hover-pop ml-auto text-white/80 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2 p-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            aria-label="Note title"
            autoFocus
            className="h-8 shrink-0 rounded-md border border-border bg-card px-2.5 text-[13px] font-semibold outline-none focus:border-[var(--mail-accent)]"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your note…"
            aria-label="Note body"
            rows={10}
            className="min-h-[180px] flex-1 resize-none rounded-md border border-border bg-card p-2.5 text-[12.5px] leading-relaxed outline-none focus:border-[var(--mail-accent)]"
          />
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border p-3">
          <button
            type="button"
            onClick={onClose}
            className="hover-press h-8 rounded-md border border-border px-3 text-[12px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            className="hover-press h-8 rounded-md px-3 text-[12px] font-semibold text-white"
            style={{ background: ACCENT }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export function NotesView({
  notes,
  onCreate,
  onEdit,
  onDelete,
}: {
  notes: Note[];
  onCreate: () => void;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="h-full w-full overflow-y-auto bg-background">
      <div className="flex h-11 shrink-0 items-center gap-2.5 border-b border-border bg-card px-4">
        <StickyNote className="h-4 w-4" style={{ color: ACCENT }} />
        <h1 className="text-[14px] font-semibold tracking-tight">Notes</h1>
        {notes.length > 0 && (
          <span className="text-[12px] tabular-nums text-muted-foreground">
            ({notes.length})
          </span>
        )}

        <button
          type="button"
          onClick={onCreate}
          className="hover-press ml-auto inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-semibold text-white"
          style={{ background: ACCENT }}
        >
          <Plus className="h-3.5 w-3.5" />
          Create
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2.5 px-4 py-20 text-center">
          <StickyNote className="h-9 w-9 text-muted-foreground/25" />
          <p className="text-[13px] text-muted-foreground/70">No notes yet</p>
          <button
            type="button"
            onClick={onCreate}
            className="hover-press inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-[12px] font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            Create a note
          </button>
        </div>
      ) : (
        <div className="grid gap-3 p-4 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
          {notes.map((note) => (
            <article
              key={note.id}
              role="button"
              tabIndex={0}
              onClick={() => onEdit(note)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onEdit(note);
                }
              }}
              className="hover-row group cursor-pointer rounded-md border border-border bg-card p-3"
            >
              <div className="mb-1 flex items-center gap-1.5">
                <h2 className="min-w-0 flex-1 truncate text-[13px] font-semibold">
                  {note.title}
                </h2>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(note.id);
                  }}
                  className="hover-pop shrink-0 opacity-0 group-hover:opacity-100"
                  style={{ color: "#c5221f" }}
                  aria-label={`Delete note ${note.title}`}
                  title="Delete note"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <p className="line-clamp-6 whitespace-pre-wrap text-[12.5px] text-muted-foreground">
                {note.body || "Empty note"}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
