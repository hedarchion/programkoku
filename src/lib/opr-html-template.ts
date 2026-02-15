export interface OprData {
  namaProgram: string
  tarikh: string
  masa: string
  tempat: string
  kehadiranSasaran: string
  isuMasalah: string
  aktiviti: string[]
  gambarBase64: string[]
  imageLayout?: 'auto' | 'grid' | 'focus'
  schoolName?: string
  schoolCode?: string
  schoolAddress?: string
  logo1Base64?: string | null
  logo2Base64?: string | null
  pegawaiTerlibat?: string[]
  namaPgb?: string
  preparedBy?: string
  font?: 'calibri' | 'times' | 'poppins'
}

interface OprHtmlParts {
  title: string
  style: string
  body: string
}

type DensityPreset = 'normal' | 'compact' | 'tight'

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  if (!year || !month || !day) return ''
  const months = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember']
  const monthNum = Number(month)
  return `${Number(day)} ${months[monthNum - 1]} ${year}`
}

function parseIsoDateLocal(input: string): Date | null {
  if (!input) return null
  const [yearRaw, monthRaw, dayRaw] = input.split('-')
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return date
}

function getDayNameMalay(tarikh: string): string {
  if (!tarikh) return '-'
  const days = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu']
  const date = parseIsoDateLocal(tarikh)
  return date ? days[date.getDay()] : '-'
}

function formatOprDateTimeDay(tarikh: string, masa: string): string {
  const dateText = formatDate(tarikh).toUpperCase()
  const dayText = getDayNameMalay(tarikh).toUpperCase()
  const upperTime = (masa || '').toUpperCase()

  const parts = []
  if (dateText) parts.push(dateText)
  if (upperTime) parts.push(upperTime)
  if (dayText && dayText !== '-') parts.push(dayText)

  return parts.length > 0 ? parts.join(' / ') : '-'
}

function getYearFromDate(tarikh: string): string {
  const date = parseIsoDateLocal(tarikh)
  return date ? date.getFullYear().toString() : new Date().getFullYear().toString()
}

function escapeHtml(value: string): string {
  return (value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function sanitizeText(value: string | null | undefined): string {
  return escapeHtml((value || '').trim())
}

function getDensityPreset(input: {
  imageCount: number
  activityCount: number
  officerCount: number
  textWeightScore: number
}): DensityPreset {
  const { imageCount, activityCount, officerCount, textWeightScore } = input
  if (imageCount >= 7 || activityCount >= 8 || officerCount >= 10 || textWeightScore > 1000) return 'tight'
  if (imageCount >= 5 || activityCount >= 6 || officerCount >= 8 || textWeightScore > 750) return 'compact'
  return 'normal'
}

export function getOprHtmlParts(data: OprData): OprHtmlParts {
  const images = (data.gambarBase64 || []).slice(0, 8)
  const galleryLayoutClass = `layout-${Math.min(Math.max(images.length, 1), 8)}`
  const activityCount = (data.aktiviti || []).filter(Boolean).length
  const officerCount = (data.pegawaiTerlibat || []).filter(Boolean).length

  const textWeightScore =
    (data.namaProgram || '').length +
    (data.tempat || '').length +
    (data.namaPgb || '').length +
    (data.kehadiranSasaran || '').length +
    (data.isuMasalah || '').length +
    (data.preparedBy || '').length +
    (data.aktiviti || []).join(' ').length

  const density = getDensityPreset({
    imageCount: images.length,
    activityCount,
    officerCount,
    textWeightScore,
  })

  const year = sanitizeText(getYearFromDate(data.tarikh))
  const formattedDate = sanitizeText(formatOprDateTimeDay(data.tarikh, data.masa))
  const schoolName = sanitizeText(data.schoolName || 'NAMA SEKOLAH')
  const schoolAddress = sanitizeText(data.schoolAddress || '-')
  const schoolCode = sanitizeText(data.schoolCode || '-')
  const namaProgram = sanitizeText(data.namaProgram || '-')
  const tempat = sanitizeText(data.tempat || '-')
  const namaPgb = sanitizeText(data.namaPgb || '-')
  const kehadiranSasaran = sanitizeText(data.kehadiranSasaran || '-')
  const isuMasalah = sanitizeText(data.isuMasalah || 'BERJALAN SEPERTI TELAH DIRANCANG')
  const preparedBy = sanitizeText(data.preparedBy || '-')

  const officers = (data.pegawaiTerlibat || [])
    .map(v => sanitizeText(v))
    .filter(Boolean)
    .slice(0, 12)
  
  const officersHtml = officers.length > 0
    ? officers.map((name, idx) => `<div class="teacher-item">${idx + 1}. ${name}</div>`).join('')
    : '<div class="teacher-item">-</div>'

  const activities = (data.aktiviti || [])
    .map(v => sanitizeText(v))
    .filter(Boolean)
    .slice(0, 8)

  const summaryHtml = activities.length > 0
    ? activities.map(item => `<li>${item}</li>`).join('')
    : '<li>-</li>'

  const galleryHtml = images
    .map((src, idx) => `
      <div class="gallery-slot slot-${idx + 1}">
        <img src="${src}" class="gallery-img" alt="Foto ${idx + 1}">
      </div>
    `)
    .join('')

  const fontFamily = data.font === 'times'
    ? "'Times New Roman', Times, serif"
    : data.font === 'poppins'
    ? "'Poppins', sans-serif"
    : "Calibri, 'Segoe UI', Arial, sans-serif"

  const style = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

    :root {
      --primary-gradient: linear-gradient(135deg, #0284c7 0%, #38bdf8 100%);
      --yellow-gradient: linear-gradient(135deg, #ca8a04 0%, #facc15 100%);
      --red-gradient: linear-gradient(135deg, #b91c1c 0%, #ef4444 100%);
      --header-gradient: linear-gradient(to right, #eff6ff, #dbeafe);
      --text-dark: #1e293b;
      --white-glass: rgba(255, 255, 255, 0.95);
    }

    @page {
      size: A4 portrait;
      margin: 0;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: ${fontFamily};
      color: var(--text-dark);
      width: 210mm;
      height: 297mm;
      padding: 0;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      overflow: hidden;
    }

    .container {
      width: 210mm;
      height: 297mm;
      background: #ffffff;
      border-radius: 0;
      overflow: hidden;
      border: none;
      box-shadow: none;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    header {
      background: var(--header-gradient);
      padding: 5mm 8mm;
      border-bottom: 1.2mm solid #0ea5e9;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 5mm;
      flex-shrink: 0;
    }

    .header-logo {
      width: 20mm;
      height: 20mm;
      object-fit: contain;
    }

    .header-content {
      text-align: center;
      flex: 1;
    }

    .report-badge {
      background: var(--primary-gradient);
      color: white;
      padding: 1mm 4mm;
      border-radius: 10mm;
      font-weight: 700;
      font-size: 3.2mm;
      display: inline-block;
      margin-bottom: 1.5mm;
      text-transform: uppercase;
    }

    .header-content h1 {
      font-size: 5mm;
      font-weight: 800;
      margin-bottom: 1mm;
      color: #1e3a8a;
      text-transform: uppercase;
      line-height: 1.2;
    }

    .header-content p {
      font-size: 3.5mm;
      color: #475569;
      font-weight: 500;
      line-height: 1.2;
    }

    .content-body {
      padding: 6mm 8mm;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2.5mm;
      min-height: 0;
      overflow: hidden;
    }

    .container.compact .content-body { gap: 1.8mm; padding: 4.5mm 7mm; }
    .container.tight .content-body { gap: 1.2mm; padding: 3.5mm 6mm; }

    .row {
      display: flex;
      align-items: stretch;
      border-radius: 2mm;
      overflow: hidden;
      box-shadow: 0 0.5mm 2mm rgba(0,0,0,0.05);
      flex-shrink: 0;
    }

    .label {
      flex: 0 0 50mm;
      background: var(--primary-gradient);
      color: white;
      display: flex;
      align-items: center;
      padding: 2.5mm 5mm;
      font-weight: 700;
      font-size: 3.2mm;
      text-transform: uppercase;
      position: relative;
      z-index: 1;
    }

    .container.compact .label { flex: 0 0 45mm; padding: 2mm 4mm; font-size: 3mm; }
    .container.tight .label { flex: 0 0 40mm; padding: 1.5mm 3.5mm; font-size: 2.8mm; }

    .label::after {
      content: '';
      position: absolute;
      right: -2.48mm;
      top: 50%;
      transform: translateY(-50%);
      border-top: 2.5mm solid transparent;
      border-bottom: 2.5mm solid transparent;
      border-left: 2.5mm solid #38bdf8;
      z-index: 2;
    }

    .data {
      flex: 1;
      background: #ffffff;
      padding: 2.5mm 5mm 2.5mm 8mm;
      font-size: 3.5mm;
      display: flex;
      align-items: center;
      color: #334155;
      line-height: 1.4;
      min-width: 0;
    }

    .container.compact .data { padding: 2mm 4mm 2mm 6mm; font-size: 3.2mm; }
    .container.tight .data { padding: 1.5mm 3mm 1.5mm 5mm; font-size: 3mm; }

    .highlight-yellow .label { background: var(--yellow-gradient); color: #713f12; }
    .highlight-yellow .label::after { border-left-color: #facc15; }
    .highlight-yellow .data { background: #fffbeb; font-weight: 700; color: #854d0e; text-align: center; justify-content: center; }

    .row.issue .label { background: var(--red-gradient); }
    .row.issue .label::after { border-left-color: #ef4444; }
    .row.issue .data { background: #fef2f2; color: #b91c1c; font-weight: 700; }

    .teacher-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1mm 4mm;
      width: 100%;
      font-size: 3.2mm;
    }
    .container.compact .teacher-grid { font-size: 3mm; }
    .container.tight .teacher-grid { font-size: 2.8mm; }

    .teacher-item {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .summary-list {
      padding-left: 6mm;
      line-height: 1.5;
      width: 100%;
      list-style: decimal;
      list-style-position: outside;
    }
    .summary-list li {
      margin-bottom: 0.5mm;
      padding-left: 1mm;
      list-style: decimal;
    }
    .container.compact .summary-list li { -webkit-line-clamp: 1; }
    .container.tight .summary-list li { -webkit-line-clamp: 1; }

    .gallery-section {
      margin-top: 1mm;
      display: flex;
      flex-direction: column;
      gap: 2mm;
      flex: 1;
      min-height: 56mm;
    }
    .container.compact .gallery-section { min-height: 48mm; }
    .container.tight .gallery-section { min-height: 40mm; }

    .gallery-section.no-images {
      min-height: 36mm;
    }
    
    .gallery-label {
      background: var(--primary-gradient);
      color: white;
      padding: 2mm;
      text-align: center;
      font-weight: 700;
      border-radius: 2mm;
      font-size: 3.5mm;
      text-transform: uppercase;
      letter-spacing: 0.5mm;
    }

    .gallery-content {
      flex: 1;
      min-height: 0;
    }

    .gallery-grid {
      display: grid;
      height: 100%;
      gap: 2mm;
      min-height: 0;
    }

    .gallery-slot {
      min-width: 0;
      min-height: 0;
      overflow: hidden;
      border-radius: 2.5mm;
      border: 0.8mm solid white;
      box-shadow: 0 1mm 3mm rgba(0,0,0,0.1);
      background: #e2e8f0;
    }

    .gallery-grid.layout-1 {
      grid-template-columns: 1fr;
      grid-template-rows: 1fr;
    }
    .gallery-grid.layout-2 {
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr;
    }
    .gallery-grid.layout-3 {
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
    }
    .gallery-grid.layout-3 .slot-1 { grid-column: 1 / 3; grid-row: 1; }
    .gallery-grid.layout-3 .slot-2 { grid-column: 1; grid-row: 2; }
    .gallery-grid.layout-3 .slot-3 { grid-column: 2; grid-row: 2; }

    .gallery-grid.layout-4 {
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
    }

    .gallery-grid.layout-5 {
      grid-template-columns: repeat(6, 1fr);
      grid-template-rows: 1fr 1fr;
    }
    .gallery-grid.layout-5 .slot-1 { grid-column: 1 / 3; grid-row: 1; }
    .gallery-grid.layout-5 .slot-2 { grid-column: 3 / 5; grid-row: 1; }
    .gallery-grid.layout-5 .slot-3 { grid-column: 5 / 7; grid-row: 1; }
    .gallery-grid.layout-5 .slot-4 { grid-column: 1 / 4; grid-row: 2; }
    .gallery-grid.layout-5 .slot-5 { grid-column: 4 / 7; grid-row: 2; }

    .gallery-grid.layout-6 {
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: 1fr 1fr;
    }

    .gallery-grid.layout-7 {
      grid-template-columns: repeat(12, 1fr);
      grid-template-rows: 1fr 1fr;
    }
    .gallery-grid.layout-7 .slot-1 { grid-column: 1 / 4; grid-row: 1; }
    .gallery-grid.layout-7 .slot-2 { grid-column: 4 / 7; grid-row: 1; }
    .gallery-grid.layout-7 .slot-3 { grid-column: 7 / 10; grid-row: 1; }
    .gallery-grid.layout-7 .slot-4 { grid-column: 10 / 13; grid-row: 1; }
    .gallery-grid.layout-7 .slot-5 { grid-column: 1 / 5; grid-row: 2; }
    .gallery-grid.layout-7 .slot-6 { grid-column: 5 / 9; grid-row: 2; }
    .gallery-grid.layout-7 .slot-7 { grid-column: 9 / 13; grid-row: 2; }

    .gallery-grid.layout-8 {
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: 1fr 1fr;
    }

    .gallery-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      border-radius: inherit;
      background: #e2e8f0;
    }

    footer {
      margin-top: auto;
      padding-top: 4mm;
      border-top: 0.3mm solid #cbd5e1;
      font-size: 3.2mm;
      color: #64748b;
      line-height: 1.4;
      flex-shrink: 0;
    }
    footer strong { color: var(--text-dark); font-size: 3.5mm; }

    /* Handling long text with clamps */
    .data-text {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .row.single-line .data-text {
      -webkit-line-clamp: 1;
      white-space: nowrap;
      text-overflow: ellipsis;
      display: block;
    }
  `

  const body = `
    <div class="container ${density}">
      <header>
        <img src="${data.logo1Base64 || 'https://via.placeholder.com/150/0ea5e9/ffffff?text=LOGO'}" alt="Logo" class="header-logo">
        <div class="header-content">
          <div class="report-badge">ONE PAGE REPORT (OPR)</div>
          <h1>${schoolName}</h1>
          <p>${schoolAddress}</p>
          <p><strong>TAHUN ${year}</strong></p>
        </div>
        <img src="${data.logo2Base64 || 'https://via.placeholder.com/150/1e293b/ffffff?text=TS25'}" alt="TS25" class="header-logo">
      </header>

      <div class="content-body">
        <div class="row single-line">
          <div class="label">Kod / Nama Sekolah</div>
          <div class="data"><div class="data-text">${schoolCode} / ${schoolName}</div></div>
        </div>

        <div class="row highlight-yellow">
          <div class="label">Program / Aktiviti</div>
          <div class="data"><div class="data-text">${namaProgram}</div></div>
        </div>

        <div class="row single-line">
          <div class="label">Tarikh / Masa / Hari</div>
          <div class="data"><div class="data-text">${formattedDate}</div></div>
        </div>

        <div class="row single-line">
          <div class="label">Tempat</div>
          <div class="data"><div class="data-text">${tempat}</div></div>
        </div>

        <div class="row single-line">
          <div class="label">Nama Penuh PGB</div>
          <div class="data"><div class="data-text">${namaPgb}</div></div>
        </div>

        <div class="row">
          <div class="label">Pegawai Terlibat</div>
          <div class="data">
            <div class="teacher-grid">${officersHtml}</div>
          </div>
        </div>

        <div class="row">
          <div class="label">Kehadiran / Sasaran</div>
          <div class="data"><div class="data-text">${kehadiranSasaran}</div></div>
        </div>

        <div class="row" style="align-items: flex-start;">
          <div class="label">Rumusan</div>
          <div class="data">
            <ol class="summary-list">${summaryHtml}</ol>
          </div>
        </div>

        <div class="row issue">
          <div class="label">Isu / Masalah</div>
          <div class="data"><div class="data-text">${isuMasalah}</div></div>
        </div>

        <section class="gallery-section ${images.length === 0 ? 'no-images' : ''}">
          <div class="gallery-label">Laporan Bergambar</div>
          <div class="gallery-content">
            ${galleryHtml
              ? `<div class="gallery-grid ${galleryLayoutClass}">${galleryHtml}</div>`
              : '<div class="gallery-grid layout-1"><div class="gallery-slot" style="display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:3mm;">Tiada Gambar</div></div>'}
          </div>
        </section>

        <footer>
          Disediakan oleh :<br>
          <strong>${preparedBy}</strong>
        </footer>
      </div>
    </div>
  `

  return {
    title: `One Page Report - ${schoolName}`,
    style,
    body,
  }
}

export function getOprHtmlContent(data: OprData): string {
  const parts = getOprHtmlParts(data)

  return `<!DOCTYPE html>
<html lang="ms">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${parts.title}</title>
  <style>${parts.style}</style>
</head>
<body>
${parts.body}
</body>
</html>`
}
