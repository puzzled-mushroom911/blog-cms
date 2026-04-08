# SEO Review Prompt

Use this to review a blog post before changing its status to "published" in the CMS.

## The Prompt

```
Review this blog post for SEO quality. Check:

- Title length (50-60 chars)
- Meta description (150-160 chars)
- Heading structure (one H1, logical H2/H3 hierarchy)
- Internal links (at least 2-4 to related content)
- Image alt text (descriptive, keyword-relevant)
- FAQ section for featured snippet potential
- Schema markup recommendations
- Keyword density (natural, not stuffed)
- Content freshness (are dates and data current?)
- Answer-first formatting (lead with the key takeaway)
- Readability (short paragraphs, scannable structure)

Provide:
1. A score out of 10
2. What's working well
3. Specific fixes needed (with examples)
4. Quick wins for improvement

Blog post content:
[PASTE OR REFERENCE POST]
```

## Quick SEO Checklist

Before publishing any post, verify:

- [ ] Title is 50-60 characters
- [ ] Meta description is 150-160 characters
- [ ] Slug is clean and keyword-rich (no dates or filler words)
- [ ] Featured image has a descriptive filename and alt text
- [ ] At least 2 internal links to other posts on your site
- [ ] At least 1 external link to a credible source
- [ ] FAQ section with 3-5 questions (helps win featured snippets)
- [ ] Content leads with the answer (not a long preamble)
- [ ] All data and statistics are current
- [ ] Read time is accurate

## Using with the CMS

1. Open the post in the CMS editor
2. Copy the title, meta description, and review the content
3. Run the SEO review prompt with Claude Code
4. Make fixes in the metadata sidebar and inline editor
5. Change status to "published" and save
