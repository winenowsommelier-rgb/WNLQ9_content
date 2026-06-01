# Blog Component Library

Complete HTML/CSS for every blog component. When generating a blog, assemble the `<style>` block from only the components you use, then build the HTML body.

**Color placeholders**: Use `{{BRAND_PRIMARY}}`, `{{BRAND_HOVER}}`, `{{BRAND_SHADOW}}`, `{{ALT_BG}}`, `{{CALLOUT_FROM}}`, `{{CALLOUT_TO}}`, `{{TABLE_HEADER}}`, `{{TABLE_EVEN}}`, `{{TABLE_HOVER}}`, `{{TOC_BG}}`, `{{TOC_BORDER}}` — then replace with actual hex values from the brand reference before output. Never output placeholders to the user.

---

## 1. Base Styles (always include)

```css
body {
  font-family: 'Kanit', 'Gotham', Arial, sans-serif;
  line-height: 1.8;
  margin: 0;
  padding: 0;
  background-color: #fff;
  color: #333;
  font-size: 18px;
}
.blog-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}
.blog-divider {
  border: none;
  height: 1px;
  background: linear-gradient(to right, transparent, #ccc, transparent);
  margin: 40px 0;
}
```

```css
/* Responsive base */
@media (max-width: 768px) {
  .blog-intro { font-size: 17px; text-align: left; }
}
```

---

## 2. Hero (Separated Image + Title)

```html
<!-- HERO IMAGE -->
<div class="blog-hero-image">
  <img src="IMAGE_URL" alt="Alt text">
</div>
<div class="blog-hero-title">
  <h1>Blog Title Here</h1>
  <div class="blog-hero-meta">CATEGORY &nbsp;|&nbsp; X min read</div>
</div>
```

```css
.blog-hero-image {
  width: 100%;
  max-height: 480px;
  overflow: hidden;
  border-radius: 0 0 16px 16px;
}
.blog-hero-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.blog-hero-title {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 20px 0 20px;
}
.blog-hero-title h1 {
  color: {{BRAND_PRIMARY}};
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 10px 0;
  line-height: 1.3;
}
.blog-hero-meta {
  color: #999;
  font-size: 14px;
  font-weight: 400;
  margin-bottom: 30px;
  letter-spacing: 0.5px;
}
```

```css
@media (max-width: 768px) {
  .blog-hero-image { max-height: 260px; border-radius: 0; }
  .blog-hero-title h1 { font-size: 26px; }
}
```

---

## 3. Author Byline

```html
<div class="blog-container">
  <div class="blog-author">
    <div class="blog-author-avatar">🍷</div>
    <div class="blog-author-info">
      <p class="blog-author-name">Wine-Now Sommelier Team</p>
      <p class="blog-author-role">Certified Sommelier &nbsp;|&nbsp; Updated: Month Year</p>
    </div>
  </div>
</div>
```

```css
.blog-author {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 0;
  margin: 30px 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}
.blog-author-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #f5efe8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}
.blog-author-info { flex: 1; }
.blog-author-name { font-size: 16px; font-weight: 600; color: #333; margin: 0; }
.blog-author-role { font-size: 14px; color: #999; margin: 0; }
```

```css
@media (max-width: 768px) {
  .blog-author { flex-direction: column; text-align: center; }
}
```

---

## 4. Intro Paragraph

```html
<div class="blog-container">
  <p class="blog-intro">Centered intro text here...</p>
</div>
```

```css
.blog-intro {
  font-size: 20px;
  color: #555;
  line-height: 2;
  max-width: 900px;
  margin: 0 auto 40px auto;
  text-align: center;
  padding: 0 20px;
}
```

---

## 5. Table of Contents (Optional)

```html
<div class="blog-container">
  <div class="blog-toc">
    <div class="blog-toc-title">สารบัญ</div>
    <ol>
      <li><a href="#section-1">Section Title</a></li>
      <li><a href="#section-2">Section Title</a></li>
    </ol>
  </div>
</div>
```

```css
.blog-toc {
  background: {{TOC_BG}};
  border: 1px solid {{TOC_BORDER}};
  border-radius: 12px;
  padding: 24px 30px;
  margin: 20px auto 40px auto;
  max-width: 700px;
}
.blog-toc-title {
  font-size: 16px;
  font-weight: 700;
  color: {{BRAND_PRIMARY}};
  margin-bottom: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.blog-toc ol { margin: 0; padding-left: 20px; }
.blog-toc li { margin-bottom: 8px; font-size: 16px; line-height: 1.5; }
.blog-toc a { color: #555; text-decoration: none; transition: color 0.2s ease; }
.blog-toc a:hover { color: {{BRAND_PRIMARY}}; text-decoration: underline; }
```

```css
@media (max-width: 768px) { .blog-toc { padding: 20px; } }
```

---

## 6. Section Blocks

```html
<!-- White background section -->
<div class="blog-section" id="section-id">
  <div class="blog-container">
    <!-- content -->
  </div>
</div>

<!-- Alternating colored background -->
<div class="blog-section-alt">
  <div class="blog-container">
    <!-- content -->
  </div>
</div>
```

```css
.blog-section { padding: 40px 0; }
.blog-section-alt {
  background-color: {{ALT_BG}};
  padding: 40px 0;
  margin: 30px 0;
  border-radius: 12px;
}
.blog-section-alt .blog-container { padding: 0 30px; }
```

---

## 7. Headings

```html
<h2 class="blog-heading">Section Title</h2>
<h3 class="blog-subheading">Subsection Title</h3>
```

```css
h2.blog-heading {
  color: {{BRAND_PRIMARY}};
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 3px solid {{BRAND_PRIMARY}};
  display: inline-block;
}
h3.blog-subheading {
  color: {{BRAND_PRIMARY}};
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 16px;
}
.blog-section p, .blog-section li,
.blog-section-alt p, .blog-section-alt li {
  margin-bottom: 16px;
  line-height: 1.8;
}
.blog-section ul, .blog-section-alt ul {
  padding-left: 20px;
  margin-bottom: 30px;
}
```

```css
@media (max-width: 768px) {
  h2.blog-heading { font-size: 24px; }
  h3.blog-subheading { font-size: 20px; }
}
```

---

## 8. Image with Caption

```html
<div class="blog-image-wrap">
  <img src="IMAGE_URL" alt="Alt text">
  <p class="blog-image-caption">Caption text here</p>
</div>
```

```css
.blog-image-full {
  width: 100%;
  border-radius: 12px;
  margin: 24px 0 0 0;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}
.blog-image-wrap { margin: 24px 0; }
.blog-image-wrap img {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  display: block;
}
.blog-image-caption {
  text-align: center;
  font-size: 14px;
  color: #999;
  margin-top: 10px;
  font-style: italic;
}
```

---

## 9. Highlight Cards (3-column)

```html
<div class="blog-highlights">
  <div class="blog-highlight-card">
    <div class="blog-highlight-icon">🛡️</div>
    <h4>Title</h4>
    <p>Description</p>
  </div>
  <!-- repeat for each card -->
</div>
```

```css
.blog-highlights {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin: 30px 0;
}
.blog-highlight-card {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.blog-highlight-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
}
.blog-highlight-icon { font-size: 36px; margin-bottom: 12px; }
.blog-highlight-card h4 {
  color: {{BRAND_PRIMARY}};
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
}
.blog-highlight-card p {
  font-size: 15px;
  color: #666;
  margin: 0;
  line-height: 1.6;
}
```

```css
@media (max-width: 768px) { .blog-highlights { grid-template-columns: 1fr; } }
```

---

## 10. Comparison Table

```html
<div class="blog-table-wrap">
  <table class="blog-table">
    <thead>
      <tr>
        <th>Column 1</th>
        <th>Column 2</th>
        <th>Column 3</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Row label</strong></td>
        <td>Data</td>
        <td>Data</td>
      </tr>
    </tbody>
  </table>
</div>
```

```css
.blog-table-wrap {
  overflow-x: auto;
  margin: 30px 0;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.blog-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 16px;
  min-width: 600px;
}
.blog-table thead th {
  background: {{TABLE_HEADER}};
  color: #fff;
  padding: 14px 18px;
  text-align: left;
  font-weight: 600;
  font-size: 15px;
  white-space: nowrap;
}
.blog-table thead th:first-child { border-radius: 12px 0 0 0; }
.blog-table thead th:last-child { border-radius: 0 12px 0 0; }
.blog-table tbody td {
  padding: 13px 18px;
  border-bottom: 1px solid #f0ebe5;
  color: #444;
  vertical-align: top;
}
.blog-table tbody tr:nth-child(even) { background: {{TABLE_EVEN}}; }
.blog-table tbody tr:hover { background: {{TABLE_HOVER}}; }
.blog-table tbody tr:last-child td:first-child { border-radius: 0 0 0 12px; }
.blog-table tbody tr:last-child td:last-child { border-radius: 0 0 12px 0; }
```

```css
@media (max-width: 768px) { .blog-table { font-size: 14px; } }
```

---

## 11. Callout / Tip Box

```html
<div class="blog-callout">
  <div class="blog-callout-title">🍷 คำแนะนำจาก Sommelier</div>
  <p>Tip text here</p>
</div>
```

```css
.blog-callout {
  background: linear-gradient(135deg, {{CALLOUT_FROM}}, {{CALLOUT_TO}});
  border-left: 4px solid {{BRAND_PRIMARY}};
  border-radius: 0 12px 12px 0;
  padding: 24px 30px;
  margin: 30px 0;
}
.blog-callout-title {
  font-size: 18px;
  font-weight: 700;
  color: {{BRAND_PRIMARY}};
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.blog-callout p { margin-bottom: 8px; color: #444; }
```

```css
@media (max-width: 768px) { .blog-callout { padding: 20px; } }
```

---

## 12. Quote Block

```html
<div class="blog-quote">
  <p>Quote text here</p>
</div>
```

```css
.blog-quote {
  text-align: center;
  padding: 30px 40px;
  margin: 40px 0;
  position: relative;
}
.blog-quote::before {
  content: '\201C';
  font-size: 80px;
  color: {{BRAND_PRIMARY}};
  opacity: 0.2;
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  font-family: Georgia, serif;
}
.blog-quote p {
  font-size: 22px;
  font-style: italic;
  color: #555;
  line-height: 1.6;
  max-width: 700px;
  margin: 0 auto;
}
```

```css
@media (max-width: 768px) { .blog-quote p { font-size: 18px; } }
```

---

## 13. FAQ Accordion

Requires `<script>` block at the top of the output.

```html
<div class="blog-faq">
  <div class="blog-faq-item">
    <button class="blog-faq-question">Question here?</button>
    <div class="blog-faq-answer">
      <div class="blog-faq-answer-inner">Answer text here.</div>
    </div>
  </div>
  <!-- repeat -->
</div>
```

```css
.blog-faq { margin: 30px 0; }
.blog-faq-item {
  border: 1px solid #ede8e2;
  border-radius: 10px;
  margin-bottom: 12px;
  overflow: hidden;
  background: #fff;
}
.blog-faq-question {
  width: 100%;
  background: none;
  border: none;
  padding: 18px 24px;
  font-family: 'Kanit', 'Gotham', Arial, sans-serif;
  font-size: 17px;
  font-weight: 600;
  color: #333;
  text-align: left;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s ease;
}
.blog-faq-question:hover { background: #faf8f5; }
.blog-faq-question::after {
  content: '+';
  font-size: 22px;
  color: {{BRAND_PRIMARY}};
  font-weight: 700;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}
.blog-faq-item.active .blog-faq-question::after { content: '\2212'; }
.blog-faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
.blog-faq-answer-inner {
  padding: 0 24px 18px 24px;
  color: #555;
  font-size: 16px;
  line-height: 1.8;
}
```

```css
@media (max-width: 768px) {
  .blog-faq-question { font-size: 15px; padding: 14px 18px; }
}
```

**Required script** (include once at top of output if FAQ is used):
```html
<script>
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.blog-faq-question').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var item = this.parentElement;
      var answer = item.querySelector('.blog-faq-answer');
      var isActive = item.classList.contains('active');
      document.querySelectorAll('.blog-faq-item').forEach(function(el) {
        el.classList.remove('active');
        el.querySelector('.blog-faq-answer').style.maxHeight = null;
      });
      if (!isActive) {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
});
</script>
```

---

## 14. LINE CTA Block

```html
<div class="blog-container">
  <div class="blog-line-cta">
    <div class="blog-line-cta-text">
      <h3>Add LINE @wine-now</h3>
      <p>Description text here</p>
    </div>
    <a href="https://lin.ee/winenow" class="blog-line-btn">
      <svg viewBox="0 0 24 24"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
      Chat with us
    </a>
  </div>
</div>
```

```css
.blog-line-cta {
  background: linear-gradient(135deg, #f0f7ef, #e8f5e6);
  border-radius: 16px;
  padding: 36px 40px;
  margin: 40px 0;
  display: flex;
  align-items: center;
  gap: 30px;
  flex-wrap: wrap;
}
.blog-line-cta-text { flex: 1; min-width: 250px; }
.blog-line-cta-text h3 {
  color: #06C755;
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 8px 0;
}
.blog-line-cta-text p { color: #555; margin: 0; font-size: 16px; }
.blog-line-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #06C755;
  color: #fff;
  padding: 14px 32px;
  border-radius: 50px;
  text-decoration: none;
  font-weight: 600;
  font-size: 17px;
  transition: background 0.2s ease, transform 0.2s ease;
  box-shadow: 0 4px 15px rgba(6,199,85,0.3);
}
.blog-line-btn:hover { background: #05a647; transform: translateY(-2px); }
.blog-line-btn svg { width: 24px; height: 24px; fill: #fff; }
```

```css
@media (max-width: 768px) {
  .blog-line-cta { padding: 24px; flex-direction: column; text-align: center; }
}
```

---

## 15. CTA Button

```html
<div class="blog-cta">
  <a class="blog-btn" href="URL">Button Text</a>
</div>
```

```css
.blog-cta { text-align: center; padding: 40px 0; }
.blog-btn {
  background-color: {{BRAND_PRIMARY}};
  color: #fff;
  padding: 14px 36px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 17px;
  display: inline-block;
  transition: background-color 0.2s ease, transform 0.2s ease;
  box-shadow: 0 4px 15px {{BRAND_SHADOW}};
}
.blog-btn:hover { background-color: {{BRAND_HOVER}}; transform: translateY(-2px); }
.blog-btn-secondary {
  background-color: #000;
  color: #fff;
  padding: 12px 28px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 16px;
  display: inline-block;
  transition: background-color 0.2s ease;
}
.blog-btn-secondary:hover { background-color: #333; }
```

---

## 16. Related Articles

```html
<div class="blog-related">
  <div class="blog-container">
    <div class="blog-related-title">บทความที่เกี่ยวข้อง</div>
    <div class="blog-related-grid">
      <a href="URL" class="blog-related-card">
        <img src="IMAGE_URL" alt="Alt">
        <div class="blog-related-card-body">
          <div class="blog-related-card-tag">Category</div>
          <h4>Article Title</h4>
          <p>X min read</p>
        </div>
      </a>
      <!-- repeat 2 more -->
    </div>
  </div>
</div>
```

```css
.blog-related { padding: 40px 0; }
.blog-related-title {
  font-size: 24px;
  font-weight: 700;
  color: {{BRAND_PRIMARY}};
  margin-bottom: 24px;
  text-align: center;
}
.blog-related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}
.blog-related-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  text-decoration: none;
  color: inherit;
  display: block;
  background: #fff;
}
.blog-related-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}
.blog-related-card img { width: 100%; height: 180px; object-fit: cover; display: block; }
.blog-related-card-body { padding: 16px 20px; }
.blog-related-card-tag {
  font-size: 12px;
  color: {{BRAND_PRIMARY}};
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 6px;
}
.blog-related-card-body h4 {
  font-size: 17px;
  font-weight: 600;
  margin: 0 0 6px 0;
  color: #333;
  line-height: 1.4;
}
.blog-related-card-body p { font-size: 14px; color: #888; margin: 0; }
```

```css
@media (max-width: 768px) { .blog-related-grid { grid-template-columns: 1fr; } }
```

---

## 17. Region Header (Product Blogs)

```html
<div class="blog-region-header">
  <span class="blog-region-flag">🇫🇷</span>
  <h3>France</h3>
</div>
```

```css
.blog-region-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #eee;
}
.blog-region-flag { font-size: 32px; }
.blog-region-header h3 {
  color: {{BRAND_PRIMARY}};
  font-size: 24px;
  font-weight: 700;
  margin: 0;
}
```

```css
@media (max-width: 768px) { .blog-region-header h3 { font-size: 20px; } }
```

---

## 18. Product Widget Placeholder

In the final output, replace the placeholder text with the actual Magento widget shortcode. If the user hasn't provided SKUs yet, leave a clear comment.

```html
<!-- Replace with actual Magento widget shortcode -->
{{widget type="Magento\CatalogWidget\Block\Product\ProductsList" show_pager="0" products_count="10" template="product/widget/content/grid.phtml" sort_by="recommended" conditions_encoded="^[`1`:^[`type`:`Magento||CatalogWidget||Model||Rule||Condition||Combine`,`aggregator`:`all`,`value`:`1`,`new_child`:``^],`1--1`:^[`type`:`Magento||CatalogWidget||Model||Rule||Condition||Product`,`attribute`:`sku`,`operator`:`()`,`value`:`SKU1, SKU2, SKU3`^]^]"}}
```

---

## 19. Footer Note

```html
<div class="blog-container">
  <p class="blog-footer-note">Closing italic text here</p>
</div>
```

```css
.blog-footer-note {
  text-align: center;
  padding: 30px 20px;
  color: #777;
  font-size: 15px;
  font-style: italic;
  max-width: 700px;
  margin: 0 auto;
}
```
