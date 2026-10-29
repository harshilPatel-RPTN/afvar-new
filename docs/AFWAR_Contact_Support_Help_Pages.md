# AFWAR – Contact, Support & Help Page Content

Prepared from: AFWAR Proposed Project Documentation v2.0, AFWAR Proposed AI Features, v2 LLM-Centric Architecture Explained, Architecture Comparison v1 vs v2, AI Trading Assistant Backend Stack (October 2026).

Items marked **[TO CREATE]** are not in any source document and need a decision before launch.

---

## 0. Before you build: things that affect all three pages

1. **Add the routes.** Section 15 of the proposal lists every route, and `/contact`, `/support` and `/help` are not there. Two redirect rules would break them:
   - "Unknown route → /desktop or /login" would swallow them.
   - "Viewport < 1000 px → /unsupported" would block them on phones.

   Add them as **public SSR routes** and exempt them from the 1000 px rule. A mobile user who can't use the desktop still needs to reach support.
2. **No contact details exist in the documents.** Email, phone, hours and social links all have to be created.
3. **Keep confidential material off public pages.** That means:
   - AI model names (the documents deliberately say "Model X*")
   - Running costs
   - The competitor comparison
   - The licensing status of data providers. The Pro-launch confirmations for Twelve Data, Binance and Alpaca/Benzinga are still pending.
4. **Use the brand voice everywhere, including support replies.** AFWAR never says "buy" or "sell", never trades, and shows a source for every number.
5. **Indian legal publishing duties. Confirm with your CA, CS or lawyer.**
   - **Companies Act 2013, s.12(3)(c):** official communications should show the company name, registered office, CIN, phone and email.
   - **IT (Intermediary) Rules 2021:** the 8 communities host user posts, which likely makes AFWAR an intermediary that must publish a **Grievance Officer**.
   - **DPDP Act 2023:** you need a published contact for personal-data requests (access, correction, deletion).

### Footer disclaimer (use on all three pages)

> AFWAR provides market information, analysis and explanation only. It never places, modifies or closes trades, and nothing on AFWAR is investment advice. Trading decisions and their responsibility remain with the user.

---

## 1. Contact page – `/contact`

**Purpose:** who we are and how to reach us.

### 1.1 Company details (from the proposal, section 1)

| Field | Value |
|---|---|
| Legal name | RedPhantom Tech Novelty Private Limited |
| Product | AFWAR – AI Trading Assistance Operating System |
| CIN | U72900PN2021PTC204792 |
| Registered office | Gat No. 52/1B, Plot No. 6, Savarkarnagar, Pandharpur, Solapur, Maharashtra 413304, India |
| Incorporated | October 2021, Registrar of Companies, Pune |
| Status | Active, private limited company |
| Directors (optional to show) | Sakshi Somnath Dombe, Sudhakar Popat Rupnar |

Suggested intro line:
> AFWAR is built and operated by RedPhantom Tech Novelty Private Limited, an Indian technology company headquartered in Pandharpur, Maharashtra.

### 1.2 Contact channels [TO CREATE]

The documents give the domain as `afwar.app`. These are suggested addresses:

| Purpose | Address |
|---|---|
| General enquiries | hello@afwar.app |
| Product support | support@afwar.app (link to the Support page) |
| Partnerships, data and business | business@afwar.app |
| Press and media | press@afwar.app |
| Legal and privacy | legal@afwar.app |
| Grievance Officer | Name, email, response time **[TO CREATE]** |
| Phone | **[TO CREATE]** |
| Business hours | **[TO CREATE]**, e.g. Mon–Fri, 10:00–18:00 IST |
| Social links | **[TO CREATE]** |

### 1.3 Contact form fields

- Full name
- Email
- Country
- Preferred language: English / Hindi / Marathi (the three launch editions)
- Topic: General / Partnership / Press / Legal / Other
- Message
- Consent checkbox for the privacy policy

### 1.4 Optional extras

- Map of the registered office (Pandharpur)
- Links to the Support and Help pages, so users with product questions go there

---

## 2. Support page – `/support`

**Purpose:** getting a specific problem fixed.

### 2.1 Support request form

| Field | Notes |
|---|---|
| Account email | Required |
| Category | See 2.2 |
| Instrument (if relevant) | XAUUSD, XAGUSD, WTI, EURUSD, USDJPY, GBPUSD, NZDUSD, or Crypto (state the coin) |
| Window affected | One of the 11 windows (see 3.3) |
| Date and time of issue | Include your time zone |
| Description | Required |
| Screenshot | Optional upload |
| Provenance badge text | For a wrong or delayed number: copy the badge (source, venue, time, delay, cache age) |
| Verdict ID | For AI verdict issues |
| Browser and screen size | The desktop needs at least 1000 px |

### 2.2 Support categories

These follow the team modules in section 14.1, so each ticket goes straight to the module owner.

| Category | Typical issues | Module |
|---|---|---|
| Account and login | Sign-in, registration, session expired, edition, time zone or currency settings | auth |
| Market data | Missing or delayed prices, "delayed" label, a number that looks wrong | market |
| AI analyst and verdicts | Verdict card questions, "WAIT" results, citation looks wrong | verdict |
| OS Agent, chat and voice | Command not understood, voice not working, language issues | assistant |
| Alerts | Alert didn't fire, problems with the confirmation step that repeats the alert back | assistant / workspace |
| Risk Guardian and MT5 connection | Connecting the read-only investor login, positions not showing, warnings | trading |
| Workspace and devices | Layout not restoring, pop-out windows, moving panels between devices, full screen | workspace |
| News, Calendar and Daily Brief | Missing events, brief not loading | content |
| Community | Report a post or user, moderation | community |
| Privacy and data | Export or delete your data | auth / legal |
| Billing and credits | Credit charges; add payments when Stripe goes live in Phase 2 | — |

### 2.3 What AFWAR support will never do

Show this prominently. Scammers may pretend to be AFWAR.

- We will **never** ask for your MT5 master or trading password. AFWAR only uses the read-only **investor** password.
- We will **never** tell you to buy or sell anything, or give trading tips or signals.
- We will **never** ask you to send money, crypto or API keys to any person.
- AFWAR has **exactly 8 official communities**, all inside the app. Any other "AFWAR" group, channel or Telegram is not us.

### 2.4 Other blocks on the page

- **System status** for the data feed, AI analyst, alerts and login. Sentry and Application Insights can drive this. **[TO CREATE]**
- **Response times** by category or priority. **[TO CREATE]**
- **Support languages:** English, Hindi, Marathi
- **Report a security issue:** a security contact. **[TO CREATE]**
- Link to the Help page for how-to questions

---

## 3. Help page – `/help`

**Purpose:** how to use AFWAR. Structure it as a help centre with the sections below.

### 3.1 Getting started

1. **Register or log in.**
2. **Onboarding:** choose your edition (English, Hindi or Marathi), your region and time zone, and a starter watchlist of the 8 coverage lanes.
3. **Guided tour:** runs once, the first time you open the desktop.
4. **Screen:** use a screen of at least 1000 px wide. Full screen is recommended, and you can toggle it from the top bar.
5. **Returning users:** your desktop restores exactly as you left it.

### 3.2 What AFWAR covers

| Instrument | Symbol | Type |
|---|---|---|
| Gold | XAUUSD | Commodity (metal) |
| Silver | XAGUSD | Commodity (metal) |
| Crude Oil | WTI | Commodity (energy) |
| Euro / Dollar | EURUSD | Forex |
| Dollar / Yen | USDJPY | Forex |
| Pound / Dollar | GBPUSD | Forex |
| Kiwi / Dollar | NZDUSD | Forex |
| Cryptocurrencies | BTC-USD + all listed coins | Crypto (Bitcoin first, 24/7) |

AFWAR does not cover stocks.

### 3.3 Using the desktop

**The 11 windows:**
- Desktop and Workspaces
- Chart
- Watchlist
- Instrument Card
- AI Chat and Voice
- News
- Economic Calendar
- Daily Brief
- Risk Guardian and Positions
- Terminal (MT5)
- Community

**Working with windows:**

| Action | How |
|---|---|
| Move a window | Drag its title bar |
| Resize | Drag any edge or corner |
| Save a layout | Automatic, saved to your account |
| Second monitor | Drag a panel to the screen edge to pop it out |
| Move a panel to another device | Drag it onto the device chip of another signed-in screen |
| Open anything quickly | Command palette: ⌘K / Ctrl+K |
| Chart timeframes | 15m, 1h, 4h, 1d |

### 3.4 Talking to the AI (OS Agent)

The AI can operate the whole workspace by typed command, chat or voice, in English, Hindi or Marathi.

**Example commands:**
- "gold 4h"
- "open my risk panel"
- "same for silver"
- "close this"
- "Close everything, open gold and the calendar side by side"
- "Send the news to my second screen"
- "Silver ka 1 hour chart dikhao" (Hindi)

**Voice:** push to talk. Spoken questions get spoken answers, and actions are confirmed aloud.

**Not possible:** "Buy 2 lots of gold" is politely declined, with a pointer to your own broker terminal window.

### 3.5 Understanding a Verdict

| Part | Meaning |
|---|---|
| BULLISH / BEARISH / WAIT | The analyst's market view. WAIT means signals disagree, and it is a real answer. |
| Key levels / watch zone | Price areas that matter |
| Invalidation | The level where the view is proven wrong |
| Objective | The level the view expects price to reach |
| Rationale | The reasoning behind the view |
| [calc #n] | Links each number to the logged code calculation that produced it |

The AI never says "buy" or "sell". This is deliberate.

**Example verdict:**
> **XAUUSD 1H · BULLISH** · watch zone 2,642–2,648 · invalidation below 2,631 · objective 2,671
>
> Higher low holding above rising EMA-50 [calc #3]; dollar index down 0.4% after CPI [calc #5]; ATR 6.2 supports the objective [calc #6].

### 3.6 Provenance badges and credits

- Every quote and verdict shows **source, venue, time, delay and cache age**, for example `live · cache 12 s`.
- "Served from cache – 0 credits" means the analysis was already made and you were not charged.
- Fresh analyses show their credit cost.

### 3.7 Track Record

- Every verdict, including every WAIT, is graded by code against what price actually did.
- **Win rate:** how often calls were right. **Expectancy:** the average result per call.
- Example: "Calls like this: right 27 of 41 · expectancy +0.6R."
- Results are public, per instrument and timeframe. Link to the scoreboard page.

### 3.8 Alerts

1. Describe the alert in plain words, e.g. "Alert me if gold closes above the weekly high and RSI is above 70."
2. AFWAR repeats back exactly what it understood. Check it, then **Confirm** or **Edit**.
3. Alerts are checked by code on closed candles and arrive in-app, by push notification, or by voice.
4. If your wording is unclear, AFWAR asks a clarifying question instead of guessing.

### 3.9 Risk Guardian and MT5

- Connect your MT5 account using the **read-only investor password only**.
- Set limits in plain words, e.g. "Warn me at 2% daily loss." AFWAR confirms the rule back to you.
- It tracks daily loss, drawdown and margin, and **only ever warns**. It can never act on your account.
- **MT5 Terminal window:** runs sandboxed. AFWAR cannot see or touch it, and you trade there with your own broker.

### 3.10 Daily Brief, News and Calendar

- **Daily Brief:** one per edition each morning, covering overnight moves, key levels, today's events and top headlines. Available as a window, a public page and an audio summary.
- **News:** each headline is tagged with the instruments it affects, its relevance and its sentiment.
- **Calendar:** countdowns before FOMC, CPI, NFP and EIA releases, showing consensus vs previous and how each instrument has historically reacted.

### 3.11 Communities

- 8 fixed rooms, one per coverage lane: Gold, Silver, Oil, EURUSD, USDJPY, GBPUSD, NZDUSD, Crypto.
- You can join, read and post.
- Users cannot create, rename or delete communities, by design.
- To report a post or user, see the Support page.

### 3.12 Language, currency and time zone

- Editions: English, Hindi, Marathi. All editions use a left-to-right layout.
- Prices can display in your own currency, and session clocks follow your time zone.
- Change these in Settings.

### 3.13 FAQ

**Can AFWAR place trades for me?**
No. No order function exists anywhere in AFWAR: not in the app, not in the API, not in the AI.

**Why did the AI refuse my "buy" command?**
AFWAR observes, analyses and explains, and never trades. Use your broker terminal window to trade.

**Why won't the AI tell me to buy or sell?**
AFWAR gives analysis, not advice. The decision is always yours.

**Why did I get WAIT?**
The signals disagree, so the analyst doesn't force a direction.

**Where do the numbers come from?**
Every number is calculated by code from a named data source and shows its source on the badge. The AI never guesses a number.

**Can I trust the AI?**
Check the public Track Record. Every call is graded against what price actually did.

**Why is a price labelled "delayed" or "cache"?**
The badge shows exactly how fresh the data is and where it came from.

**Can I add stocks or other instruments?**
Not currently. AFWAR focuses on its 8 coverage lanes; more crypto coins are available through search.

**Can I create my own community?**
No. There are exactly 8 official rooms, by design, to keep discussion focused and free of scams.

**Is my broker account safe?**
AFWAR uses read-only investor access only, never holds credentials with trading rights, and encrypts what it stores.

**Why doesn't AFWAR work on my phone?**
The multi-window desktop needs a screen at least 1000 px wide.

**How do I export or delete my data?**
Contact Support under "Privacy and data".

**Is AFWAR investment advice?**
No. See the disclaimer at the bottom of the page.

### 3.14 Coming soon (optional; show only when ready to announce)

- **Wave 1 (launch +1–3 months):** Journal window, AI Journal Coach, Voice Journaling, Portfolio Doctor and stress tests, Semantic Search, named layout presets, event playbooks
- **Wave 2 (launch +3–6 months):** Multi-Agent Research Desk, Backtest Narrator, Scenario Simulator, Learning Lab

---

## 4. Open decisions checklist

- [ ] Email addresses (general, support, business, press, legal)
- [ ] Phone number and business hours
- [ ] Grievance Officer name and contact (IT Rules 2021)
- [ ] Data-protection contact (DPDP Act 2023)
- [ ] Security issue reporting contact
- [ ] Support response times
- [ ] System status page
- [ ] Social media links
- [ ] Whether to show directors' names
- [ ] Add `/contact`, `/support`, `/help` to the route table, exempt from the 1000 px redirect
- [ ] Legal review of the disclaimer wording
