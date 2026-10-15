# Bronze tier — LINE lifecycle flow (Thai) — END-TO-END

Ready-to-localise **LINE message copy** for the **🟤 Bronze** tier (2,899 members ·
฿2,560 avg/yr) — the acquisition funnel. Goal: **convert first-timers into repeat
buyers**, establish taste profile, and trade up Bronze→Silver.
Companion to [`../LOYALTY_TIER_CRM_PLAN.md`](../LOYALTY_TIER_CRM_PLAN.md) §6.

> ⚠️ **DRAFT — fill before sending. No fabrication.** Every `{{placeholder}}`,
> `~฿{{X}}`, perk, SKU, date and incentive must be replaced with **real** values
> from your live loyalty program + product feed. Do **not** invent a perk, price,
> bottle name or threshold. If a perk doesn't exist yet, it's a proposal to
> approve — not something to message a customer.

## Sending rules (apply to all messages)

- **Consent:** PDPA-consented contacts only. Every promotional send offers easy
  opt-out (`พิมพ์ 'หยุด' เพื่อยกเลิกข้อความ`).
- **Compliance footer** on any message naming a product/promo:
  `🔞 20+ · สั่งซื้อ/สอบถามทาง LINE · ดื่มอย่างมีความรับผิดชอบ`
- **Frequency cap:** ≤ 3 promo/broadcast messages per member per month.
  Triggered lifecycle messages are exempt but don't stack two in a day.
- **Quiet hours:** send ~10:00–20:00 ICT. Never late night.
- **Priority message: B2** — getting the second purchase is the single highest-ROI
  action in Bronze. Weight human response time here if volume allows.
- **One CTA** per message; personalise with `{{ชื่อ}}`. Keep it short.

## Flow map

| ID | Trigger | Goal |
|---|---|---|
| **B0** | Member joins Bronze | Welcome, surface perks, capture taste |
| **B1** | First order delivered | Thank + pairing + seed second order |
| **B2** | 21 days after first order, no second purchase | **Second purchase** (2 touches — highest-ROI lever) |
| **B3** | Within ~฿X of Silver, or period closing | **Trade-up to Silver** (3 touches) |
| **B4** | Active one brand, not the other (60–90 d) | Cross-sell wine↔spirits |
| **B5** | Birthday / festival / payday | Occasion purchase |
| **B6** | Lapsed 60 / 90 days | Win-back (2 touches) |

---

## B0 — Welcome to Bronze  *(trigger: tier joined)*

```
ยินดีต้อนรับสู่ Wine-Now × LIQ9 นะคะ คุณ{{ชื่อ}} 🎉
ตอนนี้คุณเป็นสมาชิกระดับ Bronze 🟤 แล้ว สิทธิ์ที่ได้รับ: {{สิทธิ์ Bronze}}

เพื่อให้เราแนะนำสิ่งที่ถูกใจคุณได้ตรงที่สุด บอกเราหน่อยได้ไหมคะว่าชอบแนวไหน?
🍷 ไวน์แดง / ไวน์ขาว / สปาร์กลิง   🥃 วิสกี้ / คอนญัก / อื่น ๆ
ตอบกลับแชทนี้ได้เลยค่ะ 😊
🔞 20+ · ดื่มอย่างมีความรับผิดชอบ
```
*Gloss:* Welcome to Bronze → here are your perks → pick a category so we recommend right. Captures taste profile that powers all later messages.

## B1 — Post-purchase + pairing  *(trigger: first order delivered)*

```
ขอบคุณที่สั่ง {{ชื่อขวด}} กับเรานะคะ คุณ{{ชื่อ}} 🍷
เคล็ดลับเล็ก ๆ จากซอมเมอลิเยร์: ขวดนี้เข้ากันดีกับ {{อาหาร/โอกาส}} ลองดูนะคะ
ถ้าถูกใจ ทักเราได้เลย — เรามีของดีอีกเยอะค่ะ 😊
```
*Gloss:* Thank you + simple pairing tip (builds trust through education) + soft open door for next order. No hard sell on first post-purchase touch.

## B2 — Second purchase push  *(trigger: 21 days after first order, no reorder)* — 2 touches

**B2a · gentle (day 21)**
```
คุณ{{ชื่อ}} คะ หลังจากลอง {{ชื่อขวด}} ไปแล้ว เป็นยังไงบ้างคะ? 🍷
ถ้าถูกใจ เรามีตัวเลือกในสไตล์เดียวกันที่น่าลองอีกค่ะ
ทักเลยนะคะ เดี๋ยวแนะนำให้ 😊
```

**B2b · curated pick (day 35 — concrete suggestion)**
```
คุณ{{ชื่อ}} จัดมาให้เลยค่ะ 🍷
จากรสที่คุณชอบ เราแนะนำ {{ชื่อขวด/หมวด}} — {{เหตุผลสั้น ๆ ว่าทำไมถึงเข้ากัน}}
ราคาประมาณ ~฿{{X}} สั่งทาง LINE ได้เลยค่ะ 👉
🔞 20+ · สั่งซื้อ/สอบถามทาง LINE · ดื่มอย่างมีความรับผิดชอบ
```
*Gloss:* Day-21 is curiosity ("how was it?"); day-35 is a concrete curated pick. Two touches converts without feeling like spam. **This pair is the single biggest Bronze retention lever.**

## B3 — Trade-up to Silver  *(trigger: within ~฿X of Silver, or period closing)* — 3 touches

**B3a · reveal the gap**
```
คุณ{{ชื่อ}} รู้ไหมคะว่าตอนนี้คุณห่างจากระดับ Silver ⚪ แค่ ~฿{{X}} เท่านั้น!
ขึ้น Silver แล้วได้รับ: {{สิทธิ์ Silver}}
อยากให้เราช่วยเลือกขวดที่พาไปถึงได้ไหมคะ? 😊
```

**B3b · curated path**
```
จัดให้สำหรับคุณโดยเฉพาะค่ะ คุณ{{ชื่อ}} 🍷
{{ขวด/หมวด}} ที่คัดตามรสที่คุณชอบ — คุ้มและพาคุณถึง Silver ได้พอดีค่ะ
{{รายละเอียด}} · ราคาประมาณ ~฿{{X}}
ให้เรากันไว้ให้ไหมคะ?
🔞 20+ · สั่งซื้อ/สอบถามทาง LINE · ดื่มอย่างมีความรับผิดชอบ
```

**B3c · deadline**
```
⏳ คุณ{{ชื่อ}} เหลืออีกไม่กี่วันก่อนรอบนี้จะปิดนะคะ —
อีก ~฿{{X}} คุณก็จะเป็น Silver ⚪ พร้อมสิทธิ์ {{สิทธิ์ Silver}}
ทักด่วนเลยนะคะ เดี๋ยวจัดขวดสุดท้ายให้ทันค่ะ 😊
```
*Gloss:* Same 3-touch structure as Silver→Gold. Gap → curated path → deadline. Lead with what they unlock, not a blanket discount.

## B4 — Cross-brand cross-sell  *(trigger: active one brand, not the other, 60–90 d)*

```
คุณ{{ชื่อ}} คะ รู้ไหมว่าสมาชิก Bronze ของคุณใช้ได้กับทั้ง Wine-Now 🍷 และ LIQ9 🥃 เลยค่ะ!
สมาชิกเดียว สองแบรนด์ — ไม่ต้องสมัครใหม่
ลอง {{หมวดที่ยังไม่เคยสั่ง}} ดูไหมคะ? เราช่วยเลือกตัวแรกให้เลยค่ะ 😊
🔞 20+ · สั่งซื้อ/สอบถามทาง LINE · ดื่มอย่างมีความรับผิดชอบ
```
*Gloss:* One membership covers both brands — a simple fact most Bronze members may not know. Awareness-first, no hard sell.

## B5 — Occasion / seasonal

**Birthday**
```
🎂 สุขสันต์วันเกิดค่ะ คุณ{{ชื่อ}}!
ฉลองกับขวดพิเศษไหมคะ? เราคัด {{แชมเปญ/ไวน์ฉลอง/สุราพิเศษ}} มาให้เลือก
ราคาหลายระดับ — ทักมาบอกงบได้เลยค่ะ 😊
🔞 20+ · สั่งซื้อ/สอบถามทาง LINE · ดื่มอย่างมีความรับผิดชอบ
```

**Festival / payday broadcast**
```
เทศกาล{{ชื่อเทศกาล}}ใกล้มาแล้วนะคะ คุณ{{ชื่อ}} 🎊
ไม่ว่าจะปาร์ตี้หรือเป็นของขวัญ เราช่วยจัดให้ได้ค่ะ
{{แนะนำสั้น ๆ ตามหมวดที่ชอบ}} — สั่งล่วงหน้าเพื่อให้ทันจัดส่งนะคะ 🚚
🔞 20+ · สั่งซื้อ/สอบถามทาง LINE · ดื่มอย่างมีความรับผิดชอบ
```

## B6 — Win-back  *(trigger: lapsed 60 / 90 days)* — 2 touches

**B6a · gentle (day 60)**
```
คิดถึงนะคะ คุณ{{ชื่อ}} 🍷 ไม่ได้คุยกันสักพักเลย
มี {{ของใหม่/หมวดที่ชอบ}} เข้ามาพอดี — ให้เราคัดมาให้ดูไหมคะ?
```

**B6b · incentive (day 90)**
```
คุณ{{ชื่อ}} คะ เรายังรออยู่นะคะ 😊
{{สิทธิพิเศษ/ของแถม ถ้ามี}} สำหรับการสั่งครั้งต่อไปค่ะ
สมาชิก Bronze ⚪ ของคุณยังอยู่นะคะ — ทักมาเลยค่ะ
🔞 20+ · สั่งซื้อ/สอบถามทาง LINE · ดื่มอย่างมีความรับผิดชอบ · พิมพ์ 'หยุด' เพื่อยกเลิกข้อความ
```
*Gloss:* Bronze lapses fast (low habit formation after one order). Day-60 trigger is earlier than Silver's 90-day. Day-90 adds an incentive hook if one exists — otherwise lead with new arrivals.

---

## Fill-before-send checklist

- `{{สิทธิ์ Bronze}}` / `{{สิทธิ์ Silver}}` — actual perks per tier (live program)
- `~฿{{X}}` — real distance-to-Silver threshold per member (from BI)
- `{{ชื่อขวด}}` / `{{หมวด}}` — real in-stock products from the feed; no invented names
- `{{อาหาร/โอกาส}}` — real pairing suggestion (from your sommelier team)
- `{{ของแถม/สิทธิพิเศษ}}` — only if a real approved incentive exists
- `{{วันที่}}` — real status-period end date
- `{{เหตุผล}}` — short curation rationale from your team, not invented
- Consent flag, quiet hours, frequency cap — confirm against LINE OA settings
