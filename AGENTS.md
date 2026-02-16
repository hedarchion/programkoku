# Repository Guidelines

## Guidelines for agents
- Implement fix or user query carefully and in consideration of the whole codebase.
- For UI/UX query, ask for clarifications if user query is too vague.

## Project Structure & Module Organization
This project is a Next.js 16 + React 19 + TypeScript app using the App Router.

- `src/app/`: routes, layouts, and global styles (`globals.css`).
- `src/components/`: feature components (for example `minit-mesyuarat-form.tsx`, `opr-form.tsx`).
- `src/components/ui/`: shared shadcn/ui primitives.
- `src/lib/`: utilities, DB access, and document-generation logic.
- `src/hooks/`: reusable React hooks.
- `prisma/`: Prisma schema and migrations.
- `public/`: static assets.
- `upload/`, `download/`, `db/`: local working data and generated files.
- `examples/`: reference/demo code; excluded from linting.

## Tech Stack

### Core Framework
- **Next.js** 16 with App Router (static export mode)
- **React** 19 with TypeScript 5
- **Bun** as package manager and runtime

### Styling & UI
- **Tailwind CSS** v4 with PostCSS
- **shadcn/ui** component library built on Radix UI primitives
- **tw-animate-css** for animations
- Custom CSS variables for theming (calming blue palette)
- Dark mode support via CSS classes

### State Management & Data Fetching
- **TanStack Query** (React Query) v5 for server state
- **Zustand** v5 for client state
- **React Hook Form** v7 with **Zod** v4 for form handling and validation

### Database & ORM
- **Prisma** v6 with SQLite datasource
- `@prisma/client` for type-safe database access

### Document Generation & Export
- **docx** for Word document generation
- **jspdf** + **jspdf-autotable** for PDF generation
- **html-to-image** for image export
- **file-saver** for client-side downloads

### Animation & Interactions
- **Framer Motion** v12 for animations
- **@dnd-kit** for drag-and-drop functionality

### UI Components & Utilities
- **@radix-ui/** primitives (accordion, dialog, dropdown, etc.)
- **@tanstack/react-table** v8 for data tables
- **recharts** for charts
- **lucide-react** for icons
- **date-fns** for date manipulation
- **embla-carousel-react** for carousels
- **next-themes** for theme switching
- **sonner** for toast notifications
- **vaul** for drawers

### Development Tools
- **ESLint** v9 with Next.js config
- **@tailwindcss/postcss** for Tailwind v4 processing

## Build, Test, and Development Commands
Use Bun for dependency and script execution.

### Standard Commands

- `bun install`: install dependencies.
- `bun run dev`: run local dev server at `http://localhost:3000` (logs to `dev.log`).
- `bun run build`: create production build and standalone output.
- `bun start`: run production server from `.next/standalone` (logs to `server.log`).
- `bun run lint`: run ESLint across the repository.
- `bun run db:generate | db:push | db:migrate | db:reset`: Prisma client/schema workflows.

## Coding Style & Naming Conventions
- Language: TypeScript (`.ts`/`.tsx`) with strict compiler settings.
- Indentation: 2 spaces; keep existing file style if it differs.
- Imports: prefer `@/*` alias for `src/*`.
- Components: PascalCase filenames for reusable UI; feature files may use kebab-case to match existing patterns.
- Hooks: `use-*.ts(x)` naming.
- Styling: Tailwind CSS utilities; keep custom CSS centralized in `src/app/globals.css`.
- Linting: `eslint.config.mjs` extends Next core-web-vitals + TypeScript rules.

### Tailwind CSS v4 Notes
- Uses `@import "tailwindcss"` syntax in CSS files
- Theme configuration via `@theme inline` in CSS
- Custom properties defined in `:root` and `.dark` selectors
- `@tailwindcss/postcss` plugin for processing

## Testing Guidelines
There is currently no dedicated test framework configured in this checkout. Minimum expectation before PR:

- Run `bun run lint`.
- Run `bun run build` to catch type/runtime integration issues.
- Manually verify critical flows (form input, document generation, DB writes).
- When adding tests, place them near source (`*.test.ts[x]`) and document the command in `package.json`.

## Commit & Pull Request Guidelines
Local Git history is unavailable in this environment, so follow Conventional Commits:

- `feat: add OPR export template`
- `fix: handle empty meeting attendees`
- `chore: update prisma client`

PRs should include:

- Clear scope and reason for change.
- Linked issue/task (if available).
- Validation notes (`lint`, `build`, manual checks).
- Screenshots or sample output when UI/document output changes.

## Deployment Notes

### Static Export
- Configured with `output: "export"` in `next.config.ts`
- Images are unoptimized (`images.unoptimized: true`)
- Build output goes to `out/` directory

### GitHub Pages
- Supports GitHub Actions deployment with automatic base path detection
- Set `GITHUB_ACTIONS=true` and `GITHUB_REPOSITORY=owner/repo` for correct asset paths
