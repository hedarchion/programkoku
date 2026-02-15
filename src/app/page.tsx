'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Presentation, Download, Loader2, Settings as SettingsIcon, Building2, Users, FileCheck, CheckCircle2, AlertCircle, Image as ImageIcon } from 'lucide-react'
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
      
      // Simulate progress for better UX
      setMinitGeneration(prev => ({ ...prev, progress: 30 }))
      
      let blob: Blob
      if (format === 'docx') {
        blob = await generateMinitDocx(docData)
      } else {
        blob = await generateMinitPdf(docData)
      }
      
      setMinitGeneration(prev => ({ ...prev, progress: 80 }))
      
      downloadBlob(blob, `MINIT_MESYUARAT_${minitData.bilangan}_${minitData.tahun}.${format}`)
      
      setMinitGeneration({ status: 'success', format, progress: 100 })
      
      toast.success(`Dokumen ${format.toUpperCase()} berjaya dijana!`, {
        description: 'Fail telah dimuat turun ke peranti anda',
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      })
      
      // Reset to idle after showing success
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
      
      // Reset to idle after showing error
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
        // Use form data if available, otherwise defaults (though form should handle defaults)
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
        // PDF uses browser print dialog (native PDF generation)
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
      toast.error('Ralat semasa menjana dokumen', {
        description: error instanceof Error ? error.message : 'Sila cuba lagi',
        icon: <AlertCircle className="h-4 w-4 text-red-500" />
      })
      
      setTimeout(() => {
        setOprGeneration({ status: 'idle', format: null, progress: 0 })
      }, 3000)
    }
  }, [oprData, settings])

  const isMintGenerating = minitGeneration.status === 'generating'
  const isOprGenerating = oprGeneration.status === 'generating'

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-slate-950/95">
        <div className="container max-w-6xl mx-auto flex h-14 sm:h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-emerald-600 text-white shrink-0">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 dark:text-white truncate">Template Dokumen</h1>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 hidden sm:block truncate">{settings.schoolName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={currentProfile?.id || ''} onValueChange={switchProfile}>
              <SelectTrigger className="w-[140px] sm:w-[180px] h-8 sm:h-9">
                <SelectValue>
                  <div className="flex items-center gap-1.5">
                    {currentProfile?.type === 'school' ? (
                      <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                    ) : (
                      <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                    )}
                    <span className="truncate text-xs sm:text-sm">{currentProfile?.name}</span>
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
            
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="shrink-0 h-8 w-8 sm:h-9 sm:w-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <SettingsIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg md:max-w-xl overflow-y-auto">
                <SheetHeader><SheetTitle>Tetapan</SheetTitle></SheetHeader>
                <div className="mt-4 sm:mt-6"><SettingsPanel /></div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full">
        <div className="container max-w-6xl mx-auto px-4 py-4 sm:py-6 lg:py-8">
          <Tabs defaultValue="minit" className="w-full">
            <TabsList className="grid w-full max-w-sm mx-auto grid-cols-2 mb-4 sm:mb-6 lg:mb-8 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl h-auto">
              <TabsTrigger 
                value="minit" 
                className="flex items-center gap-2 text-xs sm:text-sm py-2.5 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md data-[state=active]:font-semibold text-slate-600 hover:text-slate-900 transition-all duration-200"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 text-blue-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <FileText className="h-3.5 w-3.5" />
                </div>
                <span className="hidden xs:inline">Minit</span>
                <span className="font-medium">Mesyuarat</span>
              </TabsTrigger>
              <TabsTrigger 
                value="opr" 
                className="flex items-center gap-2 text-xs sm:text-sm py-2.5 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-md data-[state=active]:font-semibold text-slate-600 hover:text-slate-900 transition-all duration-200"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-emerald-100 text-emerald-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                  <Presentation className="h-3.5 w-3.5" />
                </div>
                <span className="font-medium">OPR</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="minit" className="space-y-4">
              <Card>
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg">Minit Mesyuarat Panitia</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Isi borang untuk menjana minit mesyuarat dalam format DOCX atau PDF</CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-6"><MinitMesyuaratForm onDataChange={setMinitData} /></CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg">Jana Dokumen</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Dokumen dijana sepenuhnya dalam pelayar (tidak perlu pelayan)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress bar */}
                  {isMintGenerating && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Sedang menjana {minitGeneration.format?.toUpperCase()}...</span>
                        <span>{minitGeneration.progress}%</span>
                      </div>
                      <Progress value={minitGeneration.progress} className="h-2" />
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground sm:flex-1">
                      <span>Font:</span>
                      <span className="font-medium">{settings.font === 'calibri' ? 'Calibri' : 'Times New Roman'}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleGenerateMinit('docx')}
                        disabled={isMintGenerating}
                        size="sm"
                        className="relative overflow-hidden min-w-[100px] gap-1.5 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 disabled:opacity-60"
                      >
                        {minitGeneration.status === 'generating' && minitGeneration.format === 'docx' ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : minitGeneration.status === 'success' && minitGeneration.format === 'docx' ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                        <span className="text-xs font-medium">DOCX</span>
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleGenerateMinit('pdf')}
                        disabled={isMintGenerating}
                        size="sm"
                        className="relative overflow-hidden min-w-[100px] gap-1.5 border-red-200 hover:bg-red-50 hover:border-red-300 text-red-600 transition-all duration-200 disabled:opacity-60"
                      >
                        {minitGeneration.status === 'generating' && minitGeneration.format === 'pdf' ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : minitGeneration.status === 'success' && minitGeneration.format === 'pdf' ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <FileCheck className="h-3.5 w-3.5" />
                        )}
                        <span className="text-xs font-medium">PDF</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="opr" className="space-y-3">
              {/* OPR Form */}
              <OprForm key={currentProfile?.id || 'default-opr'} onDataChange={setOprData} />
              
              {/* Generate Buttons */}
              <Card className="shadow-md border-emerald-200 dark:border-emerald-800/50">
                <CardContent className="p-3 sm:p-4">
                  {isOprGenerating && (
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Sedang menjana {oprGeneration.format?.toUpperCase()}...</span>
                        <span className="font-medium">{oprGeneration.progress}%</span>
                      </div>
                      <Progress value={oprGeneration.progress} className="h-1.5" />
                    </div>
                  )}
                  
                  <div className="flex flex-col xs:flex-row gap-2.5">
                    <Button 
                      onClick={() => handleGenerateOpr('pdf')}
                      disabled={isOprGenerating}
                      size="default"
                      className="flex-1 h-10 sm:h-9 gap-2 bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 dark:hover:shadow-emerald-900/30 text-white transition-all duration-200 disabled:opacity-60"
                    >
                      {oprGeneration.status === 'generating' && oprGeneration.format === 'pdf' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : oprGeneration.status === 'success' && oprGeneration.format === 'pdf' ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <FileCheck className="h-4 w-4" />
                      )}
                      <span className="text-sm font-semibold">Jana PDF</span>
                    </Button>

                    <Button 
                      variant="outline"
                      onClick={() => handleGenerateOpr('png')}
                      disabled={isOprGenerating}
                      size="default"
                      className="flex-1 h-10 sm:h-9 gap-2 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 text-emerald-700 transition-all duration-200 disabled:opacity-60"
                    >
                      {oprGeneration.status === 'generating' && oprGeneration.format === 'png' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : oprGeneration.status === 'success' && oprGeneration.format === 'png' ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <ImageIcon className="h-4 w-4" />
                      )}
                      <span className="text-sm font-semibold">Jana Gambar</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <footer className="border-t bg-white dark:bg-slate-950 py-3 sm:py-4 mt-auto">
        <div className="container max-w-6xl mx-auto px-4 text-center text-xs sm:text-sm text-slate-500">
          Sistem Pengurusan Dokumen - {settings.schoolName}
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
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-500">Memuatkan...</p>
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
