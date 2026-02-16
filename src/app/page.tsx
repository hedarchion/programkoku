'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { FileText, ScrollText, FileImage, Download, Loader2, Settings as SettingsIcon, Building2, Users, FileCheck, CheckCircle2, AlertCircle, Image as ImageIcon } from 'lucide-react'
import MinitMesyuaratForm from '@/components/minit-mesyuarat-form'
import OprForm, { type OprFormData } from '@/components/opr-form'
import SettingsPanel from '@/components/settings-panel'
import { SettingsProvider, useSettings } from '@/lib/settings-context'
import { toast } from 'sonner'
import { generateMinitDocx, generateMinitPdf, generateOprImage, generateOprPdfClient, downloadBlob } from '@/lib/document-generator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'

type GenerationStatus = 'idle' | 'generating' | 'success' | 'error'

interface GenerationState {
  status: GenerationStatus
  format: 'docx' | 'pdf' | 'png' | null
  progress: number
}

function MainContent() {
  const [minitData, setMinitData] = useState<any>(null)
  const [oprData, setOprData] = useState<OprFormData | null>(null)
  const [minitGeneration, setMinitGeneration] = useState<GenerationState>({ status: 'idle', format: null, progress: 0 })
  const [oprGeneration, setOprGeneration] = useState<GenerationState>({ status: 'idle', format: null, progress: 0 })
  const [activeTab, setActiveTab] = useState<string>('minit')
  const { settings, profiles, currentProfile, switchProfile } = useSettings()

  const handleGenerateMinit = useCallback(async (format: 'docx' | 'pdf') => {
    if (!minitData) {
      toast.error('Sila isi borang terlebih dahulu', {
        description: 'Pastikan semua maklumat penting telah diisi'
      })
      return
    }
    
    setMinitGeneration({ status: 'generating', format, progress: 10 })
    
    try {
      const userMember = settings.members.find(m => m.id === settings.userMemberId)
      const ketuaPanitia = settings.members.find(m => m.jawatan.toLowerCase().includes('ketua panitia'))
      const mesyuaratLeftLogo = settings.logo1
      const mesyuaratRightLogo = settings.logo2
      
      const docData = {
        ...minitData,
        font: settings.font,
        logo1Base64: mesyuaratLeftLogo,
        logo2Base64: mesyuaratRightLogo,
        setiausahaSignatureBase64: settings.setiausahaSignature,
        ketuaPanitiaSignatureBase64: settings.ketuaPanitiaSignature,
        setiausaha: minitData.setiausaha || userMember?.nama || '',
        ketuaPanitia: minitData.ketuaPanitia || ketuaPanitia?.nama || ''
      }
      
      setMinitGeneration(prev => ({ ...prev, progress: 30 }))
      
      let blob: Blob
      if (format === 'docx') {
        blob = await generateMinitDocx(docData)
      } else {
        blob = await generateMinitPdf(docData)
      }
      
      setMinitGeneration(prev => ({ ...prev, progress: 80 }))
      
      const tahun = minitData.tarikh ? new Date(minitData.tarikh).getFullYear().toString() : new Date().getFullYear().toString()
      downloadBlob(blob, `MINIT_MESYUARAT_${minitData.bilangan}_${tahun}.${format}`)
      
      setMinitGeneration({ status: 'success', format, progress: 100 })
      
      toast.success(`Dokumen ${format.toUpperCase()} berjaya dijana!`, {
        description: 'Fail telah dimuat turun ke peranti anda',
        icon: <CheckCircle2 className="h-4 w-4 text-primary" />
      })
      
      setTimeout(() => {
        setMinitGeneration({ status: 'idle', format: null, progress: 0 })
      }, 2000)
      
    } catch (error) {
      console.error('Document generation error:', error)
      setMinitGeneration({ status: 'error', format, progress: 0 })
      
      toast.error('Ralat semasa menjana dokumen', {
        description: error instanceof Error ? error.message : 'Sila cuba lagi',
        icon: <AlertCircle className="h-4 w-4 text-red-500" />
      })
      
      setTimeout(() => {
        setMinitGeneration({ status: 'idle', format: null, progress: 0 })
      }, 3000)
    }
  }, [minitData, settings])

  const handleGenerateOpr = useCallback(async (format: 'pdf' | 'png' = 'pdf') => {
    if (!oprData) {
      toast.error('Sila isi borang terlebih dahulu')
      return
    }
    if (!oprData.gambarBase64 || oprData.gambarBase64.length < 1) {
      toast.error('Sila tambah sekurang-kurangnya 1 gambar untuk OPR')
      return
    }
    if (oprData.gambarBase64.length > 8) {
      toast.error('Maksimum 8 gambar untuk OPR')
      return
    }
    
    setOprGeneration({ status: 'generating', format, progress: 10 })
    
    try {
      const mesyuaratLeftLogo = settings.logo1
      const mesyuaratRightLogo = settings.logo2

      const docData = {
        ...oprData,
        schoolName: settings.schoolName,
        schoolCode: settings.schoolCode,
        schoolAddress: settings.schoolAddress,
        logo1Base64: mesyuaratLeftLogo,
        logo2Base64: mesyuaratRightLogo,
        pegawaiTerlibat: oprData.pegawaiTerlibat,
        namaPgb: oprData.namaPgb,
        preparedBy: oprData.disediakanOleh,
        font: settings.font
      }

      setOprGeneration(prev => ({ ...prev, progress: 30 }))

      let filename = `OPR_${(oprData.namaProgram || 'LAPORAN').replace(/[^a-zA-Z0-9_-]/g, '_')}`
      
      if (format === 'png') {
        const blob = await generateOprImage(docData)
        filename += '.png'
        setOprGeneration(prev => ({ ...prev, progress: 80 }))
        downloadBlob(blob, filename)
        setOprGeneration({ status: 'success', format, progress: 100 })
        toast.success('Gambar OPR berjaya dijana!', {
          description: 'Fail telah dimuat turun ke peranti anda'
        })
      } else {
        await generateOprPdfClient(docData)
        setOprGeneration({ status: 'success', format, progress: 100 })
        toast.success('Tetingkap cetakan dibuka!', {
          description: 'Sila pilih "Save as PDF" dalam dialog cetakan'
        })
      }
      
      setTimeout(() => {
        setOprGeneration({ status: 'idle', format: null, progress: 0 })
      }, 2000)
    } catch (error) {
      console.error('OPR generation error:', error)
      setOprGeneration({ status: 'error', format, progress: 0 })
      
      // Check for mobile not supported error
      if (error instanceof Error && error.message === 'MOBILE_NOT_SUPPORTED') {
        toast.error('Penjanaan imej tidak disokong pada peranti mudah alih', {
          description: 'Sila gunakan butang PDF untuk menjana laporan',
          duration: 5000,
          icon: <AlertCircle className="h-4 w-4 text-amber-500" />
        })
      } else {
        toast.error('Ralat semasa menjana dokumen', {
          description: error instanceof Error ? error.message : 'Sila cuba lagi',
          icon: <AlertCircle className="h-4 w-4 text-red-500" />
        })
      }
      
      setTimeout(() => {
        setOprGeneration({ status: 'idle', format: null, progress: 0 })
      }, 3000)
    }
  }, [oprData, settings])

  const isMintGenerating = minitGeneration.status === 'generating'
  const isOprGenerating = oprGeneration.status === 'generating'

  return (
    <div className="min-h-screen bg-[#f4f6f2] flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-[var(--grid-border)] px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight uppercase">MINIT MESYUARAT & OPR</h1>
              <p className="text-[10px] text-slate-500 uppercase font-medium hidden sm:block">{settings.schoolName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={currentProfile?.id || ''} onValueChange={switchProfile}>
              <SelectTrigger className="w-[140px] sm:w-[180px] h-9 border-slate-200 rounded-none text-xs">
                <SelectValue>
                  <div className="flex items-center gap-1.5">
                    {currentProfile?.type === 'school' ? (
                      <Building2 className="h-3 w-3 shrink-0" />
                    ) : (
                      <Users className="h-3 w-3 shrink-0" />
                    )}
                    <span className="truncate">{currentProfile?.name}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {profiles.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-1.5">
                      {p.type === 'school' ? <Building2 className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
                      <span>{p.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="h-6 w-[1px] bg-[var(--grid-border)]" />
            
            <Sheet>
              <SheetTrigger asChild>
                <button className="text-slate-400 hover:text-slate-700 transition-colors">
                  <SettingsIcon className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg md:max-w-xl overflow-y-auto">
                <SheetHeader><SheetTitle className="text-sm font-bold uppercase tracking-wide">Tetapan</SheetTitle></SheetHeader>
                <div className="mt-4 sm:mt-6"><SettingsPanel /></div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-40 sm:pb-32">
          <Tabs defaultValue="minit" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 bg-white border border-[var(--grid-border)] p-0 h-auto rounded-none">
              <TabsTrigger 
                value="minit" 
                className="relative flex items-center justify-center gap-2 text-xs py-3 sm:py-4 px-2 sm:px-4 rounded-none data-[state=active]:bg-primary data-[state=active]:text-white font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200 border-r border-[var(--grid-border)] data-[state=active]:border-primary"
              >
                <ScrollText className="h-4 w-4 shrink-0" />
                <span className="font-bold uppercase tracking-wide leading-none pt-0.5">Minit</span>
              </TabsTrigger>
              <TabsTrigger 
                value="opr" 
                className="relative flex items-center justify-center gap-2 text-xs py-3 sm:px-4 rounded-none data-[state=active]:bg-primary data-[state=active]:text-white font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200"
              >
                <FileImage className="h-4 w-4 shrink-0" />
                <span className="font-bold uppercase tracking-wide leading-none pt-0.5">OPR</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="minit" className="space-y-6">
              <div className="bg-white border border-[var(--grid-border)]">
                <div className="p-4 border-b border-[var(--grid-border)] bg-slate-50">
                  <h2 className="text-sm font-bold uppercase tracking-wide">Borang Minit Mesyuarat</h2>
                  <p className="text-[10px] text-slate-500 mt-1">Isi borang untuk menjana minit mesyuarat dalam format DOCX atau PDF</p>
                </div>
                <div className="p-4 sm:p-6">
                  <MinitMesyuaratForm onDataChange={setMinitData} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="opr" className="space-y-6">
              <div className="bg-white border border-[var(--grid-border)]">
                <div className="p-4 border-b border-[var(--grid-border)] bg-slate-50">
                  <h2 className="text-sm font-bold uppercase tracking-wide">Borang OPR</h2>
                  <p className="text-[10px] text-slate-500 mt-1">Isi borang untuk menjana lapuran OPR dengan gambar</p>
                </div>
                <div className="p-4 sm:p-6">
                  <OprForm key={currentProfile?.id || 'default-opr'} onDataChange={setOprData} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Bottom Action Bar (Sticky) */}
      <footer className="fixed bottom-0 w-full bg-white border-t-2 border-slate-800 px-4 sm:px-6 py-3 sm:py-4 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="max-w-6xl mx-auto">
          {/* Status Bar */}
          <div className="flex items-center justify-between mb-3 sm:mb-0 sm:hidden">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <span className="status-dot" />
              Auto-disimpan
            </span>
            {(isMintGenerating || isOprGenerating) && (
              <div className="flex items-center gap-2">
                <Progress value={minitGeneration.progress || oprGeneration.progress} className="w-20 h-1.5" />
                <span className="text-[10px] font-bold">{minitGeneration.progress || oprGeneration.progress}%</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            {/* Left: Status */}
            <div className="hidden sm:flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="status-dot" />
                Auto-disimpan
              </span>
            </div>
            
            {/* Right: Buttons Grid */}
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
              {/* Progress - Desktop */}
              {(isMintGenerating || isOprGenerating) && (
                <div className="hidden sm:flex items-center gap-2 mr-1">
                  <Progress value={minitGeneration.progress || oprGeneration.progress} className="w-16 h-1.5" />
                  <span className="text-[10px] font-bold">{minitGeneration.progress || oprGeneration.progress}%</span>
                </div>
              )}
              
              {/* Minit Tab Buttons */}
              {activeTab === 'minit' && (
                <>
                  {/* DOCX Button */}
                  <Button 
                    onClick={() => handleGenerateMinit('docx')}
                    disabled={isMintGenerating}
                    size="sm"
                    className="btn-primary h-10 sm:h-9"
                  >
                    {minitGeneration.status === 'generating' && minitGeneration.format === 'docx' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : minitGeneration.status === 'success' && minitGeneration.format === 'docx' ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    <span>DOCX</span>
                  </Button>
                  
                  {/* PDF Minit Button */}
                  <Button 
                    variant="outline"
                    onClick={() => handleGenerateMinit('pdf')}
                    disabled={isMintGenerating}
                    size="sm"
                    className="btn-dark h-10 sm:h-9 disabled:opacity-60"
                  >
                    {minitGeneration.status === 'generating' && minitGeneration.format === 'pdf' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : minitGeneration.status === 'success' && minitGeneration.format === 'pdf' ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <FileCheck className="h-3.5 w-3.5" />
                    )}
                    <span className="hidden sm:inline">PDF</span>
                    <span className="sm:hidden">PDF</span>
                  </Button>
                </>
              )}

              {/* OPR Tab Buttons */}
              {activeTab === 'opr' && (
                <>
                  {/* PDF OPR Button */}
                  <Button 
                    onClick={() => handleGenerateOpr('pdf')}
                    disabled={isOprGenerating}
                    size="sm"
                    className="btn-secondary border-slate-800 text-slate-800 hover:bg-slate-100 h-10 sm:h-9 disabled:opacity-60"
                  >
                    {oprGeneration.status === 'generating' && oprGeneration.format === 'pdf' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : oprGeneration.status === 'success' && oprGeneration.format === 'pdf' ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <FileCheck className="h-3.5 w-3.5" />
                    )}
                    <span className="hidden sm:inline">PDF</span>
                    <span className="sm:hidden">PDF</span>
                  </Button>

                  {/* PNG Button */}
                  <Button 
                    variant="outline"
                    onClick={() => handleGenerateOpr('png')}
                    disabled={isOprGenerating}
                    size="sm"
                    className="btn-secondary border-primary text-primary hover:bg-blue-50 h-10 sm:h-9 disabled:opacity-60"
                  >
                    {oprGeneration.status === 'generating' && oprGeneration.format === 'png' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : oprGeneration.status === 'success' && oprGeneration.format === 'png' ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <ImageIcon className="h-3.5 w-3.5" />
                    )}
                    <span className="hidden sm:inline">IMG</span>
                    <span className="sm:hidden">IMG</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// CSR only - simple and reliable
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#f4f6f2] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-slate-500 font-mono">Memuatkan...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default function Home() {
  return (
    <ClientOnly>
      <SettingsProvider>
        <MainContent />
      </SettingsProvider>
    </ClientOnly>
  )
}
