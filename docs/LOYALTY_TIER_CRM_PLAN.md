# Loyalty-Tier & Persona CRM Plan — Wine-Now × LIQ9

How to **serve** and **communicate** to every customer, by loyalty tier (value)
and by persona (need). This is the customer-lifecycle / CRM companion to
[`MARKETING_CONTENT_PLAN.md`](MARKETING_CONTENT_PLAN.md) (which covers
acquisition: AEO/SEO, content, programmatic). It draws on the vendored
[`marketing-plan`](../.claude/skills/marketing-plan) (AARRR),
[`sms`](../.claude/skills/sms) (lifecycle messaging, applied to **LINE**),
[`cro`](../.claude/skills/cro), [`analytics`](../.claude/skills/analytics) (RFM,
measurement) and [`content-strategy`](../.claude/skills/content-strategy)
skills — but the [`CLAUDE.md`](../CLAUDE.md) golden rules always win.

## Confirmed parameters (from the brief, 2026-06-10)

1. **Figures are annual** (trailing ~12 months). Diamond ≈ ฿1.24M **per year**.
2. **Top tiers are a mix of individuals + HoReCa/corporate** → two service tracks.
3. **Tiers are combined across both brands** → one program; wine↔spirits cross-sell is in-scope.
4. **The program is customer-visible** (members already see tier + perks) → we
   *optimize and communicate* an existing program; we do **not** redesign it, and
   we **reconcile** every perk named here against the live program (no invented perks).

> **No-fabrication note.** Tier counts, revenue and avg-spend below are the real
> figures you supplied. Every *perk*, *price*, *threshold* and *churn rate* in
> this plan is a **design placeholder** (`{{…}}`, `~฿X`) to confirm against your
> live program / BI feed before anything ships. See [Data still needed](#data--access-still-needed).

---

## 1. The economics that drive everything

Your base, sorted by value, with cumulative revenue:

| Tier | Customers | % base | Revenue | % rev | Cumulative rev | Avg/yr |
|---|---|---|---|---|---|---|
| 💎 Diamond | 21 | 0.3% | ฿26.0M | 19.6% | **19.6%** | ฿1,235,708 |
| 🔵 Platinum | 203 | 3.3% | ฿37.4M | 28.2% | **47.8%** | ฿184,023 |
| 🟡 Gold | 785 | 12.9% | ฿37.3M | 28.1% | **75.9%** | ฿47,539 |
| ⚪ Silver | 2,184 | 35.9% | ฿24.6M | 18.5% | **94.4%** | ฿11,243 |
| 🟤 Bronze | 2,899 | 47.6% | ฿7.4M | 5.6% | **100%** | ฿2,560 |
| **Total** | **6,092** | 100% | **฿132.7M** | 100% | | ฿21,783 |

**Four truths:**

1. **224 people (Platinum+Diamond, 3.7%) = ฿63.4M = ~48% of revenue.** Half the business is a guest-list.
2. **6 Diamonds ≈ the entire Bronze tier** (6 × ฿1.24M ≈ ฿7.4M). One lost Diamond ≈ ~480 lost Bronze.
3. **Silver is the growth engine:** 2,184 people, already 18.5% of revenue, **4.2× spend gap** up to Gold.
4. **Bronze is a sorting problem, not a revenue tier:** 48% of customers, 5.6% of revenue.

**Sensitivity (illustrative — we have no measured churn yet):** every **5 points**
of annual revenue-churn in Platinum+Diamond ≈ **฿3.2M** (5% of ฿63.4M). Every
**100 Silvers** nudged to Gold-average spend ≈ **+฿3.6M/yr** (100 × (฿47.5k−฿11.2k)).
These two levers — *protect the top, trade up the middle* — are the whole game.

### Operating principle: invert service intensity to value concentration

```
💎 Diamond / 🔵 Platinum  →  HIGH human, LOW automation   ( 224 people · ฿63M )
🟡 Gold                   →  BALANCED                       ( 785 people · ฿37M )
⚪ Silver / 🟤 Bronze      →  LOW human, HIGH automation     (5,083 people · ฿32M )
```

---

## 2. Two axes: tier (value) × persona (need)

Tiers tell us **how much to invest** in a customer. Personas tell us **what to
say**. The same Gold tier holds a cellar-building collector and a restaurant
buyer — same value, completely different message. The real plan is the grid in
[§4](#4-the-persona--tier-service-grid).

### Personas (hypothesis — validate with category/behaviour data)

| Persona | Motivation | Likely tiers | Track |
|---|---|---|---|
| **Collector / Connoisseur** | Rarity, provenance, cellar depth, en primeur | Gold→Diamond | B2C |
| **HoReCa / Trade** | Volume, consistency of supply, margin, reliability, terms | Platinum→Diamond | **B2B** |
| **Corporate gifter** | Presentation, bulk, delivery, invoicing, seasonal | Gold→Diamond | **B2B** |
| **Personal gifter** | Advice, presentation, occasion timing | Bronze→Gold | B2C |
| **Occasion / Celebration** | Champagne & marquee bottles for events; high AOV, low frequency | Silver→Platinum | B2C |
| **Everyday Enthusiast / Explorer** | Curiosity, variety, learning, value-for-quality | Silver→Gold | B2C |
| **Deal-seeker** | Price-led (handle carefully — low margin) | Bronze→Silver | B2C |

The **B2C vs B2B split inside Platinum/Diamond is the single most important thing
to tag** — a ฿1.24M Diamond restaurant and a ฿1.24M Diamond collector need
opposite playbooks. (See [Data still needed](#data--access-still-needed).)

---

## 3. Per-tier playbooks

Each tier: **who · objective (AARRR) · how we serve · how we communicate · what
we offer · the one move · primary KPI.**

### 💎 Diamond — 21 · ฿1.24M/yr · "named humans, never campaigns"
- **Who:** top collectors/HNW (B2C) **and** flagship HoReCa/corporate accounts (B2B).
- **Objective:** **Retention + Revenue expansion + Referral.** Churn here is existential.
- **Serve:** every one of the 21 gets a **named person** — a *Private Sommelier* (B2C) or a *Key Account Manager* (B2B) — with a living profile (what they collect / their venue & menu, key dates, delivery prefs). A 21-row VIP book is the **highest-ROI artefact in the company.**
- **Communicate:** 1:1 LINE + phone, **event-driven not calendar-driven** — allocations of rare/en-primeur bottles, private tastings, maker dinners; for B2B: proactive reorder, new-vintage briefings, staff training.
- **Offer:** access, scarcity, recognition, white-glove logistics (temperature-controlled delivery, storage), gifting concierge. For B2B: contract/volume pricing, terms, supply guarantees. **Not discounts** — they don't move the needle.
- **One move:** stand up the **VIP book + named owners this month**, with an automatic **"VIP gone quiet" alert** (no order in {{N}} days → human reaches out same week).
- **KPI:** account-level revenue retention (NRR); # lapsing VIPs saved.

### 🔵 Platinum — 203 · ฿184k/yr · "small pods, priority lane"
- **Who:** serious regulars (B2C) + mid-size trade/corporate (B2B).
- **Objective:** **Retention + push toward Diamond.**
- **Serve:** a few AMs covering ~40–70 each, **priority LINE line + faster SLA**, human + curated automation. Same B2C/B2B track split as Diamond, lighter touch.
- **Communicate:** monthly curated picks matched to taste/venue; quarterly personal check-in; early access (after Diamond).
- **Offer:** members' tastings, priority delivery, premium gifting, en-primeur priority, status recognition; B2B: reliable reorder + light terms.
- **One move:** a **"Platinum→Diamond" invitation track** + taste/venue-profile capture so curation feels personal at 203-scale.
- **KPI:** NRR + Platinum→Diamond migration rate.

### 🟡 Gold — 785 · ฿47.5k/yr · "curated automation + human escalation"
- **Who:** committed enthusiasts; emerging collectors; smaller gifters/venues.
- **Objective:** **Revenue (trade up Gold→Platinum, your premium pipeline) + Retention.**
- **Serve:** LINE segmented by taste/category; human touch triggered at spend milestones or high-value carts.
- **Communicate:** twice-monthly "for you" picks; group tasting invites; **visible tier progress** ("฿{{X}} to Platinum"); education that lifts palate → premium upsell.
- **Offer:** members' pricing/perks, early access (after Platinum), replenishment + "try the level up", cross-brand picks (wine↔spirits).
- **One move:** a **personalised replenishment + trade-up engine** tied to category mix (e.g. "you love Burgundy — here's the next tier up").
- **KPI:** Gold→Platinum migration rate + NRR.

### ⚪ Silver — 2,184 · ฿11.2k/yr · **THE GROWTH ENGINE** · "smart automation at scale"
- **Who:** growing regulars, explorers, occasion buyers warming up.
- **Objective:** **Revenue (Silver→Gold) + Retention + deeper Activation.** Biggest single lever (see §1 sensitivity).
- **Serve:** segmented LINE broadcasts + **RFM-triggered lifecycle flows** (post-purchase, replenishment, win-back). Minimal 1:1.
- **Communicate:** a concrete, **gamified trade-up program** ("spend ~฿{{X}} more this quarter → Gold + {{perk}}"); occasion-driven sends (festivals, paydays, gifting seasons); **cross-sell wine↔spirits** (one program, both brands).
- **Offer:** curated bundles to lift AOV, education (the blog) to build palate, members' events open to Silver. **Lead with content + curation, not blanket discounts** (protects margin).
- **One move:** the **Silver→Gold trade-up program** — make the next tier aspirational and concrete, powered by curated bundles + education.
- **KPI:** Silver→Gold migration rate; repeat-purchase rate; AOV.

### 🟤 Bronze — 2,899 · ฿2,560/yr · "full automation, sort for potential"
- **Who:** one-and-done triers, one-time gift-buyers, deal-seekers.
- **Objective:** **Activation (2nd purchase) + cheap Retention/sorting.** Don't over-invest 1:1.
- **Serve:** fully automated LINE **welcome → 2nd-purchase** flow; low-frequency broadcast; dormant → seasonal-only + occasional win-back.
- **Communicate:** the **2nd purchase is the key LTV probability lever** — a strong welcome/second-purchase flow is the cheapest growth you have; gift-buyer → self-buyer nurture.
- **Offer:** strong second-purchase nudge, onboarding/education (how to choose, pairing), low-risk entry bundles, bestseller intros.
- **One move:** a **killer welcome + 60/90-day second-purchase flow** that auto-graduates engaged buyers into the Silver treatment.
- **KPI:** 2nd-purchase rate (60/90-day); Bronze→Silver migration.

---

## 4. The persona × tier service grid

Service **model** by tier and track — note the two-track split at the top:

| | 🟤 Bronze | ⚪ Silver | 🟡 Gold | 🔵 Platinum | 💎 Diamond |
|---|---|---|---|---|---|
| **B2C** (collector / enthusiast / gifter) | Automated welcome + 2nd-purchase flow | Segmented flows + trade-up program | Curated picks + milestone human touch | AM pod + priority lane + tastings | Named Private Sommelier + concierge |
| **B2B** (HoReCa / corporate) | Route to LINE → qualify as trade | Trade pricing intro + reorder flow | Light account management + reorder | Key Account Manager + terms | Named KAM + contract + supply guarantee |

**How comms intensity scales:** broadcast (Bronze) → segmented automation
(Silver) → curated + triggered human (Gold) → scheduled human + automation
(Platinum) → fully 1:1 (Diamond). Automation carries 5,083 people; humans carry 224.

---

## 5. Cross-brand share-of-wallet (Wine-Now ↔ LIQ9)

Because tiers are **combined**, every customer has two expansion paths, not one:

1. **Trade up within brand** (Silver→Gold→Platinum) — vertical.
2. **Attach the second brand** (wine-only → +spirits, or spirits-only → +wine) — horizontal.

A Gold customer buying only wine is an obvious LIQ9 opportunity (their membership
already spans both). **Cross-brand attach rate** (% of members active in *both*
categories) becomes a program-level KPI. Tactics: "your membership works on both"
messaging, cross-category curated bundles (whisky + the wine they love), pairing
content (the blog), and a one-time cross-brand welcome when a single-brand member
first crosses over. *Requires category mix per member to size — see data needs.*

---

## 6. LINE lifecycle flows (the automation backbone)

These run for Gold/Silver/Bronze (and feed human alerts for Platinum/Diamond).
All **PDPA-consented**, with opt-out, and every send carries
`ดื่มอย่างมีความรับผิดชอบ · 20+` and routes ordering to **LINE** (price-on-request;
no open online checkout). Built on the `sms` skill, adapted to LINE.

| Flow | Trigger | Tiers | Purpose |
|---|---|---|---|
| **Welcome** | 1st purchase | Bronze | Onboard, set taste profile, seed 2nd purchase |
| **Second-purchase** | 7/30/60 days no reorder after 1st | Bronze | The LTV-unlock nudge |
| **Post-purchase / pairing** | Every order ships | All auto-tiers | Satisfaction + pairing/education (blog) |
| **Replenishment** | Est. "bottle finished" interval | Silver/Gold | Timely reorder |
| **Tier-up nudge** | Within ~฿X of next tier, period ending | Silver/Gold | Trade-up (status psychology) |
| **Status-protection** | At risk of annual downgrade | Gold/Plat | Retention save (see §7) |
| **Win-back** | Lapsed N days for tier | Bronze/Silver | Reactivate cheaply |
| **VIP-quiet alert** | No order in N days | Plat/Diamond | **Notify the human** (not an auto-send) |
| **Cross-sell** | Active one brand, not the other | Silver+ | Wine↔spirits attach |
| **Occasion** | Birthday / anniversary / festival | All (segmented) | Relevant, high-AOV moments |

**Full worked example:** the complete **Silver** flow end-to-end (S0–S7, every
message in Thai) lives in [`line-flows/silver-lifecycle-th.md`](line-flows/silver-lifecycle-th.md).

### Thai message templates (ตัวอย่าง — localise tone & **confirm perks/prices/SKUs** before sending)

> Placeholders `{{…}}` / `~฿X` must be filled from the live program + product feed. Never invent a number, perk or SKU.

**Welcome (Bronze, after 1st order)**
```
สวัสดีค่ะ คุณ{{ชื่อ}} 🍷 ขอบคุณที่เลือก {{Wine-Now / LIQ9}} ค่ะ
หวังว่าจะถูกใจ {{สินค้า}} นะคะ — อยากให้เราช่วยเลือกขวดต่อไปไหมคะ?
ทักบอกโอกาส/อาหารที่จะทาน เดี๋ยวซอมเมอลิเยร์แนะนำให้เลยค่ะ
🎁 การสั่งครั้งที่ 2 รับ {{สิทธิพิเศษ}}
ดื่มอย่างมีความรับผิดชอบ · 20+ | สอบถาม/สั่งซื้อทาง LINE
```

**Tier-up nudge (Silver → Gold)**
```
คุณ{{ชื่อ}} ตอนนี้คุณอยู่ระดับ Silver ⚪ — อีกประมาณ ~฿{{X}}
ก็เลื่อนเป็น Gold 🟡 ภายใน {{เดือน}} นี้ค่ะ
สิทธิ์ Gold: {{สิทธิ์}}
อยากได้คำแนะนำขวดที่คุ้มที่สุดเพื่อไปให้ถึงไหมคะ? ทักได้เลยค่ะ
ดื่มอย่างมีความรับผิดชอบ · 20+
```

**Cross-brand (Gold wine member → spirits)**
```
คุณ{{ชื่อ}} สมาชิก Gold ที่เลือกไวน์ได้ดีมากค่ะ 🍷
ลอง {{หมวดสุรา/วิสกี้}} จาก LIQ9 ไหมคะ — สิทธิ์สมาชิกของคุณใช้ได้ทั้งสองแบรนด์
เดี๋ยวเราเลือกขวดแรกที่เข้ากับรสที่คุณชอบให้นะคะ
```

**VIP quiet → human outreach (Platinum/Diamond — sent by their named owner)**
```
คุณ{{ชื่อ}} คะ 💎 ไม่ได้ดูแลคุณมาสักพักเลยค่ะ
มี {{คอลเลกชัน/ลอตพิเศษ}} เพิ่งเข้ามา คิดว่าคุณน่าจะสนใจเป็นพิเศษ
ให้ {{ชื่อซอมเมอลิเยร์/KAM}} ส่งรายการให้ดูก่อนใคร หรือโทรหาดีไหมคะ?
```

---

## 7. Working *within* the visible program

Members already see their tier and perks, so the leverage is **status psychology**, not redesign:

- **Make progress visible & motivating:** "฿{{X}} to {{next tier}}", progress bar, what they unlock.
- **Status-protection / re-qualify:** because tiers are annual, members can drop. A pre-emptive "keep your Gold status — {{X}} to re-qualify by {{date}}" save is one of the strongest retention messages there is. Pair with a human touch for Platinum/Diamond.
- **Perk awareness:** many members under-use perks they already have — periodic "your Gold perks you haven't used" reminders lift both value-perception and frequency.
- **Recognition moments:** tier anniversaries, "you've reached Diamond" celebrations, surprise-and-delight for the top 224.
- **⚠️ Reconcile, don't invent:** list the **actual** current perks per tier and thresholds, and replace every `{{perk}}`/`~฿X` here with them before launch. If a recommended perk doesn't exist yet, it's a *proposal to approve*, not a fact to state to customers.

---

## 8. Measurement

Built on the `analytics` skill; all numbers from BI/Supabase + LINE + GA4 (UTM-tagged), never estimated.

- **North star:** **net revenue retention of the top-3 tiers** (protect the ฿100.7M) **+ Silver→Gold migration count/quarter.**
- **Per-tier KPI:** as listed in §3.
- **Tier-migration matrix** (the key artefact): each period, count customers moving Bronze↔Silver↔Gold↔Platinum↔Diamond (and churned). Shows whether the engine is pumping value *up*.
- **Leading indicators:** 2nd-purchase rate (Bronze), repeat rate & AOV (Silver), milestone-cart rate (Gold), VIP-quiet count (Plat/Diamond), cross-brand attach rate (program-wide).
- **RFM** under the tiers: Recency flags the urgent saves (a lapsing Diamond), Frequency/Monetary inform cadence and trade-up targeting.
- **Channel:** tag every LINE flow + link with UTM; track flow-level reply/conversion to LINE.

---

## 9. 90-day rollout (highest ROI first)

| Phase | Weeks | Focus | Key actions |
|---|---|---|---|
| **0 — Unblock** | 1–2 | Data & tags | Tag top-224 **B2C vs B2B**; pull **recency** → lapsing-VIP list; confirm current perks + **consent/contactability**; list category mix per member |
| **1 — Protect ฿63M** | 1–4 | Top tiers | Stand up **VIP book** + named owners (21 Diamond, 203 Platinum pods); run lapsing-VIP saves; turn on **VIP-quiet alert** |
| **2 — Automate the base** | 3–8 | Bronze/Silver | Ship LINE **welcome, 2nd-purchase, replenishment, win-back**; **cross-sell** wine↔spirits flow |
| **3 — Grow the middle** | 6–12 | Silver→Gold→Plat | Launch **trade-up program** + **status-protection**; wire blog **education** into flows; Gold→Platinum pipeline |
| **4 — Compound** | ongoing | Measure & refer | Tier-migration matrix live; perk-awareness cycle; **referral** program for top tiers |

**Operating model / roles (dependency):** *Private Sommelier(s)* (B2C top), *Key
Account Manager(s)* (B2B top), *CRM/Lifecycle owner* (automation for the 5,083).
Human capacity for the top 224 is the main constraint — see data needs.

---

## Data & access still needed

The 4 forks are answered; these turn strategy into execution. I can pull most
from Supabase/BI **read-only with your authorization** (no production writes, no
fabrication):

**Must-have (changes structure / unblocks Phase 0–1):**
- **Recency per tier (RFM "R")** → the **lapsing-VIP list** (most urgent deliverable).
- **B2C vs B2B tag** for the top 224 (HoReCa/corporate vs individual).
- **Purchase frequency** (orders/yr per tier) → sets cadence.
- **Contactability + PDPA consent** counts (% LINE-added / email / phone, marketing consent).
- **Current program mechanics** — actual perks + thresholds per tier (to replace every placeholder).

**High-value (sharpens execution):**
- **Category/SKU mix per member** → cross-sell sizing + curation.
- **Margin by category** → weight by profit, not just revenue.
- **Service capacity** — is there an AM/concierge function today; how many can do 1:1?
- **Demographics/geo** (Bangkok vs upcountry; age band) → persona tone.

**Nice-to-have:** gift vs self-purchase signal; seasonality (festival/payday spikes); acquisition source per tier (to win more Diamonds).

---

*Companion docs:* [`MARKETING_CONTENT_PLAN.md`](MARKETING_CONTENT_PLAN.md) ·
[`CONTENT_PRODUCTION_PLAYBOOK.md`](CONTENT_PRODUCTION_PLAYBOOK.md) ·
skills in [`.claude/skills/`](../.claude/skills/README.md). Golden rules in
[`CLAUDE.md`](../CLAUDE.md) override any generic skill advice.
