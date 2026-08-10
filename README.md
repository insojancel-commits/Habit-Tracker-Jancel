# Daybook

A private, fully offline ledger for how you actually spend your day — no
login, no server, no account. Everything is saved right in your browser.

Three tabs:
- **Check-In** — log what you're doing right now, tagged productive / wasted / neutral
- **Routine** — a daily checklist of habits, grouped by time of day, with streaks
- **Insights** — streaks, a contribution heatmap, weekly trends, backup/restore, and CSV export

---

## How your data works

There's no backend. All your habits, logs, and check-ins are stored in this
browser's `localStorage`, on this device only. That means:

- It works completely offline, everywhere — no internet connection is ever
  needed, even the first time you open it.
- Your data does **not** sync between devices automatically. Installing it
  on your phone and your laptop gives you two separate, independent copies.
- Clearing your browser's site data, using private/incognito mode, or
  uninstalling the app **will delete your data**. There's no cloud copy to
  fall back on.

That's what the **Backup** button on the Insights tab is for — use it.

## Backing up and restoring your data

Open the **Insights** tab:
- **Download backup** saves everything (habits, logs, check-ins, settings)
  as one JSON file, e.g. `daybook-backup-2026-08-10.json`. Save it
  somewhere durable — cloud storage, email it to yourself, AirDrop it, etc.
- **Restore from file** loads a backup file back in. This replaces
  everything currently on the device, so it's also how you move your data
  to a new phone: back up on the old one, install the app on the new one,
  restore there.
- The **CSV export** buttons below that give you the same data as plain
  spreadsheets (habits / habit logs / check-ins), handy for your own
  analysis, but they're not meant for restoring — use the JSON backup for that.

There's no automatic backup schedule — it's a manual button, so make a
habit of tapping it every so often (weekly is reasonable), and definitely
before switching phones or reinstalling.

## 1. Build it

```bash
npm install
npm run build
```

This produces a `dist` folder — a set of plain static files. That's the
entire app; nothing else is needed to run it.

## 2. Put it on a URL

A browser can only "install" something served over `http(s)`, so `dist`
needs to be hosted somewhere. Pick whichever is easiest:

**Netlify (free, easiest):**
```bash
npm run build
```
Drag the generated `dist` folder onto
[app.netlify.com/drop](https://app.netlify.com/drop). You'll get a URL
immediately — no account required for this option, though creating one
lets you keep the URL stable across updates.

**Vercel / GitHub Pages / Cloudflare Pages:** any static host works the
same way — point it at this repo (or just upload `dist`), build command
`npm run build`, publish directory `dist`.

**On your own network (no hosting account at all):**
```bash
npm run build
npx serve dist
```
This prints a local address (e.g. `http://192.168.1.23:3000`). Open that
on your phone's browser as long as the phone is on the same Wi-Fi as the
computer running it. Good for testing; the server needs to keep running on
your computer for the phone to reach it, so it's not a great fit for
permanent daily use — use one of the hosted options above for that.

## 3. Install it on your phone

Once it's on a URL, open that URL in your phone's browser:

- **iPhone (Safari — must be Safari, not Chrome):** tap the Share icon →
  **Add to Home Screen**.
- **Android (Chrome):** tap the ⋮ menu → **Install app** (or **Add to Home
  Screen**).

This adds a Daybook icon to your home screen that opens full-screen, no
browser address bar — a real installed app. The service worker that ships
with the build caches the app itself, so it opens and works with no signal
at all, exactly like before you installed it, since all data was already
local to begin with.

## Project structure

```
src/
  lib/            date/timezone helpers, streak math, CSV export, local storage + backup
  hooks/          useDaybookData (all CRUD, localStorage-backed)
  components/     Toast, and the three tabs + their sub-components
  App.jsx         layout, tab bar, routing between tabs
  index.css       design tokens + all styles
```

## Design notes for future-you

- **Storage**: `src/lib/localStore.js` is the only place that touches
  `localStorage`. `useDaybookData.js` is the only place that calls it —
  components never read or write storage directly.
- **Timezones**: `checkins.logged_at` is stored as UTC. Every place that
  needs "which calendar day" a timestamp falls on goes through
  `localDateFromISO()` in `src/lib/dateHelpers.js` — never a UTC string
  slice. This matters most for entries logged late at night.
- **Streaks**: calculated in exactly one place, `src/lib/streaks.js`,
  imported by both Routine and Insights. Don't add a second implementation.
- **Destructive actions**: deleting a check-in requires an inline confirm
  tap; deleting a habit requires archiving first, with "delete forever"
  behind a second confirmation, since it erases history permanently.
  Restoring a backup also confirms before overwriting the device's data.

## License

Yours — this was built for your own use, do whatever you like with it.
