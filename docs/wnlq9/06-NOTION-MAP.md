# 06 — Notion Map (IDs for the whole operation)

> All the IDs a session needs. Always `notion-fetch` the data source first for the live schema.

## Hierarchy
- **Workspace hub:** "2026 WNLQ9 — Content Hub" `35e9d75a-e4b5-809f-9f9c-cfdbb9b95e6d`
  - **Calendar hub (DB parent):** "2026 Content Calendar Hub" `35e9d75a-e4b5-81ed-b331-f6655718c066`
    - **June 2026 DB:** `786d080f-8da2-4a1e-b84e-161f4e19d56d` · data source `6be4a7bb-d42c-4286-be1b-fa73e3635b45`
    - **July 2026 DB:** `93ac15a8-bb65-40f7-b357-b8cabd336214` · data source `d342f9b8-3725-4068-9ccb-03b09821b0c8`
  - **Editorial Standard (governing doc):** `3729d75a-e4b5-81a8-83dd-c176804fdbdd`

## Schema (both DBs share it)
`Title` (title) · `Site` (Wine-Now/LIQ9) · `Category` (Education/Pairing/Travel/Tips/Spotlights) ·
`Type` (Pillar/Blog/Social) · `Status` (Not started/Brief Ready/In progress/Review/Done/Published) ·
`Priority` (Hero/Standard/Filler) · `Author` (Wine-Now Sommelier Desk/LIQ9 Bartender Desk/Guest Expert) ·
`Intent` (Informational/Commercial/Transactional/Navigational) · `Funnel` (TOFU/MOFU/BOFU) ·
`Evergreen` (Evergreen/Timely) · `Month` · `Day` (number) · `Publish Date` (date) · `Word Target` (number) ·
`Target Keyword` · `KEY` · `STORY` · `TENSION` · `CTA` · `Schema` · `Content Brief` ·
`Content TH` · `Content EN` · `Brief ID` · `Final URL` · `GA Views`.

> Date fields set via expanded keys: `date:Publish Date:start`, `date:Publish Date:is_datetime`.

## June 2026 views
- Default table `61761678-fbd8-4151-bc38-7e2ca770e73e`
- WN `36e9d75a-e4b5-81f6-b620-000cab73803b` · LIQ9 `36e9d75a-e4b5-81a7-935b-000c0a406caf`
- All-by-week `36e9d75a-e4b5-8136-a58d-000c4e975764`
- (July views: not built yet — open item.)

## July 2026 Hero pillars — ALL EXPANDED to full depth (TH+EN), at Review
| Brief | Title | Site | Page ID | Expanded? |
|---|---|---|---|---|
| JUL-A1 | How to Choose the Right Wine | WN | `3739d75a-e4b5-81a6-afc7-cc59cd842b4e` | DONE |
| JUL-A2 | The Complete Home-Bar Guide | LIQ9 | `3739d75a-e4b5-819d-bd82-d533ae835c52` | DONE |
| JUL-G11 | Home-Bar Tools 101 | LIQ9 | `3739d75a-e4b5-81cf-bafd-ff9a4b866a9f` | DONE |
| JUL-B1 | The Ultimate Rum Cocktail Guide | LIQ9 | `3739d75a-e4b5-8155-be5c-f006fc067e3b` | DONE |
| JUL-G1 | Wine Tasting for Beginners | WN | `3739d75a-e4b5-8163-83ec-c9ce19e19dc1` | DONE |
| JUL-C1 | French Wine 101 | WN | `3739d75a-e4b5-8106-a1c3-ed82e2e6444e` | DONE |
| JUL-D1 | Tequila 101 | LIQ9 | `3739d75a-e4b5-8136-961f-f69f57e9e977` | DONE |
| JUL-E1 | Scotch Whisky 101 | LIQ9 | `3739d75a-e4b5-8176-b9d3-c0c9d0dbc978` | DONE |

## Notion access for a new session
Use the Notion MCP server (this session's connector id is `bad99fe0-…`; in repo/CLI it's the
standard `@notionhq/notion-mcp-server` reading `NOTION_TOKEN`). Tools: `notion-fetch`,
`notion-create-pages`, `notion-update-page`, `notion-create-database`, `notion-search`,
`notion-update-data-source`, `notion-create-view`. (No delete/archive tool — clear rows via the UI.)
