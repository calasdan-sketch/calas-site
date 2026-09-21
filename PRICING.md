# Calas Automations — master price list

All prices in Canadian dollars, plus GST/RST where applicable. This file is the single source of truth; the numbers on the site (`/pay/`, product pages) and the Stripe Products should match it. When a price changes, change it here first, then Stripe, then the pages.

| Key (`pay/links.json`) | Product | Price | Type | Guarantee | Status |
|---|---|---|---|---|---|
| `onfile_build` | On File — build fee | C$2,500 | one-time | Build fee refunded if the two-week run doesn't return 6 staff hours/week | Firm |
| `onfile_monthly` | On File — monthly plan | C$500/mo | recurring monthly | 30 days' notice to cancel | Firm |
| `leadme_build` | Lead Me — setup fee | C$2,500 | one-time | Live with 40 verified warm companies in 14 days, or setup fee back | Firm |
| `leadme_monthly` | Lead Me — monthly plan | C$500/mo | recurring monthly | 30 days' notice to cancel | Firm |
| `quoteme_monthly` | Quote Me — per shop | C$99/mo | recurring monthly | 60-day deposit-or-refund: no real deposit collected in 60 days, first two months refunded | Early access; rises after first ten shops |
| `textback_monthly` | Cara — missed-call text-back | C$29/mo | recurring monthly | none yet; first three months C$19 while validating | **Hypothesis** |
| `greenmile` | Green Mile | by request (page shows C$25/mo per truck introductory) | — | — | **Hypothesis**, no checkout |
| `watchpost_watch` | Watchpost — Watch plan | by request, first month free | — | — | **Hypothesis**, no checkout |

## One-line rationale each

- **On File build, C$2,500.** Roughly two weeks of set-up against a client's own file list; low enough to be a line item, high enough that we don't cut corners. The refund-if-under-6-hours guarantee makes the number safe to say yes to.
- **On File monthly, C$500.** C$6,000/yr against an estimated 8–12 staff hours a week recovered (~C$9,000–14,000/yr at C$30/hr). Flat all year so it stays maintained through the quiet months.
- **Lead Me setup, C$2,500.** Same shape as On File: profile, territory, first verified list. The 40-companies-in-14-days guarantee is the measurable version of "it works for your territory".
- **Lead Me monthly, C$500.** Ongoing finding, reading, scoring and drafting; priced against what a part-time SDR or a paid lead list costs, without the per-lead fee.
- **Quote Me, C$99/mo.** Sits between the invoice apps (Joist C$14–98) and the full job-management suites (Jobber from ~C$69, Housecall Pro from ~C$111) because it does one thing those don't: voice note → priced quote → deposit collected. No setup fee, no contract.
- **Cara text-back, C$29/mo.** One recovered job pays for a year. C$19 intro for three months is a validation discount, said plainly on the page. Until we have real recovered-call numbers this is a guess, not a price.
- **Green Mile, by request.** The page shows C$25/mo per truck (or C$250/yr) as an introductory figure under the platforms at C$25–150+/mo; not yet tested against real owner-operators, so no self-serve checkout.
- **Watchpost, by request.** Early access, no marketing push; price set with the first businesses. First month free, no setup fee.

## What is still a hypothesis

1. **Cara text-back at C$29/mo** — needs recovered-call data from the first few trades customers.
2. **Green Mile at C$25/mo per truck** — needs the first paying owner-operators.
3. **Watchpost Watch plan** — no number yet.
4. **Quote Me at C$99/mo** — firm for the first ten shops; the "price rises after" is a stated intent, not a fixed number.

## Discounts and exceptions already promised on the site

- Trades page: the C$2,500 On File build fee is **waived for the first three trades contractors** (they still pay C$500/mo) in exchange for a measured case study. In Stripe, do this with a 100% one-time coupon on the build link or simply don't send the build link — don't create a second product.
- Trades page: Cara text-back **first three months at C$19**. In Stripe, a coupon (C$10 off, repeating for 3 months) on the C$29 price, not a second price.
- Watchpost: **first month free** — a Stripe free-trial setting on the subscription once a price exists.
