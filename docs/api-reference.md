# Blog CMS — API & MCP Reference

## Authentication

All API and MCP requests require an API key in the `Authorization` header:

```
Authorization: Bearer sk_live_your_api_key_here
```

Get your API key from the CMS dashboard: **Settings → API Keys → Create Key**.

The key is shown once at creation — copy it immediately. All requests are scoped to the workspace associated with the key.

---

## REST API

Base URL: `https://cms.moonify.ai/api/v1`

All responses use `{ data: ... }` for success and `{ error: "message" }` for errors.

### Posts

#### `GET /api/v1/posts`

List blog posts.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| status | string | — | Filter: `draft`, `needs-review`, `published` |
| limit | number | 50 | Max results |
| offset | number | 0 | Pagination offset |

```bash
curl -H "Authorization: Bearer sk_live_..." \
  "https://cms.moonify.ai/api/v1/posts?status=draft&limit=10"
```

Response:
```json
{
  "data": [
    {
      "id": "uuid",
      "slug": "best-neighborhoods-st-pete",
      "title": "Best Neighborhoods in St. Pete",
      "excerpt": "...",
      "date": "2026-04-14",
      "category": "Guide",
      "tags": ["st pete", "neighborhoods"],
      "status": "draft",
      "created_at": "2026-04-14T12:00:00Z",
      "updated_at": "2026-04-14T12:00:00Z"
    }
  ]
}
```

#### `GET /api/v1/posts/:id`

Get a single post by UUID or slug. Returns full content blocks.

```bash
curl -H "Authorization: Bearer sk_live_..." \
  "https://cms.moonify.ai/api/v1/posts/best-neighborhoods-st-pete"
```

#### `POST /api/v1/posts`

Create a new blog post.

Required fields: `title`

Optional fields: `slug`, `excerpt`, `date`, `read_time`, `author`, `category`, `tags`, `youtube_id`, `image`, `meta_description`, `keywords`, `content`, `status`, `editor_notes`

```bash
curl -X POST -H "Authorization: Bearer sk_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Moving to St. Pete in 2026",
    "category": "Guide",
    "tags": ["relocation", "st pete"],
    "content": [
      { "type": "paragraph", "text": "St. Pete is one of the hottest..." },
      { "type": "heading", "text": "Cost of Living" },
      { "type": "paragraph", "text": "Compared to other Florida cities..." }
    ]
  }' \
  "https://cms.moonify.ai/api/v1/posts"
```

Response: `201 Created` with `{ data: { ...full post } }`

#### `PATCH /api/v1/posts/:id`

Update a post. Send only the fields you want to change.

```bash
curl -X PATCH -H "Authorization: Bearer sk_live_..." \
  -H "Content-Type: application/json" \
  -d '{ "status": "published" }' \
  "https://cms.moonify.ai/api/v1/posts/<uuid>"
```

#### `DELETE /api/v1/posts/:id`

Delete a post permanently.

```bash
curl -X DELETE -H "Authorization: Bearer sk_live_..." \
  "https://cms.moonify.ai/api/v1/posts/<uuid>"
```

---

### Topics

#### `GET /api/v1/topics`

List topics. Supports `status`, `limit`, `offset` query params.

Status values: `researched`, `approved`, `discarded`, `writing`, `written`

```bash
curl -H "Authorization: Bearer sk_live_..." \
  "https://cms.moonify.ai/api/v1/topics?status=approved"
```

#### `GET /api/v1/topics/:id`

Get a single topic with full research data.

#### `POST /api/v1/topics`

Create a topic. Required: `title`. Optional: `primary_keyword`, `secondary_keywords`, `search_volume`, `keyword_difficulty`, `cpc`, `competition_level`, `status`, `research_data`, `notes`.

```bash
curl -X POST -H "Authorization: Bearer sk_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Best 55+ Communities Tampa Bay",
    "primary_keyword": "55+ communities tampa bay",
    "search_volume": 1200,
    "keyword_difficulty": 42,
    "competition_level": "medium"
  }' \
  "https://cms.moonify.ai/api/v1/topics"
```

#### `PATCH /api/v1/topics/:id`

Update a topic. Send only changed fields.

---

### Preferences

#### `GET /api/v1/preferences`

List active writing style preferences.

#### `POST /api/v1/preferences`

Create a new preference. Required: `rule`. Optional: `category` (tone, structure, vocabulary, formatting), `active`.

```bash
curl -X POST -H "Authorization: Bearer sk_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "rule": "Use conversational tone, avoid generic realtor language",
    "category": "tone"
  }' \
  "https://cms.moonify.ai/api/v1/preferences"
```

---

### Auth

#### `GET /api/v1/auth/me`

Returns workspace info and stats.

```bash
curl -H "Authorization: Bearer sk_live_..." \
  "https://cms.moonify.ai/api/v1/auth/me"
```

Response:
```json
{
  "data": {
    "workspace": {
      "id": "uuid",
      "name": "Living in St. Pete",
      "slug": "living-in-st-pete",
      "settings": { ... },
      "created_at": "2026-04-01T00:00:00Z"
    },
    "stats": {
      "post_count": 24,
      "topic_count": 15
    }
  }
}
```

---

## MCP Server (Claude Code Integration)

The CMS exposes an MCP server that lets Claude Code manage blog content directly.

### Setup

Add this to your `~/.claude/mcp.json` (or project-level `.claude/mcp.json`):

```json
{
  "mcpServers": {
    "moonify-cms": {
      "type": "streamable-http",
      "url": "https://cms.moonify.ai/api/mcp",
      "headers": {
        "Authorization": "Bearer sk_live_your_api_key_here"
      }
    }
  }
}
```

Restart Claude Code after adding the config. You'll see the CMS tools available.

### Available Tools

| Tool | Description |
|------|-------------|
| `list_posts` | List blog posts. Params: `status` (optional), `limit` (optional, default 50) |
| `get_post` | Get a single post by ID or slug. Returns full content blocks. |
| `create_post` | Create a new blog post with title, content blocks, category, tags, etc. |
| `update_post` | Update an existing post. Partial updates — only send changed fields. |
| `publish_post` | Set a post's status to "published". |
| `delete_post` | Permanently delete a post. |
| `list_topics` | List blog topics from the research pipeline. Filter by status. |
| `get_topic` | Get a single topic with full research data. |
| `create_topic` | Create a topic with keyword data. |
| `update_topic` | Update a topic (status, notes, research_data). |
| `list_preferences` | List active writing style preferences. |
| `create_preference` | Add a new style preference rule. |
| `get_workspace_info` | Returns workspace name, settings, and stats (post count, topic count). |

### Content Block Types

When using `create_post` or `update_post`, the `content` field is an array of block objects:

- `{ "type": "paragraph", "text": "..." }`
- `{ "type": "heading", "text": "..." }`
- `{ "type": "subheading", "text": "..." }`
- `{ "type": "list", "items": ["item1", "item2"] }`
- `{ "type": "process-steps", "steps": [{ "title": "...", "text": "..." }] }`
- `{ "type": "callout", "title": "...", "text": "..." }`
- `{ "type": "quote", "text": "...", "author": "..." }`
- `{ "type": "info-box", "title": "...", "text": "...", "variant": "blue|warning" }`
- `{ "type": "image", "src": "...", "alt": "...", "caption": "..." }`
- `{ "type": "table", "headers": ["..."], "rows": [["...", "..."]] }`
- `{ "type": "stat-cards", "items": [{ "label": "...", "value": "..." }] }`
- `{ "type": "pros-cons", "pros": ["..."], "cons": ["..."] }`

### Getting an API Key

1. Log into the CMS dashboard at `https://cms.moonify.ai`
2. Go to **Settings** (gear icon in the sidebar)
3. Under **API Keys**, click **Create Key**
4. Give it a name (e.g., "Claude Code")
5. Copy the key immediately — it's only shown once
