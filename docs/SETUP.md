# Setup & Deployment Guide

This guide covers local development setup, environment configuration, available scripts, and production builds for the **Cyber Defense Console**.

---

## Prerequisites

- **Node.js**: `v20.x` or `v22.x` LTS recommended
- **Package Manager**: `npm` (`v10+`) or `bun`

Verify your local toolchain:

```bash
node -v
npm -v
```

---

## Local Installation

1. **Install project dependencies**

   ```bash
   npm install
   ```

2. **Environment Configuration**

   Copy `.env.example` to `.env` if you plan to connect server-side integrations or custom APIs:

   ```bash
   cp .env.example .env
   ```

   | Variable | Purpose | Required |
   | --- | --- | --- |
   | `GEMINI_API_KEY` | Optional key for server-side Gemini API extensions | No (for UI console) |
   | `APP_URL` | Hosted application URL for callbacks/links | No (for local dev) |

   > **Security Note:** Never commit `.env` files or API secrets to version control. `.gitignore` excludes local environment files by default.

   For configuring persistent storage (PostgreSQL or Firebase Firestore), see **[Database Setup Guide](./DATABASE_SETUP.md)**.

3. **Run the Development Server**

   ```bash
   npm run dev
   ```

   Vite serves the console on `http://localhost:3000` (`--port=3000 --host=0.0.0.0`).

---

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts Vite development server on port `3000` |
| `npm run lint` | Runs TypeScript type-checking (`tsc --noEmit`) |
| `npm run build` | Builds optimized production assets into `dist/` |
| `npm run preview` | Serves the `dist/` production bundle locally for verification |
| `npm run clean` | Removes `dist/` build artifacts |

---

## Production Build & Deployment

1. **Verify TypeScript & build output**

   ```bash
   npm run lint
   npm run build
   ```

   This outputs static HTML, CSS, and JS bundles to `dist/` (and copies static assets from `src/assets` automatically via `vite.config.ts`).

2. **Preview production build locally**

   ```bash
   npm run preview
   ```

3. **Hosting Options**
   - **Static Hosting (Vercel, Netlify, Cloudflare Pages, GitHub Pages)**: Set the build command to `npm run build` and output directory to `dist`.
   - **Container / Node Server**: Serve the `dist/` directory behind Nginx, Caddy, or a Cloud Run service.

---

## Troubleshooting

- **Port 3000 already in use**: Stop any existing process on port `3000` or override with `npx vite --port=3001`.
- **Browser extension `window.fetch` errors**: Privacy or recording Chrome extensions that attempt to overwrite `window.fetch` inside sandboxed iframes can log console `TypeError` warnings; test in an Incognito window if needed.
