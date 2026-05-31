# CET LMS - Quick Start Guide

## ⚠️ IMPORTANT: How to Run This App

**DO NOT open `index.html` directly in your browser!** This app uses ES6 JavaScript modules which require HTTP protocol to work.

### ✅ Correct Way to Run:

#### Option 1: Double-click `start-server.bat` (Windows - Easiest)
1. Double-click `start-server.bat` in the project folder
2. Wait for "Serving HTTP on..." message
3. Open browser to: **http://localhost:8080**
4. Keep the command prompt open while using the app

#### Option 1B: Quick Restart (When you've made code changes)
1. Double-click `restart-server.bat`
2. This kills any old server and starts a fresh one
3. Browser opens automatically to http://localhost:8080
4. Use this when you update CSS/JS and want to ensure fresh cache

#### Option 2: Use VS Code Live Server (Recommended for Development)
1. Install "Live Server" extension in VS Code
2. Right-click `index.html` 
3. Select "Open with Live Server"
4. Browser opens automatically

#### Option 3: Manual Python Server
```bash
cd F:\Projects\cet_app
python -m http.server 8080
```
Then open: http://localhost:8080

---

## 📁 Project Structure

```
cet_app/
├── index.html              # Main entry point
├── manifest.json           # PWA manifest
├── css/                    # Stylesheets
│   ├── reset.css           # CSS reset
│   ├── variables.css       # Design tokens
│   ├── layout.css          # Shell / sidebar
│   ├── components.css      # Shared components
│   ├── animations.css      # Transitions & keyframes
│   ├── utilities.css       # Utility classes
│   ├── typography.css      # Type scale
│   ├── pages/              # Page-specific styles
│   └── components/         # Component-specific styles
├── js/                     # JavaScript modules
│   ├── app.js              # Entry point
│   ├── router.js           # SPA hash router
│   ├── store.js            # Reactive state
│   ├── db.js               # localStorage layer
│   ├── data.js             # Static curriculum data
│   ├── theme.js            # Dark/light toggle
│   ├── audio.js            # Sound effects
│   ├── utils.js            # Shared helpers
│   ├── pages/              # Page renderers (8 pages)
│   └── components/         # Reusable UI components
├── data/                   # App data
│   ├── quiz_data.json      # Quiz questions
│   ├── textbook_data.json  # Chapter content
│   ├── flashcard_data.json # Flashcard decks
│   └── extracted/          # Raw JSON from PDFs
└── scripts/                # Build & extraction tools
```

---

## 🎨 Features

- **Dashboard** — Stats, streaks, subject progress
- **Subjects** — Browse all CET subjects
- **Subject Detail** — Chapters & resources for a subject
- **Reader** — Read extracted chapter content
- **Quiz** — Test your knowledge
- **Flashcards** — Quick review with spaced repetition
- **Timer** — Pomodoro study sessions
- **Progress** — Track your improvement

---

## 🛠️ Development Notes

- **ES6 Modules**: Requires HTTP server (won't work with file://)
- **No Build Step**: Vanilla JS, no bundler needed
- **CSS Cache**: Version query params (`?v=3`) for cache busting
- **Dark Theme**: Default theme (toggle with D key)

---

## 🔧 Troubleshooting

**Q: Clicking navigation does nothing**
A: You're opening the file directly. Use a web server instead!

**Q: CSS changes not showing**
A: Hard refresh (Ctrl+Shift+R) or check cache-busting version

**Q: Data not persisting**
A: Check browser's localStorage is enabled

**Q: Content not loading**
A: Ensure `data/extracted/` folder has JSON files

---

## 📞 Need Help?

Check the browser console (F12) for error messages.
