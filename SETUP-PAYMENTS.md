# Setting up payments — a checklist for Dan

This is the plain-English list of what to click and paste so the website can take money, Quote Me can bill shops and take deposits, and Cara can text people back. Nothing here needs code. Where you have to type a command, it is written out exactly; copy and paste it.

You will need, open in browser tabs: **Stripe** (dashboard.stripe.com), **Twilio** (console.twilio.com), and **GitHub** (the calas-site repo). You will also need a **PowerShell** window open in the folder `ventures\apps\sitequote\worker` for a few `npx wrangler secret put` commands (each one asks you to paste a value, then press Enter; nothing is shown while you paste, that's normal).

**What it costs, honestly**

- **Stripe**: no monthly fee. You pay per transaction only: about 2.9% + C$0.30 on a card, 1% + C$0.40 capped at C$5 on a pre-authorized bank debit (check stripe.com/en-ca/pricing, they change it).
- **Twilio**: roughly **CA$1.15 a month per phone number**, plus a fraction of a cent to a cent or so **per text** sent and received. Verify the current numbers on twilio.com/en-us/sms/pricing/ca before quoting anyone. A2P/10DLC registration may have a one-time or small monthly fee.
- **Cloudflare Workers** (where Quote Me and Cara run): free tier is enough for now. C$0.
- **GitHub Pages** (the website): free.

---

## Part A — Stripe

### A1. Switch to live mode

1. Log in to dashboard.stripe.com.
2. Top-right, there is a **Test mode** toggle. Turn it **off** so it says live mode. Everything below is done in live mode. (If Stripe asks you to finish activating the account — business details, bank account for payouts — do that first; you can't take real money until it's done.)

### A2. Create the products and prices

Go to **Product catalog** (left menu; it may say **Products**) → **+ Add product**. Make these nine. For each one, set **Currency** to **CAD**. "One-time" vs "Recurring / Monthly" is the important choice.

| # | Product name (type it exactly) | Price | Billing |
|---|---|---|---|
| 1 | On File — build fee | 2500.00 CAD | One-time |
| 2 | On File — monthly plan | 500.00 CAD | Recurring, Monthly |
| 3 | Lead Me — setup fee | 2500.00 CAD | One-time |
| 4 | Lead Me — monthly plan | 500.00 CAD | Recurring, Monthly |
| 5 | Quote Me — per shop | 99.00 CAD | Recurring, Monthly |
| 6 | Cara — missed-call text-back | 29.00 CAD | Recurring, Monthly |
| 7 | Green Mile — owner-operator (up to 3 trucks) | 29.00 CAD | Recurring, Monthly |
| 8 | Green Mile — small fleet (up to 20 trucks) | 79.00 CAD | Recurring, Monthly |
| 9 | Watchpost — Watch plan | 99.00 CAD | Recurring, Monthly |

Watchpost's first month is free: on product 9, when you make the Payment Link (A3), turn on **Free trial** and set it to 30 days. Annual prices (Green Mile C$290 / C$790, Watchpost C$990) are optional extra prices on the same products; the website only links the monthly ones.

Tax: if you have registered for GST (and RST if it applies), turn on **Stripe Tax** in Settings → Tax and set each product's tax behaviour to **Exclusive** so the tax is added on top, matching the "plus GST/RST" line on the site. If you have not registered yet, skip this and the site's wording still holds.

### A3. Create one Payment Link per price

1. Left menu → **Payment Links** → **+ New**.
2. Pick the product (one of the nine above). Leave quantity fixed at 1.
3. Under **Payment methods**, make sure **Card** and **Pre-authorized debit (PAD)** are both on. (PAD only appears once Stripe has PAD enabled on your account: Settings → Payment methods → turn on Pre-authorized debit.)
4. Turn on **Collect customers' addresses** if you use Stripe Tax; otherwise leave it.
5. After payment: choose **Don't show confirmation page** → **Redirect customers to your website** and paste `https://calasautomations.com/pay/?paid=1` (or just leave Stripe's own confirmation page; either is fine).
6. Click **Create link**. Copy the link. It starts with `https://buy.stripe.com/`.
7. Repeat for all nine.

### A4. Paste the links into the website

1. In the calas-site repo, open the file **`pay/links.json`**.
2. Paste each link between the quotes of its key. It should end up looking like this (your links will differ):

```json
{
  "_help": [ "...leave this block as it is..." ],
  "onfile_build": "https://buy.stripe.com/aaaaaaaaaaaaa",
  "onfile_monthly": "https://buy.stripe.com/bbbbbbbbbbbbb",
  "leadme_build": "https://buy.stripe.com/ccccccccccccc",
  "leadme_monthly": "https://buy.stripe.com/ddddddddddddd",
  "quoteme_monthly": "https://buy.stripe.com/eeeeeeeeeeeee",
  "textback_monthly": "https://buy.stripe.com/fffffffffffff",
  "greenmile_small": "https://buy.stripe.com/ggggggggggggg",
  "greenmile_fleet": "https://buy.stripe.com/hhhhhhhhhhhhh",
  "watchpost_watch": "https://buy.stripe.com/iiiiiiiiiiiii"
}
```

Rules: keep the quotes; keep the commas at the end of every line except the last one. A key left as `""` simply means that Pay button stays hidden on the site, so you can fill them in one at a time.

3. Commit and push (in GitHub Desktop: write "Add Stripe payment links", Commit, Push). A minute or two later the Pay buttons appear on the product pages and on calasautomations.com/pay/. If a button doesn't appear, the most common cause is a missing comma or quote in `links.json`; open https://calasautomations.com/pay/links.json in your browser and it should display as text with no error.

Test it: open calasautomations.com/pay/ in a private window, click a Pay button, and check it lands on your Stripe page showing the right amount in CAD. Don't pay; just close it.

### A5. Copy the Quote Me price ID into the worker

Quote Me can also bill shops from inside the app. For that it needs the **Price ID** of the Quote Me product.

1. Stripe → Product catalog → **Quote Me — per shop** → in the Pricing section, click the C$99.00 price. In the top-right corner there is an ID that starts with **`price_`**. Copy it.
2. Open PowerShell in `ventures\apps\sitequote\worker` and run:

```
npx wrangler secret put STRIPE_PRICE_ID_MONTHLY
```

3. When it asks for the value, paste the `price_...` ID and press Enter.

### A6. Add the billing webhook (so the worker knows who has paid)

1. Stripe → **Developers** (bottom-left, or the `</>` icon) → **Webhooks** → **+ Add endpoint** (or "Add destination").
2. **Endpoint URL**: the exact URL is in the worker's own README (`ventures\apps\sitequote\worker\README.md`, section on billing webhooks). It is on `https://sitequote.calasdan.workers.dev/...`. Copy it from there rather than from here.
3. **Events to send** — select exactly these five:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Click **Add endpoint**. On the endpoint's page, under **Signing secret**, click **Reveal** and copy it. It starts with **`whsec_`**.
5. In PowerShell (same folder):

```
npx wrangler secret put STRIPE_BILLING_WEBHOOK_SECRET
```

   Paste the `whsec_...` value, Enter.

### A7. Turn on Stripe Connect (so contractors' deposits go to their own accounts)

Quote Me sends each contractor's deposit straight to that contractor's Stripe account; Calas never holds the money. That uses Stripe **Connect**.

1. Stripe → **Connect** (left menu) → **Get started**.
2. Choose **Express** accounts. Country: **Canada**. Set the platform name and support email when asked (Calas Automations, dan@calasautomations.com).
3. Under Connect → Settings → Payment methods for connected accounts, make sure **Pre-authorized debit (PAD)** is turned on so customers can pay deposits from their bank account.
4. Add a **Connect webhook**: Developers → Webhooks → **+ Add endpoint**, and this time choose **Listen to events on Connected accounts** (not your own account). URL: again from the worker README (the Connect/checkout webhook URL). Events, exactly these four:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
5. Copy its `whsec_` signing secret and store it under whatever name the worker README says for the Connect webhook secret (it is a different secret from the billing one in A6):

```
npx wrangler secret put <NAME_FROM_README>
```

---

## Part B — Twilio (Cara's texting)

### B1. Get the account details

1. Log in to console.twilio.com. On the home page, the **Account Info** box shows **Account SID** (starts with `AC`) and **Auth Token** (click the eye icon to reveal). Keep this tab open.
2. Under **Phone Numbers → Manage → Active numbers**, click Cara's line. Copy its number in the form **+1XXXXXXXXXX** (plus sign, 1, then the ten digits, no spaces or dashes). If you don't have a number yet: Buy a number → Canada → tick **SMS** → pick one in your area code (204 for Winnipeg). It costs about CA$1.15 a month.

### B2. Store them in the worker

In PowerShell in `ventures\apps\sitequote\worker`, run these three, pasting the value when each asks:

```
npx wrangler secret put TWILIO_ACCOUNT_SID
npx wrangler secret put TWILIO_AUTH_TOKEN
npx wrangler secret put TWILIO_FROM_NUMBER
```

(`TWILIO_FROM_NUMBER` is the `+1...` number.)

### B3. Point incoming texts at Cara

1. Back on the number's page in Twilio, scroll to **Messaging Configuration**.
2. **A message comes in**: choose **Webhook**, method **HTTP POST**, and paste:

```
https://sitequote.calasdan.workers.dev/api/sms/inbound
```

3. Save.

### B4. Canadian A2P / 10DLC registration — do not skip

Carriers in Canada and the US block or throttle business texting from unregistered numbers. Before any client's calls are routed through Cara:

1. Twilio console → **Messaging → Regulatory Compliance** (or **Trust Hub**). Register **Calas Automations** as the business (you will need the legal name, business number, address, and a description: "Missed-call text-back for trades businesses; replies to inbound calls the customer initiated; STOP to opt out").
2. Create a **Messaging Service**, add Cara's number to it, and attach the registered campaign.
3. Wait for Twilio to show it as **Verified / Approved** (can take a few days). Only then send client traffic. Until then, test only with your own phone.

---

## Part C — Cara's API key

The worker needs one long random password that only it and Cara's dashboard know. Make one and store it.

1. In PowerShell, run this one-liner to generate a random 48-character key and copy it to your clipboard:

```
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 48 | % {[char]$_}) | Set-Clipboard; Get-Clipboard
```

   It prints the key and it is now on your clipboard. Save it somewhere safe (your password manager) — you will need it for Cara's dashboard too.

2. Store it in the worker:

```
npx wrangler secret put CARA_API_KEY
```

   Paste (Ctrl+V), Enter.

---

## Part D — Deploy

1. In File Explorer, go to `ventures\apps\sitequote\worker`.
2. Double-click **`deploy-round5.cmd`**. A window opens, runs for a minute or so, and should end with a line containing "Published" or "Deployed" and the `sitequote.calasdan.workers.dev` address. If it ends in red text, take a screenshot and send it to me.
3. Quick checks afterwards:
   - Open https://calasautomations.com/pay/ — Pay buttons show and land on Stripe pages in CAD.
   - Text Cara's number from your own phone — you should get an auto-reply within a few seconds.
   - In Stripe → Developers → Webhooks, both endpoints show a green tick after the first event arrives (it will show nothing until something actually happens; that's fine).

---

## If something goes wrong

- **Pay button not showing**: `pay/links.json` has a typo, or the link isn't `https://`. Open https://calasautomations.com/pay/links.json in the browser; if it shows an error, fix the comma/quote and push again.
- **Pay button shows the wrong amount**: the Payment Link points at the wrong product. Fix it in Stripe; no website change needed.
- **`npx wrangler` says not logged in**: run `npx wrangler login` first; it opens a browser page to approve.
- **Texts not arriving**: check the webhook URL in B3 is exactly right (HTTP POST), and that the number is SMS-capable. If Twilio shows error 30034 or similar, that is A2P/10DLC registration (B4) not finished.
