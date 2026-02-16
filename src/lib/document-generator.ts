import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, BorderStyle, WidthType, ImageRun } from 'docx'
import { jsPDF } from 'jspdf'
import { toPng } from 'html-to-image'
import { getOprHtmlContent as getSharedOprHtmlContent, getOprHtmlParts as getSharedOprHtmlParts, type OprData } from '@/lib/opr-html-template'

const noBorders = { top: { style: BorderStyle.NIL }, bottom: { style: BorderStyle.NIL }, left: { style: BorderStyle.NIL }, right: { style: BorderStyle.NIL } }

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  if (!year || !month || !day) return ''
  const monthNum = Number(month)
  const dayNum = Number(day)
  if (Number.isNaN(monthNum) || Number.isNaN(dayNum) || monthNum < 1 || monthNum > 12) return ''
  const months = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember']
  return `${dayNum} ${months[monthNum - 1]} ${year}`
}

function formatTimeWithSuffix(timeStr: string): string {
  if (!timeStr) return ''
  if (/[a-zA-Z]/.test(timeStr)) return timeStr
  
  try {
    const [hours, minutes] = timeStr.split(':').map(Number)
    const suffix = getTimeSuffix(hours)
    const displayHour = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours)
    return `${displayHour}.${String(minutes).padStart(2, '0')} ${suffix}`
  } catch {
    return timeStr
  }
}

function getTimeSuffix(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Pagi'
  if (hour >= 12 && hour < 15) return 'Tengah Hari'
  if (hour >= 15 && hour < 19) return 'Petang'
  return 'Malam'
}

function getFontName(font?: string): string {
  return font === 'calibri' ? 'Calibri' : 'Times New Roman'
}

// jsPDF uses standard PDF fonts: helvetica, times, courier
function getPdfFontName(font?: string): string {
  return font === 'times' ? 'times' : 'helvetica'
}

function getYearFromTarikh(tarikh: string): string {
  if (!tarikh) return new Date().getFullYear().toString()
  try {
    return new Date(tarikh).getFullYear().toString()
  } catch {
    return new Date().getFullYear().toString()
  }
}

interface AhliEntry {
  id: string
  nama: string
  jawatan: string
  isCustom?: boolean
}

interface SignatureInfo {
  name: string
  title1: string
  title2: string
  title3: string
}

interface AgendaItem {
  id: string
  perkara: string
  butiran: string[]
  tindakan: string
  included: boolean
}

interface MinitData {
  bilangan: string
  tarikh: string
  hari: string
  masa: string
  tempat: string
  panitia: string
  ahli: AhliEntry[]
  ucapanPengerusi: string[]
  ucapanPenasihat: string[]
  minitLalu: { dibentang: string; dicadangkan: string; disokong: string }
  perkaraBerbangkit: string[]
  agendaItems: AgendaItem[]
  halHalLain: string[]
  ucapanPenangguhan: string[]
  setiausaha: SignatureInfo
  ketuaPanitia: SignatureInfo
  guruBesar: SignatureInfo
  sections: {
    ucapanPengerusi: boolean
    ucapanPenasihat: boolean
    minitLalu: boolean
    perkaraBerbangkit: boolean
    halHalLain: boolean
    ucapanPenangguhan: boolean
  }
  sectionTitles?: {
    ucapanPengerusi: string
    ucapanPenasihat: string
    minitLalu: string
    perkaraBerbangkit: string
    halHalLain: string
    ucapanPenangguhan: string
  }
  font?: 'calibri' | 'times'
  logo1Base64?: string
  logo2Base64?: string
  setiausahaSignatureBase64?: string
  ketuaPanitiaSignatureBase64?: string
}

// Calculate section numbers dynamically
function getSectionNumbers(data: MinitData) {
  let currentNum = 1
  const numbers: Record<string, number> = {}
  
  if (data.sections.ucapanPengerusi) numbers.ucapanPengerusi = currentNum++
  if (data.sections.ucapanPenasihat) numbers.ucapanPenasihat = currentNum++
  if (data.sections.minitLalu) numbers.minitLalu = currentNum++
  if (data.sections.perkaraBerbangkit) numbers.perkaraBerbangkit = currentNum++
  
  numbers.agendaStart = currentNum
  const numberedAgendaCount = data.agendaItems.length
  currentNum += numberedAgendaCount
  
  if (data.sections.halHalLain) numbers.halHalLain = currentNum++
  if (data.sections.ucapanPenangguhan) numbers.ucapanPenangguhan = currentNum
  
  return numbers
}

// ==================== DOCX Generation ====================

export async function generateMinitDocx(data: MinitData): Promise<Blob> {
  const fontName = getFontName(data.font)
  const children: (Paragraph | Table)[] = []
  const pageWidth = 9600
  const sectionNums = getSectionNumbers(data)
  
  // Consistent font sizes for DOCX
  const TITLE_SIZE = 28      // 14pt - Main title
  const SUBTITLE_SIZE = 24   // 12pt - Subtitle/Bilangan
  const SECTION_SIZE = 24    // 12pt - Section headers
  const BODY_SIZE = 22       // 11pt - Body text
  
  // Header with logos and title
  if (data.logo1Base64 || data.logo2Base64) {
    const logoCells: TableCell[] = []
    const hasLogo1 = !!data.logo1Base64
    const hasLogo2 = !!data.logo2Base64
    const logoCellWidth = 1500
    const titleCellWidth = pageWidth - (hasLogo1 ? logoCellWidth : 0) - (hasLogo2 ? logoCellWidth : 0)
    
    if (data.logo1Base64) {
      logoCells.push(await createLogoCellDocx(data.logo1Base64, logoCellWidth))
    }
    
    logoCells.push(
      new TableCell({
        borders: noBorders,
        width: { size: titleCellWidth, type: WidthType.DXA },
        verticalAlign: 'center',
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "MINIT MESYUARAT PANITIA", bold: true, size: TITLE_SIZE, font: fontName })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: data.panitia.toUpperCase(), bold: true, size: TITLE_SIZE, font: fontName })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 50 }, children: [new TextRun({ text: `BIL. ${data.bilangan} SESI ${getYearFromTarikh(data.tarikh)}`, bold: true, size: SUBTITLE_SIZE, font: fontName })] })
        ]
      })
    )
    
    if (data.logo2Base64) {
      logoCells.push(await createLogoCellDocx(data.logo2Base64, logoCellWidth))
    }
    
    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: logoCells })] }))
  } else {
    children.push(
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "MINIT MESYUARAT PANITIA", bold: true, size: TITLE_SIZE, font: fontName })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: data.panitia.toUpperCase(), bold: true, size: TITLE_SIZE, font: fontName })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: `BIL. ${data.bilangan} SESI ${getYearFromTarikh(data.tarikh)}`, bold: true, size: SUBTITLE_SIZE, font: fontName })] })
    )
  }

  // Horizontal line
  children.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: "000000" } }, spacing: { after: 200 }, children: [] }))

  // Maklumat Mesyuarat
  children.push(
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: `TARIKH: ${formatDate(data.tarikh)}`, bold: true, size: SUBTITLE_SIZE, font: fontName })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: `HARI: ${data.hari.toUpperCase()}`, bold: true, size: SUBTITLE_SIZE, font: fontName })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: `MASA: ${formatTimeWithSuffix(data.masa).toUpperCase()}`, bold: true, size: SUBTITLE_SIZE, font: fontName })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: `TEMPAT: ${data.tempat.toUpperCase()}`, bold: true, size: SUBTITLE_SIZE, font: fontName })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 150 }, children: [new TextRun({ text: `KEHADIRAN: ${data.ahli.filter(a => a.nama).length} ORANG`, bold: true, size: SUBTITLE_SIZE, font: fontName })] })
  )

  // Kehadiran
  children.push(new Paragraph({ spacing: { before: 150, after: 100 }, children: [new TextRun({ text: "Kehadiran:", bold: true, size: SECTION_SIZE, font: fontName })] }))
  data.ahli.forEach((ahli, index) => {
    if (ahli.nama) {
      children.push(new Paragraph({ spacing: { after: 40 }, indent: { left: 360 }, children: [new TextRun({ text: `${index + 1}.  ${ahli.nama} (${ahli.jawatan})`, size: BODY_SIZE, font: fontName })] }))
    }
  })

  // Helper function to add section
  const addSection = (num: number | undefined, title: string, items: string[], tindakan: string) => {
    if (num === undefined) return
    children.push(new Paragraph({ spacing: { before: 250, after: 100 }, children: [new TextRun({ text: `${num}.  ${title}`, bold: true, size: SECTION_SIZE, font: fontName })] }))
    items.forEach((item, index) => {
      if (item) children.push(new Paragraph({ spacing: { after: 60 }, indent: { left: 360 }, children: [new TextRun({ text: `${num}.${index + 1}  ${item}`, size: BODY_SIZE, font: fontName })] }))
    })
    children.push(new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 100 }, children: [new TextRun({ text: `Tindakan: ${tindakan}`, italics: true, size: BODY_SIZE, font: fontName })] }))
  }

  // Helper to get section title
  const getSectionTitle = (key: keyof NonNullable<MinitData['sectionTitles']>, defaultTitle: string): string => {
    return data.sectionTitles?.[key]?.toUpperCase() || defaultTitle
  }

  // 1. Ucapan Pengerusi
  if (data.sections.ucapanPengerusi) {
    addSection(sectionNums.ucapanPengerusi, getSectionTitle('ucapanPengerusi', 'UCAPAN PENGERUSI / KETUA PANITIA'), data.ucapanPengerusi, 'Makluman')
  }

  // 2. Ucapan Penasihat
  if (data.sections.ucapanPenasihat) {
    addSection(sectionNums.ucapanPenasihat, getSectionTitle('ucapanPenasihat', 'UCAPAN PENASIHAT'), data.ucapanPenasihat, 'Makluman')
  }

  // 3. Minit Lalu
  if (data.sections.minitLalu) {
    children.push(
      new Paragraph({ spacing: { before: 200, after: 100 }, children: [new TextRun({ text: `${sectionNums.minitLalu}.  ${getSectionTitle('minitLalu', 'MEMBENTANGKAN DAN MENGESAHKAN MINIT MESYUARAT YANG LALU')}`, bold: true, size: SECTION_SIZE, font: fontName })] }),
      new Paragraph({ spacing: { after: 60 }, indent: { left: 360 }, children: [new TextRun({ text: `${sectionNums.minitLalu}.1  ${data.minitLalu.dibentang || 'Minit mesyuarat telah dibentangkan dan disahkan'}`, size: BODY_SIZE, font: fontName })] })
    )
    if (data.minitLalu.dicadangkan) children.push(new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 40 }, children: [new TextRun({ text: `Dicadangkan oleh: ${data.minitLalu.dicadangkan}`, italics: true, size: BODY_SIZE, font: fontName })] }))
    if (data.minitLalu.disokong) children.push(new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 40 }, children: [new TextRun({ text: `Disokong oleh: ${data.minitLalu.disokong}`, italics: true, size: BODY_SIZE, font: fontName })] }))
    children.push(new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 100 }, children: [new TextRun({ text: "Tindakan: Semua GBA", italics: true, size: BODY_SIZE, font: fontName })] }))
  }

  // 4. Perkara Berbangkit
  if (data.sections.perkaraBerbangkit) {
    addSection(sectionNums.perkaraBerbangkit, getSectionTitle('perkaraBerbangkit', 'PERKARA BERBANGKIT'), data.perkaraBerbangkit.slice(0, 1), 'Semua GBA')
  }

  // Agenda Items (with dynamic numbering)
  let agendaNum = sectionNums.agendaStart
  data.agendaItems.forEach((agenda) => {
    if (agenda.included && agenda.perkara.trim()) {
      children.push(new Paragraph({ spacing: { before: 200, after: 100 }, children: [new TextRun({ text: `${agendaNum}.  ${agenda.perkara.toUpperCase()}`, bold: true, size: SECTION_SIZE, font: fontName })] }))
      agenda.butiran.forEach((butiran, bIndex) => {
        if (butiran) children.push(new Paragraph({ spacing: { after: 60 }, indent: { left: 360 }, children: [new TextRun({ text: `${agendaNum}.${bIndex + 1}  ${butiran}`, size: BODY_SIZE, font: fontName })] }))
      })
      if (agenda.tindakan) children.push(new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 100 }, children: [new TextRun({ text: `Tindakan: ${agenda.tindakan}`, italics: true, size: BODY_SIZE, font: fontName })] }))
    }
    agendaNum++
  })

  // Hal-hal Lain
  if (data.sections.halHalLain) {
    addSection(sectionNums.halHalLain, getSectionTitle('halHalLain', 'HAL-HAL LAIN'), data.halHalLain, 'Semua GBA')
  }

  // Ucapan Penangguhan
  if (data.sections.ucapanPenangguhan) {
    children.push(new Paragraph({ spacing: { before: 200, after: 100 }, children: [new TextRun({ text: `${sectionNums.ucapanPenangguhan}.  ${getSectionTitle('ucapanPenangguhan', 'UCAPAN PENANGGUHAN')}`, bold: true, size: SECTION_SIZE, font: fontName })] }))
    data.ucapanPenangguhan.forEach((ucapan, index) => {
      if (ucapan) children.push(new Paragraph({ spacing: { after: 60 }, indent: { left: 360 }, children: [new TextRun({ text: `${sectionNums.ucapanPenangguhan}.${index + 1}  ${ucapan}`, size: BODY_SIZE, font: fontName })] }))
    })
  }

  // Signature Section
  children.push(new Paragraph({ spacing: { before: 400 }, children: [] }))

  const sigTable = new Table({
    columnWidths: [3200, 3200, 3200],
    rows: [new TableRow({
      children: [
        await createSignatureCellDocx("Disediakan oleh,", data.setiausaha, fontName, data.setiausahaSignatureBase64),
        await createSignatureCellDocx("Disemak oleh,", data.ketuaPanitia, fontName, data.ketuaPanitiaSignatureBase64),
        createSignatureCellSimpleDocx("Disahkan oleh,", data.guruBesar, fontName)
      ]
    })]
  })
  children.push(sigTable)

  const doc = new Document({
    styles: { default: { document: { run: { font: fontName, size: 22 } } } },
    sections: [{ properties: { page: { margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 } } }, children: children as Paragraph[] }]
  })

  return await Packer.toBlob(doc)
}

async function createSignatureCellDocx(label: string, sig: SignatureInfo, fontName?: string, signatureImage?: string): Promise<TableCell> {
  const SIGNATURE_SIZE = 22  // 11pt - consistent body size
  const safeName = (sig?.name || '-').toUpperCase()
  const safeTitles = [sig?.title1, sig?.title2, sig?.title3].filter(Boolean) as string[]
  const cellChildren: Paragraph[] = [
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: label, size: SIGNATURE_SIZE, font: fontName })] })
  ]
  
  // Add signature image if available, otherwise use signature line
  if (signatureImage) {
    try {
      const sigBuffer = await base64ToArrayBuffer(signatureImage)
      cellChildren.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 100 },
        children: [new ImageRun({ type: getDocxImageType(signatureImage), data: sigBuffer, transformation: { width: 80, height: 30 } })]
      }))
    } catch {
      // Fallback to signature line if image fails
      cellChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300 }, children: [new TextRun({ text: "........................................", size: SIGNATURE_SIZE, font: fontName })] }))
    }
  } else {
    // Signature line (no image)
    cellChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300 }, children: [new TextRun({ text: "........................................", size: SIGNATURE_SIZE, font: fontName })] }))
  }
  
  // Name (handle long names by allowing it to wrap)
  cellChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `(${safeName})`, bold: true, size: SIGNATURE_SIZE, font: fontName })] }))
  
  // Titles (handle long titles)
  safeTitles.forEach(title => {
    if (title) cellChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: title, size: SIGNATURE_SIZE, font: fontName })] }))
  })
  
  return new TableCell({ borders: noBorders, children: cellChildren })
}

function createSignatureCellSimpleDocx(label: string, sig: SignatureInfo, fontName?: string): TableCell {
  const SIGNATURE_SIZE = 22  // 11pt - consistent body size
  const safeName = (sig?.name || '-').toUpperCase()
  const safeTitles = [sig?.title1, sig?.title2, sig?.title3].filter(Boolean) as string[]
  const cellChildren: Paragraph[] = [
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: label, size: SIGNATURE_SIZE, font: fontName })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300 }, children: [new TextRun({ text: "........................................", size: SIGNATURE_SIZE, font: fontName })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `(${safeName})`, bold: true, size: SIGNATURE_SIZE, font: fontName })] })
  ]
  safeTitles.forEach(title => {
    if (title) cellChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: title, size: SIGNATURE_SIZE, font: fontName })] }))
  })
  return new TableCell({ borders: noBorders, children: cellChildren })
}

async function createLogoCellDocx(base64: string, width: number): Promise<TableCell> {
  try {
    const logoBuffer = await base64ToArrayBuffer(base64)
    return new TableCell({
      borders: noBorders,
      width: { size: width, type: WidthType.DXA },
      verticalAlign: 'center',
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new ImageRun({ type: getDocxImageType(base64), data: logoBuffer, transformation: { width: 60, height: 70 } })]
        })
      ]
    })
  } catch {
    return new TableCell({
      borders: noBorders,
      width: { size: width, type: WidthType.DXA },
      verticalAlign: 'center',
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [] })]
    })
  }
}

// ==================== PDF Generation (using jsPDF - fast and reliable) ====================

export async function generateMinitPdf(data: MinitData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })
  
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)
  let y = margin
  const sectionNums = getSectionNumbers(data)
  
  // Get font from settings (times or helvetica)
  const fontFamily = getPdfFontName(data.font)
  
  // Consistent font sizes for PDF
  const TITLE_SIZE = 14       // Main title
  const SUBTITLE_SIZE = 12    // Subtitle/Bilangan
  const SECTION_SIZE = 12     // Section headers
  const BODY_SIZE = 11        // Body text
  
  // Helper functions
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, options: { fontSize?: number; fontStyle?: 'normal' | 'bold' | 'italic' } = {}): number => {
    const fontSize = options.fontSize || BODY_SIZE
    doc.setFontSize(fontSize)
    doc.setFont(fontFamily, options.fontStyle || 'normal')
    const lines = doc.splitTextToSize(text, maxWidth)
    doc.text(lines, x, y)
    return y + (lines.length * fontSize * 0.4)
  }
  
  const checkNewPage = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage()
      y = margin
    }
  }

  // Header with logos and title
  if (data.logo1Base64 || data.logo2Base64) {
    const logoWidth = 20
    const logoHeight = 23
    const titleX = margin + (data.logo1Base64 ? logoWidth + 5 : 0)
    const titleWidth = contentWidth - (data.logo1Base64 ? logoWidth + 5 : 0) - (data.logo2Base64 ? logoWidth + 5 : 0)
    
    if (data.logo1Base64) {
      try {
        const logoData = data.logo1Base64.split(',')[1] || data.logo1Base64
        doc.addImage(logoData, 'PNG', margin, y, logoWidth, logoHeight)
      } catch (e) { console.error('Error adding logo 1:', e) }
    }
    
    doc.setFontSize(TITLE_SIZE)
    doc.setFont(fontFamily, 'bold')
    const titleCenterX = titleX + (titleWidth / 2)
    doc.text('MINIT MESYUARAT PANITIA', titleCenterX, y + 8, { align: 'center' })
    doc.text(data.panitia.toUpperCase(), titleCenterX, y + 15, { align: 'center' })
    doc.setFontSize(SUBTITLE_SIZE)
    doc.text(`BIL. ${data.bilangan} SESI ${getYearFromTarikh(data.tarikh)}`, titleCenterX, y + 22, { align: 'center' })
    
    if (data.logo2Base64) {
      try {
        const logoData = data.logo2Base64.split(',')[1] || data.logo2Base64
        doc.addImage(logoData, 'PNG', pageWidth - margin - logoWidth, y, logoWidth, logoHeight)
      } catch (e) { console.error('Error adding logo 2:', e) }
    }
    
    y += 30
  } else {
    doc.setFontSize(TITLE_SIZE)
    doc.setFont(fontFamily, 'bold')
    doc.text('MINIT MESYUARAT PANITIA', pageWidth / 2, y + 8, { align: 'center' })
    doc.text(data.panitia.toUpperCase(), pageWidth / 2, y + 15, { align: 'center' })
    doc.setFontSize(SUBTITLE_SIZE)
    doc.text(`BIL. ${data.bilangan} SESI ${getYearFromTarikh(data.tarikh)}`, pageWidth / 2, y + 22, { align: 'center' })
    y += 30
  }

  // Horizontal line
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8
  
  // Maklumat Mesyuarat (centered)
  doc.setFontSize(SUBTITLE_SIZE)
  doc.setFont(fontFamily, 'bold')
  const maklumat = [
    `TARIKH: ${formatDate(data.tarikh)}`,
    `HARI: ${data.hari.toUpperCase()}`,
    `MASA: ${formatTimeWithSuffix(data.masa).toUpperCase()}`,
    `TEMPAT: ${data.tempat.toUpperCase()}`,
    `KEHADIRAN: ${data.ahli.filter(a => a.nama).length} ORANG`
  ]
  maklumat.forEach(text => {
    doc.text(text, pageWidth / 2, y, { align: 'center' })
    y += 6
  })
  y += 4
  
  // Kehadiran
  doc.setFont(fontFamily, 'bold')
  doc.text('Kehadiran:', margin, y)
  y += 6
  doc.setFont(fontFamily, 'normal')
  data.ahli.forEach((ahli, index) => {
    if (ahli.nama) {
      checkNewPage(6)
      doc.text(`${index + 1}. ${ahli.nama} (${ahli.jawatan})`, margin + 5, y)
      y += 5
    }
  })
  
  // Helper to add section
  const addSection = (num: number | undefined, title: string, items: string[], tindakan: string) => {
    if (num === undefined) return
    y += 6
    checkNewPage(20)
    doc.setFontSize(SECTION_SIZE)
    doc.setFont(fontFamily, 'bold')
    doc.text(`${num}. ${title}`, margin, y)
    y += 6
    doc.setFontSize(BODY_SIZE)
    doc.setFont(fontFamily, 'normal')
    items.forEach((item, index) => {
      if (item) {
        checkNewPage(8)
        y = addWrappedText(`${num}.${index + 1} ${item}`, margin + 5, y, contentWidth - 10, { fontSize: BODY_SIZE })
        y += 2
      }
    })
    doc.setFont(fontFamily, 'italic')
    doc.text(`Tindakan: ${tindakan}`, pageWidth - margin, y, { align: 'right' })
    y += 4
  }

  // Helper to get section title for PDF
  const getPdfSectionTitle = (key: keyof NonNullable<MinitData['sectionTitles']>, defaultTitle: string): string => {
    return data.sectionTitles?.[key]?.toUpperCase() || defaultTitle
  }

  // Sections
  if (data.sections.ucapanPengerusi) {
    addSection(sectionNums.ucapanPengerusi, getPdfSectionTitle('ucapanPengerusi', 'UCAPAN PENGERUSI / KETUA PANITIA'), data.ucapanPengerusi, 'Makluman')
  }
  
  if (data.sections.ucapanPenasihat) {
    addSection(sectionNums.ucapanPenasihat, getPdfSectionTitle('ucapanPenasihat', 'UCAPAN PENASIHAT'), data.ucapanPenasihat, 'Makluman')
  }
  
  if (data.sections.minitLalu) {
    y += 6
    checkNewPage(20)
    doc.setFontSize(SECTION_SIZE)
    doc.setFont(fontFamily, 'bold')
    doc.text(`${sectionNums.minitLalu}. ${getPdfSectionTitle('minitLalu', 'MEMBENTANGKAN DAN MENGESAHKAN MINIT MESYUARAT YANG LALU')}`, margin, y)
    y += 6
    doc.setFontSize(BODY_SIZE)
    doc.setFont(fontFamily, 'normal')
    y = addWrappedText(`${sectionNums.minitLalu}.1 ${data.minitLalu.dibentang || 'Minit mesyuarat telah dibentangkan dan disahkan'}`, margin + 5, y, contentWidth - 10, { fontSize: BODY_SIZE })
    y += 2
    if (data.minitLalu.dicadangkan) {
      doc.setFont(fontFamily, 'italic')
      doc.text(`Dicadangkan oleh: ${data.minitLalu.dicadangkan}`, pageWidth - margin, y, { align: 'right' })
      y += 5
    }
    if (data.minitLalu.disokong) {
      doc.setFont(fontFamily, 'italic')
      doc.text(`Disokong oleh: ${data.minitLalu.disokong}`, pageWidth - margin, y, { align: 'right' })
      y += 5
    }
    doc.setFont(fontFamily, 'italic')
    doc.text('Tindakan: Semua GBA', pageWidth - margin, y, { align: 'right' })
    y += 6
  }
  
  if (data.sections.perkaraBerbangkit) {
    addSection(sectionNums.perkaraBerbangkit, getPdfSectionTitle('perkaraBerbangkit', 'PERKARA BERBANGKIT'), data.perkaraBerbangkit.slice(0, 1), 'Semua GBA')
  }
  
  // Agenda Items
  let agendaNum = sectionNums.agendaStart
  data.agendaItems.forEach((agenda) => {
    if (agenda.included && agenda.perkara.trim()) {
      addSection(agendaNum, agenda.perkara.toUpperCase(), agenda.butiran, agenda.tindakan || 'Semua GBA')
    }
    agendaNum++
  })
  
  if (data.sections.halHalLain) {
    addSection(sectionNums.halHalLain, getPdfSectionTitle('halHalLain', 'HAL-HAL LAIN'), data.halHalLain, 'Semua GBA')
  }
  
  if (data.sections.ucapanPenangguhan) {
    y += 6
    checkNewPage(15)
    doc.setFontSize(SECTION_SIZE)
    doc.setFont(fontFamily, 'bold')
    doc.text(`${sectionNums.ucapanPenangguhan}. ${getPdfSectionTitle('ucapanPenangguhan', 'UCAPAN PENANGGUHAN')}`, margin, y)
    y += 6
    doc.setFontSize(BODY_SIZE)
    doc.setFont(fontFamily, 'normal')
    data.ucapanPenangguhan.forEach((ucapan, index) => {
      if (ucapan) {
        checkNewPage(8)
        y = addWrappedText(`${sectionNums.ucapanPenangguhan}.${index + 1} ${ucapan}`, margin + 5, y, contentWidth - 10, { fontSize: BODY_SIZE })
        y += 2
      }
    })
  }
  
  // Signature Section
  y += 20
  checkNewPage(50)
  
  const sigWidth = contentWidth / 3
  const sigPositions = [margin, margin + sigWidth, margin + sigWidth * 2]
  
  const drawSignature = (label: string, sig: SignatureInfo, x: number, signatureImage?: string) => {
    const sigY = y
    const SIGNATURE_SIZE = BODY_SIZE  // 11pt - consistent body size
    
    doc.setFont(fontFamily, 'normal')
    doc.setFontSize(SIGNATURE_SIZE)
    doc.text(label, x + sigWidth / 2, sigY, { align: 'center' })
    
    // Draw signature image if available, otherwise draw signature line
    if (signatureImage) {
      try {
        const sigImgData = signatureImage.split(',')[1] || signatureImage
        const sigImgHeight = 12  // Height for signature image
        const sigImgWidth = 40   // Width for signature image
        const sigX = x + (sigWidth - sigImgWidth) / 2
        const sigImgY = sigY + 6  // Position below label
        doc.addImage(sigImgData, 'PNG', sigX, sigImgY, sigImgWidth, sigImgHeight)
      } catch (e) {
        // Fallback to signature line if image fails
        doc.text('........................................', x + sigWidth / 2, sigY + 20, { align: 'center' })
      }
    } else {
      // Signature line (no image)
      doc.text('........................................', x + sigWidth / 2, sigY + 20, { align: 'center' })
    }
    
    // Name (handle long names - wrap if needed)
    doc.setFont(fontFamily, 'bold')
    const nameLines = doc.splitTextToSize(`(${sig.name.toUpperCase()})`, sigWidth - 10)
    doc.text(nameLines, x + sigWidth / 2, sigY + 28, { align: 'center' })
    
    // Titles
    doc.setFont(fontFamily, 'normal')
    let titleY = sigY + 34 + ((nameLines.length - 1) * 4)
    ;[sig.title1, sig.title2, sig.title3].forEach((title, i) => {
      if (title) {
        const titleLines = doc.splitTextToSize(title, sigWidth - 10)
        doc.text(titleLines, x + sigWidth / 2, titleY, { align: 'center' })
        titleY += titleLines.length * 4
      }
    })
  }
  
  drawSignature('Disediakan oleh,', data.setiausaha, sigPositions[0], data.setiausahaSignatureBase64)
  drawSignature('Disemak oleh,', data.ketuaPanitia, sigPositions[1], data.ketuaPanitiaSignatureBase64)
  drawSignature('Disahkan oleh,', data.guruBesar, sigPositions[2])
  
  return doc.output('blob')
}

async function base64ToArrayBuffer(base64: string): Promise<ArrayBuffer> {
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64
  const binaryString = atob(base64Data)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

function getDocxImageType(base64: string): 'png' | 'jpg' {
  return /data:image\/png/i.test(base64) ? 'png' : 'jpg'
}

function drawImageFitPdf(
  doc: jsPDF,
  imageData: string,
  x: number,
  y: number,
  boxWidth: number,
  boxHeight: number
) {
  const format = getPdfImageType(imageData)
  const props = doc.getImageProperties(imageData)
  const imgRatio = props.width / props.height
  const boxRatio = boxWidth / boxHeight

  let drawWidth = boxWidth
  let drawHeight = boxHeight
  if (imgRatio > boxRatio) {
    drawHeight = boxWidth / imgRatio
  } else {
    drawWidth = boxHeight * imgRatio
  }

  const xOffset = x + (boxWidth - drawWidth) / 2
  const yOffset = y + (boxHeight - drawHeight) / 2
  try {
    doc.addImage(imageData, format, xOffset, yOffset, drawWidth, drawHeight)
  } catch {
    doc.setDrawColor(180, 180, 180)
    doc.rect(x, y, boxWidth, boxHeight, 'S')
    doc.setTextColor(120, 120, 120)
    doc.setFontSize(8)
    doc.text('Image error', x + boxWidth / 2, y + boxHeight / 2, { align: 'center' })
  }
}

function drawImageCoverPdf(
  doc: jsPDF,
  imageData: string,
  x: number,
  y: number,
  boxWidth: number,
  boxHeight: number
) {
  const format = getPdfImageType(imageData)
  try {
    const props = doc.getImageProperties(imageData)
    const imgRatio = props.width / props.height
    const boxRatio = boxWidth / boxHeight

    let drawWidth = boxWidth
    let drawHeight = boxHeight
    if (imgRatio > boxRatio) {
      drawWidth = boxHeight * imgRatio
    } else {
      drawHeight = boxWidth / imgRatio
    }

    const xOffset = x - (drawWidth - boxWidth) / 2
    const yOffset = y - (drawHeight - boxHeight) / 2
    // Clip to frame bounds so cover-cropped image never spills outside.
    doc.saveGraphicsState()
    doc.rect(x, y, boxWidth, boxHeight)
    doc.clip()
    doc.discardPath()
    doc.addImage(imageData, format, xOffset, yOffset, drawWidth, drawHeight)
    doc.restoreGraphicsState()
  } catch {
    // Fallback to fit mode for compatibility on PDF engines lacking clip support.
    drawImageFitPdf(doc, imageData, x, y, boxWidth, boxHeight)
  }
}

function drawLogoSlotPdf(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  imageBase64?: string | null
) {
  doc.setDrawColor(88, 164, 199)
  doc.setFillColor(234, 248, 255)
  doc.roundedRect(x, y, w, h, 1.6, 1.6, 'FD')
  if (imageBase64) {
    drawImageFitPdf(doc, imageBase64, x + 1, y + 1, w - 2, h - 2)
  } else {
    doc.setTextColor(96, 140, 170)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.text('LOGO', x + w / 2, y + h / 2 + 0.6, { align: 'center' })
  }
}

function getPdfImageType(imageData: string): 'PNG' | 'JPEG' | 'WEBP' {
  if (/data:image\/png/i.test(imageData)) return 'PNG'
  if (/data:image\/webp/i.test(imageData)) return 'WEBP'
  return 'JPEG'
}

function formatOprDateTimeDay(tarikh: string, masa: string): string {
  if (!tarikh && !masa) return '-'
  const dateText = formatDate(tarikh).toUpperCase()
  const dayText = getDayNameMalay(tarikh)
  const upperTime = masa ? masa.toUpperCase() : ''
  const upperDay = dayText && dayText !== '-' ? dayText.toUpperCase() : ''
  if (!dateText && upperTime && upperDay) return `${upperTime} / ${upperDay}`
  if (!dateText && upperTime) return upperTime
  if (!upperTime && upperDay) return `${dateText} / ${upperDay}`
  if (!upperTime) return dateText || '-'
  if (!upperDay) return `${dateText} / ${upperTime}`
  return `${dateText} / ${upperTime} / ${upperDay}`
}

function parseIsoDateLocal(input: string): Date | null {
  if (!input) return null
  const [yearRaw, monthRaw, dayRaw] = input.split('-')
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null
  }
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}

function getDayNameMalay(tarikh: string): string {
  if (!tarikh) return '-'
  const days = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu']
  const date = parseIsoDateLocal(tarikh)
  if (!date) return '-'
  return days[date.getDay()]
}

function getYearFromDate(tarikh: string): string {
  if (!tarikh) return new Date().getFullYear().toString()
  const date = parseIsoDateLocal(tarikh)
  if (!date) return new Date().getFullYear().toString()
  return date.getFullYear().toString()
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function sanitizeText(value: string | null | undefined): string {
  return escapeHtml((value || '').trim())
}

function getImageFrameLayoutForCount(
  imageCount: number,
  mode: 'auto' | 'grid' | 'focus'
): Array<Array<number | null>> {
  void mode
  if (imageCount <= 0) return []
  if (imageCount === 1) return [[0]]
  if (imageCount === 2) return [[0, 1]]
  if (imageCount === 3) return [[0, 1, 2]]
  if (imageCount === 4) return [[0, 1], [2, 3]]
  if (imageCount === 5) return [[0, 1, 2], [3, 4]]
  if (imageCount === 6) return [[0, 1, 2], [3, 4, 5]]
  if (imageCount === 7) return [[0, 1, 2, 3], [4, 5, 6]]
  if (imageCount === 8) return [[0, 1, 2, 3], [4, 5, 6, 7]]
  return [[0, 1, 2], [3, 4, 5]]
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Legacy function for backward compatibility
export async function generateMinitDocument(data: MinitData): Promise<Blob> {
  return generateMinitDocx(data)
}

// ==================== OPR HTML/Image Generation ====================

interface OprHtmlParts {
  title: string
  style: string
  body: string
}

function getOprHtmlParts(data: OprData): OprHtmlParts {
  return getSharedOprHtmlParts(data)
}

function getOprHtmlContent(data: OprData): string {
  return getSharedOprHtmlContent(data)
}

async function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'))
  if (images.length === 0) return
  await Promise.all(
    images.map(img => new Promise<void>(resolve => {
      if (img.complete) return resolve()
      img.onload = () => resolve()
      img.onerror = () => resolve()
    }))
  )
}

export async function generateOprHtml(data: OprData): Promise<Blob> {
  const htmlContent = getOprHtmlContent(data)
  return new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
}

export async function generateOprImage(data: OprData): Promise<Blob> {
  const parts = getOprHtmlParts(data)
  
  // Create off-screen container - must be visible for proper rendering
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.top = '-9999px'
  container.style.left = '-9999px'
  container.style.zIndex = '-1'
  
  container.innerHTML = `
    <style>${parts.style}</style>
    ${parts.body}
  `
  
  document.body.appendChild(container)
  
  try {
    const page = container.querySelector('.container') as HTMLElement | null
    if (!page) {
      throw new Error('Gagal merender halaman OPR')
    }
    
    // Wait for fonts and images
    if (document.fonts?.ready) {
      await document.fonts.ready
    }
    await waitForImages(page)
    
    // Delay for layout
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const dataUrl = await toPng(page, {
      quality: 1,
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: '#ffffff'
    })
    
    const response = await fetch(dataUrl)
    return await response.blob()
  } finally {
    document.body.removeChild(container)
  }
}

export async function generateOprPdfClient(data: OprData): Promise<void> {
  const parts = getSharedOprHtmlParts(data)
  
  // Open a new window for browser-native PDF generation via print
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    throw new Error('Pop-up blocker menghalang tetingkap cetakan. Sila benarkan pop-up untuk laman ini.')
  }

  const doc = printWindow.document
  doc.open()
  doc.write(`
    <!DOCTYPE html>
    <html lang="ms">
      <head>
        <meta charset="UTF-8">
        <title>${parts.title}</title>
        <style>
          ${parts.style}
          @media print {
            @page {
              size: A4 portrait;
              margin: 0;
            }
            body { 
              background: white !important; 
              padding: 0 !important;
              margin: 0 !important;
              display: block !important;
            }
            .container { 
              box-shadow: none !important; 
              border: none !important;
              border-radius: 0 !important;
              width: 210mm !important;
              height: 297mm !important;
              padding: 0 !important;
              margin: 0 !important;
              overflow: hidden !important;
            }
          }
        </style>
      </head>
      <body>
        ${parts.body}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 800);
          };
        </script>
      </body>
    </html>
  `)
  doc.close()
}
