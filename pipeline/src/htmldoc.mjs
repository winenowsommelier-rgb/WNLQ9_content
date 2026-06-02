// Turn a content article's HTML into a self-contained file for handoff
// (e.g. uploading to Google Drive, where the team copies it into Magento).
//
// The article pages link an external stylesheet (assets/article.css). For a
// standalone file we inline that CSS so the HTML renders correctly on its own
// with no external dependency. Pure + dependency-free so it's unit-testable.

/**
 * Inline a stylesheet into an HTML document.
 * Replaces the <link ... article.css> tag with an inline <style> block; if no
 * such link exists, injects the <style> just before </head>.
 * @param {string} html  full HTML document
 * @param {string} css   stylesheet contents to inline
 * @returns {string}
 */
export function inlineStylesheet(html, css) {
  const styleTag = `<style>\n${css}\n</style>`;
  const linkRe = /<link\b[^>]*article\.css[^>]*>/i;
  if (linkRe.test(html)) return html.replace(linkRe, styleTag);
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${styleTag}\n</head>`);
  return `${styleTag}\n${html}`;
}

/**
 * Derive a clean Drive file name from a Notion item + slug.
 * Strips the "| EN: ..." half of bilingual titles and appends .html.
 */
export function driveFileName(item, fallbackSlug = "article") {
  const base = (item?.title || fallbackSlug).split("|")[0].replace(/\s+/g, " ").trim();
  const site = item?.site ? ` — ${item.site}` : "";
  return `${base}${site}.html`;
}
