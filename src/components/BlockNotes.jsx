/**
 * BlockNotes — inline comment popover for content blocks.
 *
 * Shows a chat-bubble icon on the right edge of each block.
 * Filled amber when unresolved notes exist. Clicking opens a
 * popover to view, add, and resolve notes.
 */

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Check, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function BlockNotes({
  blockIndex,
  notes,
  onAddNote,
  onToggleResolved,
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const panelRef = useRef(null);
  const inputRef = useRef(null);

  const blockNotes = notes.filter((n) => n.blockIndex === blockIndex);
  const unresolvedCount = blockNotes.filter((n) => !n.resolved).length;
  const hasNotes = blockNotes.length > 0;

  // Close popover on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  function handleSubmit(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onAddNote(blockIndex, text);
    setDraft("");
  }

  return (
    <div className="absolute -right-10 top-1 z-20" ref={panelRef}>
      {/* Trigger icon */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`
          relative flex items-center justify-center w-7 h-7 rounded-full
          transition-all duration-150
          ${
            hasNotes && unresolvedCount > 0
              ? "bg-amber-100 text-amber-600 hover:bg-amber-200"
              : hasNotes
              ? "bg-slate-100 text-slate-400 hover:bg-slate-200"
              : "bg-transparent text-slate-300 hover:text-slate-500 hover:bg-slate-100 opacity-0 group-hover/block:opacity-100"
          }
        `}
        title={
          unresolvedCount > 0
            ? `${unresolvedCount} unresolved note${unresolvedCount > 1 ? "s" : ""}`
            : hasNotes
            ? "All notes resolved"
            : "Add a note"
        }
      >
        <MessageSquare className="w-3.5 h-3.5" />
        {unresolvedCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unresolvedCount}
          </span>
        )}
      </button>

      {/* Popover panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-9 w-72 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50">
              <span className="text-xs font-medium text-slate-600">
                Notes &middot; Block {blockIndex + 1}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Notes list */}
            <div className="max-h-48 overflow-y-auto">
              {blockNotes.length === 0 ? (
                <p className="px-3 py-4 text-xs text-slate-400 text-center">
                  No notes yet. Add one below.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {blockNotes.map((note) => (
                    <li
                      key={note.createdAt}
                      className={`px-3 py-2 flex items-start gap-2 ${
                        note.resolved ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs text-slate-700 leading-relaxed ${
                            note.resolved ? "line-through" : ""
                          }`}
                        >
                          {note.text}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {note.author} &middot;{" "}
                          {new Date(note.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          onToggleResolved(blockIndex, note.createdAt)
                        }
                        className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors mt-0.5 ${
                          note.resolved
                            ? "bg-emerald-100 border-emerald-300 text-emerald-600"
                            : "border-slate-300 text-transparent hover:border-slate-400 hover:text-slate-400"
                        }`}
                        title={
                          note.resolved
                            ? "Mark as unresolved"
                            : "Mark as resolved"
                        }
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Add note form */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-1.5 px-3 py-2 border-t border-slate-100 bg-slate-50"
            >
              <input
                ref={inputRef}
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Add a note..."
                className="flex-1 text-xs px-2 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 bg-white"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                className="p-1.5 rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-3 h-3" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
