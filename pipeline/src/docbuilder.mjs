// Build the HTML body for the Google Doc created on approval.
// A deliberately small markdown subset (## headings, paragraphs) is enough for
// Drive to convert into a cleanly-formatted Google Doc.

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Minimal markdown -> HTML: ## / ### headings and blank-line paragraphs. */
export function markdownToHtml(md) {
  const blocks = String(md).replace(/\r\n/g, "\n").split(/\n{2,}/);
  return blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      const h = trimmed.match(/^(#{2,3})\s+(.*)$/);
      if (h) {
        const level = h[1].length; // 2 or 3
        return `<h${level}>${escapeHtml(h[2])}</h${level}>`;
      }
      return `<p>${escapeHtml(trimmed).replace(/\n/g, "<br/>")}</p>`;
    })
    .filter(Boolean)
    .join("\n");
}

/**
 * Compose the full bilingual document (EN + TH) for an item.
 * @returns {{ name: string, html: string }}
 */
export function buildDoc(item) {
  const name = `${item.briefId || item.title} — ${item.site || ""}`.trim();
  const meta = [
    item.site && `Site: ${item.site}`,
    item.category && `Category: ${item.category}`,
    item.targetKeyword && `Target keyword: ${item.targetKeyword}`,
    item.publishDate && `Publish date: ${item.publishDate}`,
  ]
    .filter(Boolean)
    .map((l) => `<p><em>${escapeHtml(l)}</em></p>`)
    .join("\n");

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(
    item.title || "",
  )}</title></head><body>
<h1>${escapeHtml(item.title || "")}</h1>
${meta}
<hr/>
<h2>English</h2>
${markdownToHtml(item.contentEN || "")}
<hr/>
<h2>ภาษาไทย (Thai)</h2>
${markdownToHtml(item.contentTH || "")}
</body></html>`;

  return { name, html };
}
