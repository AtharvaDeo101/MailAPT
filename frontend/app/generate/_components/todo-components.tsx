"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Circle,
  GripHorizontal,
  Heading1,
  Heading2,
  List,
  ListTodo,
  Minus,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Trash2,
  Type,
  X,
} from "lucide-react";

import { usePersistentState } from "../_lib/use-persistent-state";

const ACCENT = "var(--mail-accent)";

export type TodoBlockType = "header" | "subheader" | "check" | "bullet" | "text";

export type TodoBlock = {
  id: string;
  type: TodoBlockType;
  text: string;
  done?: boolean;
};

export type TodoList = {
  id: string;
  title: string;
  blocks: TodoBlock[];
  pinned: boolean;
  /** viewport position of the floating card, in px from the top-left */
  x: number;
  y: number;
  collapsed?: boolean;
};

const BLOCK_KINDS: {
  type: TodoBlockType;
  label: string;
  icon: React.ReactNode;
}[] = [
  { type: "header", label: "Header", icon: <Heading1 className="h-3.5 w-3.5" /> },
  { type: "subheader", label: "Sub header", icon: <Heading2 className="h-3.5 w-3.5" /> },
  { type: "check", label: "Checklist", icon: <Circle className="h-3.5 w-3.5" /> },
  { type: "bullet", label: "List", icon: <List className="h-3.5 w-3.5" /> },
  { type: "text", label: "Text", icon: <Type className="h-3.5 w-3.5" /> },
];

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now() + Math.random());

const emptyBlock = (type: TodoBlockType): TodoBlock => ({
  id: newId(),
  type,
  text: "",
  ...(type === "check" ? { done: false } : {}),
});

export function useTodoLists() {
  return usePersistentState<TodoList[]>("mailly-todo-lists", []);
}

/* ------------------------------------------------------------------ */
/* Shared block rendering                                              */
/* ------------------------------------------------------------------ */

const BLOCK_TEXT_CLASS: Record<TodoBlockType, string> = {
  header: "text-[14px] font-bold",
  subheader: "text-[12.5px] font-semibold",
  check: "text-[12.5px]",
  bullet: "text-[12.5px]",
  text: "text-[12.5px] text-muted-foreground",
};

/** One block, read-only apart from ticking a checklist item. */
function BlockRow({
  block,
  onToggle,
}: {
  block: TodoBlock;
  onToggle: () => void;
}) {
  if (block.type === "check") {
    return (
      <label className="flex items-start gap-2 py-0.5 cursor-pointer">
        <input
          type="radio"
          checked={Boolean(block.done)}
          onChange={onToggle}
          onClick={(e) => {
            // radios do not fire onChange when re-clicked; this makes it a toggle
            e.preventDefault();
            onToggle();
          }}
          className="mt-0.5 shrink-0 accent-[var(--mail-accent)]"
          aria-label={block.text || "Task"}
        />
        <span
          className={BLOCK_TEXT_CLASS.check}
          style={{
            textDecoration: block.done ? "line-through" : "none",
            color: block.done ? "var(--muted-foreground)" : "var(--foreground)",
          }}
        >
          {block.text || <span className="opacity-40">Empty task</span>}
        </span>
      </label>
    );
  }

  if (block.type === "bullet") {
    return (
      <div className="flex items-start gap-2 py-0.5">
        <Minus className="mt-1 h-3 w-3 shrink-0 text-muted-foreground" />
        <span className={BLOCK_TEXT_CLASS.bullet}>{block.text}</span>
      </div>
    );
  }

  return (
    <p
      className={`${BLOCK_TEXT_CLASS[block.type]} py-0.5`}
      style={{ color: block.type === "header" ? ACCENT : undefined }}
    >
      {block.text}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Create / edit popup                                                 */
/* ------------------------------------------------------------------ */

export function TodoEditorModal({
  isOpen,
  initial,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  initial: TodoList | null;
  onClose: () => void;
  onSave: (list: TodoList) => void;
}) {
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<TodoBlock[]>([]);
  const [pinned, setPinned] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setTitle(initial?.title ?? "");
    setBlocks(initial?.blocks?.length ? initial.blocks : [emptyBlock("check")]);
    setPinned(initial?.pinned ?? true);
  }, [isOpen, initial]);

  if (!isOpen) return null;

  const addBlock = (type: TodoBlockType, afterId?: string) =>
    setBlocks((prev) => {
      const block = emptyBlock(type);
      if (!afterId) return [...prev, block];
      const index = prev.findIndex((b) => b.id === afterId);
      return [...prev.slice(0, index + 1), block, ...prev.slice(index + 1)];
    });

  const patchBlock = (id: string, patch: Partial<TodoBlock>) =>
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    );

  const save = () => {
    const kept = blocks.filter((b) => b.text.trim());
    onSave({
      id: initial?.id ?? newId(),
      title: title.trim() || "Untitled list",
      blocks: kept,
      pinned,
      x: initial?.x ?? Math.max(16, window.innerWidth - 300),
      y: initial?.y ?? 72,
      collapsed: initial?.collapsed ?? false,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="To-do list editor"
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
          <ListTodo className="h-4 w-4 text-white" />
          <span className="text-[13px] font-semibold text-white">
            {initial ? "Edit list" : "New to-do list"}
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

        <div className="shrink-0 border-b border-border p-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="List title"
            aria-label="List title"
            autoFocus
            className="h-8 w-full rounded-md border border-border bg-card px-2.5 text-[13px] font-semibold outline-none focus:border-[var(--mail-accent)]"
          />

          <div className="mt-2 flex flex-wrap gap-1">
            {BLOCK_KINDS.map((kind) => (
              <button
                key={kind.type}
                type="button"
                onClick={() => addBlock(kind.type)}
                className="hover-press inline-flex h-7 items-center gap-1.5 rounded-md border border-border px-2 text-[11.5px]"
                title={`Add ${kind.label.toLowerCase()}`}
              >
                {kind.icon}
                {kind.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {blocks.map((block) => (
            <div key={block.id} className="group mb-1.5 flex items-center gap-2">
              {block.type === "check" && (
                <input
                  type="radio"
                  checked={Boolean(block.done)}
                  onChange={() => patchBlock(block.id, { done: !block.done })}
                  onClick={(e) => {
                    e.preventDefault();
                    patchBlock(block.id, { done: !block.done });
                  }}
                  className="shrink-0 accent-[var(--mail-accent)]"
                  aria-label="Done"
                />
              )}
              {block.type === "bullet" && (
                <Minus className="h-3 w-3 shrink-0 text-muted-foreground" />
              )}

              <input
                value={block.text}
                onChange={(e) => patchBlock(block.id, { text: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addBlock(block.type, block.id);
                  }
                }}
                placeholder={`${
                  BLOCK_KINDS.find((k) => k.type === block.type)?.label
                }…`}
                aria-label={`${block.type} text`}
                className={`h-8 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 outline-none focus:border-border ${BLOCK_TEXT_CLASS[block.type]}`}
                style={{ color: block.type === "header" ? ACCENT : undefined }}
              />

              <button
                type="button"
                onClick={() =>
                  setBlocks((prev) => prev.filter((b) => b.id !== block.id))
                }
                className="hover-pop shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100"
                aria-label="Remove line"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-border p-3">
          <label className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="mail-check"
            />
            Stick to screen
          </label>

          <button
            type="button"
            onClick={onClose}
            className="hover-press ml-auto h-8 rounded-md border border-border px-3 text-[12px]"
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

/* ------------------------------------------------------------------ */
/* Middle panel board                                                  */
/* ------------------------------------------------------------------ */

export function TodoBoard({
  lists,
  onCreate,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleBlock,
}: {
  lists: TodoList[];
  onCreate: () => void;
  onEdit: (list: TodoList) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleBlock: (listId: string, blockId: string) => void;
}) {
  return (
    <div className="h-full w-full overflow-y-auto bg-background">
      <div className="flex h-11 shrink-0 items-center gap-2.5 border-b border-border bg-card px-4">
        <ListTodo className="h-4 w-4" style={{ color: ACCENT }} />
        <h1 className="text-[14px] font-semibold tracking-tight">To-do</h1>
        {lists.length > 0 && (
          <span className="text-[12px] tabular-nums text-muted-foreground">
            ({lists.length})
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

      {lists.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2.5 px-4 py-20 text-center">
          <ListTodo className="h-9 w-9 text-muted-foreground/25" />
          <p className="text-[13px] text-muted-foreground/70">
            No to-do lists yet
          </p>
          <button
            type="button"
            onClick={onCreate}
            className="hover-press inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-[12px] font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            Create a list
          </button>
        </div>
      ) : (
        <div className="grid gap-3 p-4 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
          {lists.map((list) => (
            <article
              key={list.id}
              className="hover-row rounded-md border border-border bg-card p-3"
            >
              <div className="mb-1.5 flex items-center gap-1.5">
                <h2 className="min-w-0 flex-1 truncate text-[13px] font-semibold">
                  {list.title}
                </h2>

                <button
                  type="button"
                  onClick={() => onTogglePin(list.id)}
                  className="hover-pop shrink-0"
                  style={{
                    color: list.pinned ? ACCENT : "var(--muted-foreground)",
                  }}
                  aria-label={list.pinned ? "Unstick from screen" : "Stick to screen"}
                  title={list.pinned ? "Unstick from screen" : "Stick to screen"}
                >
                  {list.pinned ? (
                    <Pin className="h-3.5 w-3.5" />
                  ) : (
                    <PinOff className="h-3.5 w-3.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onEdit(list)}
                  className="hover-pop shrink-0 text-muted-foreground"
                  aria-label="Edit list"
                  title="Edit list"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(list.id)}
                  className="hover-pop shrink-0"
                  style={{ color: "#c5221f" }}
                  aria-label="Delete list"
                  title="Delete list"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {list.blocks.length === 0 ? (
                <p className="text-[12px] text-muted-foreground/70">Empty list</p>
              ) : (
                list.blocks.map((block) => (
                  <BlockRow
                    key={block.id}
                    block={block}
                    onToggle={() => onToggleBlock(list.id, block.id)}
                  />
                ))
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Floating sticky card                                                */
/* ------------------------------------------------------------------ */

const CARD_WIDTH = 260;

function FloatingTodo({
  list,
  onMove,
  onToggleBlock,
  onToggleCollapse,
  onUnpin,
}: {
  list: TodoList;
  onMove: (x: number, y: number) => void;
  onToggleBlock: (blockId: string) => void;
  onToggleCollapse: () => void;
  onUnpin: () => void;
}) {
  const dragOffset = useRef<{ x: number; y: number } | null>(null);
  const [position, setPosition] = useState({ x: list.x, y: list.y });

  useEffect(() => {
    setPosition({ x: list.x, y: list.y });
  }, [list.x, list.y]);

  // keep the card reachable when the window shrinks under it
  useEffect(() => {
    const clamp = () =>
      setPosition((prev) => ({
        x: Math.min(prev.x, Math.max(8, window.innerWidth - CARD_WIDTH - 8)),
        y: Math.min(prev.y, Math.max(8, window.innerHeight - 60)),
      }));

    window.addEventListener("resize", clamp);
    return () => window.removeEventListener("resize", clamp);
  }, []);

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const offset = dragOffset.current;
    if (!offset) return;

    setPosition({
      x: Math.min(
        Math.max(8, e.clientX - offset.x),
        Math.max(8, window.innerWidth - CARD_WIDTH - 8),
      ),
      y: Math.min(
        Math.max(8, e.clientY - offset.y),
        Math.max(8, window.innerHeight - 60),
      ),
    });
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragOffset.current) return;
    dragOffset.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
    onMove(position.x, position.y);
  };

  return (
    <div
      className="fixed z-[60] overflow-hidden rounded-md border border-border bg-card"
      style={{
        left: position.x,
        top: position.y,
        width: CARD_WIDTH,
        boxShadow: "0 6px 24px rgba(0,0,0,0.22)",
      }}
    >
      <div
        onPointerDown={startDrag}
        onPointerMove={onDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="flex h-8 cursor-grab items-center gap-1.5 px-2 active:cursor-grabbing"
        style={{ background: ACCENT, touchAction: "none" }}
      >
        <GripHorizontal className="h-3.5 w-3.5 shrink-0 text-white/70" />
        <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-white">
          {list.title}
        </span>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="hover-pop shrink-0 text-white/80 hover:text-white"
          aria-label={list.collapsed ? "Expand list" : "Collapse list"}
          title={list.collapsed ? "Expand" : "Collapse"}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={onUnpin}
          className="hover-pop shrink-0 text-white/80 hover:text-white"
          aria-label="Unstick from screen"
          title="Unstick from screen"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {!list.collapsed && (
        <div className="max-h-[50vh] overflow-y-auto p-2.5">
          {list.blocks.length === 0 ? (
            <p className="text-[12px] text-muted-foreground/70">Empty list</p>
          ) : (
            list.blocks.map((block) => (
              <BlockRow
                key={block.id}
                block={block}
                onToggle={() => onToggleBlock(block.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

/** Every stuck list, floating above the mail UI whatever tab is open.
 *  Rendered into <body> so the settings font-size zoom cannot skew the drag
 *  coordinates; `style` re-supplies the mail colour vars it leaves behind. */
export function PinnedTodos({
  lists,
  style,
  onMove,
  onToggleBlock,
  onToggleCollapse,
  onUnpin,
}: {
  lists: TodoList[];
  style?: React.CSSProperties;
  onMove: (id: string, x: number, y: number) => void;
  onToggleBlock: (listId: string, blockId: string) => void;
  onToggleCollapse: (id: string) => void;
  onUnpin: (id: string) => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const pinned = lists.filter((list) => list.pinned);
  if (!mounted || pinned.length === 0) return null;

  const { zoom: _zoom, ...vars } = style ?? {};

  return createPortal(
    <div className="mail-ui" style={vars}>
      {pinned.map((list) => (
        <FloatingTodo
          key={list.id}
          list={list}
          onMove={(x, y) => onMove(list.id, x, y)}
          onToggleBlock={(blockId) => onToggleBlock(list.id, blockId)}
          onToggleCollapse={() => onToggleCollapse(list.id)}
          onUnpin={() => onUnpin(list.id)}
        />
      ))}
    </div>,
    document.body,
  );
}
