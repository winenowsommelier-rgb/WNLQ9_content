import assert from "node:assert/strict";
import { test } from "node:test";
import { buildDoc, markdownToHtml } from "../src/docbuilder.mjs";

test("markdownToHtml renders headings and paragraphs", () => {
  const html = markdownToHtml("## Intro\n\nHello world\n\n### Sub\n\nLine one\nLine two");
  assert.match(html, /<h2>Intro<\/h2>/);
  assert.match(html, /<h3>Sub<\/h3>/);
  assert.match(html, /<p>Hello world<\/p>/);
  assert.match(html, /Line one<br\/>Line two/);
});

test("markdownToHtml escapes HTML", () => {
  assert.match(markdownToHtml("a < b & c"), /a &lt; b &amp; c/);
});

test("buildDoc composes name + bilingual body", () => {
  const { name, html } = buildDoc({
    briefId: "WN-D03-terroir",
    title: "Terroir in One Minute",
    site: "Wine-Now",
    targetKeyword: "what is terroir",
    contentEN: "## EN\n\nEnglish body",
    contentTH: "## TH\n\nเนื้อหาภาษาไทย",
  });
  assert.equal(name, "WN-D03-terroir — Wine-Now");
  assert.match(html, /<h1>Terroir in One Minute<\/h1>/);
  assert.match(html, /<h2>English<\/h2>/);
  assert.match(html, /English body/);
  assert.match(html, /ภาษาไทย/);
  assert.match(html, /เนื้อหาภาษาไทย/);
});
