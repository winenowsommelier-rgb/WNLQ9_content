// Render an article model (article-model.buildArticleModel) into a standalone,
// Magento-safe HTML page that matches the hand-authored exemplars in
// public/content (shared assets/article.css, Sarabun, canonical, OG/Twitter,
// three+ JSON-LD blocks, brand chrome, compliance footer). Pure + deterministic.

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ESC[c]);
}

// Minimal inline markup on already-escaped text: **bold** and *em*.
function inline(s) {
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
}

function attr(s) {
  return String(s ?? "").replace(/"/g, "&quot;");
}

function jsonLdBlock(obj) {
  return `<script type="application/ld+json">\n${JSON.stringify(obj)}\n</script>`;
}

function head(m) {
  const jsonld = m.jsonld.map(jsonLdBlock).join("\n");
  return `<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap">
<title>${esc(m.pageTitle)}</title>
<meta name="description" content="${attr(m.description)}">
<link rel="canonical" href="${attr(m.canonical)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${attr(m.h1)}">
<meta property="og:image" content="${attr(m.ogImage)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${attr(m.ogImage)}">
<meta property="og:description" content="${attr(m.dek || m.description)}">
<meta property="og:locale" content="${m.lang === "en" ? "en_US" : "th_TH"}">
<link rel="stylesheet" href="assets/article.css">
${jsonld}
</head>`;
}

function topbar(b) {
  return `<div class="topbar"><div class="wrap"><span class="brand"${b.brandAttr}>${b.brandHtml}</span>
<nav><a href="index.html">บทความ</a><a href="${attr(b.navAllHref)}">${esc(b.navAll)}</a></nav></div></div>`;
}

function header(m) {
  const b = m.brand;
  return `<header class="article">
  <span class="kicker"${b.kickerAttr}>${esc(m.kicker)}</span>
  <h1>${esc(m.h1)}</h1>
  ${m.dek ? `<p class="dek">${esc(m.dek)}</p>` : ""}
  <div class="meta"><span>วันที่ <b>${esc(m.meta.dateText)}</b></span><span>อ่าน <b>${esc(m.meta.readText)}</b></span><span>หมวด <b>${esc(m.meta.categoryText)}</b></span></div>
  <div class="byline"><span class="${b.avClass}">${esc(b.avText)}</span><span>โดย <b>${esc(b.bylinePersona)}</b> · ${esc(b.bylineNote)}</span></div>
</header>`;
}

function heroFigure(m) {
  const altThai = `ภาพประกอบ: ${m.h1}`;
  return `<figure>
  <div class="figph"><div class="t">ภาพประกอบหลัก</div><div class="alt">${esc(altThai)}</div></div>
  <figcaption>${esc(m.h1)}</figcaption>
</figure>`;
}

function section(s) {
  const paras = s.paragraphs.map((p) => `<p>${inline(p)}</p>`).join("\n");
  const list = s.list.length
    ? `<ul>\n${s.list.map((li) => `  <li>${inline(li)}</li>`).join("\n")}\n</ul>`
    : "";
  const note = s.note ? `<p class="note">${inline(s.note)}</p>` : "";
  return `<h2>${esc(s.h2)}</h2>\n${paras}${list ? "\n" + list : ""}${note ? "\n" + note : ""}`;
}

function table(t) {
  if (!t || !t.head || !t.rows) return "";
  const head = t.head.map((h) => `<th>${esc(h)}</th>`).join("");
  const rows = t.rows
    .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`)
    .join("\n");
  return `<div class="table-wrap">
<table>
<thead><tr>${head}</tr></thead>
<tbody>
${rows}
</tbody>
</table>
</div>`;
}

function productGrid(m) {
  if (!m.products.length) {
    // SKU rule: no matching in-stock product => 0 cards, route to LINE honestly.
    return `<p class="note">ตอนนี้สต็อกที่ตรงกับหัวข้อนี้มีจำกัด — ทักทีมเราทาง LINE เพื่อสอบถามรุ่นที่มีและคำแนะนำเฉพาะคุณได้เลย</p>`;
  }
  const intro = m.productIntro ? `<p>${inline(m.productIntro)}</p>\n` : "";
  const cards = m.products
    .map((p) => {
      const badges = p.badges
        .map((bdg, i) => `<span class="badge${i === 0 ? " gold" : ""}">${esc(bdg)}</span>`)
        .join("");
      const price = p.price ? `<div class="pr">${esc(p.price)}</div>` : "";
      return `  <div class="product-card" data-sku="${attr(p.sku)}">
    <div class="nm">${esc(p.name)}</div>
    <div class="mt">${esc(p.desc)}</div>
    <div class="badges">${badges}</div>
    <div class="sku">SKU: <b>${esc(p.sku)}</b></div>
    ${price}
    <a class="shop" href="${attr(p.catalogUrl)}">ดูขวดนี้ →</a>
  </div>`;
    })
    .join("\n");
  const note = `<p class="mt" style="font-size:13px;color:#8a8079">*ราคาเป็นค่าประมาณและอาจเปลี่ยนแปลง โปรดสอบถามราคา/สั่งซื้อทาง LINE</p>`;
  return `${intro}<div class="product-grid">\n${cards}\n</div>\n${note}`;
}

function ctaBlock(m) {
  if (!m.cta) return "";
  const b = m.brand;
  return `<div class="${b.ctaClass}">
  <div class="ct"><h4>${esc(m.cta.heading)}</h4>${m.cta.body ? `<p>${esc(m.cta.body)}</p>` : ""}</div>
  <a class="btn" href="${attr(b.ctaAllHref)}">${esc(b.ctaAllLabel)}</a>
</div>`;
}

function faqBlock(m) {
  if (!m.faq.length) return "";
  const items = m.faq
    .map(
      (f, i) =>
        `  <details${i === 0 ? " open" : ""}><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`,
    )
    .join("\n");
  return `<h2 id="faq">คำถามที่พบบ่อย</h2>
<div class="faq">
${items}
</div>`;
}

function footer(b) {
  return `<footer class="site"><div class="wrap"><span>© 2026 ${esc(b.footerName)}</span><a href="${attr(b.domain)}">${esc(b.footerHost)}</a><span class="sp">ดื่มอย่างมีความรับผิดชอบ · 20+</span></div></footer>`;
}

/**
 * Render the full standalone HTML page for an article model.
 * @returns {string} HTML document
 */
export function renderArticle(m) {
  const body = [
    topbar(m.brand),
    `<div class="wrap">`,
    header(m),
    `<article>`,
    "",
    heroFigure(m),
    "",
    m.summary ? `<p class="note"><b>สรุปสั้นๆ:</b> ${inline(m.summary)}</p>` : "",
    "",
    m.sections.map(section).join("\n\n"),
    "",
    table(m.table),
    "",
    productGrid(m),
    "",
    ctaBlock(m),
    "",
    faqBlock(m),
    "",
    `</article>`,
    `</div>`,
    footer(m.brand),
  ]
    .filter((s) => s !== "")
    .join("\n");

  return `<!doctype html>
<html lang="${m.lang === "en" ? "en" : "th"}">
${head(m)}
<body>
${body}
</body>
</html>
`;
}
