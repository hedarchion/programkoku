# Repository Guidelines

## Guidelines for agents
- Implement fix or user query carefully and in consideration of the whole codebase.
- For UI/UX query, ask for clarifications if user query is too vague.

## Project Structure & Module Organization
This project is a Next.js 16 + TypeScript app using the App Router.

- `src/app/`: routes, layouts, and global styles (`globals.css`).
- `src/components/`: feature components (for example `minit-mesyuarat-form.tsx`, `opr-form.tsx`).
- `src/components/ui/`: shared shadcn/ui primitives.
- `src/lib/`: utilities, DB access, and document-generation logic.
- `src/hooks/`: reusable React hooks.
- `prisma/`: Prisma schema and migrations.
- `public/`: static assets.
- `upload/`, `download/`, `db/`: local working data and generated files.
- `examples/`: reference/demo code; excluded from linting.
- `mini-services/`: standalone microservices (e.g., PDF generation service).
  - `mini-services/pdf-service/`: Docker-based Puppeteer service for OPR PDF generation.

## Build, Test, and Development Commands
Use Bun for dependency and script execution.

### Local Development (with Docker for PDF)

For local development with full PDF support, use Docker for the Puppeteer service:

```bash
# Start everything (PDF service in Docker + Next.js dev server)
./scripts/start-local.sh

# Stop everything
./scripts/stop-local.sh
```

**Architecture:**
- Next.js dev server runs locally on port 3000 (hot reload)
- PDF microservice runs in Docker on port 3001 (Puppeteer + Chrome)

See `LOCAL_DEV.md` for detailed setup and troubleshooting.

### Standard Commands

- `bun install`: install dependencies.
- `bun run dev`: run local dev server at `http://localhost:3000` (logs to `dev.log`).
  - ⚠️ **Note**: PDF generation requires the Docker PDF service to be running.
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
