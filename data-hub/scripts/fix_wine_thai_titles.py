#!/usr/bin/env python3
"""
Patch the wine-now Thai titles in wine-now-topic-library.csv.

Background: the original wine-now library was bulk-generated with machine-translated
Thai titles that are often grammatically wrong or semantically off (e.g. "Tannins"
→ "เทวิน", and "ขนาดของไวน์" = "wine size" instead of wine tannins). This script
replaces every Thai title with a natural, accurate Thai version, keeping the rest
of each row untouched.

Matching key: Primary Keyword (unique per row) — not row order, since the CSV
is now sorted by Priority Score.

Thai titles follow the conventions of the successfully-produced Wine-Now articles:
- Mix of natural Thai and English loan terms (Tannin, Acidity, Decant, etc.)
- Question or benefit-driven phrasing where natural
- Accurate translation of the English concept — no garbled back-translations
"""
import csv, os, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC = os.path.join(ROOT, "wine-now-topic-library.csv")
TMP = SRC + ".tmp"

# Map: primary_keyword (lowercase) -> correct Thai title
# Source: produced article titles where available; fresh writes for backlog.
THAI_TITLES = {
    # === Produced articles — title taken from actual HTML (source of truth) ===
    "wine tannins":
        "Tannin คืออะไร และทำไมไวน์บางขวดทำให้ฝาดในปาก",
    "wine acidity":
        "Acidity ในไวน์: ทำไมความเปรี้ยวคือสัญญาณที่ดี (และจับคู่อาหารไทยได้ดี)",
    "wine label terms":
        "อ่านฉลากไวน์: Old World vs New World ต่างกันยังไง",
    "natural wine":
        "Natural / Organic / Biodynamic: 3 คำที่คนสับสนที่สุดในร้านไวน์",
    "wine storage":
        "เก็บไวน์ในคอนโด: วิธีให้ไวน์อยู่รอดในเมืองร้อน",
    "wine tourism thailand":
        "Wine Tourism เขาใหญ่: สิ่งที่นักท่องเที่ยวส่วนใหญ่ยังไม่รู้",
    # Net-new published (from actual article H1)
    "most expensive wine":
        "ไวน์แพงที่สุดในโลก 2026: 20 อันดับ และขวดที่ดื่มแล้วใกล้เคียงในงบจริง",
    "white wine for summer":
        "ไวน์ขาวสำหรับงานเลี้ยงฤดูร้อน: เลือกสไตล์ไหน เสิร์ฟกี่องศา จัดปาร์ตี้ยังไง",
    "wine excise tax thailand 2026":
        "ทำไมไวน์/เหล้าขึ้นราคาปี 2026: เข้าใจภาษีสรรพสามิตใหม่ และขวดที่ยังคุ้ม",
    "pinot noir":
        "Pinot Noir 101: ไวน์แดงเบาที่ใครๆ ก็รัก (รสชาติ–แหล่ง–คู่อาหาร)",
    "cabernet sauvignon":
        "Cabernet Sauvignon 101: รสชาติ แหล่งผลิต และขวดที่ดีที่สุดในแต่ละงบ",

    # === Backlog — fresh Thai titles ===
    # Education / Explorer
    "wine buying guide for beginners":
        "ไวน์ 101: คู่มือฉบับสมบูรณ์สำหรับผู้เริ่มต้นเลือกและดื่มไวน์",
    "red wine vs white wine":
        "ไวน์แดง vs ไวน์ขาว: ความแตกต่างและวิธีเลือกให้ถูกโอกาส",
    "wine body":
        "บอดี้ไวน์: ความแตกต่างระหว่าง Light, Medium และ Full-Bodied",
    "wine regions":
        "ภูมิศาสตร์ไวน์โลก: บอร์โดซ์ เบอร์กันดี และแหล่งผลิตที่คุณต้องรู้จัก",
    "Bordeaux wine":
        "ไวน์บอร์โดซ์: ทำไมถึงสำคัญ และผู้ผลิตที่คุณต้องลองชิม",
    "Burgundy wine":
        "ไวน์เบอร์กันดี: หัวใจของไวน์ฝรั่งเศส เข้าใจง่ายใน 5 นาที",
    "Champagne sparkling wine":
        "ชาเปญ vs ไวน์สปาร์กลิง: อะไรคือความแตกต่างที่แท้จริง",
    "wine quality assessment":
        "ไวน์เต็มตัวไม่ได้แปลว่าดีกว่า: ทำความเข้าใจคุณภาพไวน์อย่างถูกต้อง",
    "best wine regions in the world":
        "แหล่งผลิตไวน์ที่ดีที่สุดในโลก: ทัวร์จากฝรั่งเศสถึงนิวซีแลนด์",
    "Napa Valley 2023 vintage":
        "Napa Valley 2023: วินเทจที่นักสะสมต้องจับตา",
    "Thai wine":
        "ไวน์ไทย: สิ่งที่ต้องรู้ก่อนซื้อ",
    "wine bottle sizes":
        "ขนาดขวดไวน์: แต่ละขนาดเหมาะกับโอกาสไหน",
    "how to decant wine":
        "การ Decant ไวน์: ขวดไหนต้อง Decant และทำอย่างไรให้ถูกต้อง",
    "wine tasting notes":
        "การชิมไวน์: วิธีจับรสชาติและเขียน Tasting Notes แบบมืออาชีพ",
    "wine serving temperature":
        "อุณหภูมิเสิร์ฟไวน์: เย็นแค่ไหนถึงจะดีที่สุด",
    "quick chill wine":
        "เย็นไวน์ใน 15 นาที: เทคนิคฉุกเฉินที่ทุกคนควรรู้",
    "wine glasses":
        "แก้วไวน์: คุณต้องการแค่ 2 แบบนี้เท่านั้น",
    "wine varieties":
        "ไวน์มีกี่ประเภท: สเปกตรัมสมบูรณ์เกินกว่าแค่ Cabernet",
    "white wine comparison":
        "Sauvignon Blanc vs Chardonnay: ไวน์ขาวแบบไหนที่ใช่สำหรับคุณ",
    "red wine comparison":
        "Pinot Noir vs Cabernet: หยุดถามว่าอันไหนดีกว่า",
    "prosecco vs champagne":
        "Prosecco vs Champagne: ทางเลือกที่คุ้มค่ากว่า อธิบายอย่างชัดเจน",
    "sparkling wine":
        "คู่มือไวน์มีฟอง: ประเภท ความแตกต่าง และวิธีเลือก",
    "food pairing science":
        "วิทยาศาสตร์การจับคู่อาหาร: ทำไมไวน์กับอาหารถึงเข้ากันได้",
    "wine aging":
        "ไวน์เก่า: ขวดไหนดีขึ้นเมื่อเวลาผ่านไป",
    "wine ratings":
        "คะแนนไวน์: ความแตกต่างระหว่าง Score กับ Opinion",
    "vintage year wine":
        "ปีวินเทจ: เมื่อไหร่ที่ตัวเลขบนขวดสำคัญ และเมื่อไหร่ที่ไม่",
    "wine alcohol content":
        "ปริมาณแอลกอฮอล์ในไวน์: สิ่งที่คุณต้องรู้",
    "sulfites wine":
        "Sulfites ในไวน์: คืออะไร และทำไมถึงสำคัญ",
    "wine closures":
        "จุกคอร์ก vs ฝาเกลียว: แบบไหนดีกว่ากัน",
    "fortified wine":
        "ไวน์เสริมแอลกอฮอล์: เกินกว่าแค่ Port และ Sherry",
    "organic wine":
        "ไวน์ออร์แกนิก: ความหมายที่แท้จริง และสำคัญแค่ไหนกับคุณ",
    "wine vintage chart":
        "ตารางวินเทจ: ปีไหนควรซื้อ ปีไหนควรหลีกเลี่ยง",
    "wine health":
        "ไวน์กับสุขภาพ: แยกข้อเท็จจริงออกจากข่าวพาดหัว",

    # Tips & Guides / Explorer-Enthusiast
    "wine tasting journal":
        "Tasting Journal: ทำไม Sommelier ทุกคนถึงจดบันทึกไวน์",
    "blind wine tasting":
        "ชิมไวน์ปิดตา: คู่มือจัดงานที่บ้านฉบับสมบูรณ์",
    "buy wine online Thailand":
        "ซื้อไวน์ออนไลน์ในไทย: เช็กลิสต์ที่ต้องรู้ก่อนกด Order",
    "affordable wine":
        "ไวน์ราคาไม่เกิน 500 บาท: คุณภาพดีในงบที่จับต้องได้",
    "mid-range wine":
        "ไวน์ราคาไม่เกิน 1,000 บาท: Premium ไม่ได้แปลว่าแพงเสมอไป",
    "wine gift":
        "ของขวัญไวน์: วิธีเลือกให้โดนใจคนรักไวน์ทุกระดับ",
    "boxed wine":
        "ไวน์กล่อง: ทำลายมายาคติว่ามันถูกและไม่ดีเสมอไป",
    "how to open wine":
        "เปิดขวดไวน์อย่างถูกต้อง: มีและไม่มี Corkscrew",
    "bulk wine purchase":
        "ซื้อไวน์จำนวนมาก: ซื้ออย่างไรให้คุ้มค่าสำหรับคนดื่มประจำ",
    "spoiled wine":
        "ไวน์เสีย: วิธีรู้ว่าเสียก่อนจะดื่ม",
    "wine oxidation":
        "ไวน์ Oxidize: ทำไมถึงเกิด และป้องกันอย่างไร",
    "sommelier":
        "Sommelier คือใคร และเขาช่วยคุณได้อย่างไร",
    "wine tasting party":
        "จัดงาน Wine Tasting ที่บ้าน: คู่มือฉบับสมบูรณ์",
    "wine prices":
        "ราคาไวน์: ทำไมบางขวดถึงแพงกว่าที่คาด",
    "wine allergens":
        "สารก่อภูมิแพ้ในไวน์: สิ่งที่ต้องรู้ก่อนซื้อ",
    "wine subscription":
        "สมาชิกไวน์รายเดือน: คุ้มค่าจริงไหมที่จะสั่งแบบ Recurring",
    "home wine growing":
        "ปลูกองุ่นที่บ้าน: สิ่งที่ต้องคิดก่อนเริ่มต้น",
    "wine donation":
        "บริจาคไวน์: ทำอะไรกับขวดเก่าที่ไม่ต้องการแล้ว",
    "wine futures":
        "ซื้อไวน์ก่อนออกขาย: ทำความเข้าใจ En Primeur (Wine Futures)",
    "wine club":
        "Wine Club: คุ้มค่าเงินหรือเปล่า",
    "wine cellar design":  # Collector tips
        "ห้องเก็บไวน์: ออกแบบพื้นที่จัดเก็บในฝันของคุณ",
    "wine storage design":  # alternative key for cellar design row
        "ห้องเก็บไวน์: ออกแบบพื้นที่จัดเก็บในฝันของคุณ",
    "wine authenticity":
        "ใบรับรองและความถูกต้องของไวน์: วิธีสังเกตไวน์ปลอม",
    "wine investment":
        "ลงทุนในไวน์วินเทจ: ไวน์เป็นสินทรัพย์ทางการเงินได้จริงไหม",
    "luxury wine":
        "ไวน์ระดับ Premium: คำแนะนำสำหรับนักสะสมและโอกาสพิเศษ",
    "wine futures":
        "ซื้อไวน์ก่อนออกขาย: ทำความเข้าใจ En Primeur",
    "expensive wine":
        "ไวน์ราคาแพง: อะไรที่ทำให้มันคุ้มค่าราคานั้น",

    # Pairing
    "wine food pairing Thai":
        "ไวน์คู่อาหารไทย: 5 คู่ที่ลงตัวจนคุณต้องลอง",
    "wine pairing BBQ":
        "หมูกระทะ x ไวน์: 6 ขวดที่เข้ากันสุดๆ สำหรับงานปาร์ตี้ฤดูร้อน",
    "wine pairing pizza":
        "Pizza Night x ไวน์: Lambrusco พระเอกที่คนไม่ค่อยพูดถึง",
    "wine pairing seafood":
        "อาหารทะเลกรุงเทพ x ไวน์: คู่ที่ใช้ได้จริงสำหรับซีฟู้ดสไตล์ไทย",
    "wine cheese pairing":
        "ชีสบอร์ด x ไวน์ 2026: กฎที่ใช้ได้จริง",
    "wine pairing vegetarian":
        "อาหารมังสวิรัติไทย x ไวน์: ความซับซ้อนที่หลายคนมองข้าม",
    "rose wine":
        "ไวน์โรเซ่: ไม่ใช่แค่เครื่องดื่มฤดูร้อนอีกต่อไป",
    "dessert wine":
        "ไวน์หวาน: ไม่ใช่แค่ของหวานหลังมื้ออาหารอีกต่อไป",

    # Spotlights / Enthusiast-Collector
    "young winemakers":
        "คลื่นใหม่: นักทำไวน์รุ่นใหม่ที่กำลังเปลี่ยนกฎของ Old World",
    "Chateau Margaux":
        "Château Margaux: 50 ปีแห่งการเดินทางในแต่ละขวด",
    "wine label design":
        "ศิลปะบนฉลากไวน์: เทรนด์งานออกแบบที่นักสะสมตามหา",
    "champagne brands":
        "แบรนด์ Champagne ที่ต้องรู้จักก่อนจะเฉลิมฉลอง",
    "Napa 2023":
        "Napa Valley 2023: วินเทจระดับตำนานหรือแค่ความเชื่อ",
    "sustainable wine":
        "ไวน์ยั่งยืน: สำคัญจริงๆ หรือแค่การตลาด",
    "female winemakers":
        "นักทำไวน์หญิง: ผู้ผลิตสตรีที่กำลังเปลี่ยนวงการ",
    "local wine community":
        "ชุมชนไวน์: ผู้ผลิตท้องถิ่นและนักสะสมที่คุณควรรู้จัก",

    # Travel
    "wine tourism Thailand":
        "ท่องเที่ยวไวน์ในไทย: จุดซ่อนเร้นนอกกรุงเทพ",
    "wine bars Bangkok":
        "ไวน์บาร์กรุงเทพ: 10 ที่ซ่อนเร้นที่ไม่มีใครพูดถึง",
    "wine travel Thailand":
        "ท่องเที่ยวไวน์ในไทย: จุดซ่อนเร้นนอกกรุงเทพ",  # differs from Tourism row in angle
    "Bordeaux wine tasting":
        "Pauillac ถึง Saint-Émilion: ข้อมูลใน Private Tasting Tour",
    "wine community Bangkok":
        "ชุมชนไวน์กรุงเทพ: สถานที่ที่นักสะสมมาพบกัน",
}

def main():
    with open(SRC, encoding="utf-8", newline="") as fh:
        rows = list(csv.DictReader(fh))
        fieldnames = rows[0].keys() if rows else []

    updated = changed = 0
    for row in rows:
        pk = (row.get("Primary Keyword") or "").strip()
        pk_lower = pk.lower()
        # Try exact lowercase match, then check if any key is a substring match
        new_thai = THAI_TITLES.get(pk_lower) or THAI_TITLES.get(pk)
        if not new_thai:
            # secondary: match the English part of the existing title
            for key, val in THAI_TITLES.items():
                if key.lower() in pk_lower or pk_lower in key.lower():
                    new_thai = val
                    break
        if new_thai:
            # Reconstruct: "THAI | English part"
            existing = row["Topic Title (Thai | EN)"]
            if "|" in existing:
                en_part = existing.split("|", 1)[1].strip()
            else:
                en_part = existing.strip()
            new_full = f"{new_thai} | {en_part}"
            if new_full != existing:
                row["Topic Title (Thai | EN)"] = new_full
                changed += 1
        updated += 1

    with open(TMP, "w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(fieldnames))
        w.writeheader()
        w.writerows(rows)
    os.replace(TMP, SRC)
    print(f"Processed {updated} rows. Updated Thai titles: {changed}.")
    # Report rows NOT found in map (for manual review)
    with open(SRC, encoding="utf-8") as fh:
        final = list(csv.DictReader(fh))
    print("\nRows whose PRIMARY KEYWORD had no Thai title match (check manually):")
    found_keys = set(THAI_TITLES.keys())
    for r in final:
        pk = (r.get("Primary Keyword") or "").strip()
        if not (pk.lower() in found_keys or pk in found_keys):
            print(f"  pk='{pk}' | {r['Topic Title (Thai | EN)'][:60]}")

if __name__ == "__main__":
    main()
