# Website text changes (truth pass, 2026-10-27)

Branch `truth-and-polish`, worktree `C:\Users\danie\calas-site-truth`. Local only: nothing was deployed or pushed, and `calas-site-deploy` main was not touched.
Source of what to change: `docs\SITE-TEXT-FIXES.md` in the On File repo (`C:\Users\danie\onfile-product`), plus the brief for this pass.
**Do not deploy this file.** The `docs/` folder is only a record for Dan; delete it (or keep it out of the merge) before the site is published, because every file in this repo is served.

Every change below is a literal find-and-replace done by `ofwork\site_fix.py` from the committed text, so the old and new wording shown is exact (HTML entities such as `&rsquo;` are shown as written in the page). `x N` is how many times that wording appeared on the page (page text, meta tags and the FAQ JSON-LD each count).

## In one paragraph

The 6-staff-hours guarantee is gone from every page and from the Terms. The pilot is now described as **30 days** (the length On File's welcome sheet uses), sign-up as **manual**, cancelling as **30 days' notice** for On File, and reminders as: press the button, or on a schedule **only after daily chasing is switched on**, then up to three reminders and a person is asked to phone. Toronto, Bird, encrypted storage, the shared folder, text messages, the 8-12 hours / $9,000-14,000 claim and 'subcontractor compliance' were removed or reworded. 78 Claus Bay is now labelled as the company's mailing address, in the Terms only, outside the ScamCatch seller block.

## Changes by page

### /accounting/  (`accounting/index.html`)

- **Why:** Unsourced 8-12 hours / $9,000-14,000 claim (SITE-TEXT-FIXES 11)  (x 1)
  - Old: `<dt>What it's worth</dt><dd>Our estimate, not a measured result: <b>8&ndash;12 staff hours a week</b> &mdash; roughly <b>$9,000 to $14,000 a year</b> at a $30/hr admin rate, against $6,000 in fees. Illustrative figure with no external source &mdash; your real number gets measured in the two-week free run.</dd>`
  - New: `<dt>What it's worth</dt><dd>We do not quote a savings figure, because we have none we can source. Use the calculator above with your own hours: at C$500 a month and a $30/hr admin rate, On File pays for itself if it saves about 3.9 staff hours a week. Its own hours-saved figure is an estimate, not a measurement.</dd>`
- **Why:** 6-hour guarantee removed (Calas-Facts.md: not on the site, do not quote)  (x 1)
  - Old: `<dt>Guarantee</dt><dd>If the two-week free run doesn't return at least 6 staff hours a week, you have paid nothing (<a href="/terms/#on-file-test">how the hours are counted</a>).</dd>`
  - New: `(removed)`
- **Why:** 6-hour guarantee removed; cancel-any-time replaced by 30 days' notice  (x 1)
  - Old: `If that run does not return at least 6 staff hours a week, you have paid nothing (<a href="/terms/#on-file-test">how the hours are counted</a>). Cancel any time, never billed again.`
  - New: `If you keep On File, C$500 a month plus tax starts on day 31; there is no charge before that. Monthly plans are cancelled with 30 days&rsquo; notice.`
- **Why:** 'Cancel any time' vs 30 days' notice  (x 1)
  - Old: `Cancel any time and you're never billed again, and the workflow stays yours if you do.`
  - New: `Monthly plans are cancelled with 30 days&rsquo; notice, and the workflow stays yours if you do.`
- **Why:** 'your real number gets measured' (hours saved is an estimate)  (x 1)
  - Old: `your real number gets measured in the two-week free run`
  - New: `On File&rsquo;s own hours-saved figure is an estimate built from what it actually did, not a measurement`
- **Why:** same  (x 1)
  - Old: `Your real number gets measured in the two-week free run: hours counted before and after, and you see both.`
  - New: `Count your own staff hours before and after the pilot; On File's own hours-saved figure is an estimate built from what it actually did, not a measurement.`
- **Why:** 30-day pilot  (x 1)
  - Old: `The free two-week run on your own files tells you plainly whether a pilot makes sense for you.`
  - New: `The free 30-day pilot on your own files tells you plainly whether On File makes sense for you.`
- **Why:** 30-day pilot  (x 1)
  - Old: `It runs beside you, free, for two weeks.`
  - New: `It runs beside you, free, for 30 days.`
- **Why:** sign-up is manual; no 'two weeks' promise  (x 1)
  - Old: `Early access: we set it up with you in about two weeks. Call (431) 244-9026 or ask Cara.`
  - New: `Sign-up is manual: call (431) 244-9026 or ask Cara, and we set up your account by hand with you. The free 30-day pilot starts once your list is loaded.`
- **Why:** 'shared folder' / integrations described honestly  (x 1)
  - Old: `<li>No mailbox reader, shared-folder sync or automatic Cara replies yet.</li>`
  - New: `<li>Not live yet: the mailbox reader that files replies and attachments. Not built: folder sync. Cara drafts replies for a person to send; she never sends one herself.</li><li>No link to QuickBooks, Xero, TaxDome or Karbon. You bring lists in and take records out as CSV spreadsheets; there is also a calendar link and a simple API.</li>`
- **Why:** 'shared-folder', schedule and manual sign-up described as they are  (x 1)
  - Old: `Reminders go out when you or we press the button; there is no mailbox reader, shared-folder sync or automatic Cara reply yet.`
  - New: `Sign-up is manual, by phone. Reminders go out when you press Chase now, or on a schedule once daily chasing is switched on for you (the request, then up to three reminders, on weekdays in office hours; then a person is asked to phone). The mailbox reader is not live yet, there is no folder sync, and Cara only drafts replies.`
- **Why:** schedule exists once switched on  (x 1)
  - Old: `Sends request and reminder emails in your firm's name when you or we press the button.`
  - New: `Sends request and reminder emails in your firm's name when you press the button, or on a schedule once daily chasing is switched on.`
- **Why:** schedule exists once switched on  (x 1)
  - Old: `The request and reminder emails go out when you or we press the button, in your firm's name.`
  - New: `The request and reminder emails go out when you press the button, or on a schedule once daily chasing is switched on for you, in your firm's name.`
- **Why:** 'nothing chases on its own' vs the schedule  (x 2)
  - Old: `Reminders go out when you or we press the button; nothing chases on its own yet.`
  - New: `Reminders go out when you press the button. Daily chasing is off until you and we switch it on; once it is on, On File sends the request and up to three reminders on weekdays in office hours, then marks the client as needing a phone call.`
- **Why:** same  (x 2)
  - Old: `Reminders go out only when someone presses the button.`
  - New: `Reminders go out only when someone presses the button or daily chasing has been switched on.`
- **Why:** hours saved is an estimate  (x 1)
  - Old: `Hours saved are counted in the two-week side-by-side run. They are not promised in advance.`
  - New: `Hours saved shown in On File are an estimate built from what it actually did, not a measurement. They are not promised in advance.`
- **Why:** 'cancel any time' vs 30 days' notice  (x 2)
  - Old: `Cancel any time and you are never billed again; your plan runs to the end of the period you paid for.`
  - New: `Monthly plans are cancelled with 30 days&rsquo; notice, by phone or email.`
- **Why:** 'Toronto', Bird, automatic deletion promise, Google/Cloudflare named  (x 2)
  - Old: `and delete them when you close your account. On File is stored on our server in Toronto, Canada. Reminder emails are sent through Resend (United States) and Bird (Netherlands).`
  - New: `and delete them on request when you close your account, usually within 30 days. On File is stored on our own server, hosted with DigitalOcean; we have not yet confirmed which region, so please do not assume it is in Canada. Reminder emails are sent through Resend (United States) by way of Cloudflare, and replies arrive in a Google mailbox (Gmail / Google Workspace).`
- **Why:** 'Toronto', Bird, Google/Cloudflare named  (x 1)
  - Old: `<li>On File is stored on our server in Toronto, Canada. Reminder emails go through Resend (United States) and Bird (Netherlands).</li>`
  - New: `<li>On File is stored on our own server, hosted with DigitalOcean; we have not yet confirmed which region, so please do not assume it is in Canada. Reminder emails go through Resend (United States) by way of Cloudflare, and replies arrive in a Google mailbox (Gmail / Google Workspace).</li>`
- **Why:** automatic deletion promise (deletion is by hand, on request)  (x 1)
  - Old: `<li>When you close your account, we delete your data, unless the law requires us to keep it.</li>`
  - New: `<li>When you close your account, we delete your data on request, usually within 30 days, unless the law requires us to keep it. We keep one thing: the email address of anyone who asked us to stop emailing them, so we can honour that. Copies in backups are deleted as the backups expire.</li>`
- **Why:** footer 'cancel any time' (On File needs 30 days' notice)  (x 1)
  - Old: `&middot; cancel any time, never billed again</span>`
  - New: `&middot; cancellation terms are in our Terms</span>`
- **Why:** 'cancel any time' vs 30 days' notice  (x 1)
  - Old: `&middot; cancel any time, never billed again &middot; prices in CAD.`
  - New: `&middot; cancel with 30 days&rsquo; notice &middot; prices in CAD.`
- **Why:** link to the removed 6-hour test now goes to the pilot section  (x 1)
  - Old: `/terms/#on-file-test`
  - New: `/terms/#on-file-pilot`
- **Why:** pilot is 30 days  (x 6)
  - Old: `free two-week pilot`
  - New: `free 30-day pilot`
- **Why:** pilot is 30 days  (x 1)
  - Old: `Free two-week pilot`
  - New: `Free 30-day pilot`
- **Why:** pilot is 30 days  (x 5)
  - Old: `first two weeks side by side`
  - New: `first 30 days side by side`
- **Why:** pilot is 30 days  (x 1)
  - Old: `first two weeks run side by side`
  - New: `first 30 days run side by side`
- **Why:** pilot is 30 days  (x 1)
  - Old: `free for two weeks`
  - New: `free for 30 days`
- **Why:** pilot is 30 days  (x 1)
  - Old: `Nothing is charged during the two-week run`
  - New: `Nothing is charged during the 30-day pilot`
- **Why:** pilot is 30 days  (x 2)
  - Old: `Nothing is charged during the two-week pilot`
  - New: `Nothing is charged during the 30-day pilot`
- **Why:** pilot is 30 days  (x 1)
  - Old: `starts on day 15`
  - New: `starts on day 31`

### /trades/  (`trades/index.html`)

- **Why:** 6-hour guarantee removed  (x 1)
  - Old: `<dt>Guarantee</dt><dd>If the two-week free run doesn't return at least 6 staff hours a week, you walk away owing nothing (<a href="/terms/#on-file-test">how the hours are counted</a>).</dd>`
  - New: `(removed)`
- **Why:** 6-hour guarantee removed; cancel-any-time replaced by 30 days' notice  (x 1)
  - Old: `If that run does not return at least 6 staff hours a week, you walk away owing nothing (<a href="/terms/#on-file-test">how the hours are counted</a>). Cancel any time, never billed again.`
  - New: `If you keep On File, C$500 a month plus tax starts on day 31; there is no charge before that. Monthly plans are cancelled with 30 days&rsquo; notice.`
- **Why:** 6-hour guarantee removed  (x 1)
  - Old: `The two-week side-by-side runs the same way, same guarantee.`
  - New: `The 30-day side-by-side pilot runs the same way.`
- **Why:** 'subcontractor compliance' (On File does not judge compliance)  (x 1)
  - Old: `<h3>On File &mdash; subcontractor compliance</h3>`
  - New: `<h3>On File &mdash; subcontractor paperwork</h3>`
- **Why:** 'Cancel any time' vs 30 days' notice  (x 1)
  - Old: `Cancel any time and you're never billed again, and the workflow stays yours if you do.`
  - New: `Monthly plans are cancelled with 30 days&rsquo; notice, and the workflow stays yours if you do.`
- **Why:** 'your real number gets measured' (hours saved is an estimate)  (x 1)
  - Old: `your real number gets measured in the two-week free run`
  - New: `On File&rsquo;s own hours-saved figure is an estimate built from what it actually did, not a measurement`
- **Why:** 30-day pilot  (x 1)
  - Old: `The free two-week run on your own files tells you plainly whether a pilot makes sense for you.`
  - New: `The free 30-day pilot on your own files tells you plainly whether On File makes sense for you.`
- **Why:** 30-day pilot  (x 1)
  - Old: `It runs beside you, free, for two weeks.`
  - New: `It runs beside you, free, for 30 days.`
- **Why:** sign-up is manual; no 'two weeks' promise  (x 1)
  - Old: `Early access: we set it up with you in about two weeks. Call (431) 244-9026 or ask Cara.`
  - New: `Sign-up is manual: call (431) 244-9026 or ask Cara, and we set up your account by hand with you. The free 30-day pilot starts once your list is loaded.`
- **Why:** 'shared folder' / integrations described honestly  (x 1)
  - Old: `<li>No mailbox reader, shared-folder sync or automatic Cara replies yet.</li>`
  - New: `<li>Not live yet: the mailbox reader that files replies and attachments. Not built: folder sync. Cara drafts replies for a person to send; she never sends one herself.</li><li>No link to QuickBooks, Xero, TaxDome or Karbon. You bring lists in and take records out as CSV spreadsheets; there is also a calendar link and a simple API.</li>`
- **Why:** 'nothing chases on its own' vs the schedule  (x 1)
  - Old: `Reminders go out when you or we press the button; nothing chases on its own yet.`
  - New: `Reminders go out when you press the button. Daily chasing is off until you and we switch it on; once it is on, On File sends the request and up to three reminders on weekdays in office hours, then marks the client as needing a phone call.`
- **Why:** same  (x 1)
  - Old: `Reminders go out only when someone presses the button.`
  - New: `Reminders go out only when someone presses the button or daily chasing has been switched on.`
- **Why:** hours saved is an estimate  (x 1)
  - Old: `Hours saved are counted in the two-week side-by-side run. They are not promised in advance.`
  - New: `Hours saved shown in On File are an estimate built from what it actually did, not a measurement. They are not promised in advance.`
- **Why:** 'cancel any time' vs 30 days' notice  (x 1)
  - Old: `Cancel any time and you are never billed again; your plan runs to the end of the period you paid for.`
  - New: `Monthly plans are cancelled with 30 days&rsquo; notice, by phone or email.`
- **Why:** 'Toronto', Bird, automatic deletion promise, Google/Cloudflare named  (x 1)
  - Old: `and delete them when you close your account. On File is stored on our server in Toronto, Canada. Reminder emails are sent through Resend (United States) and Bird (Netherlands).`
  - New: `and delete them on request when you close your account, usually within 30 days. On File is stored on our own server, hosted with DigitalOcean; we have not yet confirmed which region, so please do not assume it is in Canada. Reminder emails are sent through Resend (United States) by way of Cloudflare, and replies arrive in a Google mailbox (Gmail / Google Workspace).`
- **Why:** 'Toronto', Bird, Google/Cloudflare named  (x 1)
  - Old: `<li>On File is stored on our server in Toronto, Canada. Reminder emails go through Resend (United States) and Bird (Netherlands).</li>`
  - New: `<li>On File is stored on our own server, hosted with DigitalOcean; we have not yet confirmed which region, so please do not assume it is in Canada. Reminder emails go through Resend (United States) by way of Cloudflare, and replies arrive in a Google mailbox (Gmail / Google Workspace).</li>`
- **Why:** automatic deletion promise (deletion is by hand, on request)  (x 1)
  - Old: `<li>When you close your account, we delete your data, unless the law requires us to keep it.</li>`
  - New: `<li>When you close your account, we delete your data on request, usually within 30 days, unless the law requires us to keep it. We keep one thing: the email address of anyone who asked us to stop emailing them, so we can honour that. Copies in backups are deleted as the backups expire.</li>`
- **Why:** footer 'cancel any time' (On File needs 30 days' notice)  (x 1)
  - Old: `&middot; cancel any time, never billed again</span>`
  - New: `&middot; cancellation terms are in our Terms</span>`
- **Why:** 'cancel any time' vs 30 days' notice  (x 1)
  - Old: `&middot; cancel any time, never billed again &middot; prices in CAD.`
  - New: `&middot; cancel with 30 days&rsquo; notice &middot; prices in CAD.`
- **Why:** link to the removed 6-hour test now goes to the pilot section  (x 1)
  - Old: `/terms/#on-file-test`
  - New: `/terms/#on-file-pilot`
- **Why:** pilot is 30 days  (x 3)
  - Old: `free two-week pilot`
  - New: `free 30-day pilot`
- **Why:** pilot is 30 days  (x 5)
  - Old: `first two weeks side by side`
  - New: `first 30 days side by side`
- **Why:** pilot is 30 days  (x 1)
  - Old: `first two weeks run side by side`
  - New: `first 30 days run side by side`
- **Why:** pilot is 30 days  (x 1)
  - Old: `free for two weeks`
  - New: `free for 30 days`
- **Why:** pilot is 30 days  (x 1)
  - Old: `Nothing is charged during the two-week run`
  - New: `Nothing is charged during the 30-day pilot`
- **Why:** pilot is 30 days  (x 1)
  - Old: `Nothing is charged during the two-week pilot`
  - New: `Nothing is charged during the 30-day pilot`
- **Why:** pilot is 30 days  (x 1)
  - Old: `starts on day 15`
  - New: `starts on day 31`

### /it-msp/  (`it-msp/index.html`)

- **Why:** 6-hour guarantee removed  (x 1)
  - Old: `<dt>Guarantee</dt><dd>Same as the direct product: if the two-week free run doesn&rsquo;t return at least 6 staff hours a week to your client, the setup fee is refunded &mdash; to you, so you can refund your client on your own terms.</dd>`
  - New: `(removed)`
- **Why:** 6-hour guarantee removed  (x 1)
  - Old: `(pattern)  If the free two-week run does not return at least 6 staff hours a week to your client, the setup fee is refunded to you\.`
  - New: `(removed)`
- **Why:** guarantee wording removed  (x 1)
  - Old: `First cohort shapes the guarantee.`
  - New: `First cohort shapes the terms.`
- **Why:** guarantee wording removed  (x 1)
  - Old: `First MSP partners help shape the guarantee and the white-label spec.`
  - New: `First MSP partners help shape the terms and the white-label spec.`
- **Why:** 'shared folder' does not exist  (x 1)
  - Old: `We set up the sending address and any shared folder with you by hand.`
  - New: `We set up the sending address with you by hand.`
- **Why:** 'shared folder' does not exist  (x 1)
  - Old: `your domain, your shared folder, no Calas branding`
  - New: `your domain, no Calas branding`
- **Why:** 'shared folder' does not exist  (x 1)
  - Old: `In early access we set up the sending address and any shared folder with you by hand;`
  - New: `In early access we set up the sending address with you by hand;`
- **Why:** 'cancel any time' vs 30 days' notice  (x 1)
  - Old: `After that, cancel any client slot any time and it&rsquo;s never billed again.`
  - New: `After that, cancel any client slot with 30 days&rsquo; notice.`
- **Why:** overpromise/underpromise: schedule exists once switched on  (x 1)
  - Old: `Reminders go out when you or we press the button, not on their own.`
  - New: `Reminders go out when someone presses the button, or on a schedule once daily chasing is switched on.`
- **Why:** same  (x 3)
  - Old: `(pattern) Reminders go out when you or we press the button\.`
  - New: `Reminders go out when someone presses the button, or on a schedule once daily chasing is switched on.`
- **Why:** footer 'cancel any time' (On File needs 30 days' notice)  (x 1)
  - Old: `&middot; cancel any time, never billed again</span>`
  - New: `&middot; cancellation terms are in our Terms</span>`
- **Why:** pilot is 30 days  (x 3)
  - Old: `free two-week pilot`
  - New: `free 30-day pilot`
- **Why:** pilot is 30 days  (x 1)
  - Old: `first two weeks side by side`
  - New: `first 30 days side by side`

### /pay/  (`pay/index.html`)

- **Why:** 6-hour guarantee removed  (x 1)
  - Old: `<p class="gq"><b>Guarantee.</b> If the two-week run doesn&rsquo;t return at least 6 staff hours a week, you have paid nothing (<a href="/terms/#on-file-test">how the hours are counted</a>).</p>`
  - New: `(removed)`
- **Why:** 30-day pilot; 30 days' notice  (x 1)
  - Old: `<p class="gq"><b>Billing.</b> Nothing is charged during the two-week run. If you keep it, C$500 a month plus tax starts on day 15.</p>`
  - New: `<p class="gq"><b>Billing.</b> Nothing is charged during the 30-day pilot. If you keep it, C$500 a month plus tax starts on day 31. Monthly plans are cancelled with 30 days&rsquo; notice.</p>`
- **Why:** sign-up is manual; no 'two weeks' promise  (x 1)
  - Old: `Set-up against your own file list and your own wording, in about two weeks.`
  - New: `Set-up by hand against your own file list and your own wording.`
- **Why:** 30-day pilot  (x 1)
  - Old: `A two-week measured run on your real files before the monthly plan starts.`
  - New: `A free 30-day pilot on your real files before the monthly plan starts.`
- **Why:** 'cancel any time' vs 30 days' notice  (x 1)
  - Old: `Maintenance, fixes and small changes through the year. Cancel any time, never billed again.`
  - New: `Maintenance, fixes and small changes through the year. Monthly plan, cancelled with 30 days&rsquo; notice.`
- **Why:** 30-day pilot  (x 1)
  - Old: `$0 <small>&mdash; free 2-week trial</small>`
  - New: `$0 <small>&mdash; free 30-day pilot</small>`
- **Why:** 'cancel any time' vs 30 days' notice for On File  (x 1)
  - Old: `You can cancel any plan any time and you&rsquo;re never billed again; your plan runs to the end of the period you paid for.`
  - New: `You can cancel any plan any time and you&rsquo;re never billed again after it ends; your plan runs to the end of the period you paid for. The one exception is On File, whose monthly plan is cancelled with 30 days&rsquo; notice.`
- **Why:** pilot is 30 days  (x 1)
  - Old: `free two-week pilot`
  - New: `free 30-day pilot`

### /tools/  (`tools/index.html`)

- **Why:** 'cancel any time' vs 30 days' notice for On File  (x 1)
  - Old: `Cancel any plan any time and you are never billed again.`
  - New: `Cancel any plan any time and you are never billed again after it ends (On File: 30 days&rsquo; notice).`
- **Why:** 6-hour guarantee removed  (x 1)
  - Old: `(pattern) Free two-week pilot, nothing charged during it\. If it does not return at least 6 staff hours a week, you pay nothing \(<a href="/terms/#on-file-test">how[^)]*\)\.?`
  - New: `Free 30-day pilot, nothing charged during it. Monthly plan, cancelled with 30 days&rsquo; notice.`

### /  (`index.html`)

- **Why:** pilot is 30 days  (x 5)
  - Old: `free two-week pilot`
  - New: `free 30-day pilot`
- **Why:** pilot is 30 days  (x 1)
  - Old: `Free two-week pilot`
  - New: `Free 30-day pilot`

### /demo/accounting/  (`demo/accounting/index.html`)

- **Why:** 'texts and follows up until the paperwork lands' and unsourced 6-12 hours  (x 2)
  - Old: `Chasing client documents costs six to twelve staff hours a week. On File emails, texts and follows up until the paperwork lands.`
  - New: `Made-up demo of On File: the office sends the request and reminders and sees which client documents are still missing. Email only; text messages are not available.`
- **Why:** pilot is 30 days  (x 1)
  - Old: `first two weeks side by side`
  - New: `first 30 days side by side`
- **Why:** pilot is 30 days  (x 2)
  - Old: `free two-week side-by-side run`
  - New: `free 30-day pilot`
- **Why:** 6-hour guarantee removed  (x 2)
  - Old: `If the free 30-day pilot doesn't return at least 6 staff hours a week, you walk away owing nothing.`
  - New: `Nothing is charged during the free 30-day pilot.`
- **Why:** demo banner: 'shared-folder sync', schedule and manual sign-up described as they are  (x 1)
  - Old: `(pattern) reminders go out when you or we press the button, and we set it up with you and run the first (?:two weeks|30 days) side by side\. A mailbox reader, shared-folder sync and automatic Cara replies are not live yet\.`
  - New: `sign-up is manual and we set it up with you by hand, with a free 30-day pilot. In this simulation &ldquo;Automatic&rdquo; shows the schedule that runs only after daily chasing is switched on for a customer, and the voice-over describes that mode. Not live yet: the mailbox reader. Not built: folder sync. Cara only drafts replies.`
- **Why:** 'saves you hours every week' (DEMO-MISMATCHES row 7)  (x 1)
  - Old: `<b>Saves you hours</b><span>Every week in season, February to June.</span>`
  - New: `<b>Keeps a record</b><span>Who was asked for what, and when.</span>`
- **Why:** 'nothing new for your client to learn' (DEMO-MISMATCHES row 7)  (x 1)
  - Old: `<b>Simple</b><span>Your existing portal. Nothing new for your client to learn.</span>`
  - New: `<b>Simple</b><span>The person asked gets one link and uploads from a phone. No account.</span>`

### /demo/trades/  (`demo/trades/index.html`)

- **Why:** pilot is 30 days  (x 1)
  - Old: `first two weeks side by side`
  - New: `first 30 days side by side`
- **Why:** pilot is 30 days  (x 2)
  - Old: `free two-week side-by-side run`
  - New: `free 30-day pilot`
- **Why:** 6-hour guarantee removed  (x 2)
  - Old: `If the free 30-day pilot doesn't return at least 6 staff hours a week, you walk away owing nothing.`
  - New: `Nothing is charged during the free 30-day pilot.`
- **Why:** demo banner: 'shared-folder sync', schedule and manual sign-up described as they are  (x 1)
  - Old: `(pattern) reminders go out when you or we press the button, and we set it up with you and run the first (?:two weeks|30 days) side by side\. A mailbox reader, shared-folder sync and automatic Cara replies are not live yet\.`
  - New: `sign-up is manual and we set it up with you by hand, with a free 30-day pilot. In this simulation &ldquo;Automatic&rdquo; shows the schedule that runs only after daily chasing is switched on for a customer, and the voice-over describes that mode. Not live yet: the mailbox reader. Not built: folder sync. Cara only drafts replies.`
- **Why:** 'saves you hours every week' (DEMO-MISMATCHES row 7)  (x 1)
  - Old: `<b>Saves you hours</b><span>Every week in season, February to June.</span>`
  - New: `<b>Keeps a record</b><span>Who was asked for what, and when.</span>`
- **Why:** 'nothing new for your client to learn' (DEMO-MISMATCHES row 7)  (x 1)
  - Old: `<b>Simple</b><span>Your existing portal. Nothing new for your client to learn.</span>`
  - New: `<b>Simple</b><span>The person asked gets one link and uploads from a phone. No account.</span>`

### /demo/it-msp/  (`demo/it-msp/index.html`)

- **Why:** pilot is 30 days  (x 1)
  - Old: `first two weeks side by side`
  - New: `first 30 days side by side`
- **Why:** pilot is 30 days  (x 2)
  - Old: `free two-week side-by-side run`
  - New: `free 30-day pilot`
- **Why:** 6-hour guarantee removed  (x 2)
  - Old: `If the free 30-day pilot doesn't return at least 6 staff hours a week, you walk away owing nothing.`
  - New: `Nothing is charged during the free 30-day pilot.`
- **Why:** demo banner: 'shared-folder sync', schedule and manual sign-up described as they are  (x 1)
  - Old: `(pattern) reminders go out when you or we press the button, and we set it up with you and run the first (?:two weeks|30 days) side by side\. A mailbox reader, shared-folder sync and automatic Cara replies are not live yet\.`
  - New: `sign-up is manual and we set it up with you by hand, with a free 30-day pilot. In this simulation &ldquo;Automatic&rdquo; shows the schedule that runs only after daily chasing is switched on for a customer, and the voice-over describes that mode. Not live yet: the mailbox reader. Not built: folder sync. Cara only drafts replies.`
- **Why:** 'saves you hours every week' (DEMO-MISMATCHES row 7)  (x 1)
  - Old: `<b>Saves you hours</b><span>Every week in season, February to June.</span>`
  - New: `<b>Keeps a record</b><span>Who was asked for what, and when.</span>`
- **Why:** 'nothing new for your client to learn' (DEMO-MISMATCHES row 7)  (x 1)
  - Old: `<b>Simple</b><span>Your existing portal. Nothing new for your client to learn.</span>`
  - New: `<b>Simple</b><span>The person asked gets one link and uploads from a phone. No account.</span>`

### /terms/  (`terms/index.html`)

- **Why:** 6-hour test section removed; pilot, notice and honesty wording instead  (x 1)
  - Old: `(pattern)   <h2 id="on-file-test">4A\..*?</ul>\n(?=  <h2>4B)`
  - New: `<h2 id="on-file-pilot">4A. On File: the 30-day pilot and cancelling</h2>   <!-- 2026-10-27 truth pass: the "6 staff hours" test was removed because it is not offered (Calas-Facts.md). Dan: have this section reviewed before relying on it. -->   <p>On File starts with a free 30-day pilot that runs beside the way your business chases documents today. Nothing is charged during the pilot; if you keep On File, the monthly fee starts on day 31. Sign-up is manual: we create your account by hand after you ask, and billing is set up by us by hand; nothing in On File bills you or locks you out by itself.</p>   <ul>     <li><strong>Cancelling.</strong> On File monthly plans are cancelled with 30 days&rsquo; notice, by phone or email. This replaces the general &ldquo;cancel any time&rdquo; wording in Section 4 for On File. During the free pilot you can stop at any time and owe nothing.</li>     <li><strong>Hours saved.</strong> The hours-saved figure On File shows is an estimate built from what it actually did, not a measurement, and we promise no number of hours or dollars. Hour and dollar figures on our pages are illustrative.</li>     <li><strong>What On File does not do.</strong> It does not review documents or confirm that they are valid or enough; a person at your business does that.</li>   </ul>`
- **Why:** 'cancel any time' vs 30 days' notice  (x 1)
  - Old: `<strong>Cancel any time, and you&rsquo;re never billed again.</strong> Your plan runs to the end of the period you already paid for. To cancel, use your account where the app offers it, call 431-244-9026, or email office@calasautomations.com.`
  - New: `<strong>Cancel any time, and you&rsquo;re never billed again.</strong> Your plan runs to the end of the period you already paid for. To cancel, use your account where the app offers it, call 431-244-9026, or email office@calasautomations.com. On File is the exception: its monthly plan is cancelled with 30 days&rsquo; notice (Section 4A).`
- **Why:** 'works inside your mailbox and folder' (no such connection)  (x 1)
  - Old: `It works inside the mailbox and folder you give it.`
  - New: `It works from the lists you give it (spreadsheets) and sends reminders from its own sending address.`
- **Why:** automatic deletion promise (deletion is by hand, on request)  (x 1)
  - Old: `use them only to run On File for you, and delete them when you close your account.`
  - New: `use them only to run On File for you, and delete them on request when you close your account, usually within 30 days.`
- **Why:** mailing address moved out of the ScamCatch seller block  (x 1)
  - Old: `Seller: Calas Automations Inc., 78 Claus Bay, Winnipeg, Manitoba R2G 2A1, 431-244-9026, office@calasautomations.com.`
  - New: `Seller: Calas Automations Inc., 431-244-9026, office@calasautomations.com (mailing address at the end of these Terms).`
- **Why:** label 78 Claus Bay as the company's mailing address  (x 1)
  - Old: `<p style="margin:0">Calas Automations Inc. &middot; Winnipeg, Manitoba, Canada &middot;`
  - New: `<p style="margin:0">Calas Automations Inc. &middot; mailing address: 78 Claus Bay, Winnipeg, Manitoba R2G 2A1 &middot;`

### /privacy/  (`privacy/index.html`)

- **Why:** 'Toronto' not confirmed  (x 1)
  - Old: `<strong>Lead Me, Haul Me and On File</strong> are stored on our server in Toronto, Canada (DigitalOcean).`
  - New: `<strong>Lead Me, Haul Me and On File</strong> are stored on our own server, hosted with DigitalOcean (we have not yet confirmed which region it is in, so please do not assume it is in Canada).`
- **Why:** Google and Cloudflare named as processors; Bird removed  (x 1)
  - Old: `On File stores what your clients or subcontractors send, as your service provider.`
  - New: `On File stores what your clients or subcontractors send, as your service provider. Its reminder emails are sent through Resend (United States) by way of Cloudflare, and replies arrive in a Google mailbox (Gmail / Google Workspace); these providers handle that email for us.`
- **Why:** Bird is not used  (x 1)
  - Old: `<strong>Email</strong> is sent through Resend (United States) and Bird (Netherlands).`
  - New: `<strong>Email</strong> is sent through Resend (United States) by way of Cloudflare, and replies to On File arrive in a Google mailbox.`
- **Why:** 'Toronto' not confirmed  (x 1)
  - Old: `Our own server is in Toronto, Canada.`
  - New: `Our own server is hosted with DigitalOcean; we have not yet confirmed its region.`
- **Why:** Bird is not used; Google added  (x 1)
  - Old: `(pattern) Resend and Stripe mainly in the United States, openrouteservice in Germany and Bird in the Netherlands`
  - New: `Resend, Google and Stripe mainly in the United States, and openrouteservice in Germany`
- **Why:** 'encrypted storage' unverified  (x 1)
  - Old: `including encrypted storage and transmission, access controls and regular security review of our own code.`
  - New: `including private per-client folders, access controls, sending files only over HTTPS, and review of our own code. We have not yet verified whether our server disks and backups are encrypted, so we do not claim it.`
- **Why:** automatic-deletion promise (deletion is by hand, on request)  (x 1)
  - Old: `Deleted information can stay in our providers&rsquo; automatic backups for a short time before it is gone.`
  - New: `For On File we delete a customer&rsquo;s data on request when the account is closed, usually within 30 days; we keep only the email address of anyone who asked us to stop emailing them, so that request keeps working. Deleted information can stay in backup copies until they expire.`

## Items in SITE-TEXT-FIXES.md and the brief that needed no change (already absent from the pages)

- "Chase missing client documents automatically", "follows up on its own", "Nobody on your staff sends a follow-up", "T1 season stops being a scramble", "The T183 comes last, not first": not present in this branch's pages when I checked, so there was nothing to change.
- "On File - subcontractor compliance" was present on /trades/ and is changed above. "Compliance exposure" is not present in this branch.
- QuickBooks, Xero, TaxDome and Karbon appear only in ReceiptSort's own code (a different product, a CSV export format). On File pages did not claim them; the pages now say so plainly.
- Text-message reminders: the only On File mention was in the accounting demo's search description (fixed above). Everything else already says email only.

## Things left alone on purpose (Dan decides)

- **Region of the server.** "Toronto" is gone, replaced by "hosted with DigitalOcean, region not yet confirmed". The same server holds Lead Me and Haul Me, so their sentence changed too. Put "Toronto, Canada" back only after you have looked at the droplet's region in DigitalOcean.
- **Your home address.** 78 Claus Bay is your home address. It is now labelled as the company mailing address in the Terms. It still appears as the address on /guardian/, /dispatchme/ and the Haul Me calculator page (other products, not changed here). A mailbox service or registered office avoids publishing it.
- **Terms section 4A** is new wording (pilot, 30 days' notice, hours-saved estimate). It was written from the product's own behaviour and is not legal advice; have it reviewed. Section 4 still says "cancel any time" for the other products.
- **Whether monthly plans really need 30 days' notice** (the facts file says yes, the old pages said no). The pages now say 30 days for On File only.
- **The demo pages' built-in voice-over** (`/demo/accounting/`, `/demo/trades/`, `/demo/it-msp/`) still says "switch to Automatic and the whole run plays through on its own. No clicking needed" in its narration clips (mp3 files). I changed the visible banner to say what "Automatic" is, but the spoken clips and their on-page captions need re-recording. The demo's "hours saved, about $X at $30/hr" figures are demo arithmetic, labelled "demo estimate"; left alone.
- **Calculator assumptions** (85% of hours come back over 46 weeks) are unchanged; they are labelled as an assumption on the page.
- **Privacy officer name and e-mail** (SITE-TEXT-FIXES 9) needs a person's name from you.
- **"Canada first - other countries on request"** in the demo footers is about where the product is sold, not where data lives; unchanged.
