# สรุป SEO/AEO 1 หน้า สำหรับทีม Dev/Magento — Wine-Now & LIQ9
อ้างอิงข้อมูลจริงจาก Google Search Console (1 มี.ค. – 31 พ.ค. 2026) + การตรวจ index จริงของ Google
อัปเดต: 2026-06-03

> หมายเหตุ: HTML ดิบของเว็บอ่านตรงไม่ได้เพราะ WAF (StackPath) บล็อก bot (ขึ้น 503) — ซึ่งตัวอาการนี้คือ 1 ในปัญหา (ข้อ P0-2)

---

## 🔴 P0 — ทำด่วน (มีตัวเลขยืนยันว่าเสีย traffic จริง)

**1. โดเมนซ้ำ (.com ↔ .asia) ทั้ง 2 แบรนด์ → แย่งอันดับกันเอง**
- LIQ9 หนักสุด: GSC ของ `th.liq9.com` มีหน้าที่ rank จริงแค่ **4 หน้า**, query ที่ได้คลิกมีแต่ชื่อแบรนด์
  - keyword จริง ไม่ติดเลย: "whisky thailand" = อันดับ **89**, "online liquor store" = 48, "buy gin online" = 54 (0 คลิก)
  - traffic ที่ควรได้ถูก `th.liq9.asia` (ไม่อยู่ใน GSC) ดูดไป
- Wine-Now ก็มี mirror `th.wine-now.asia` index ซ้ำเช่นกัน
- ✅ แก้: เลือก primary domain เดียว/แบรนด์ → 301 redirect โดเมนที่เหลือมาโดเมนหลัก (ดีที่สุด) หรืออย่างน้อยตั้ง cross-domain canonical

**2. WAF (StackPath) บล็อก Googlebot/AI bot เป็นบางครั้ง**
- พบบทความที่ Google index ไว้แต่ title กลายเป็น "StackPath" (หน้า challenge) แทนเนื้อหา → หน้านั้นอันดับตก
- ระบบตรวจสอบของเราก็โดน 503 เช่นกัน
- ✅ แก้: allowlist Googlebot, Bingbot และ AI crawlers (ดู robots.txt) ใน StackPath/WAF + verify ด้วย reverse-DNS

**3. คู่ TH/EN ไม่มี hreflang → ขึ้นผิดภาษา (ยืนยันด้วยตัวเลข)**
- หน้า EN `/blog/15-most-expensive-wine-in-the-world-en.html` = **145,980 impressions แต่ CTR แค่ 0.23%** (อันดับ 7.7) ขณะที่หน้า TH เวอร์ชันเดียวกัน rank แยกอีกหน้า
- ✅ แก้: ใส่ hreflang th ↔ en + x-default แบบ reciprocal ทุกคู่ slug `-th`/`-en`

**4. หน้า blog search ถูก index (thin/duplicate)**
- พบ `th.wine-now.com/blog/search/5.html` (หน้า search ว่าง) ถูก index
- ✅ แก้: `noindex` หน้า search ทั้งหมด + `Disallow: /blog/search/` (มีใน robots.txt ที่แนบ)

**5. คอนเทนต์ผิดแบรนด์**
- บทความวิสกี้ `jack-daniel-s-tennessee-whiskey` (54,089 impr) อยู่บนเว็บ **ไวน์** wine-now → ควรอยู่ LIQ9
- ✅ แก้: ย้าย/รวมคอนเทนต์ spirits ไป LIQ9, set 301

---

## 🟠 P1 — ภายใน 2–3 สัปดาห์
6. ตั้ง **sitemap.xml** ต่อโดเมนหลัก + submit GSC (ดูคู่มือไฟล์ `SITEMAP_SETUP_GUIDE_TH.md`)
7. วาง **robots.txt** ใหม่ทั้ง 2 เว็บ (ไฟล์แนบ) — บล็อก path ขยะ Magento + เปิดให้ AI crawlers
8. บล็อก URL ขยะของ Magento ที่ทำ duplicate: `?SID=`, sort/filter params (พบ `?SID=` ใน index แล้ว)
9. ตรวจ canonical ทุกหน้าให้ชี้ถูกโดเมน/ถูกหน้า

## 🟡 P1.5 — Quick wins (มีตัวเลขรองรับ ดันขึ้นหน้า 1 ได้เร็ว)
หน้าอันดับ 8–17 impression สูง — ปรับ title/เนื้อหา/internal link:
- `/blog/10-prestige-Italian-wine.html` (อันดับ 12.6, 13,160 impr)
- `/robert_mondavi` (อันดับ 11.2, 15,711 impr)
- `/blog/10-affordable-bordeaux-wine.html` (อันดับ 9.1, 10,298 impr)
- head term ไทยที่ยังต่ำ: "ไวน์" (อันดับ 5.8, 35,796 impr), "แชมเปญ" (อันดับ 6.1), "ไวน์แดง" (อันดับ 8.7)
- อัปเดต title ล้าสมัย: `top-10-best-selling-red-wine-of-2024`

## 🟢 P2 — ต่อเนื่อง
- หลังรวมโดเมน authority จะกลับมารวมที่เดียว = อันดับเด้งขึ้น
- Content freshness loop (อัปเดตบทความผูกปี/ราคา)
- รูปจริง + alt ไทย + WebP + lazy-load (ทีมเช็ค view-source เอง เพราะ WAF บล็อกเรา)
- E-E-A-T: หน้า author + ข้อมูลบริษัท/ใบอนุญาต (หมวดแอลกอฮอล์ = YMYL)
- JSON-LD: Article + FAQPage + BreadcrumbList ครบทุกหน้า

---

## สิ่งที่ยืนยันเองไม่ได้ (ทีมเช็ค view-source / GSC)
robots.txt จริง, hreflang/canonical tag จริง, sitemap.xml, HTML แต่ละบทความ — เพราะ WAF บล็อก IP ระบบตรวจ
