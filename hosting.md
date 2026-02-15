# Hosting TODO (GitHub Pages + Vercel Backend)

## 1. Architecture Decisions
- [ ] Confirm final architecture: static frontend on GitHub Pages, backend on Vercel.
- [ ] Decide API base URL convention (e.g. `https://mm-maker-api.vercel.app`).
- [ ] Decide whether DOCX stays client-side or also moves to backend.

## 2. Frontend Build for GitHub Pages
- [ ] Keep static export mode enabled (`output: "export"`).
- [ ] Add/verify `basePath` and `assetPrefix` if deployed under repo subpath.
- [ ] Add frontend env var for backend URL (e.g. `NEXT_PUBLIC_API_BASE_URL`).
- [ ] Update export buttons to call backend endpoint for server PDF generation.
- [ ] Add error UI for API timeout/rate-limit/server failure.

## 3. Backend on Vercel
- [ ] Create separate backend project (or separate app) for API routes.
- [ ] Implement `POST /api/export/opr/pdf` endpoint.
- [ ] Add payload validation (zod) and strict max request size.
- [ ] Add HTML sanitization/escaping in server render pipeline.
- [ ] Implement PDF generation via headless Chromium-compatible stack.
- [ ] Return PDF with correct headers (`application/pdf`, `Content-Disposition`).

## 4. CORS and Security
- [ ] Restrict CORS origin to GitHub Pages domain.
- [ ] Add API auth mechanism (API key or signed token).
- [ ] Add basic rate limiting to protect free-plan quota.
- [ ] Add abuse protections (size caps, image count caps, timeout guards).
- [ ] Keep secrets in Vercel env vars only.

## 5. Performance and Reliability
- [ ] Optimize image preprocessing (resize/compress before PDF render).
- [ ] Set conservative runtime/memory usage targets for free plan.
- [ ] Add graceful fallback message when export is temporarily unavailable.
- [ ] Add retry strategy for transient failures.

## 6. CI/CD
- [ ] Configure GitHub Actions for frontend build and Pages deployment.
- [ ] Configure Vercel project from backend repo/folder.
- [ ] Add preview deployments for backend changes.
- [ ] Add versioned API path or backward-compatible response format.

## 7. Testing Checklist
- [ ] Test export from production GitHub Pages origin to Vercel API.
- [ ] Test CORS block for non-approved origins.
- [ ] Test valid/invalid payload handling.
- [ ] Test large image payload rejection.
- [ ] Test PDF visual quality across Chrome/Edge print workflows.

## 8. Operations
- [ ] Add logging for export failures and latency.
- [ ] Add simple usage tracking (daily export counts).
- [ ] Define upgrade trigger thresholds (when to move from free to Pro).
- [ ] Document runbook for common incidents (timeouts, quota exceeded, CORS errors).

