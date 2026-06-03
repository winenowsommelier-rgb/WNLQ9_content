# Environment Setup — make the GA/GSC pull turnkey

The content/Notion/Drive MCPs are already wired. The **only** thing a fresh
session needs for the automated GA4+GSC pull (Path A in `docs/GA_GSC_PLANNING.md`)
is a handful of env values in **this Claude Code environment's** secret store.

> Why it isn't automatic yet: `.claude/settings.json` maps env names to
> `${PLACEHOLDER}` values. Those only resolve if the **environment** provides the
> real secret. Right now `GOOGLE_SERVICE_ACCOUNT_JSON` resolves to the literal
> `${GOOGLE_SERVICE_ACCOUNT_JSON}` (proven by `ga-gsc-pull.mjs --check`), i.e. the
> environment isn't injecting it. Add the values below once and every future
> session inherits them.

## Where to set them
Claude Code on the web → your environment → **Environment variables / secrets**
(docs: https://code.claude.com/docs/en/claude-code-on-the-web). Add each key,
save, and start a new session (or re-run the setup).

## Keys to add
| Key | Example / source | Secret? |
|---|---|---|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | one-line service-account JSON `{"client_email":"…","private_key":"…"}` (also used for Drive) | **yes** |
| `GA4_PROPERTY_WN` | `123456789` (GA4 Admin → Property Settings → Property ID, Wine-Now) | no |
| `GA4_PROPERTY_LIQ9` | `987654321` (LIQ9 property) | no |
| `GSC_SITE_WN` | `sc-domain:wine-now.com` or `https://th.wine-now.com/` | no |
| `GSC_SITE_LIQ9` | `sc-domain:liq9.com` or `https://th.liq9.com/` | no |

(Optional: `GA_GSC_SERVICE_ACCOUNT_JSON` if you want a dedicated SA separate from
the Drive one. Otherwise the puller reuses `GOOGLE_SERVICE_ACCOUNT_JSON`.)

## Grant the service account access (once)
- **GA4**: each property → Admin → Property Access Management → add the SA
  `client_email` as **Viewer**.
- **GSC**: each property → Settings → Users and permissions → add the SA
  `client_email` as a user.

## Verify
```bash
node pipeline/scripts/ga-gsc-pull.mjs --check
```
Green = ready. Then `node pipeline/scripts/ga-gsc-pull.mjs --plan` pulls + scores.

If you can't / don't want to wire the SA, the **manual CSV path (Path B)** needs
none of this — just drop `pipeline/data/ga4.csv` + `gsc.csv` (see
`pipeline/data/README.md`) and run `plan-from-csv.mjs`.
