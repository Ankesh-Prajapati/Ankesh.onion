# Ankesh Prajapati — Cybersecurity Portfolio

An interactive, terminal/desktop-OS-styled personal portfolio for **Ankesh Prajapati**, a Security Analyst & Penetration Tester at Securis360. The site simulates a Linux desktop environment — complete with draggable windows, a working terminal, a theme customizer, and a few playable mini-games — to present skills, experience, and projects in a way that fits the security/hacker aesthetic.

**Live look & feel:** boot sequence → desktop with app icons → click an icon to open a window (About, Skills, Experience, Projects, Certifications, Contact, Terminal, Neofetch) → drag, resize, minimize, or maximize like a real OS.

## Features

- 🖥️ **Desktop environment** — draggable/resizable windows, taskbar, start menu, right-click context menu
- 💻 **Working terminal** — type commands like `about`, `skills`, `projects`, `certs`, `experience`, `help`
- 🎨 **Theme customizer** — switch the entire UI's accent color via presets or a color wheel
- 🐍 **Mini-games** — Snake (with leaderboard), Tetris, and a hacker-style typing challenge
- 🖼️ **Neofetch-style system info panel** — a fun, familiar way to show role/company/stack at a glance
- 📱 **Responsive** — adapted layouts and touch controls for mobile/tablet
- ⚡ **Fast load** — lightweight terminal-style boot sequence, no build step required

## Sections

- **About** — who I am and what I do
- **Skills** — VAPT coverage areas and tools
- **Experience** — work history and education
- **Projects** — real, currently-maintained tools and repos (Warden, GhostRecon, GhostRecon v2, PhishAware)
- **Certifications** — CEH, CNSP, and other credentials
- **Contact** — email, phone, LinkedIn, GitHub

## Tech Stack

Plain HTML, CSS, and JavaScript — no frameworks, no build tools, no dependencies. Just open `index.html` in a browser or serve the folder statically.

## Project Structure
portfolio/
├── index.html          # Markup only
├── css/                 # Modular stylesheets (base, windows, terminal, theme, games, etc.)
└── js/                  # Modular scripts (windows, terminal, theme, games, etc.)


## Running Locally

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Deployment

Static site — deploy directly to **GitHub Pages**, Netlify, Vercel, or any static host. No build step needed.

## Contact
- 📧 ankeshprajapati217@gmail.com
- 🔗 [LinkedIn](https://linkedin.com/in/ankesh-prajapati-0a87a8249)
- 🐙 [GitHub](https://github.com/Ankesh-Prajapati)

## SEO

- **Live URL:** https://ankesh-prajapati.github.io/Ankesh.onion/
- `index.html` — optimized `<title>`, meta description, canonical URL, robots directives, Open Graph + Twitter cards, and JSON-LD (`WebSite`, `ProfilePage`, `Person`) so Google can connect the name *Ankesh Prajapati* to this site, Securis360, LinkedIn and GitHub.
- A visually-hidden, crawlable text version of every window (About, Skills, Experience, Projects, Certifications, Contact) with a single `<h1>` and proper `<h2>` sections.
- `sitemap.xml`, `robots.txt`, `og-image.png` (1200×630 share preview) and a full favicon set (`favicon.ico`, `favicon.svg`, 48/180/192/512 px PNGs).

### After every deploy
1. Google Search Console → add the URL-prefix property `https://ankesh-prajapati.github.io/Ankesh.onion/` and verify it.
2. Sitemaps → submit `sitemap.xml`.
3. URL Inspection → paste the live URL → **Request Indexing**.
4. Link to the portfolio from your LinkedIn (Contact info + Featured), GitHub profile README / website field, and the Securis360 team page if possible.
