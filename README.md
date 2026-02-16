# MM Maker — Minit Mesyuarat & OPR Generator

A single-page, client-heavy Next.js 16 experience for Malaysian panitia teams to write meeting minutes and One Page Reports, upload supporting images/signatures, and publish finished documents without any server runtime. The entire UI + data workflow runs inside the browser, while document export relies on `docx`, `html-to-image`, and browser print-to-PDF.

## What it does
- Provides a two-tab workflow for **Minit Mesyuarat** and **OPR** documentation with sticky top navigation, profile-aware settings, and downloadable Docx/PDF outputs.
- Saves every organization profile and member list in `localStorage` through the `SettingsProvider` (`src/lib/settings-context.tsx`), so switching contexts stays instant even when the page reloads.
- Lets you upload logos and signatures, drag in frequent phrases, and choose school metadata directly on the sheet drawer (all managed inside `src/components/settings-panel.tsx`).
- Generates documents purely on the client: `src/lib/document-generator.ts` builds DOCX, uses `html-to-image` for PNG/OCR-friendly exports, and opens a `window.print()` flow for PDF.

## Technology & architecture
- **Next.js 16 + TypeScript** with the App Router and `output: "export"` (see `next.config.ts`), so `bun run build` emits a static `out/` folder and `bun start` serves it through the `python -m http.server` shim in `package.json`.
- **Bun** as the package runner (`bun install`, `bun run dev`, etc.) and `tailwindcss@4` for styling; the global themes live in `src/app/globals.css` (tokens for `--grid-border`, `--focus-bg`, `section-badge`, etc.).
- **SettingsProvider** orchestrates every profile, member, and frequent content item. The UI components (`settings-panel`, forms for mesyuarat and OPR) consume this provider to render the settings drawer without server data.
- **Document generation** is client-side only: `generateMinitDocx`, `generateOprImage`, and `generateOprPdfClient` live in `src/lib/document-generator.ts` for browser-based export.

## Responsive layout (mobile/tablet view)
- `src/app/page.tsx` wraps everything in `<main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-32">`; the tab list, generation controls, and grid sections collapse with `grid grid-cols-1 lg:grid-cols-2` and `sm:grid-cols-2` classes so small screens stack naturally.
- Settings panel cards rely on `grid grid-cols-1 md:grid-cols-2` or `sm:grid-cols-2 lg:grid-cols-4` patterns plus `divide` utilities, making each upload, member list, and template block stack on phones and spread horizontally on tablets/larger screens (`src/components/settings-panel.tsx`).
- Global utilities in `src/app/globals.css` ensure consistent borders, section badges, and focused inputs across breakpoints, while `tailwind.config.ts` registers the shared token palette and leaves the default Tailwind breakpoints (`sm`, `md`, `lg`, etc.) in place for the responsive utilities already encoded in the JSX.

## Local development
1. `bun install`
2. Copy `.env.local.example` to `.env.local` if needed for your configuration.
3. Run `bun run dev` to start the development server on port 3000.
4. Use `bun run lint` + `bun run build` before publishing.

## Publishing
- The default `next.config.ts` sets `output: "export"`, so `bun run build` produces static files under `out/`. You can serve that folder via `bun start` or push it to GitHub Pages/another static host.
- For GitHub Pages, target the generated `out/` directory or a `gh-pages` branch (the `hosting.md` file outlines options). Static hosting is sufficient because every route (`/`, settings drawer, document outputs) is rendered client-side.

## Project structure
```
src/
├── app/               # App Router entrypoint (`page.tsx`, `layout.tsx`) and global styles
├── components/        # Forms (+ the settings drawer) and shared UI
│   └── ui/            # shadcn-inspired primitives (tabs, sheet, dialog, buttons, inputs)
├── hooks/             # Reusable React hooks
├── lib/               # Settings context + document generation helpers

```

## Tips & tooling
- Profiles, members, logos, and template snippets are all stored in-browser; clearing the `document-generator-profiles` key resets the state.
- The settings drawer follows the same grid-border, flat Tabs layout as the Mesyuarat/OPR workspace, so tweaks to `src/app/globals.css` (section badges, `grid-border-*` utilities) immediately affect both spaces.
- Run `bun run dev` while inspecting in mobile or responsive devices mode in your browser to confirm the `Selectors`, `grid-cols-1 sm:grid-cols-2`, and `divide` utilities fall back gracefully on phones and orient horizontally on tablets.
