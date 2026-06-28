# Silver tier — LINE lifecycle flow (Thai) — END-TO-END

Ready-to-localise **LINE message copy** for the **⚪ Silver** tier (2,184 members ·
฿11,243 avg/yr) — the growth engine. Goal: **trade up Silver→Gold**, raise
frequency + AOV, cross-sell wine↔spirits, and prevent lapse/downgrade.
Companion to [`../LOYALTY_TIER_CRM_PLAN.md`](../LOYALTY_TIER_CRM_PLAN.md) §6.
Built on the `sms` skill, adapted to **LINE**.

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
  (ordering happens in LINE chat — no open online checkout; prices on request).
- **Frequency cap:** ≤ 3–4 promo/broadcast messages per member per month.
  Triggered lifecycle messages (post-purchase, replenishment, status) are exempt
  but still respect a hard ceiling — don't stack two in a day.
- **Quiet hours:** send ~10:00–20:00 ICT. Never late night.
- **Segment** by category affinity (wine vs spirits), recency, and distance-to-Gold.
- **One CTA** per message; personalise with `{{ชื่อ}}` + last category. Keep it short.

## Flow map

| ID | Trigger | Goal |
|---|---|---|
| **S0** | Member reaches Silver | Recognise status, surface perks, capture taste profile |
| **S1** | Each order delivered | Thank + pairing (education) + seed next |
| **S2** | ~Est. "bottle finished" interval | Replenishment reorder |
| **S3** | Within ~฿X of Gold, or status period closing | **Trade-up to Gold** (3 touches) |
| **S4** | Active one brand, not the other (60–90d) | Cross-sell wine↔spirits |
| **S5** | Birthday / festival / payday | High-AOV occasion |
| **S6** | Lapsed 90 / 120 days | Win-back (2 touches) |
| **S7** | At risk of annual downgrade | Status-protection save |

---

## S0 — Welcome to Silver  *(trigger: tier reached)*

```
🎉 ยินดีด้วยค่ะ คุณ{{ชื่อ}} — ตอนนี้คุณเป็นสมาชิกระดับ Silver ⚪ แล้วนะคะ!
สิทธิ์ที่คุณได้รับ: {{สิทธิ์ Silver}}

เพื่อให้เราเลือกขวดที่ "ใช่" สำหรับคุณได้ดีขึ้น บอกเราหน่อยได้ไหมคะว่าชอบแนวไหน?
🍷 ไวน์แดง / ไวน์ขาว / สปาร์กลิง   🥃 วิสกี้ / คอนญัก / อื่น ๆ
ตอบกลับแชทนี้ได้เลยค่ะ เดี๋ยวซอมเมอลิเยร์ของเราจัดให้ 😊
🔞 20+ · ดื่มอย่างมีความรับผิดชอบ
```
*Gloss:* Congrats on reaching Silver → here are your perks → tell us your taste so we can recommend → reply in chat. Captures the taste profile that powers every later message.

## S1 — Post-purchase + pairing  *(trigger: order delivered)*

```
ขอบคุณที่สั่ง {{ชื่อขวด}} กับเรานะคะ คุณ{{ชื่อ}} 🍷
เคล็ดลับเล็ก ๆ: ขวดนี้เข้ากันดีกับ {{อาหาร/โอกาส}} ลองดูนะคะ
ถ้าถูกใจ อยากให้เราแนะนำขวดถัดไปในสไตล์ที่คุณชอบไหมคะ? ทักได้เลยค่ะ
```
*Gloss:* Thank you + a pairing tip (education builds palate → trades up) + soft offer to recommend the next bottle. No hard sell.

## S2 — Replenishment  *(trigger: ~N days after a consumable purchase)*

```
คุณ{{ชื่อ}} ขวด {{ชื่อขวด}} ที่สั่งไปคงใกล้หมดแล้วใช่ไหมคะ? 😉
อยากเติมขวดเดิม หรือลองตัวใหม่ในสไตล์ที่คุณชอบดีคะ?
เรามี {{หมวด/ตัวเลือกใหม่}} เข้ามาที่น่าจะถูกใจค่ะ
👉 ทักเลย เดี๋ยวจัดส่งให้ค่ะ
🔞 20+ · สั่งซื้อ/สอบถามทาง LINE · ดื่มอย่างมีความรับผิดชอบ
```
*Gloss:* Your bottle's probably running low — reorder the same or try a new one in your style.

## S3 — Trade-up to Gold  *(trigger: within ~฿X of Gold, or period closing)* — 3 touches

**S3a · reveal the gap**
```
คุณ{{ชื่อ}} รู้ไหมคะว่าตอนนี้คุณห่างจากระดับ Gold 🟡 แค่ ~฿{{X}} เท่านั้น!
ขึ้น Gold แล้วได้รับ: {{สิทธิ์ Gold}}
อยากให้เราช่วยเลือกขวดที่คุ้มที่สุดเพื่อไปให้ถึงไหมคะ? 🥂
```

**S3b · curated path (value, not discount)**
```
จัดให้สำหรับคุณโดยเฉพาะค่ะ คุณ{{ชื่อ}} 🍷
{{เซ็ต/บันเดิล}} ที่คัดตามรสที่คุณชอบ — คุ้มและพาคุณถึง Gold ได้พอดี
{{รายละเอียดเซ็ต}} · ราคาประมาณ ~฿{{X}}
ให้เรากันไว้ให้ไหมคะ?
🔞 20+ · สั่งซื้อ/สอบถามทาง LINE · ดื่มอย่างมีความรับผิดชอบ
```

**S3c · deadline before status period closes**
```
⏳ คุณ{{ชื่อ}} เหลืออีกไม่กี่วันก่อนรอบนี้จะปิดนะคะ —
อีก ~฿{{X}} คุณก็จะเป็น Gold 🟡 พร้อมสิทธิ์ {{สิทธิ์ Gold}}
ให้เราช่วยจัดขวดสุดท้ายให้ทันไหมคะ? ทักด่วนเลยค่ะ 😊
```
*Gloss:* The core revenue lever — make Gold concrete (how far, what you unlock), give a curated value path, then a deadline. **Lead with curation, not blanket discounts** (protects margin).

## S4 — Cross-brand cross-sell  *(trigger: active one brand, not the other)*

```
คุณ{{ชื่อ}} คุณเลือกไวน์ได้มีรสนิยมมากค่ะ 🍷
รู้ไหมคะว่าสิทธิ์สมาชิกของคุณใช้ได้กับ LIQ9 (สุรา/วิสกี้) ด้วย!
ลอง {{หมวดสุรา}} สักขวดไหมคะ — เดี๋ยวเราเลือกตัวที่เข้ากับรสไวน์ที่คุณชอบให้ 🥃
🔞 20+ · สั่งซื้อ/สอบถามทาง LINE · ดื่มอย่างมีความรับผิดชอบ
```
*Gloss:* (Wine→spirits shown; mirror for spirits→wine.) One membership spans both brands — try the other category, we'll match it to your taste.

## S5 — Occasion / seasonal

**Birthday**
```
🎂 สุขสันต์วันเกิดค่ะ คุณ{{ชื่อ}}!
ฉลองโอกาสพิเศษด้วยขวดพิเศษไหมคะ? เราคัด {{แชมเปญ/ไวน์ฉลอง}} มาให้เลือก
{{ของขวัญวันเกิด/สิทธิพิเศษ ถ้ามี}}
🔞 20+ · สั่งซื้อ/สอบถามทาง LINE · ดื่มอย่างมีความรับผิดชอบ
```

**Festival / payday (segmented broadcast)**
```
เทศกาล{{ชื่อเทศกาล}}ใกล้เข้ามาแล้วนะคะ คุณ{{ชื่อ}} 🎊
ไม่ว่าจะปาร์ตี้หรือเป็นของขวัญ เราช่วยจัดให้ได้ค่ะ — {{แนะนำตามหมวดที่คุณชอบ}}
สั่งล่วงหน้าเพื่อให้ทันจัดส่งนะคะ 🚚
🔞 20+ · สั่งซื้อ/สอบถามทาง LINE · ดื่มอย่างมีความรับผิดชอบ
```

## S6 — Win-back  *(trigger: lapsed 90 / 120 days)* — 2 touches

**S6a · gentle (day 90)**
```
คิดถึงคุณนะคะ คุณ{{ชื่อ}} 🍷 ไม่ได้เจอกันสักพักเลย
มี {{ของใหม่/หมวดที่คุณชอบ}} เข้ามาเยอะเลยค่ะ ให้เราคัดมาให้ดูไหมคะ?
```

**S6b · stronger (day 120, with incentive if one exists)**
```
คุณ{{ชื่อ}} คะ เราอยากต้อนรับคุณกลับมา 😊
{{สิทธิพิเศษ/ของแถม ถ้ามี}} สำหรับการสั่งครั้งต่อไป
และสถานะ Silver ⚪ ของคุณยังอยู่นะคะ — อย่าให้หลุดไปเลยค่ะ
👉 ทักเลย เดี๋ยวเราดูแลให้ค่ะ
🔞 20+ · สั่งซื้อ/สอบถามทาง LINE · ดื่มอย่างมีความรับผิดชอบ · พิมพ์ 'หยุด' เพื่อยกเลิกข้อความ
```

## S7 — Status-protection  *(trigger: annual downgrade risk near period-end)*

```
คุณ{{ชื่อ}} คะ 🔔 สถานะ Silver ⚪ ของคุณจะต่ออายุภายใน {{วันที่}}
อีกเพียง ~฿{{X}} ก็รักษาสิทธิ์ Silver ไว้ได้ครบปีค่ะ — รวมถึง {{สิทธิ์ Silver}}
ให้เราช่วยแนะนำขวดที่ใช่ไหมคะ? 🍷
🔞 20+ · สั่งซื้อ/สอบถามทาง LINE · ดื่มอย่างมีความรับผิดชอบ
```
*Gloss:* Annual tiers mean members can drop — a pre-emptive "keep your status, ฿X to re-qualify by DATE" is one of the strongest retention messages there is.

---

## Fill-before-send checklist (the real values needed)

- `{{สิทธิ์ Silver}}` / `{{สิทธิ์ Gold}}` — actual perks per tier (from your live program)
- `~฿{{X}}` — real distance-to-Gold / re-qualify thresholds (per member, from BI)
- `{{ชื่อขวด}}` / `{{SKU}}` / `{{หมวด}}` — real in-stock products from the feed
- `{{เซ็ต/บันเดิล}}` + `~฿{{X}}` — real curated bundle + approximate price
- `{{ของแถม/สิทธิพิเศษ}}` — only if a real incentive is approved
- `{{วันที่}}` — real status-period end date
- Quiet hours, frequency cap, opt-out keyword — confirm against LINE OA settings

Once you confirm perks/thresholds, this set is launch-ready for Silver; the same
skeleton adapts to Bronze (welcome + 2nd-purchase heavy) and Gold (curation +
Gold→Platinum) — say the word and I'll produce those.
