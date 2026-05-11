# Contributing to Hive Command

Thanks for your interest. This project is open source and accepts contributions via fork-and-pull-request.

## Quick links

- 🟢 **[Live demo](https://hive-command-lemon.vercel.app)** — runs on generic seed data, no real backend
- 📖 **[USER_MANUAL.md](./USER_MANUAL.md)** — operator's guide to every page
- 🛠️ **[SETUP.md](./SETUP.md)** — install + Airtable schema + env vars

## How to contribute

### 1. Fork the repo

Click **Fork** on https://github.com/Anubisseth/hive-command to copy it to your own GitHub account.

### 2. Clone + run locally

```bash
git clone https://github.com/<your-username>/hive-command.git
cd hive-command
npm install
cp .env.example .env   # see SETUP.md for what to fill in
npm run dev            # http://localhost:5173
```

You can develop without setting up Airtable — the dashboard runs on the generic seed in `src/data/agents.js`.

### 3. Make your change

Create a branch with a descriptive name:

```bash
git checkout -b feat/your-feature-name
# or
git checkout -b fix/the-bug-you-fixed
```

### 4. Test it

- Lint: `npm run lint`
- Build: `npm run build`
- Manually click through the affected pages

If you changed:
- **3D office** → verify on `/office` that agents still spawn, walk, and don't clip through furniture
- **Commander Loop** → run a directive on `/commander` and confirm Decompose → Distribute → Execute → Collect → Review still completes
- **Airtable wiring** → test both with and without Airtable configured
- **AI proxy** → don't break the rate limits (`api/ai.js`) — see [SETUP.md security notes](./SETUP.md#rate-limits-on-apiai-built-in)

### 5. Push + open a PR

```bash
git push -u origin feat/your-feature-name
```

Then open a PR against `Anubisseth/hive-command` `main`. In the description:
- What's the change
- Why
- Screenshots if visual
- Anything I should test specifically

## Coding conventions

- **Atomic Design** — atoms / molecules / organisms / templates / pages under `src/components/`
- **No personal data in committed code** — venture names, agent mandates, API keys all stay in `.env` or Airtable
- **CSS via tokens** — use the custom properties in `src/styles/index.css` (`--bg-primary`, `--accent-primary`, etc.), not hex literals
- **Animation variants in `src/motion/`** — compose, don't inline complex Framer Motion code
- **Server-side keys NEVER VITE_-prefixed** — anything VITE_ goes into the browser bundle
- **Airtable mutations are optimistic** — update Zustand first, sync to Airtable in the background

## What we want

Good fits for PRs:

- New page features that fit the operator-centric mental model
- 3D office polish — better character animations, NavMesh pathfinding, environment props
- New AI providers in `api/ai.js` (route via the existing fallback chain)
- New team templates in `src/data/teamTemplates.js` for other industries
- Performance — anything that improves frame rate on `/office` with 30+ agents
- Accessibility — ARIA labels, keyboard navigation, screen reader support
- Tests — there are currently zero. Even a few Vitest specs around the store would help.

Less good fits:

- Multi-tenant auth — out of scope until Phase D
- Mobile-first redesign — the desktop tactical theme is intentional
- Switching frameworks (Next.js, SvelteKit, etc.) — Vite + React stays
- Removing the hive metaphor — Queen Bee / Workers / etc. is core brand

## Reporting bugs

[Open an issue](https://github.com/Anubisseth/hive-command/issues/new) with:

1. **Steps to reproduce** — page, click sequence, input
2. **Expected** vs **actual** behaviour
3. **Browser + OS**
4. **Screenshot** if visual
5. **Console errors** if any (DevTools → Console)

## Security

Don't open a public issue for security findings. Email the maintainer or open a [private security advisory](https://github.com/Anubisseth/hive-command/security/advisories/new) on GitHub.

## License

By contributing you agree your contributions are licensed under MIT, same as the rest of the project.
