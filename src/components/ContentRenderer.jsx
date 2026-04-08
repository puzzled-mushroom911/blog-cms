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

export default function ContentRenderer({ content, editable = false, onInlineEdit }) {
  if (!content || !Array.isArray(content)) return null;

  return content.map((block, i) => {
    const rendered = renderBlock(block, i, editable, onInlineEdit);
    if (!rendered) return null;
    return rendered;
  });
}

/**
 * Inline-editable text span. Fires onInlineEdit when the user blurs
 * after changing the text.
 */
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

function renderBlock(block, i, editable, onInlineEdit) {
  switch (block.type) {
    case 'paragraph':
      return (
        <p key={i} className="text-slate-600 leading-relaxed mb-6 text-base">
          {editable ? (
            <EditableText text={block.text} index={i} field="text" onInlineEdit={onInlineEdit} />
          ) : (
            block.text
          )}
        </p>
      );

    case 'heading':
      return (
        <h2
          key={i}
          className="text-2xl font-bold text-slate-900 mt-10 mb-4 relative pl-4 border-l-4 border-blue-500"
        >
          {editable ? (
            <EditableText text={block.text} index={i} field="text" onInlineEdit={onInlineEdit} />
          ) : (
            block.text
          )}
        </h2>
      );

    case 'subheading':
      return (
        <h3 key={i} className="text-xl font-bold text-slate-800 mt-8 mb-3">
          {editable ? (
            <EditableText text={block.text} index={i} field="text" onInlineEdit={onInlineEdit} />
          ) : (
            block.text
          )}
        </h3>
      );

    case 'list':
      return (
        <ul key={i} className="mb-6 space-y-2 pl-1">
          {block.items?.map((item, j) => (
            <li
              key={j}
              className="flex items-start gap-3 text-slate-600 text-base leading-relaxed"
            >
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2.5 flex-shrink-0" />
              <span>{typeof item === 'string' ? item : item.text}</span>
            </li>
          ))}
        </ul>
      );

    case 'callout':
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
              <EditableText text={block.text} index={i} field="text" onInlineEdit={onInlineEdit} />
            ) : (
              block.text
            )}
          </p>
        </div>
      );

    case 'quote':
      return (
        <blockquote key={i} className="border-l-4 border-slate-300 pl-5 my-8 italic">
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

    case 'image':
      return (
        <figure key={i} className="my-8">
          <div className="rounded-lg overflow-hidden bg-slate-100">
            <img
              src={block.src}
              alt={block.alt || ''}
              className="w-full h-auto"
              loading="lazy"
            />
          </div>
          {block.caption && (
            <figcaption className="text-center text-slate-400 text-sm mt-2 italic">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    case 'table':
      return (
        <div key={i} className="my-8 overflow-x-auto rounded-lg border border-slate-200">
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
                  className={j % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                >
                  {row.map((cell, k) => (
                    <td
                      key={k}
                      className={`px-4 py-2.5 text-slate-600 border-b border-slate-100 ${
                        k === 0 ? 'font-medium text-slate-800' : ''
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

    case 'stat-cards':
      return (
        <div key={i} className="grid grid-cols-2 md:grid-cols-4 gap-3 my-8">
          {block.cards?.map((card, j) => (
            <div key={j} className="bg-slate-50 rounded-lg p-4 text-center border border-slate-100">
              <div className="text-xl font-bold text-blue-600">{card.number}</div>
              <div className="text-sm font-medium text-slate-700 mt-1">{card.label}</div>
              {card.sublabel && (
                <div className="text-xs text-slate-400 mt-0.5">{card.sublabel}</div>
              )}
            </div>
          ))}
        </div>
      );

    case 'pros-cons':
      return (
        <div key={i} className="grid md:grid-cols-2 gap-3 my-8">
          <div className="bg-emerald-50 rounded-lg p-5 border border-emerald-100">
            <h4 className="font-bold text-emerald-800 mb-2 text-sm">
              {block.prosTitle || 'Pros'}
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
                  <span>{typeof item === 'string' ? item : item.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-red-50 rounded-lg p-5 border border-red-100">
            <h4 className="font-bold text-red-800 mb-2 text-sm">
              {block.consTitle || 'Cons'}
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
                  <span>{typeof item === 'string' ? item : item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      );

    case 'info-box':
      return (
        <div
          key={i}
          className={`my-6 p-4 rounded-lg border-l-4 ${
            block.variant === 'warning'
              ? 'bg-amber-50 border-amber-400'
              : 'bg-blue-50 border-blue-400'
          }`}
        >
          <p
            className="text-slate-700 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: block.content }}
          />
        </div>
      );

    case 'process-steps':
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
