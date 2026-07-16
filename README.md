# Ankesh Prajapati — CyberSec Desktop Portfolio

An interactive, desktop-OS-styled portfolio site. Refactored into a clean,
multi-file structure that's ready to push straight to GitHub Pages.

## Structure

```
portfolio/
├── index.html            Markup only — no inline <style> or <script> blocks
├── css/
│   ├── base.css           CSS variables, reset, tooltip
│   ├── cursor.css         Standard, theme-adaptive cursor rules
│   ├── loader.css         Fast terminal boot screen
│   ├── desktop.css        Desktop background, icons, taskbar, context/start menu
│   ├── windows.css        Window chrome + About/Skills/Experience/Projects/Certs/Contact content
│   ├── terminal.css       Terminal window + neofetch styling
│   ├── theme.css          Theme customizer (color wheel, presets)
│   ├── games.css          Shared utility classes for hack.exe / tetris.exe / snake.exe
│   ├── animations.css     Konami-code alert overlay + keyframes
│   └── responsive.css     Mobile / small-screen breakpoints
└── js/
    ├── favicon.js         Animated favicon canvas
    ├── loader.js           ~1.2s boot sequence, then hands off to the desktop
    ├── desktop-bg.js       Particle-network canvas background
    ├── windows.js          Open/close/drag/resize/focus/taskbar + auto-sizing + cascade placement
    ├── icon-grid.js        Desktop icon layout & drag-to-reorder
    ├── theme.js             Wallpaper/theme customizer + accent color engine
    ├── terminal.js          Terminal shell (commands, content data)
    ├── context-menu.js      Right-click menu, start menu, toast notifications
    ├── clock.js              Taskbar clock, desktop clock widget, neofetch uptime
    ├── tray.js               Battery/network tray icons
    ├── konami.js             Konami-code easter egg
    ├── boot-shutdown.js      Shutdown/reboot overlay + "intruder" toast easter egg
    ├── snake.js               Snake game (idle demo + full game + leaderboard)
    ├── tetris.js              Tetris game
    ├── typingtest.js          "hack.exe" typing challenge
    └── cursor.js              Generates the theme-tinted standard cursor
```

## What changed from the original single-file version

- **DFIR de-emphasized.** Removed forensics-heavy skill bars, tool chips
  (UFED/EnCase/Talon), stats, and forensic certifications. Kept a single,
  brief mention of prior time at the State Cyber Crime Cell. About, Skills,
  Experience, and Projects now reflect current VAPT/pentesting work at
  Securis360. The four existing projects were kept as-is (per request, no
  new projects were invented) with de-DFIR'd tags/descriptions.
- **Cursor:** the custom crosshair + trailing ring were removed. The cursor
  is now a normal arrow pointer, generated as a small inline SVG so it can
  pick up the current accent color automatically whenever the theme changes.
- **Loader:** replaced the multi-second "hacking" animation with a compact
  terminal boot sequence that finishes in ~1.2–1.5s.
- **Windows:** the About and Neofetch windows no longer overlap on startup.
  Windows now size themselves to their content (up to a max-height) instead
  of using a fixed height + always-visible scrollbar — the inner scrollbar
  only appears if content genuinely overflows. Drag, resize (mouse + touch),
  minimize, and maximize all still work.
- **Code organization:** all CSS and JS were extracted out of `index.html`
  into logical modules. The three mini-games (typing test, tetris, snake)
  had their heaviest inline styling converted into reusable classes in
  `games.css`.

## Running locally

No build step — just serve the folder:

```bash
cd portfolio
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploying to GitHub Pages

Push the contents of `portfolio/` to your repo root (or a `docs/` folder)
and enable GitHub Pages on that branch/folder.
