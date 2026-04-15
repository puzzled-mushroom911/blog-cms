/**
 * WordPress Publishing Integration
 *
 * Two exports:
 *   blocksToHtml(contentArray)       — converts CMS JSONB content blocks to WordPress-ready HTML
 *   publishToWordPress({ ... })      — POSTs a new post to the WordPress REST API
 */

/* ------------------------------------------------------------------ */
/*  Content Block → HTML Converter                                     */
/* ------------------------------------------------------------------ */

/**
 * Convert an array of CMS content blocks to a single HTML string
 * suitable for the WordPress post `content` field.
 */
export function blocksToHtml(contentArray) {
  if (!Array.isArray(contentArray)) return '';
  return contentArray.map(blockToHtml).filter(Boolean).join('\n\n');
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function blockToHtml(block) {
  if (!block || !block.type) return '';

  switch (block.type) {
    case 'paragraph':
      return `<p>${escapeHtml(block.text)}</p>`;

    case 'heading':
      return `<h2>${escapeHtml(block.text)}</h2>`;

    case 'subheading':
      return `<h3>${escapeHtml(block.text)}</h3>`;

    case 'list': {
      const items = (block.items || [])
        .map((item) => {
          const text = typeof item === 'string' ? item : item.text || '';
          return `  <li>${escapeHtml(text)}</li>`;
        })
        .join('\n');
      return `<ul>\n${items}\n</ul>`;
    }

    case 'callout': {
      const titleHtml = block.title
        ? `<strong>${escapeHtml(block.title)}</strong>\n`
        : '';
      return (
        `<div style="background:#f0f9ff;border-left:4px solid #3b82f6;padding:16px;margin:16px 0;">` +
        `${titleHtml}<p>${escapeHtml(block.text)}</p>` +
        `</div>`
      );
    }

    case 'quote': {
      const attribution = block.attribution || block.author;
      const citeHtml = attribution
        ? `\n<cite>${escapeHtml(attribution)}</cite>`
        : '';
      return `<blockquote><p>${escapeHtml(block.text)}</p>${citeHtml}</blockquote>`;
    }

    case 'image': {
      const alt = block.alt ? ` alt="${escapeHtml(block.alt)}"` : ' alt=""';
      const captionHtml = block.caption
        ? `\n<figcaption>${escapeHtml(block.caption)}</figcaption>`
        : '';
      return `<figure><img src="${escapeHtml(block.src)}"${alt}>${captionHtml}</figure>`;
    }

    case 'table': {
      const headers = (block.headers || [])
        .map((h) => `<th>${escapeHtml(h)}</th>`)
        .join('');
      const rows = (block.rows || [])
        .map((row) => {
          const cells = row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('');
          return `<tr>${cells}</tr>`;
        })
        .join('\n');
      return (
        `<table>\n<thead><tr>${headers}</tr></thead>\n` +
        `<tbody>\n${rows}\n</tbody>\n</table>`
      );
    }

    case 'pros-cons': {
      const prosTitle = block.prosTitle || 'Pros';
      const consTitle = block.consTitle || 'Cons';
      const prosList = (block.pros || [])
        .map((p) => {
          const text = typeof p === 'string' ? p : p.text || '';
          return `<li>${escapeHtml(text)}</li>`;
        })
        .join('');
      const consList = (block.cons || [])
        .map((c) => {
          const text = typeof c === 'string' ? c : c.text || '';
          return `<li>${escapeHtml(text)}</li>`;
        })
        .join('');
      return (
        `<div style="display:flex;gap:16px;margin:16px 0;">` +
        `<div style="flex:1;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:16px;">` +
        `<h4 style="color:#065f46;margin:0 0 8px 0;">${escapeHtml(prosTitle)}</h4>` +
        `<ul>${prosList}</ul></div>` +
        `<div style="flex:1;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;">` +
        `<h4 style="color:#991b1b;margin:0 0 8px 0;">${escapeHtml(consTitle)}</h4>` +
        `<ul>${consList}</ul></div>` +
        `</div>`
      );
    }

    case 'info-box': {
      const isWarning = block.variant === 'warning';
      const bg = isWarning ? '#fffbeb' : '#eff6ff';
      const border = isWarning ? '#f59e0b' : '#3b82f6';
      return (
        `<div style="background:${bg};border-left:4px solid ${border};padding:16px;margin:16px 0;border-radius:0 8px 8px 0;">` +
        `<p>${block.content || ''}</p>` +
        `</div>`
      );
    }

    case 'stat-cards': {
      const cards = (block.cards || [])
        .map((card) => {
          const sublabel = card.sublabel
            ? `<div style="font-size:12px;color:#94a3b8;margin-top:2px;">${escapeHtml(card.sublabel)}</div>`
            : '';
          return (
            `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;text-align:center;">` +
            `<div style="font-size:24px;font-weight:bold;color:#2563eb;">${escapeHtml(card.number)}</div>` +
            `<div style="font-size:14px;font-weight:500;color:#334155;margin-top:4px;">${escapeHtml(card.label)}</div>` +
            `${sublabel}</div>`
          );
        })
        .join('\n');
      return (
        `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin:16px 0;">` +
        `${cards}</div>`
      );
    }

    case 'process-steps': {
      const steps = (block.steps || [])
        .map((step, idx) => {
          return (
            `<li style="margin-bottom:12px;">` +
            `<strong>${escapeHtml(step.title)}</strong>` +
            `<br>${escapeHtml(step.text)}</li>`
          );
        })
        .join('\n');
      return `<ol>\n${steps}\n</ol>`;
    }

    case 'prompt':
      // Internal-only block — skip entirely
      return '';

    default:
      // Unknown block type — render as paragraph to avoid data loss
      if (block.text) return `<p>${escapeHtml(block.text)}</p>`;
      return '';
  }
}

/* ------------------------------------------------------------------ */
/*  WordPress REST API Client                                          */
/* ------------------------------------------------------------------ */

/**
 * Publish (or create a draft) on a WordPress site via the REST API.
 *
 * @param {Object} opts
 * @param {string} opts.siteUrl      - WordPress root URL, e.g. https://example.com
 * @param {string} opts.username     - WordPress username
 * @param {string} opts.appPassword  - WordPress Application Password
 * @param {string} opts.title        - Post title
 * @param {string} opts.content      - Post HTML content
 * @param {string} [opts.excerpt]    - Post excerpt
 * @param {string} [opts.slug]       - Post slug
 * @param {string} [opts.status]     - 'draft' (default) or 'publish'
 * @returns {Promise<{ id: number, url: string }>}
 */
export async function publishToWordPress({
  siteUrl,
  username,
  appPassword,
  title,
  content,
  excerpt,
  slug,
  status = 'draft',
}) {
  // Normalize site URL — strip trailing slash
  const base = siteUrl.replace(/\/+$/, '');
  const endpoint = `${base}/wp-json/wp/v2/posts`;

  const credentials = Buffer.from(`${username}:${appPassword}`).toString('base64');

  const body = { title, content, status };
  if (excerpt) body.excerpt = excerpt;
  if (slug) body.slug = slug;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorMessage = `WordPress API error: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json();
      if (errorBody.message) {
        errorMessage = `WordPress API error: ${errorBody.message}`;
      }
    } catch {
      // Couldn't parse error body — use the status-based message
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return {
    id: data.id,
    url: data.link,
  };
}
