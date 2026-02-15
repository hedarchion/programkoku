# OPR PDF via GitHub Action (Preparation)

## Frontend behavior
- OPR `PDF` button now downloads a JSON job payload (`*_PDF_JOB.json`).
- This payload is used by GitHub Action to render the final PDF.

## Render workflow
- Workflow file: `.github/workflows/render-opr-pdf.yml`
- Script used: `scripts/render-opr-pdf.ts`

## How it will be used later
1. Place the downloaded payload in the repo (example: `upload/opr-jobs/opr-job.json`).
2. Run workflow **Render OPR PDF** with:
   - `payload_path`: path to payload JSON file in repo
   - `output_name`: output filename
3. Download generated PDF artifact from workflow run.

## Local test command
```bash
bun scripts/render-opr-pdf.ts upload/opr-jobs/opr-job.json download/OPR.pdf
```
