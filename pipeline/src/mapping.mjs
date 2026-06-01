// Map a normalized brief -> Notion page `properties` payload.
//
// Property names below MUST match the live Notion column names exactly
// (note: the column whose schema key is "userDefined:URL" is named "URL").
// Only defined fields are emitted, so partial briefs produce partial rows.

// Notion rejects any single text item whose content exceeds 2000 characters,
// so long values (Content Brief / TH / EN) are split across multiple items.
const NOTION_TEXT_LIMIT = 2000;

function chunk(value) {
  const s = String(value);
  const items = [];
  for (let i = 0; i < s.length; i += NOTION_TEXT_LIMIT) {
    items.push({ type: "text", text: { content: s.slice(i, i + NOTION_TEXT_LIMIT) } });
  }
  return items.length ? items : [{ type: "text", text: { content: "" } }];
}

function title(value) {
  return { title: chunk(value) };
}
function richText(value) {
  return { rich_text: chunk(value) };
}
function select(name) {
  return { select: { name } };
}
function number(value) {
  return { number: value };
}
function url(value) {
  return { url: value || null };
}
function date(value) {
  // Notion accepts a date or datetime ISO string as `start`.
  const d = new Date(value);
  const iso = value.length <= 10 ? value : d.toISOString();
  return { date: { start: iso } };
}

/**
 * @param {object} brief normalized brief (see normalizeBrief)
 * @returns {object} Notion `properties` object for POST /pages
 */
export function briefToNotionProperties(brief) {
  const props = {};

  // Title (required on create; omitted on partial updates)
  if (brief.title != null) props["Title"] = title(brief.title);

  // Selects
  if (brief.status) props["Status"] = select(brief.status);
  if (brief.site) props["Site"] = select(brief.site);
  if (brief.weekTheme) props["Week Theme"] = select(brief.weekTheme);
  if (brief.category) props["Category"] = select(brief.category);
  if (brief.type) props["Type"] = select(brief.type);
  if (brief.month) props["Month"] = select(brief.month);

  // Numbers
  if (brief.day != null) props["Day"] = number(brief.day);
  if (brief.gaViews != null) props["GA Views"] = number(brief.gaViews);

  // Date
  if (brief.publishDate) props["Publish Date"] = date(brief.publishDate);

  // Rich text
  if (brief.targetKeyword) props["Target Keyword"] = richText(brief.targetKeyword);
  if (brief.contentBrief) props["Content Brief"] = richText(brief.contentBrief);
  if (brief.contentTH) props["Content TH"] = richText(brief.contentTH);
  if (brief.contentEN) props["Content EN"] = richText(brief.contentEN);
  if (brief.briefId) props["Brief ID"] = richText(brief.briefId);
  if (brief.key) props["KEY"] = richText(brief.key);
  if (brief.story) props["STORY"] = richText(brief.story);
  if (brief.tension) props["TENSION"] = richText(brief.tension);
  if (brief.cta) props["CTA"] = richText(brief.cta);

  // URLs
  if (brief.finalUrl) props["Final URL"] = url(brief.finalUrl);
  if (brief.url) props["URL"] = url(brief.url);

  return props;
}
