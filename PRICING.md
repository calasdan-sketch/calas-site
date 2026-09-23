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
| `greenmile_small` | Green Mile — owner-operator, up to 3 trucks | C$29/mo (C$290/yr) | recurring monthly (annual optional) | 30-day money-back, no questions | First price; flat, not per truck |
| `greenmile_fleet` | Green Mile — small fleet, up to 20 trucks | C$79/mo (C$790/yr) | recurring monthly (annual optional) | 30-day money-back, no questions | First price |
| `watchpost_watch` | Watchpost — Watch plan, one location | C$79/mo (C$790/yr) | recurring monthly (annual optional) | First month free; any month the decoys can't be shown up is free; cancel with one email | Early access; business-hours support, no 24/7 |

## One-line rationale each

- **On File build, C$2,500.** Roughly two weeks of set-up against a client's own file list; low enough to be a line item, high enough that we don't cut corners. The refund-if-under-6-hours guarantee makes the number safe to say yes to.
- **On File monthly, C$500.** C$6,000/yr against an estimated 8–12 staff hours a week recovered (~C$9,000–14,000/yr at C$30/hr). Flat all year so it stays maintained through the quiet months.
- **Lead Me setup, C$2,500.** Same shape as On File: profile, territory, first verified list. The 40-companies-in-14-days guarantee is the measurable version of "it works for your territory".
- **Lead Me monthly, C$500.** Ongoing finding, reading, scoring and drafting; priced against what a part-time SDR or a paid lead list costs, without the per-lead fee.
- **Quote Me, C$99/mo.** Sits between the invoice apps (Joist C$14–98) and the full job-management suites (Jobber from ~C$69, Housecall Pro from ~C$111) because it does one thing those don't: voice note → priced quote → deposit collected. No setup fee, no contract.
- **Cara text-back, C$29/mo.** One recovered job pays for a year. C$19 intro for three months is a validation discount, said plainly on the page. Until we have real recovered-call numbers this is a guess, not a price.
- **Green Mile, C$29/mo up to 3 trucks, C$79/mo up to 20.** Flat, not per truck; sits beside the bookkeeping/dispatch tools at roughly C$27–56/mo and under the load boards at C$59–83/mo. Annual C$290/C$790 (two months free). 30-day money-back so the risk of a first price sits with us.
- **Watchpost, C$79/mo (C$790/yr).** One plan, one location. First month free, no setup fee, business-hours email support and no 24/7 monitoring, said plainly. Roughly a tenth of Thinkst Canary; not comparable to 24/7 MDR products, which it isn't.

## What is still a hypothesis

1. **Cara text-back at C$29/mo** — needs recovered-call data from the first few trades customers.
2. **Green Mile at C$29 / C$79** — a first price set from neighbouring tools, not a customer study; needs the first paying owner-operators.
3. **Watchpost Watch at C$79/mo** — set with the first businesses taken on in early access (matches the live Stripe strike price).
4. **Quote Me at C$99/mo** — firm for the first ten shops; the "price rises after" is a stated intent, not a fixed number.

## Discounts and exceptions already promised on the site

- Trades page: the C$2,500 On File build fee is **waived for the first three trades contractors** (they still pay C$500/mo) in exchange for a measured case study. In Stripe, do this with a 100% one-time coupon on the build link or simply don't send the build link — don't create a second product.
- Trades page: Cara text-back **first three months at C$19**. In Stripe, a coupon (C$10 off, repeating for 3 months) on the C$29 price, not a second price.
- Watchpost: **first month free** — a 30-day free trial on the `watchpost_watch` Payment Link.
- Green Mile / Watchpost annual prices (C$290, C$790): a second Stripe price on the same product, or offer by email; the site keys are the monthly ones.
