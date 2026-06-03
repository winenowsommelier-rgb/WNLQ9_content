# คู่มือตั้งค่า sitemap.xml (Magento 2) + ส่ง Google — Wine-Now & LIQ9
อัปเดต: 2026-06-03

ทำเหมือนกันทั้ง 2 เว็บ (`th.wine-now.com` และ `th.liq9.com`) แยกของใครของมัน

---

## ขั้นที่ 1 — ตั้งค่า XML Sitemap (Admin Config)
**Stores → Configuration → Catalog → XML Sitemap**
ตั้งค่าแต่ละกลุ่ม (Frequency / Priority แนะนำ):

| กลุ่ม | Frequency | Priority |
|---|---|---|
| Categories Options | weekly | 0.5 |
| Products Options | daily | 0.8 (ตั้ง "Add Images into Sitemap" = Base Only เพื่อช่วย Google Images) |
| CMS Pages Options | weekly | 0.5 |

- **Generation Settings:** Enabled = Yes, Start Time ตั้งช่วงดึก, Frequency = Daily
- **Sitemap File Limits:** Max URLs = 50,000 / Max File Size = 50MB (Magento จะแตกเป็น sitemap index อัตโนมัติถ้าเกิน)
- **Search Engine Submission Settings:** Enable Submission to Robots.txt = **Yes** (จะเติม `Sitemap:` ใน robots.txt ให้)

## ขั้นที่ 2 — สร้างไฟล์ sitemap
**Marketing → SEO & Search → Site Map → Add Sitemap**
- Filename: `sitemap.xml`
- Path: `/`  (เพื่อให้ได้ URL `https://th.wine-now.com/sitemap.xml`)
- กด **Save & Generate**
- ต้องมี **cron ทำงาน** (`bin/magento cron:install` / ตรวจ `crontab -l`) ไม่งั้น sitemap จะไม่อัปเดตอัตโนมัติ

## ขั้นที่ 3 — รวม Blog เข้า sitemap
บล็อกใช้ extension (Magefan / Mirasvit — สังเกตจาก URL `/blog/<slug>.html`)
- **Magefan Blog:** Stores → Configuration → Magefan Extensions → Blog → ตรวจว่า blog posts/category อยู่ใน sitemap (Magefan เพิ่มให้ใน sitemap หลักอัตโนมัติเมื่อเปิดใช้งาน)
- **Mirasvit Blog:** มี sitemap แยก — เพิ่มเข้า sitemap index หรือ submit `/<blog>/sitemap.xml` เพิ่ม
- ✅ เป้าหมาย: บทความ `/blog/*.html` ทุกอันต้องอยู่ใน sitemap

## ขั้นที่ 4 — ส่งเข้า Google Search Console
- เปิด property ของแต่ละโดเมน (มีอยู่แล้ว: `th.wine-now.com`, `th.liq9.com`)
- **Indexing → Sitemaps →** ใส่ `sitemap.xml` → Submit
- (Bing Webmaster Tools ก็ submit ตัวเดียวกัน)

## ขั้นที่ 5 — Bing / IndexNow (ช่วย AEO/Copilot index เร็ว)
- เปิด **IndexNow** (Magento มี extension / Bing plugin) เพื่อ ping เมื่อมีหน้าใหม่/อัปเดต → Bing & Copilot เห็นเร็วขึ้น

---

## ⚠️ จุดสำคัญเชื่อมกับปัญหา P0
1. **โดเมนซ้ำ:** หลังตัดสินใจ primary domain แล้ว ให้ submit sitemap **เฉพาะโดเมนหลัก** เท่านั้น ส่วน `.asia` ทำ 301 redirect (อย่า submit sitemap ของ .asia — จะยิ่งตอกย้ำ duplicate)
   - ระหว่าง migrate: เปิด robots.txt ของ .asia ให้ crawl ได้ (อย่าบล็อก) เพื่อให้ Google เก็บ 301 ครบ
2. **WAF (StackPath):** ต้อง allowlist Googlebot/Bingbot/AI bots ไม่งั้น crawler ดึง sitemap/หน้าไม่ได้ (ขึ้น 503) — sitemap ดีแค่ไหนก็ไร้ผล
3. **hreflang ใน sitemap (ทางเลือก):** ถ้าแก้ `<head>` ทีละหน้ายาก ใส่ `<xhtml:link rel="alternate" hreflang="...">` ใน sitemap แทนได้ — มักง่ายกว่าบน Magento สำหรับคู่ TH/EN

## ตัวอย่างหน้าตา sitemap index ที่ถูกต้อง
```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://th.wine-now.com/sitemap.xml-1.xml</loc></sitemap>
  <sitemap><loc>https://th.wine-now.com/sitemap.xml-2.xml</loc></sitemap>
</sitemapindex>
```

## ตรวจหลังทำเสร็จ
- เปิด `https://th.wine-now.com/sitemap.xml` ตรง ๆ ต้องเห็น XML (ไม่ใช่ 404/StackPath)
- GSC → Sitemaps → status = "Success", discovered URLs ใกล้เคียงจำนวนหน้าจริง
- GSC → Pages (Indexing) → ดูว่าจำนวน indexed เพิ่มขึ้น และไม่มี "Crawled - currently not indexed" เยอะผิดปกติ
