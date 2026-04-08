# Setting Up Your Knowledge Base

Your knowledge base is what makes AI-generated content sound like YOU, not a robot. It gives Claude Code context about your voice, expertise, and the topics you cover.

## Step 1: Gather Your Content Sources

Collect anything that captures your authentic voice:
- YouTube video transcripts (your best source of natural voice)
- Email templates and client communications
- Voice notes and brainstorming recordings (transcribe them first)
- Previous blog posts or articles you've written
- Social media posts in your voice

## Step 2: Create a Knowledge Base Folder

```bash
mkdir -p ~/knowledge_bases/your_content
```

## Step 3: Add Your Transcripts

Drop your transcript files into the folder. The more content Claude Code has to reference, the better it can match your voice.

**Downloading YouTube transcripts in bulk:**
```bash
# Download transcripts for your last 10 videos
yt-dlp --write-auto-sub --sub-lang en --skip-download \
  -o "~/knowledge_bases/your_content/%(title)s" \
  "https://youtube.com/@yourchannel" \
  --playlist-end 10
```

**Tip:** Name files descriptively so you can reference specific topics:
```
~/knowledge_bases/your_content/
  how-to-buy-first-home.txt
  neighborhood-guide-downtown.txt
  market-update-q1-2026.txt
  client-faq-responses.txt
```

## Step 4: Configure Claude Code

Add this to your project's `CLAUDE.md` file (or your global `~/.claude/CLAUDE.md`):

```markdown
# Content Sources
- Knowledge base: ~/knowledge_bases/your_content/
- YouTube channel: [YOUR CHANNEL URL]
- Brand voice: [DESCRIBE YOUR VOICE]
  Examples: "direct and conversational", "professional but warm",
  "data-driven with personal anecdotes", "casual and relatable"
```

Now when you tell Claude Code to "use my knowledge base" or "match my voice," it knows where to look.

## Step 5: Test It

Try generating a short paragraph to verify the voice match:

```
Read my transcripts in ~/knowledge_bases/your_content/ and write
a 100-word paragraph about [YOUR TOPIC] in my voice. Match my
speaking style, not generic AI writing.
```

Compare the output to your actual content. If it's close, you're set. If not, add more transcript examples.

## Advanced: Vector Database (Optional)

For larger knowledge bases with semantic search:

1. Install ChromaDB:
   ```bash
   pip install chromadb sentence-transformers
   ```

2. Create an import script that chunks your transcripts and stores them as embeddings

3. Claude Code can then search by meaning, not just keywords -- finding relevant content even when the exact words differ

This is optional. For most creators, the simple folder approach in Steps 2-4 works great.
