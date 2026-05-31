# 🔧 รายงานแก้ไข Technical SEO + AI/GEO สำหรับ Magento
## Wine Now (th.wine-now.com) & LIQ9 (th.liq9.com)
### สำหรับทีม Developer | อัปเดต: 31 พฤษภาคม 2026

---

## 📋 สารบัญ

1. [ภาพรวมและเป้าหมาย](#ภาพรวม)
2. [ส่วนที่ 1: แก้ Technical SEO ใน Magento](#magento-technical)
3. [ส่วนที่ 2: ทำให้ AI เข้าถึงข้อมูลได้ดี (GEO)](#geo)
4. [ส่วนที่ 3: Schema Markup (สำคัญมาก)](#schema)
5. [ส่วนที่ 4: Core Web Vitals / ความเร็ว](#speed)
6. [ลำดับความสำคัญในการแก้ (Priority)](#priority)
7. [Checklist สำหรับ Dev](#checklist)

---

<a name="ภาพรวม"></a>
## 🎯 ภาพรวมและเป้าหมาย

รายงานนี้แยกออกมาจากรายงาน SEO หลัก (`SEO_AUDIT_REPORT.html`) โดยเน้นเฉพาะ **สิ่งที่ทีม Dev ต้องแก้ในระบบ Magento** และการทำให้ **AI (ChatGPT, Google AI Overviews, Perplexity, Claude)** ดึงข้อมูลสินค้าของเราได้อย่างมีประสิทธิภาพ

### ปัญหาหลักที่ต้องแก้ (สรุป)
| ปัญหา | ผลกระทบ | ความเร่งด่วน |
|-------|---------|--------------|
| ไม่มี Product Schema (JSON-LD) | AI + Google ไม่เห็นราคา/รีวิว/สต็อก | 🔴 สูงสุด |
| Layered Navigation สร้าง URL ซ้ำมหาศาล | Crawl budget เสีย, duplicate content | 🔴 สูง |
| ไม่มีไฟล์ `llms.txt` | AI ไม่รู้ว่าจะอ่านอะไร | 🔴 สูง |
| robots.txt ไม่อนุญาต AI crawler | ChatGPT/Perplexity เข้าไม่ได้ | 🔴 สูง |
| Core Web Vitals ช้า (Magento หนัก) | อันดับตก, CTR ต่ำ | 🟡 กลาง |
| Canonical tag ตั้งค่าไม่ครบ | duplicate content | 🟡 กลาง |
| Title/Meta เป็น template ซ้ำกัน | CTR ต่ำ (4.26%) | 🟡 กลาง |

> **หมายเหตุ:** ข้อความอธิบายเป็นภาษาไทย แต่ code/config เป็นภาษาอังกฤษตามมาตรฐานการพัฒนา เพื่อให้ copy ไปใช้ได้เลย

---

<a name="magento-technical"></a>
## ⚙️ ส่วนที่ 1: แก้ Technical SEO ใน Magento

### 1.1 ตั้งค่า Canonical Tag ให้ครบ ⭐ สำคัญ

**ปัญหา:** Magento โดย default จะสร้าง URL ได้หลายแบบสำหรับสินค้าเดียวกัน เช่น
- `th.wine-now.com/robert-mondavi-cabernet.html`
- `th.wine-now.com/red-wine/robert-mondavi-cabernet.html`
- `th.wine-now.com/robert-mondavi-cabernet.html?color=red`

ทำให้ Google มองว่าเป็นเนื้อหาซ้ำ (duplicate content) อันดับเลยตก

**วิธีแก้ (Magento Admin):**
```
Stores → Configuration → Catalog → Catalog → Search Engine Optimization
- Use Canonical Link Meta Tag for Categories = Yes
- Use Canonical Link Meta Tag for Products = Yes
```

**ตรวจสอบใน HTML ว่าได้แบบนี้:**
```html
<link rel="canonical" href="https://th.wine-now.com/robert-mondavi-cabernet.html" />
```

---

### 1.2 ควบคุม Layered Navigation (Filter) ไม่ให้ index ⭐ สำคัญมาก

**ปัญหา:** หน้า filter เช่น `?price=500-1000&color=red&size=750ml` สร้าง URL ได้เป็นพันๆ แบบ Google จะ crawl URL พวกนี้จนหมด crawl budget แล้วไม่เหลือมา crawl หน้าสินค้าจริง

**วิธีแก้ที่ 1 — robots.txt (บล็อก parameter):**
```
# Block layered navigation parameters
Disallow: /*?price=
Disallow: /*?color=
Disallow: /*?size=
Disallow: /*?material=
Disallow: /*?*filter
Disallow: /*?p=
Disallow: /*?product_list_order=
Disallow: /*?product_list_dir=
Disallow: /*?product_list_limit=
```

**วิธีแก้ที่ 2 — เพิ่ม `noindex, follow` ที่หน้า filter:**

ถ้าใช้ extension เช่น **Amasty Improved Layered Navigation** หรือ **Mirasvit** ให้เปิด:
```
- Add "nofollow" to filter links = Yes
- Add "noindex, follow" robots meta to filtered pages = Yes
- Use canonical to main category page = Yes
```

ถ้าไม่มี extension ให้ dev เพิ่มใน layout ของหน้า catalog:
```php
// ใน Block/Plugin ตรวจว่า request มี filter parameter หรือไม่
if ($this->hasFilterParams()) {
    $this->pageConfig->setRobots('NOINDEX,FOLLOW');
    // set canonical กลับไปหน้า category หลัก
}
```

---

### 1.3 robots.txt ฉบับสมบูรณ์สำหรับ Magento + AI ⭐

**ตำแหน่งตั้งค่าใน Magento:**
```
Stores → Configuration → General → Design → Search Engine Robots
→ Edit custom instruction of robots.txt File
```

**robots.txt ที่แนะนำ (เต็ม):**
```
User-agent: *
# Magento system paths
Disallow: /index.php/
Disallow: /catalog/product_compare/
Disallow: /catalog/category/view/
Disallow: /catalog/product/view/
Disallow: /catalogsearch/
Disallow: /checkout/
Disallow: /customer/
Disallow: /sales/
Disallow: /wishlist/
Disallow: /*?SID=
Disallow: /*?___store=
Disallow: /*?___from_store=

# Layered navigation parameters
Disallow: /*?price=
Disallow: /*?color=
Disallow: /*?size=
Disallow: /*?p=
Disallow: /*?product_list_order=
Disallow: /*?product_list_dir=
Disallow: /*?product_list_limit=
Disallow: /*?cat=

# Allow important resources (สำคัญ! ห้ามบล็อก CSS/JS)
Allow: /media/
Allow: /static/
Allow: /pub/

# Sitemap
Sitemap: https://th.wine-now.com/sitemap.xml

# ===== AI Crawlers (ดูส่วนที่ 2) =====
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: CCBot
Allow: /
```

> ⚠️ **ระวัง:** อย่าบล็อก `/media/`, `/static/`, `/pub/` เพราะ Google ต้องโหลด CSS/JS เพื่อ render หน้า ถ้าบล็อกจะทำให้ mobile-friendly test fail

---

### 1.4 XML Sitemap ที่ถูกต้อง

**ปัญหา:** Sitemap ของ Magento โดย default มักใส่ URL ที่ไม่ควร index (เช่น out-of-stock, disabled products)

**วิธีแก้ (Magento Admin):**
```
Stores → Configuration → Catalog → XML Sitemap
- Categories Options → Frequency = daily, Priority = 0.5
- Products Options → Frequency = daily, Priority = 1.0
- Add product images to sitemap = Yes  ⭐ (สำคัญสำหรับ Google Images + AI)
- CMS Pages Options → Frequency = monthly

Generation Settings:
- Enabled = Yes
- Start Time = ตี 3-4 (ช่วงคนน้อย)
- Frequency = Daily
```

**เพิ่ม sitemap ใน Google Search Console ทั้ง 2 เว็บ:**
```
https://th.wine-now.com/sitemap.xml
https://th.liq9.com/sitemap.xml
```

**สิ่งที่ต้องตรวจ:**
- สินค้า out-of-stock / disabled ต้องไม่อยู่ใน sitemap
- ทุก URL ใน sitemap ต้องตอบ HTTP 200 (ไม่ใช่ 301/404)
- ใส่ `<image:image>` tag สำหรับรูปสินค้า

---

### 1.5 Title & Meta Description ไม่ให้ซ้ำกัน

**ปัญหา:** Magento ใช้ template เดียวทำให้ title ซ้ำกันหมด เช่น ทุกหน้าขึ้น "Wine Now" เฉยๆ → CTR ต่ำ (ปัจจุบัน 4.26%)

**วิธีแก้ — ตั้ง template ที่ category/product level:**
```
Catalog → Categories → [เลือก category] → Search Engine Optimization
- Meta Title: {ชื่อหมวด} ราคาดีที่สุด | จัดส่งทั่วไทย | Wine Now
- Meta Description: ช้อป{ชื่อหมวด}ของแท้ ราคา ฿XXX-฿X,XXX จัดส่งฟรีเมื่อสั่ง ฿1,000+

Catalog → Products → [สินค้า] → Search Engine Optimization
- Meta Title: {ชื่อสินค้า} {ปริมาตร} ราคา ฿XXX | Wine Now
```

**ตั้งค่า global template (ถ้าต้องการ auto-generate):**
```
Stores → Configuration → Catalog → Catalog → Product Fields Auto-Generation
- Mask for Meta Title: {{name}} ราคา | Wine Now & LIQ9
- Mask for Meta Description: ซื้อ {{name}} ของแท้ ราคาดี จัดส่งไว {{short_description}}
```

> 💡 หน้าที่ traffic สูง (homepage, expensive wine, champagne, robert mondavi) ให้เขียน title/meta เองทุกหน้า ห้ามใช้ template — ดูสูตรในไฟล์ `QUICK_WINS_THIS_WEEK.md`

---

### 1.6 จัดการ Pagination (หน้า 2, 3, ...)

**ปัญหา:** `?p=2`, `?p=3` สร้าง duplicate content

**วิธีแก้:**
- ใส่ `rel="canonical"` ของแต่ละหน้า pagination ชี้กลับมาที่ตัวมันเอง (ไม่ใช่หน้า 1) — Google ปัจจุบันแนะนำแบบนี้
- หรือใช้ "View All" page เป็น canonical ถ้าโหลดไหว
- ใส่ `<title>` ที่บอกหน้า เช่น "Red Wine - หน้า 2 | Wine Now" เพื่อไม่ให้ซ้ำ

---

### 1.7 แก้ URL ให้สะอาด (URL Rewrites)

**วิธีแก้ (Magento Admin):**
```
Stores → Configuration → General → Web → Search Engine Optimization
- Use Web Server Rewrites = Yes   (ตัด index.php ออก)

Stores → Configuration → Catalog → Catalog → Search Engine Optimization
- Product URL Suffix = .html (หรือเอาออกให้ว่าง — แต่ห้ามเปลี่ยนบ่อย)
- Category URL Suffix = (เว้นว่าง แนะนำ)
- Use Categories Path for Product URLs = No  ⭐ (สำคัญ! ป้องกัน URL ซ้ำ)
- Create Permanent Redirect for URLs if URL Key Changed = Yes
```

> ⚠️ ถ้าเปลี่ยน URL suffix ต้องทำ 301 redirect ทุก URL เก่า ไม่งั้นอันดับหายหมด

---

<a name="geo"></a>
## 🤖 ส่วนที่ 2: ทำให้ AI เข้าถึงข้อมูลได้ดี (GEO - Generative Engine Optimization)

> **GEO คืออะไร?** การทำให้ AI search (ChatGPT, Google AI Overviews, Perplexity, Claude, Copilot) ดึงข้อมูลและ **อ้างอิงเว็บเรา** เมื่อผู้ใช้ถามเกี่ยวกับไวน์ นี่คือ traffic ช่องทางใหม่ที่กำลังโตเร็วมาก

### 2.1 สร้างไฟล์ `llms.txt` ⭐ สำคัญ

**llms.txt คืออะไร:** ไฟล์มาตรฐานใหม่ (เหมือน robots.txt แต่สำหรับ AI) ที่บอก AI ว่าเว็บเรามีอะไร อ่านตรงไหน

**วิธีทำ:** สร้างไฟล์ที่ `https://th.wine-now.com/llms.txt`

```markdown
# Wine Now (th.wine-now.com)

> ร้านไวน์และเครื่องดื่มแอลกอฮอล์ออนไลน์ชั้นนำในประเทศไทย จำหน่ายไวน์แดง ไวน์ขาว
> แชมเปญ สปาร์กลิงไวน์ และไวน์ราคาพิเศษ พร้อมคำแนะนำจากผู้เชี่ยวชาญ จัดส่งทั่วไทย

## สินค้าหลัก (Product Categories)
- [ไวน์แดง (Red Wine)](https://th.wine-now.com/red-wine): ไวน์แดงจาก Bordeaux, Napa, Tuscany
- [แชมเปญ (Champagne)](https://th.wine-now.com/champagne): Moët, Dom Pérignon, Veuve Clicquot
- [ไวน์ราคาพิเศษ (Expensive Wine)](https://th.wine-now.com/expensive-wine): ไวน์หายาก ราคา ฿500-฿100,000+
- [สปาร์กลิงไวน์ (Sparkling Wine)](https://th.wine-now.com/sparkling-wine)

## คู่มือและความรู้ (Guides)
- [วิธีเลือกไวน์](https://th.wine-now.com/wine-guide)
- [การจับคู่ไวน์กับอาหาร (Wine Pairing)](https://th.wine-now.com/wine-pairing)
- [Tasting Notes](https://th.wine-now.com/tasting-notes)

## ข้อมูลร้าน
- จัดส่งฟรีเมื่อสั่งซื้อ ฿1,000 ขึ้นไป
- จัดส่งทั่วประเทศไทย / ส่งด่วนในกรุงเทพฯ
- สินค้าของแท้ 100% มีผู้เชี่ยวชาญ (sommelier) แนะนำ
- ติดต่อ: [Contact](https://th.wine-now.com/contact)
```

ทำแบบเดียวกันสำหรับ `https://th.liq9.com/llms.txt`

> 💡 ใน Magento ให้สร้างเป็น static file ใน `pub/` หรือใช้ CMS page + URL rewrite ไปที่ `/llms.txt`

---

### 2.2 อนุญาต AI Crawlers ใน robots.txt ⭐

ดู section 1.3 ด้านบน — เพิ่ม `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `OAI-SearchBot` เป็น `Allow: /`

**AI Crawler ที่สำคัญและควรอนุญาต:**
| Bot | เจ้าของ | ทำหน้าที่ |
|-----|---------|-----------|
| `GPTBot` | OpenAI | เก็บข้อมูลเทรน + ChatGPT search |
| `OAI-SearchBot` | OpenAI | ChatGPT search results |
| `ChatGPT-User` | OpenAI | เมื่อ user ถามแบบ real-time |
| `ClaudeBot` | Anthropic | Claude |
| `PerplexityBot` | Perplexity | Perplexity AI search |
| `Google-Extended` | Google | Gemini + AI Overviews |
| `Applebot-Extended` | Apple | Apple Intelligence |

> ⚠️ ถ้าบล็อก bot พวกนี้ = เว็บเราจะ **ไม่ปรากฏ** ใน AI search เลย ซึ่งเป็นช่องทาง traffic ที่กำลังโต

---

### 2.3 เนื้อหาต้องเป็น Server-Side Rendered (SSR) ⭐

**ปัญหา:** AI crawler ส่วนใหญ่ **ไม่ run JavaScript** ถ้าเนื้อหา (ราคา, รายละเอียดสินค้า) โหลดด้วย JS/AJAX → AI มองไม่เห็น

**ตรวจสอบ:** ปิด JavaScript ใน browser แล้วเปิดหน้าสินค้า — ถ้าเห็นราคา/รายละเอียด = ผ่าน, ถ้าหน้าว่าง = ต้องแก้

**วิธีแก้ใน Magento:**
- Magento (Luma theme) เป็น SSR อยู่แล้ว ✅ — แต่ถ้าใช้ **PWA/Headless (Venia)** ต้องทำ SSR/prerender เพิ่ม
- ราคาและ stock status ต้อง render ใน HTML ตั้งแต่แรก ไม่ใช่โหลดทีหลังด้วย AJAX
- ถ้ามีส่วนที่ใช้ AJAX (เช่น related products) ให้ใส่ข้อมูลหลัก (ราคา, ชื่อ, รายละเอียด) ใน HTML เลย

---

### 2.4 โครงสร้างเนื้อหาที่ AI ชอบ (Citability)

AI ชอบอ้างอิงเนื้อหาที่ **ตอบคำถามตรงๆ เป็นย่อหน้าสั้น** ลองปรับ:

**✅ ดี (AI อ้างอิงง่าย):**
```html
<h2>แชมเปญต่างจากสปาร์กลิงไวน์อย่างไร?</h2>
<p>แชมเปญ (Champagne) คือสปาร์กลิงไวน์ที่ผลิตเฉพาะในแคว้นช็องปาญ
ประเทศฝรั่งเศส ด้วยกรรมวิธี méthode traditionnelle เท่านั้น
ส่วนสปาร์กลิงไวน์ทั่วไปผลิตที่ไหนก็ได้ ราคาเริ่มต้นที่ ฿400</p>
```

**หลักการเขียนให้ AI อ้างอิง:**
1. ใช้ heading เป็นคำถาม (H2/H3) — ตรงกับที่คนถาม AI
2. ตอบใน 2-3 ประโยคแรกทันที (ไม่อ้อมค้อม)
3. ใส่ตัวเลข/ข้อเท็จจริงที่ชัดเจน (ราคา, ปี, เปอร์เซ็นต์)
4. ใช้ bullet list และ table สำหรับเปรียบเทียบ
5. มี FAQ section ในทุกหน้าสำคัญ

---

### 2.5 E-E-A-T Signals (ความน่าเชื่อถือสำหรับ AI)

AI ให้น้ำหนักกับเว็บที่มีความเชี่ยวชาญชัดเจน:
- ใส่ชื่อ **sommelier/ผู้เชี่ยวชาญ** ที่เขียน tasting notes (พร้อม credential เช่น WSET, Certified Sommelier)
- มีหน้า About ที่บอกประสบการณ์ร้าน
- ใส่วันที่อัปเดตเนื้อหา (`dateModified` ใน schema)
- มีรีวิวจริงจากลูกค้า (พร้อม Review schema)

---

<a name="schema"></a>
## 🏷️ ส่วนที่ 3: Schema Markup (JSON-LD) — สำคัญที่สุดสำหรับทั้ง Google + AI

> นี่คือสิ่งที่จะให้ผลลัพธ์เร็วและแรงที่สุด ทั้งสำหรับ rich results ใน Google และให้ AI เข้าใจสินค้า

### 3.1 Product Schema (ทุกหน้าสินค้า) ⭐⭐⭐

**ใส่ใน `<head>` หรือท้าย `<body>` ของหน้าสินค้า:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "Robert Mondavi Cabernet Sauvignon 2019 750ml",
  "image": [
    "https://th.wine-now.com/media/catalog/product/r/m/robert-mondavi.jpg"
  ],
  "description": "ไวน์แดง Cabernet Sauvignon จาก Napa Valley รสชาตินุ่มนวล กลมกล่อม กลิ่นผลไม้สุก",
  "brand": {
    "@type": "Brand",
    "name": "Robert Mondavi"
  },
  "sku": "RM-CAB-2019",
  "gtin13": "0086003000123",
  "offers": {
    "@type": "Offer",
    "url": "https://th.wine-now.com/robert-mondavi-cabernet.html",
    "priceCurrency": "THB",
    "price": "850",
    "priceValidUntil": "2026-12-31",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/NewCondition",
    "seller": {
      "@type": "Organization",
      "name": "Wine Now"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.7",
    "reviewCount": "24"
  }
}
</script>
```

**วิธีทำใน Magento:**
- **ตัวเลือก A (แนะนำ):** ติดตั้ง extension เช่น **Magefan Rich Snippets**, **Amasty SEO Toolkit**, หรือ **MageWorx SEO Suite** — generate schema อัตโนมัติทุกสินค้า
- **ตัวเลือก B:** Dev เขียน template ใน `view/frontend/templates/product/view/` ดึงค่าจาก product object:
```php
// ใน .phtml template
$product = $block->getProduct();
$price = $product->getFinalPrice();
$stock = $product->isAvailable() ? 'InStock' : 'OutOfStock';
// render JSON-LD ด้วยค่าจริง
```

> ⚠️ Magento native มี structured data แค่บางส่วน (และมักไม่ครบ/ไม่ valid) — แนะนำใช้ extension ดีกว่าเขียนเอง

---

### 3.2 BreadcrumbList Schema (ทุกหน้า)
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "หน้าแรก", "item": "https://th.wine-now.com/"},
    {"@type": "ListItem", "position": 2, "name": "ไวน์แดง", "item": "https://th.wine-now.com/red-wine"},
    {"@type": "ListItem", "position": 3, "name": "Robert Mondavi Cabernet"}
  ]
}
</script>
```

---

### 3.3 FAQPage Schema (หน้า category + บทความ) ⭐⭐
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Prosecco คืออะไร?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Prosecco คือสปาร์กลิงไวน์อิตาลีที่ทำจากองุ่น Glera รสชาติเบาและหวานกว่าแชมเปญ ราคาเริ่มต้น ฿400"
      }
    },
    {
      "@type": "Question",
      "name": "ไวน์ที่แพงที่สุดในโลกราคาเท่าไหร่?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "ไวน์ที่แพงที่สุดในโลกอาจมีราคาหลายล้านบาทต่อขวด เช่น Romanée-Conti ที่ Wine Now เรามีไวน์ระดับพรีเมียมเริ่มต้น ฿800 ถึง ฿100,000+"
      }
    }
  ]
}
</script>
```

> 💡 FAQ schema ช่วยทั้ง 2 อย่าง: ได้ rich result ใน Google + AI ดึงไปตอบใน AI Overviews/ChatGPT ได้ตรงๆ — ตอบโจทย์ keyword "prosecco คือ", "most expensive wine" ที่เรามี impression สูงแต่ click ต่ำ

---

### 3.4 Organization Schema (หน้าแรก)
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  "name": "Wine Now",
  "url": "https://th.wine-now.com",
  "logo": "https://th.wine-now.com/media/logo/wine-now.png",
  "description": "ร้านไวน์ออนไลน์ชั้นนำในประเทศไทย",
  "sameAs": [
    "https://www.facebook.com/winenow",
    "https://www.instagram.com/winenow"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+66-XX-XXX-XXXX",
    "contactType": "customer service",
    "areaServed": "TH",
    "availableLanguage": ["Thai", "English"]
  }
}
</script>
```

### 3.5 ตรวจสอบ Schema
หลังทำเสร็จ ทดสอบทุกหน้าที่:
- https://validator.schema.org
- https://search.google.com/test/rich-results

---

<a name="speed"></a>
## ⚡ ส่วนที่ 4: Core Web Vitals / ความเร็ว (Magento หนักโดยธรรมชาติ)

> Magento เป็นระบบที่หนัก ถ้าไม่ optimize จะช้ามาก ทำให้อันดับตกและ AI crawler timeout

### 4.1 เปิด Full Page Cache + Varnish ⭐
```
Stores → Configuration → Advanced → System → Full Page Cache
- Caching Application = Varnish Cache (recommended)
```
ตั้ง Varnish บน server (ไม่ใช่ built-in cache) — ลด TTFB จากวินาทีเหลือ < 200ms

### 4.2 Production Mode + รวม/ย่อ JS/CSS
```bash
# ตั้งเป็น production mode
php bin/magento deploy:mode:set production

# Admin: Stores → Configuration → Advanced → Developer
```
```
JavaScript Settings:
- Merge JavaScript Files = Yes
- Minify JavaScript Files = Yes
- Enable JavaScript Bundling = No (ใช้ baler แทน ดีกว่า)

CSS Settings:
- Merge CSS Files = Yes
- Minify CSS Files = Yes

Template Settings:
- Minify Html = Yes
```

### 4.3 Optimize รูปภาพ (สำคัญสำหรับร้านไวน์ที่มีรูปขวดเยอะ)
- แปลงรูปเป็น **WebP** (ลดขนาด 25-35%)
- ใช้ extension เช่น **Mageplaza WebP** หรือ CDN ที่แปลง on-the-fly
- ใส่ `loading="lazy"` กับรูปที่อยู่ใต้ fold
- ใส่ `width`/`height` attribute ป้องกัน CLS (layout shift)
- ใส่ `alt` text ทุกรูป (ดีต่อ SEO + AI + accessibility)

### 4.4 ใช้ CDN
- ใช้ CDN (Cloudflare / Fastly) สำหรับ static + media files
- ลด latency สำหรับผู้ใช้ + crawler

### 4.5 Database & Indexing
```bash
# ตั้ง indexer เป็น schedule (cron) ไม่ใช่ on save
php bin/magento indexer:set-mode schedule

# เปิด cron ให้ทำงานสม่ำเสมอ
```

### 4.6 เป้าหมาย Core Web Vitals
| Metric | เป้าหมาย | ความหมาย |
|--------|----------|----------|
| LCP | < 2.5s | โหลดเนื้อหาหลักเร็ว |
| INP | < 200ms | ตอบสนองการคลิกเร็ว |
| CLS | < 0.1 | หน้าไม่กระตุก |
| TTFB | < 200ms | server ตอบเร็ว (Varnish ช่วย) |

**ทดสอบที่:** https://pagespeed.web.dev (ใส่ URL ทั้ง 2 เว็บ)

---

<a name="priority"></a>
## 🎯 ลำดับความสำคัญในการแก้ (Priority)

### 🔴 Phase 1 — ทำทันที (สัปดาห์นี้, ผลเร็ว)
| งาน | เวลา | ผลกระทบ |
|-----|------|---------|
| 1. เพิ่ม AI crawlers ใน robots.txt | 30 นาที | AI เข้าถึงได้ |
| 2. สร้าง llms.txt ทั้ง 2 เว็บ | 1-2 ชม. | AI เข้าใจเว็บ |
| 3. ติดตั้ง extension Product Schema | 2-3 ชม. | Google + AI เห็นราคา/รีวิว |
| 4. เปิด Canonical tag (product + category) | 15 นาที | ลด duplicate |
| 5. บล็อก layered nav params ใน robots.txt | 30 นาที | ประหยัด crawl budget |

### 🟡 Phase 2 — ภายใน 2-4 สัปดาห์
| งาน | เวลา |
|-----|------|
| 6. เพิ่ม FAQ schema หน้าสำคัญ | 3-4 ชม. |
| 7. เพิ่ม BreadcrumbList + Organization schema | 2 ชม. |
| 8. เปิด Varnish + Production mode | 1 วัน |
| 9. แปลงรูปเป็น WebP + lazy load | 1-2 วัน |
| 10. เขียน Title/Meta หน้า traffic สูงเอง | 4 ชม. |

### 🟢 Phase 3 — ภายใน 1-3 เดือน
| งาน |
|-----|
| 11. ตรวจสอบ SSR ทุกหน้าสินค้า (ปิด JS test) |
| 12. ปรับโครงสร้างเนื้อหาให้ AI อ้างอิงง่าย |
| 13. เพิ่ม E-E-A-T (sommelier credentials, author) |
| 14. Optimize Core Web Vitals ให้ผ่านทุก metric |
| 15. ตั้ง hreflang ถ้ามีหลายภาษา (th/en) |

---

<a name="checklist"></a>
## ✅ Checklist สำหรับ Dev

### robots.txt & Crawling
- [ ] เพิ่ม AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended ฯลฯ)
- [ ] บล็อก layered navigation parameters
- [ ] บล็อก Magento system paths (/checkout/, /customer/ ฯลฯ)
- [ ] อนุญาต /media/, /static/, /pub/ (ห้ามบล็อก!)
- [ ] ใส่ Sitemap URL

### llms.txt & AI
- [ ] สร้าง /llms.txt สำหรับ wine-now
- [ ] สร้าง /llms.txt สำหรับ liq9
- [ ] ทดสอบปิด JavaScript แล้วยังเห็นราคา/รายละเอียดสินค้า

### Schema (JSON-LD)
- [ ] Product schema ทุกหน้าสินค้า (มี price, availability, rating)
- [ ] BreadcrumbList ทุกหน้า
- [ ] FAQPage หน้า category + บทความ
- [ ] Organization schema หน้าแรก
- [ ] ทดสอบที่ validator.schema.org + Rich Results Test

### Magento Config
- [ ] Canonical tag = Yes (product + category)
- [ ] Use Categories Path for Product URLs = No
- [ ] Web Server Rewrites = Yes
- [ ] XML Sitemap: add images = Yes, exclude out-of-stock
- [ ] Submit sitemap ใน Google Search Console ทั้ง 2 เว็บ

### Performance
- [ ] Production mode
- [ ] Varnish Full Page Cache
- [ ] Merge + Minify JS/CSS/HTML
- [ ] WebP images + lazy loading
- [ ] width/height attribute ทุกรูป (กัน CLS)
- [ ] CDN สำหรับ static/media
- [ ] Indexer = schedule mode
- [ ] PageSpeed score > 80 (mobile)

### Content (สำหรับทีม content + dev ร่วมกัน)
- [ ] Title/Meta หน้า traffic สูงไม่ซ้ำกัน
- [ ] alt text ทุกรูปสินค้า
- [ ] FAQ section ในหน้าสำคัญ
- [ ] dateModified ในเนื้อหา/บทความ

---

## 📞 เครื่องมือทดสอบ (ฟรีทั้งหมด)

| เครื่องมือ | ใช้ทำอะไร | URL |
|-----------|-----------|-----|
| Rich Results Test | ทดสอบ schema | search.google.com/test/rich-results |
| Schema Validator | ตรวจ JSON-LD | validator.schema.org |
| PageSpeed Insights | Core Web Vitals | pagespeed.web.dev |
| Google Search Console | ดู index, CTR, error | search.google.com/search-console |
| Mobile-Friendly Test | ทดสอบมือถือ | search.google.com/test/mobile-friendly |
| robots.txt Tester | ทดสอบ robots | ใน GSC |

---

## 🎓 สรุปสำหรับทีม Dev

**3 สิ่งที่ให้ผลเร็วที่สุด ทำก่อนเลย:**
1. **Product Schema (JSON-LD)** → Google โชว์ราคา/ดาว/สต็อก + AI เข้าใจสินค้า → CTR +25-30%
2. **llms.txt + เปิด AI crawlers** → เว็บเราเริ่มปรากฏใน ChatGPT/Perplexity/AI Overviews
3. **บล็อก layered nav + เปิด canonical** → Google เลิกเสีย crawl budget มา crawl หน้าจริง

**หลักคิด:** ทำให้ทั้ง **Google bot** และ **AI bot** เข้าถึงเนื้อหาได้ง่าย เข้าใจสินค้าได้ครบ (ราคา/สต็อก/รีวิว) และโหลดเร็ว = ได้ทั้ง traffic จาก search ปกติ และ traffic ใหม่จาก AI search

---

*รายงานจัดทำ: 31 พฤษภาคม 2026*
*ใช้คู่กับ: SEO_AUDIT_REPORT.html, QUICK_WINS_THIS_WEEK.md, ACTION_PLAN_IMPLEMENTATION.md*
*แพลตฟอร์ม: Magento | เว็บไซต์: th.wine-now.com, th.liq9.com*
