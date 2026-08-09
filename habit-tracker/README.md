# Daybook

Habit tracker + 15-minute check-in log. Built as a PWA, backed by Supabase.

## 1. Run the migration

In your Supabase project → SQL Editor, run everything in `supabase-migration.sql`. This adds the category, bad-habit, essential, and tag columns to your existing tables. Safe to run even once already applied.

## 2. Local dev (optional)

```
npm install
npm run dev
```

## 3. Deploy via GitHub + Netlify

1. Push this folder to a new GitHub repo.
2. In Netlify: **Add new site → Import an existing project → GitHub** → pick the repo.
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Deploy.

Supabase URL and key are already embedded in `src/lib/supabase.js` — no environment variables needed since you're using the public/publishable key.

## 4. Add to your home screen

Open the deployed Netlify URL on your phone → browser menu → **Add to Home Screen**. This is what makes the check-in pings usable — Daybook needs to stay open (or at least be the active tab) to fire the 15-minute reminder, since it's a browser-based app rather than a native one.

## How it works

- **Routine tab** — your morning/afternoon/evening habits, plus a separate "Avoiding" section for bad habits you're tracking in reverse. Streaks and a 21-day dot ledger per habit. Tap the name to edit.
- **Check-in tab** — quick-tap chips (reordered by what you actually log most at that hour), tag each entry Productive/Neutral/Wasted, optional 15/30/60-min ping while the tab's open, editable ping window.
- **Insights tab** — weekly completion, category balance (Business/Content/Health/Personal), time-split from your tags, best focus hour, current streaks, CSV export.
- **Mismatch flag** — if a routine habit has a scheduled time and your check-in log around that hour doesn't mention it, it's flagged "mismatch" so the two systems keep each other honest.

Data lives in your Supabase project — same data on any device you open the URL from. The ping window/interval setting is local to each device by design.
