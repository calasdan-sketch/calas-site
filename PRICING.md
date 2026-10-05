# Calas Automations — master price list

All prices in Canadian dollars, plus GST/RST where applicable. This file is the single source of truth; the numbers on the site (`/pay/`, product pages) and the Stripe Products should match it. When a price changes, change it here first, then Stripe, then the pages.

| Key (`pay/links.json`) | Product | Price | Type | Guarantee | Status |
|---|---|---|---|---|---|
| `onfile_build` | On File — setup fee | **C$0 (dropped)** | one-time | Free two-week trial; no setup fee | Removed 2026-09-27 (was C$2,500; top deal-killer) |
| `onfile_monthly` | On File — monthly plan | C$500/mo | recurring monthly | 30 days' notice to cancel | Firm |
| `leadme_build` | Lead Me — setup fee | **C$0 (dropped)** | one-time | No setup fee on any Lead Me plan | Removed 2026-09-28 (was C$2,500) |
| `leadme_starter` | Lead Me Starter — finds, checks and writes; you send from your own email with one click, up to 30 a day; one person | C$199/mo | recurring monthly | 40 businesses in your territory that fit what you sell, each with a checked, working email address and a record of where we found it, within 14 days of going live, or walk away owing nothing; 30 days' notice to cancel | Raised from C$800 on 2026-10-05; Stripe link live |
| `leadme_monthly` | Lead Me — everything in Starter, plus it sends for you from your own address (first email, day 3, day 7, then stops), stops on reply or unsubscribe, pauses on bounces; one person; most popular | C$599/mo | recurring monthly | 40 businesses in your territory that fit what you sell, each with a checked, working email address and a record of where we found it, within 14 days of going live, or walk away owing nothing; 30 days' notice to cancel | Firm |
| `leadme_team` | Lead Me Team — everything in Lead Me for up to 4 people on one shared list, plus CRM export (spreadsheet file) | C$1,200/mo | recurring monthly | 40 businesses in your territory that fit what you sell, each with a checked, working email address and a record of where we found it, within 14 days of going live, or walk away owing nothing; 30 days' notice to cancel | Raised from C$800 on 2026-10-05; Stripe link live |
| `quoteme_monthly` | Quote Me — per shop | C$99/mo | recurring monthly | 60-day deposit-or-refund: no real deposit collected in 60 days, first two months refunded | Early access; rises after first ten shops |
| `textback_monthly` | Cara — missed-call text-back | C$29/mo | recurring monthly | none yet; first three months C$19 while validating | **Hypothesis** |
| `haulme_founding` | Haul Me — FOUNDING (first 50 owner-ops + couriers) | C$19/mo, locked 3 years | recurring monthly | 30-day money-back, no questions | First 50 only; price held 3 years then moves to regular |
| `greenmile_small` | Haul Me — owner-operator, up to 3 trucks | C$39/mo | recurring monthly | 30-day money-back, no questions | Raised from C$29 (board: underpricing signals a toy); flat, not per truck |
| `greenmile_fleet` | Haul Me — small fleet, up to 20 trucks | C$99/mo | recurring monthly | 30-day money-back, no questions | Raised from C$79 |
| `watchpost_guarded` | Watchpost — Watch Pro, we triage alerts and call you | C$199/mo (C$1,990/yr) | recurring monthly (annual optional) | First month free | Early access |
| `watchpost_family` | Watchpost — Family, per family | C$9.99/mo (C$99/yr); code FOUNDINGFAMILY = C$5/mo for 36 months, first 20 families | recurring | — | Early access |
| `watchpost_watch` | Watchpost — Watch plan, one location | C$79/mo (C$790/yr) | recurring monthly (annual optional) | First month free; any month the decoys can't be shown up is free; cancel with one email | Early access; business-hours support, no 24/7 |

## One-line rationale each

- **On File setup, C$0.** The C$2,500 build fee was dropped on 2026-09-27 — it was the top deal-killer. On File now starts with a free two-week trial and no setup fee; the C$500/mo plan begins only if the run returns at least 6 staff hours a week.
- **On File monthly, C$500.** C$6,000/yr against an estimated 8–12 staff hours a week recovered (~C$9,000–14,000/yr at C$30/hr). Flat all year so it stays maintained through the quiet months.
- **Lead Me setup, C$0.** The C$2,500 setup fee was dropped on 2026-09-28. The guarantee on every plan (40 checked, ready-to-email businesses in 14 days of going live, or you owe nothing) is the measurable version of "it works for your territory".
- **Lead Me Starter, C$199.** The same finding, checking, fit scoring and drafting, but the customer sends each email themselves from their own inbox with one click (up to 30 a day). A lower first step for people who want to stay hands-on.
- **Lead Me, C$599** (raised from C$500 on 2026-10-05; founding code LEADMEFOUNDING = 40% off 12 months, first 8). Everything in Starter, plus Lead Me sends for them from their own address on a gentle three-email schedule and stops or pauses by itself. Priced against what a part-time SDR or a paid lead list costs, without the per-lead fee.
- **Lead Me Team, C$1,200** (raised from C$800 on 2026-10-05). Up to four people on one shared lead list, so nobody emails the same company twice, plus CRM export. About C$300 a person.
- **Quote Me, C$99/mo.** Sits between the invoice apps (Joist C$14–98) and the full job-management suites (Jobber from ~C$69, Housecall Pro from ~C$111) because it does one thing those don't: voice note → priced quote → deposit collected. No setup fee, no contract.
- **Cara text-back, C$29/mo.** One recovered job pays for a year. C$19 intro for three months is a validation discount, said plainly on the page. Until we have real recovered-call numbers this is a guess, not a price.
- **Haul Me, C$39/mo up to 3 trucks, C$99/mo up to 20.** Founding offer: first 50 owner-operators and couriers get C$19/mo locked for 3 years. Flat, not per truck; sits beside the bookkeeping/dispatch tools at roughly C$27–56/mo and under the load boards at C$59–83/mo. 30-day money-back so the risk of a first price sits with us. (Raised from C$29/C$79 on board advice — underpricing signals a toy and left 10–20x of the value on the table.)
- **Watchpost, C$79/mo (C$790/yr).** One plan, one location. First month free, no setup fee, business-hours email support and no 24/7 monitoring, said plainly. Roughly a tenth of Thinkst Canary; not comparable to 24/7 MDR products, which it isn't.

## What is still a hypothesis

1. **Cara text-back at C$29/mo** — needs recovered-call data from the first few trades customers.
2. **Haul Me at C$39 / C$99 (founding C$19)** — set from neighbouring tools, not a customer study; needs the first paying owner-operators.
3. **Watchpost Watch at C$79/mo** — set with the first businesses taken on in early access (matches the live Stripe strike price).
4. **Quote Me at C$99/mo** — firm for the first ten shops; the "price rises after" is a stated intent, not a fixed number.

## Discounts and exceptions already promised on the site

- On File has **no build fee** (dropped 2026-09-27) — the old "waived for the first three trades contractors" offer is moot. Everyone now gets the free two-week trial and C$500/mo.
- Trades page: Cara text-back **first three months at C$19**. In Stripe, a coupon (C$10 off, repeating for 3 months) on the C$29 price, not a second price.
- Watchpost: **first month free on both plans** — a 30-day free trial on the `watchpost_watch` and `watchpost_guarded` (Watch Pro) Payment Links (Watch Pro trial added by Dan 2026-10-01, verified on the live checkout).
- Haul Me / Watchpost annual prices (Haul Me C$390 / C$990; Watchpost Watch C$790, Watch Pro C$1,990): a second Stripe price on the same product, or offer by email; the site keys are the monthly ones.
