# Voice Timer

A high-precision interval timer with pre-rendered voice countdowns and chime audio cues.

## Features

- **High-Precision Timing**: Sub-second accurate countdown loop.
- **Voice Cues**: Spoken countdown numbers using pre-rendered audio clips with Web Speech fallback.
- **Audio Chimes**: Beeps and completion tones with offline Web Audio synthesis fallbacks.
- **Visual Feedback**: Circular progress rings and segment tracking.
- **Customizable Routines**: Multi-loop and multi-segment timer configuration.
- **Keyboard Shortcuts**: Complete control via keyboard hotkeys.
- **PWA & Offline Ready**: IndexedDB audio persistence and offline operation.

---

## Deploying to GitHub Pages

This project is pre-configured for seamless deployment to **GitHub Pages**.

### Method 1: Automatic Deployment with GitHub Actions (Recommended)

A GitHub Actions workflow is included at `.github/workflows/deploy.yml`.
1. **Push your code to GitHub**:

   ```bash
   git add .
   git commit -m "Configure GitHub Pages deployment"
   git push origin main
   ```

2. **Enable GitHub Actions Pages Source**:
   - Go to your repository on GitHub.
   - Click **Settings** > **Pages** (in the left sidebar under _Code and automation_).
   - Under **Build and deployment** -> **Source**, select **GitHub Actions**.

3. **Done!**
   - The `.github/workflows/deploy.yml` workflow will trigger automatically whenever you push to `main` (or `master`).
   - Your live site URL will be displayed in the **Actions** tab or under **Settings** > **Pages**.

---

### Method 2: Manual Deployment using `gh-pages`

If you prefer to deploy directly from your local terminal using the `gh-pages` npm package:
1. **Run the deploy command**:

   ```bash
   npm run deploy
   ```

   _This automatically runs `npm run build` first, then pushes the contents of the `dist/` folder to the `gh-pages` branch._

2. **Configure GitHub Pages to use the `gh-pages` branch**:
   - Go to your GitHub repository **Settings** > **Pages**.
   - Under **Build and deployment** -> **Source**, select **Deploy from a branch**.
   - Select **Branch**: `gh-pages` and **Folder**: `/ (root)`.
   - Click **Save**.

---

## Technical Configuration Details

- **Relative Asset Resolution**: `vite.config.ts` uses `base: process.env.VITE_BASE_PATH || process.env.BASE_URL || './'` so that built scripts, stylesheets, and voice audio `.opus` files resolve relative to your GitHub Pages repository path (`https://<username>.github.io/<repository-name>/`).
- **Custom Base Path Override**: If needed for specific routing environments, you can specify a custom base path when building:

  ```bash
  VITE_BASE_PATH=/my-repo-name/ npm run build
  ```

---

## Local Development

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Lint & type-check
npm run lint

# Build for production
npm run build

# Preview build locally
npm run preview
```
