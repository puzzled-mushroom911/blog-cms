/**
 * ContentRenderer -- renders JSON content blocks into a visual preview.
 *
 * Supported block types:
 *   paragraph, heading, subheading, list, callout, quote, image,
 *   table, stat-cards, pros-cons, info-box, process-steps
 *
 * When `editable` is true, text blocks become contentEditable so you
 * can make quick inline corrections before saving.
 */

import { useState } from "react";
import {
  Plus,
  Heading2,
  AlignLeft,
  List,
  AlertCircle,
  Quote,
  ImagePlus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import ImageUpload from "./ImageUpload";
import BlockNotes from "./BlockNotes";

export default function ContentRenderer({
  content,
  editable = false,
  onInlineEdit,
  onInsertBlock,
  onRemoveBlock,
  slug = "untitled",
  editorNotes = [],
  onAddNote,
  onToggleResolved,
}) {
  if (!content || !Array.isArray(content)) return null;

  return (
    <>
      {content.map((block, i) => (
        <div key={i} data-block-index={i} className="relative group/block">
          {/* Insert image button — shown between blocks in edit mode */}
          {editable && onInsertBlock && (
            <BlockInserter
              index={i}
              slug={slug}
              onInsertBlock={onInsertBlock}
            />
          )}

          {renderBlock(block, i, editable, onInlineEdit, onRemoveBlock, slug)}

          {/* Inline notes icon — shown in edit mode */}
          {editable && onAddNote && onToggleResolved && (
            <BlockNotes
              blockIndex={i}
              notes={editorNotes}
              onAddNote={onAddNote}
              onToggleResolved={onToggleResolved}
            />
          )}
        </div>
      ))}

      {/* Insert button after the last block */}
      {editable && onInsertBlock && content.length > 0 && (
        <BlockInserter
          index={content.length}
          slug={slug}
          onInsertBlock={onInsertBlock}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  BlockInserter — appears between blocks to add any block type      */
/* ------------------------------------------------------------------ */

const BLOCK_TYPES = [
  { type: "heading", label: "Heading", icon: Heading2 },
  { type: "paragraph", label: "Paragraph", icon: AlignLeft },
  { type: "list", label: "List", icon: List },
  { type: "callout", label: "Callout", icon: AlertCircle },
  { type: "quote", label: "Quote", icon: Quote },
  { type: "image", label: "Image", icon: ImagePlus },
  { type: "prompt", label: "Prompt", icon: Sparkles },
];

function BlockInserter({ index, slug, onInsertBlock }) {
  const [open, setOpen] = useState(false);
  const [activeType, setActiveType] = useState(null);
  const [text, setText] = useState("");
  const [listItems, setListItems] = useState([""]);

  function reset() {
    setOpen(false);
    setActiveType(null);
    setText("");
    setListItems([""]);
  }

  function handlePickType(type) {
    if (type === "image") {
      setActiveType("image");
      return;
    }
    setActiveType(type);
  }

  function handleInsertText() {
    const trimmed = text.trim();
    if (!trimmed) return;

    switch (activeType) {
      case "heading":
        onInsertBlock(index, { type: "heading", text: trimmed });
        break;
      case "paragraph":
        onInsertBlock(index, { type: "paragraph", text: trimmed });
        break;
      case "callout":
        onInsertBlock(index, { type: "callout", text: trimmed });
        break;
      case "quote":
        onInsertBlock(index, { type: "quote", text: trimmed });
        break;
      case "prompt":
        onInsertBlock(index, { type: "prompt", text: trimmed });
        break;
    }
    reset();
  }

  function handleInsertList() {
    const items = listItems.map((s) => s.trim()).filter(Boolean);
    if (items.length === 0) return;
    onInsertBlock(index, { type: "list", items });
    reset();
  }

  return (
    <div className="relative flex items-center justify-center h-0 -my-px z-10">
      {/* Thin hover zone */}
      <div className="absolute inset-x-0 -top-3 -bottom-3 group/insert">
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                       flex items-center gap-1 px-2.5 py-1 rounded-full
                       bg-white border border-slate-200 shadow-sm
                       text-xs text-slate-400 hover:text-blue-600 hover:border-blue-300
                       opacity-0 group-hover/insert:opacity-100 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            Add block
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-2 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-20">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-700">
              {activeType
                ? BLOCK_TYPES.find((b) => b.type === activeType)?.label
                : "Add a block"}
            </span>
            <button
              type="button"
              onClick={reset}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Type picker */}
          {!activeType && (
            <div className="grid grid-cols-4 gap-1 p-3">
              {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handlePickType(type)}
                  className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg
                             text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <Icon className="w-4.5 h-4.5" />
                  <span className="text-[10px] font-medium leading-none">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Text input for heading / paragraph / callout / quote / prompt */}
          {activeType &&
            ["heading", "paragraph", "callout", "quote", "prompt"].includes(
              activeType
            ) && (
              <div className="p-3 space-y-2">
                {activeType === "prompt" && (
                  <p className="text-[10px] text-violet-500 font-medium">
                    This instruction is for Claude — it won&apos;t appear on the
                    published post.
                  </p>
                )}
                <textarea
                  autoFocus
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={
                    activeType === "heading"
                      ? "Heading text..."
                      : activeType === "prompt"
                      ? "e.g. Generate a comparison chart of flood insurance costs by zone..."
                      : activeType === "callout"
                      ? "Callout text..."
                      : activeType === "quote"
                      ? "Quote text..."
                      : "Paragraph text..."
                  }
                  rows={activeType === "prompt" ? 4 : 3}
                  className={`w-full px-3 py-2 text-sm border rounded-lg resize-none
                    focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300
                    ${
                      activeType === "prompt"
                        ? "border-violet-200 bg-violet-50/50 text-violet-900 placeholder:text-violet-300"
                        : "border-slate-200 text-slate-700 placeholder:text-slate-400"
                    }`}
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveType(null)}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleInsertText}
                    disabled={!text.trim()}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg
                               hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Insert
                  </button>
                </div>
              </div>
            )}

          {/* List input */}
          {activeType === "list" && (
            <div className="p-3 space-y-2">
              {listItems.map((item, j) => (
                <div key={j} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                  <input
                    autoFocus={j === listItems.length - 1}
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const next = [...listItems];
                      next[j] = e.target.value;
                      setListItems(next);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        setListItems([...listItems, ""]);
                      }
                    }}
                    placeholder={`Item ${j + 1}`}
                    className="flex-1 px-2.5 py-1.5 text-sm border border-slate-200 rounded-md
                               focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300
                               text-slate-700 placeholder:text-slate-400"
                  />
                  {listItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setListItems(listItems.filter((_, k) => k !== j))
                      }
                      className="text-slate-300 hover:text-red-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setListItems([...listItems, ""])}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add item
              </button>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveType(null)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleInsertList}
                  disabled={listItems.every((s) => !s.trim())}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg
                             hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Insert
                </button>
              </div>
            </div>
          )}

          {/* Image upload */}
          {activeType === "image" && (
            <div className="p-3 space-y-2">
              <ImageUpload
                slug={slug}
                previewHeight="h-32"
                onUpload={(url) => {
                  onInsertBlock(index, {
                    type: "image",
                    src: url,
                    alt: "",
                    caption: "",
                  });
                  reset();
                }}
              />
              <div className="flex justify-start">
                <button
                  type="button"
                  onClick={() => setActiveType(null)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EditableText({ text, index, field, onInlineEdit }) {
  return (
    <span
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => {
        const newText = e.target.innerText;
        if (newText !== text) {
          onInlineEdit?.(index, field, newText);
        }
      }}
      className="outline-none focus:bg-blue-50/50 focus:ring-1 focus:ring-blue-200 rounded px-0.5 -mx-0.5"
    >
      {text}
    </span>
  );
}

function renderBlock(block, i, editable, onInlineEdit, onRemoveBlock, slug) {
  switch (block.type) {
    case "paragraph":
      return (
        <p key={i} className="text-slate-600 leading-relaxed mb-6 text-base">
          {editable ? (
            <EditableText
              text={block.text || ""}
              index={i}
              field="text"
              onInlineEdit={onInlineEdit}
            />
          ) : (
            block.text
          )}
        </p>
      );

    case "heading":
      return (
        <h2
          key={i}
          className="text-2xl font-bold text-slate-900 mt-10 mb-4 relative pl-4 border-l-4 border-blue-500"
          style={{ fontFamily: "Inter, system-ui, sans-serif" }}
        >
          {editable ? (
            <EditableText
              text={block.text || ""}
              index={i}
              field="text"
              onInlineEdit={onInlineEdit}
            />
          ) : (
            block.text
          )}
        </h2>
      );

    case "subheading":
      return (
        <h3
          key={i}
          className="text-xl font-bold text-slate-800 mt-8 mb-3"
          style={{ fontFamily: "Inter, system-ui, sans-serif" }}
        >
          {editable ? (
            <EditableText
              text={block.text || ""}
              index={i}
              field="text"
              onInlineEdit={onInlineEdit}
            />
          ) : (
            block.text
          )}
        </h3>
      );

    case "list":
      return (
        <ul key={i} className="mb-6 space-y-2 pl-1">
          {block.items?.map((item, j) => (
            <li
              key={j}
              className="flex items-start gap-3 text-slate-600 text-base leading-relaxed"
            >
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2.5 flex-shrink-0" />
              <span>{typeof item === "string" ? item : item.text}</span>
            </li>
          ))}
        </ul>
      );

    case "callout":
      return (
        <div
          key={i}
          className="bg-blue-50 border-l-4 border-blue-400 p-5 rounded-r-lg mb-6"
        >
          {block.title && (
            <p className="text-blue-700 font-semibold text-xs uppercase tracking-wider mb-1.5">
              {block.title}
            </p>
          )}
          <p className="text-slate-700 text-base leading-relaxed">
            {editable ? (
              <EditableText
                text={block.text || ""}
                index={i}
                field="text"
                onInlineEdit={onInlineEdit}
              />
            ) : (
              block.text
            )}
          </p>
        </div>
      );

    case "quote":
      return (
        <blockquote
          key={i}
          className="border-l-4 border-slate-300 pl-5 my-8 italic"
        >
          <p className="text-slate-500 text-lg leading-relaxed">
            &ldquo;{block.text}&rdquo;
          </p>
          {(block.author || block.attribution) && (
            <cite className="text-slate-400 text-sm font-medium mt-2 block not-italic">
              &mdash; {block.author || block.attribution}
            </cite>
          )}
        </blockquote>
      );

    case "image":
      return (
        <figure key={i} className="my-8 relative group/img">
          <div className="rounded-lg overflow-hidden bg-slate-100">
            <img
              src={block.src}
              alt={block.alt || ""}
              className="w-full h-auto"
              loading="lazy"
            />
          </div>

          {editable ? (
            <div className="mt-2 space-y-1.5">
              <input
                type="text"
                value={block.alt || ""}
                onChange={(e) => onInlineEdit?.(i, "alt", e.target.value)}
                placeholder="Alt text (for accessibility & SEO)"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 text-slate-600"
              />
              <input
                type="text"
                value={block.caption || ""}
                onChange={(e) => onInlineEdit?.(i, "caption", e.target.value)}
                placeholder="Caption (optional)"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 text-slate-500 italic"
              />
              {onRemoveBlock && (
                <button
                  type="button"
                  onClick={() => onRemoveBlock(i)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Remove image
                </button>
              )}
            </div>
          ) : (
            block.caption && (
              <figcaption className="text-center text-slate-400 text-sm mt-2 italic">
                {block.caption}
              </figcaption>
            )
          )}
        </figure>
      );

    case "table":
      return (
        <div
          key={i}
          className="my-8 overflow-x-auto rounded-lg border border-slate-200"
        >
          <table className="w-full text-sm">
            <thead>
              <tr>
                {block.headers?.map((h, j) => (
                  <th
                    key={j}
                    className="bg-slate-800 text-white text-left px-4 py-2.5 font-medium text-xs uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows?.map((row, j) => (
                <tr
                  key={j}
                  className={j % 2 === 0 ? "bg-white" : "bg-slate-50"}
                >
                  {row.map((cell, k) => (
                    <td
                      key={k}
                      className={`px-4 py-2.5 text-slate-600 border-b border-slate-100 ${
                        k === 0 ? "font-medium text-slate-800" : ""
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "stat-cards":
      return (
        <div key={i} className="grid grid-cols-2 md:grid-cols-4 gap-3 my-8">
          {block.cards?.map((card, j) => (
            <div
              key={j}
              className="bg-slate-50 rounded-lg p-4 text-center border border-slate-100"
            >
              <div className="text-xl font-bold text-blue-600">
                {card.number}
              </div>
              <div className="text-sm font-medium text-slate-700 mt-1">
                {card.label}
              </div>
              {card.sublabel && (
                <div className="text-xs text-slate-400 mt-0.5">
                  {card.sublabel}
                </div>
              )}
            </div>
          ))}
        </div>
      );

    case "pros-cons":
      return (
        <div key={i} className="grid md:grid-cols-2 gap-3 my-8">
          <div className="bg-emerald-50 rounded-lg p-5 border border-emerald-100">
            <h4 className="font-bold text-emerald-800 mb-2 text-sm">
              {block.prosTitle || "Pros"}
            </h4>
            <ul className="space-y-1.5">
              {block.pros?.map((item, j) => (
                <li
                  key={j}
                  className="flex items-start gap-2 text-sm text-slate-700"
                >
                  <span className="text-emerald-500 mt-0.5 flex-shrink-0">
                    &#x2713;
                  </span>
                  <span>{typeof item === "string" ? item : item.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-red-50 rounded-lg p-5 border border-red-100">
            <h4 className="font-bold text-red-800 mb-2 text-sm">
              {block.consTitle || "Cons"}
            </h4>
            <ul className="space-y-1.5">
              {block.cons?.map((item, j) => (
                <li
                  key={j}
                  className="flex items-start gap-2 text-sm text-slate-700"
                >
                  <span className="text-red-400 mt-0.5 flex-shrink-0">
                    &#x2717;
                  </span>
                  <span>{typeof item === "string" ? item : item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      );

    case "info-box":
      return (
        <div
          key={i}
          className={`my-6 p-4 rounded-lg border-l-4 ${
            block.variant === "warning"
              ? "bg-amber-50 border-amber-400"
              : "bg-blue-50 border-blue-400"
          }`}
        >
          <p
            className="text-slate-700 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: block.content || "" }}
          />
        </div>
      );

    case "process-steps":
      return (
        <div key={i} className="my-8 space-y-3">
          {block.steps?.map((step, j) => (
            <div key={j} className="flex gap-3 items-start">
              <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {j + 1}
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  {step.title}
                </h4>
                <p className="text-slate-500 text-sm mt-0.5 leading-relaxed">
                  {step.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      );

    case "prompt":
      return (
        <div key={i} className="my-6 relative group/prompt">
          <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-dashed border-violet-300 bg-violet-50/60">
            <Sparkles className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider mb-1">
                Prompt — not published
              </p>
              <p className="text-sm text-violet-800 leading-relaxed whitespace-pre-wrap">
                {editable ? (
                  <EditableText
                    text={block.text || ""}
                    index={i}
                    field="text"
                    onInlineEdit={onInlineEdit}
                  />
                ) : (
                  block.text
                )}
              </p>
            </div>
            {editable && onRemoveBlock && (
              <button
                type="button"
                onClick={() => onRemoveBlock(i)}
                className="flex-shrink-0 p-1 text-violet-300 hover:text-red-500 transition-colors
                           opacity-0 group-hover/prompt:opacity-100"
                title="Remove prompt"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      );

    default:
      return (
        <div
          key={i}
          className="my-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700"
        >
          Unknown block type: <code className="font-mono">{block.type}</code>
        </div>
      );
  }
}
