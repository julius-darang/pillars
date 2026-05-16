# Ritual — Daily Habit Tracker

A minimalist, offline-first habit tracker built on a three-pillar philosophy: **Mind**, **Body**, and **Soul**.

## Features

- Track daily habits across three pillars (Mind, Body, Soul)
- Streak tracking — current, best, and weekly
- Weekly calendar view with completion indicators
- Drag-and-drop habit reordering
- Collapsible pillar sections
- Weekly goal with progress bar
- 7-day history chart
- Daily reminder notifications (via browser Notification API)
- Export / import data as JSON
- Fully offline via service worker (PWA)
- No account, no server — all data stays in your browser

## Getting started

No build step required. Open `index.html` directly in your browser, or serve the directory with any static file server:

```bash
npx serve .
# or
python3 -m http.server
```

Then open `http://localhost:3000` (or whichever port is shown).

## Installing as a PWA

Open the app in Chrome or Safari and use the browser's "Add to Home Screen" / "Install App" option. The service worker enables full offline use after the first load.

## Project structure

```
index.html   — markup and layout
style.css    — all styles and CSS custom properties
app.js       — application logic and state management
sw.js        — service worker for offline caching
manifest.json — PWA metadata
```

## Data

All data is stored in `localStorage` under the key `ritual_jd_v1`. Use **Settings → Export as JSON** to back up your data, and **Import from JSON** to restore it.

## Tech stack

Vanilla HTML, CSS, and JavaScript — no frameworks, no build tools, no dependencies beyond Google Fonts.
