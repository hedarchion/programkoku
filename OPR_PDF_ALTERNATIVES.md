# OPR PDF Generation: Alternatives to Puppeteer

## Problem Summary

Current OPR PDF generation uses Puppeteer for pristine HTML-to-PDF rendering, but this cannot be hosted cost-effectively due to:
- Vercel serverless 250MB function size limit (Chromium exceeds this)
- Docker microservice complexity and hosting costs
- Cold start issues with browser-based solutions

## Requirements

From analysis of `src/lib/opr-html-template.ts`:
- **Format**: A4 Portrait (210mm x 297mm)
- **Layout**: Fixed container with precise mm-based positioning
- **CSS Features Required**:
  - CSS Gradients (blue, yellow, red)
  - Flexbox and CSS Grid
  - `@page` rules for print margins
  - `object-fit: cover` for images
  - Custom fonts (Calibri, Times New Roman, Poppins)
  - CSS clip-path (via `clip()` in jsPDF)
- **Image Handling**: 1-8 images in dynamic grid layouts
- **Output**: Single-page PDF, print-ready

## Alternative Solutions

### Option 1: Client-Side Rendering (Recommended First)

Use `html2pdf.js` (html2canvas + jsPDF) to generate PDF in the browser.

**Implementation Plan:**

1. **Install dependency:**
   ```bash
   npm install html2pdf.js
   ```

2. **Modify `src/lib/document-generator.ts`:**
   - Add new function `generateOprPdfClientSide(data: OprData)`
   - Create hidden DOM element with OPR HTML template
   - Use html2pdf.js to convert to PDF
   - Clean up DOM element

3. **Update `src/app/page.tsx`:**
   - Change PDF button to use client-side generation
   - Add loading state during generation
   - Handle errors gracefully

4. **CSS Adjustments for html2canvas:**
   - Ensure all colors use hex/rgb (not CSS variables in some cases)
   - Add `backgroundColor: '#ffffff'` to html2canvas options
   - Test gradient rendering across browsers

**Code Example:**
```typescript
import html2pdf from 'html2pdf.js';

export async function generateOprPdfClientSide(data: OprData): Promise<Blob> {
  const parts = getOprHtmlParts(data);

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.innerHTML = `<style>${parts.style}</style>${parts.body}`;
  document.body.appendChild(container);

  const element = container.querySelector('.container');
  if (!element) throw new Error('Failed to render OPR container');

  const opt = {
    margin: 0,
    filename: `OPR_${data.namaProgram}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    }
  };

  try {
    const pdfBlob = await html2pdf()
      .set(opt)
      .from(element)
      .output('blob');
    return pdfBlob;
  } finally {
    document.body.removeChild(container);
  }
}
```

**Pros:**
- Zero server infrastructure
- Free forever
- Works offline after page load

**Cons:**
- Less accurate than Chrome for complex CSS
- Font loading may need preloading
- Large images can cause memory issues
- Browser-dependent rendering

**Testing Checklist:**
- [ ] Verify A4 dimensions are accurate when printed
- [ ] Check gradient rendering in Chrome, Firefox, Safari
- [ ] Test with maximum 8 images (5MB each)
- [ ] Verify fonts load correctly (especially Poppins from Google Fonts)
- [ ] Test with compact/tight density modes

---

### Option 2: Gotenberg on Fly.io (Free Tier)

Host [Gotenberg](https://gotenberg.dev) PDF generation service on Fly.io's free tier.

**Implementation Plan:**

1. **Create Fly.io account** (free tier: 3 shared VMs, 256MB RAM)

2. **Create `fly.toml`:**
   ```toml
   app = "your-gotenberg-pdf"
   primary_region = "sin"

   [build]
     image = "gotenberg/gotenberg:8"

   [http_service]
     internal_port = 3000
     force_https = true
     auto_stop_machines = true
     auto_start_machines = true
     min_machines_running = 0
   ```

3. **Deploy:**
   ```bash
   fly deploy
   ```

4. **Create API client `src/lib/gotenberg-client.ts`:**
   ```typescript
   export async function generatePdfWithGotenberg(html: string): Promise<Blob> {
     const GOTENBERG_URL = process.env.NEXT_PUBLIC_GOTENBERG_URL;

     const formData = new FormData();
     const htmlBlob = new Blob([html], { type: 'text/html' });
     formData.append('files', htmlBlob, 'index.html');

     const response = await fetch(`${GOTENBERG_URL}/forms/chromium/convert/html`, {
       method: 'POST',
       body: formData,
     });

     if (!response.ok) {
       throw new Error(`PDF generation failed: ${response.statusText}`);
     }

     return response.blob();
   }
   ```

5. **Update environment variables:**
   ```bash
   NEXT_PUBLIC_GOTENBERG_URL=https://your-gotenberg-pdf.fly.dev
   ```

**Pros:**
- True Chrome rendering
- API-based, simple integration
- Free for light usage
- Handles complex CSS accurately

**Cons:**
- Cold starts (5-10s after idle)
- Free tier limitations (256MB RAM may struggle with many images)
- Requires Fly.io account setup

**Cost:** Free (within Fly.io limits)

---

### Option 3: Browserless.io (Pay-Per-Use)

Use hosted browser service with simple HTTP API.

**Implementation Plan:**

1. **Sign up at browserless.io** (~$5-20/month for moderate usage)

2. **Create client `src/lib/browserless-client.ts`:**
   ```typescript
   export async function generatePdfWithBrowserless(html: string): Promise<Blob> {
     const BROWSERLESS_TOKEN = process.env.NEXT_PUBLIC_BROWSERLESS_TOKEN;

     const response = await fetch(`https://chrome.browserless.io/pdf?token=${BROWSERLESS_TOKEN}`, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         html,
         options: {
           printBackground: true,
           format: 'A4',
           margin: { top: 0, right: 0, bottom: 0, left: 0 },
           preferCSSPageSize: true,
         },
      }),
     });

     if (!response.ok) {
       throw new Error(`PDF generation failed: ${response.statusText}`);
     }

     return response.blob();
   }
   ```

**Pros:**
- True Chrome rendering
- No infrastructure to manage
- Simple HTTP API

**Cons:**
- Ongoing cost
- Network dependency

**Cost:** ~$0.001-0.005 per PDF

---

### Option 4: AWS Lambda with Chrome Layer

Deploy Chromium on AWS Lambda using `chrome-aws-lambda`.

**Implementation Plan:**

1. **Create Lambda function** with chrome-aws-lambda layer

2. **Lambda handler:**
   ```javascript
   const chromium = require('chrome-aws-lambda');

   exports.handler = async (event) => {
     const browser = await chromium.puppeteer.launch({
       args: chromium.args,
       executablePath: await chromium.executablePath,
       headless: chromium.headless,
     });

     const page = await browser.newPage();
     await page.setContent(event.html, { waitUntil: 'networkidle0' });

     const pdf = await page.pdf({
       format: 'A4',
       printBackground: true,
       margin: { top: 0, right: 0, bottom: 0, left: 0 },
       preferCSSPageSize: true,
     });

     await browser.close();

     return {
       statusCode: 200,
       headers: { 'Content-Type': 'application/pdf' },
       body: pdf.toString('base64'),
       isBase64Encoded: true,
     };
   };
   ```

3. **Create API Gateway** to expose Lambda function

4. **Update client code** to call API Gateway

**Pros:**
- True Chrome rendering
- 10GB deployment package (vs Vercel's 250MB)
- Very low cost for low usage

**Cons:**
- AWS complexity
- Cold starts (2-5s)
- Requires AWS knowledge

**Cost:** ~$0.20-1/month for light usage

---

## Recommendation

**Start with Option 1 (Client-Side)** for these reasons:

1. Zero cost and complexity
2. Fast feedback loop for testing
3. If it works well enough, you're done
4. The existing PNG generation already uses the same underlying technology (`html-to-image` library), proving this approach works in your codebase

**Fallback to Option 2 (Gotenberg)** if:
- html2canvas doesn't render gradients/CSS accurately enough
- Font loading is inconsistent
- Large images cause browser crashes

**Avoid Option 3 and 4** unless Options 1 and 2 fail, as they introduce ongoing costs and infrastructure complexity.

---

## Files to Modify

### For Option 1 (Client-Side):
1. `package.json` - Add `html2pdf.js` dependency
2. `src/lib/document-generator.ts` - Add `generateOprPdfClientSide()` function
3. `src/app/page.tsx` - Update PDF button handler
4. `src/lib/opr-html-template.ts` - May need CSS adjustments for html2canvas compatibility

### For Option 2 (Gotenberg):
1. Create `fly.toml` for deployment
2. Create `src/lib/gotenberg-client.ts` for API client
3. Update `src/app/page.tsx` to use Gotenberg client
4. Add environment variable for Gotenberg URL

---

## Testing Strategy

1. **Visual Comparison:**
   - Generate PDFs with both Puppeteer (current) and new method
   - Compare side-by-side in PDF viewer
   - Check: margins, gradients, image sizing, fonts, spacing

2. **Print Test:**
   - Print both versions to physical printer
   - Verify A4 dimensions are accurate
   - Check color accuracy

3. **Edge Cases:**
   - Maximum 8 images
   - Long text in all fields
   - All three density modes (normal, compact, tight)
   - All three fonts (Calibri, Times, Poppins)

---

## Decision Matrix

| Criteria | Client-Side | Gotenberg | Browserless | AWS Lambda |
|----------|-------------|-----------|-------------|------------|
| Cost | Free | Free (limited) | $5-20/mo | $0.20-1/mo |
| Setup Complexity | Low | Medium | Low | High |
| Rendering Accuracy | Good | Excellent | Excellent | Excellent |
| Cold Start | None | 5-10s | <1s | 2-5s |
| Maintenance | None | Low | None | Medium |
| Works Offline | Yes | No | No | No |

---

## Next Steps

1. Implement Option 1 (Client-Side) first
2. Test with various OPR content scenarios
3. If accuracy is insufficient, implement Option 2 (Gotenberg)
4. Keep existing Puppeteer code as fallback for local development
