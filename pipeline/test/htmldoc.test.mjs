import assert from "node:assert/strict";
import { test } from "node:test";
import { driveFileName, inlineStylesheet } from "../src/htmldoc.mjs";

test("inlineStylesheet replaces the external article.css link with inline CSS", () => {
  const html = `<head><link rel="stylesheet" href="assets/article.css"></head><body>hi</body>`;
  const out = inlineStylesheet(html, "body{color:red}");
  assert.ok(!out.includes("<link"));
  assert.ok(out.includes("<style>\nbody{color:red}\n</style>"));
  assert.ok(out.includes("hi"));
});

test("inlineStylesheet injects before </head> when no stylesheet link exists", () => {
  const html = `<head><title>x</title></head><body>hi</body>`;
  const out = inlineStylesheet(html, "p{margin:0}");
  assert.ok(out.includes("<style>\np{margin:0}\n</style>\n</head>"));
});

test("driveFileName strips bilingual '| EN:' half, adds site + .html", () => {
  const name = driveFileName({ title: "Tannin คืออะไร | EN: Tannin Explained", site: "Wine-Now" });
  assert.equal(name, "Tannin คืออะไร — Wine-Now.html");
});

test("driveFileName falls back to slug when no title", () => {
  assert.equal(driveFileName({}, "day2-tannin"), "day2-tannin.html");
});
