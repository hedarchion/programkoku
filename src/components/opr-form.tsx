'use client'

import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, ListChecks, ChevronDown, ChevronUp, Image as ImageIcon, Calendar, Clock, MapPin, Users, AlertCircle, FileText, User } from 'lucide-react'

import { useSettings } from '@/lib/settings-context'
import { toast } from 'sonner'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'

export interface OprFormData {
  namaProgram: string
  tarikh: string
  masa: string
  tempat: string
  kehadiranSasaran: string
  isuMasalah: string
  aktiviti: string[]
  gambarBase64: string[]

  pegawaiTerlibat: string[]
  namaPgb: string
  disediakanOleh: string
}

interface Props {
  onDataChange: (data: OprFormData) => void
}

export default function OprForm({ onDataChange }: Props) {
  const { settings } = useSettings()

  const guruBesar = useMemo(
    () => settings.members.find(m => m.jawatan.toLowerCase().includes('guru besar')),
    [settings.members]
  )
  const currentUser = useMemo(
    () => settings.members.find(m => m.id === settings.userMemberId),
    [settings.members, settings.userMemberId]
  )

  const defaultMembers = useMemo(
    () => settings.members
      .filter(m => !m.jawatan.toLowerCase().includes('guru besar'))
      .slice(0, 10)
      .map(m => m.nama.toUpperCase()),
    [settings.members]
  )

  const defaultData = useMemo<OprFormData>(() => ({
    namaProgram: '',
    tarikh: '',
    masa: '',
    tempat: '',
    kehadiranSasaran: 'SEMUA MURID PERGERAKAN PUTERI ISLAM MALAYSIA (PPIM)\nSK AYER TAWAR',
    isuMasalah: 'Berjalan seperti telah dirancang',
    aktiviti: [
      'Guru-guru penasihat dan murid-murid berkumpul di surau dan mengambil kehadiran.',
      'Kata aluan daripada ketua guru penasihat.',
      'Nyanyian Asma Ul-Husna dan lagu PPIM.',
      'Perlantikan Jawatankuasa PPIM (murid).',
      'Perbincangan aktiviti tahunan.',
      'Hal-hal lain.',
      'Ucapan penutupan.'
    ],
    gambarBase64: [],
    pegawaiTerlibat: defaultMembers,
    namaPgb: guruBesar?.nama?.toUpperCase() || '',
    disediakanOleh: currentUser ? `${currentUser.nama.toUpperCase()} / ${currentUser.jawatan.toUpperCase()}` : ''
  }), [currentUser, defaultMembers, guruBesar?.nama])

  const [data, setData] = useState<OprFormData>(defaultData)
  const [pegawaiInput, setPegawaiInput] = useState(defaultMembers.join('\n'))
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    program: true,
    aktiviti: true
  })

  useEffect(() => {
    onDataChange(data)
  }, [data, onDataChange])

  const updateField = <K extends keyof OprFormData>(field: K, value: OprFormData[K]) => {
    setData(prev => ({ ...prev, [field]: value }))
  }

  const handlePegawaiChange = (text: string) => {
    setPegawaiInput(text)
    const lines = text.split('\n').filter(line => line.trim() !== '')
    updateField('pegawaiTerlibat', lines)
  }

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const addAktiviti = () => {
    setData(prev => ({ ...prev, aktiviti: [...prev.aktiviti, ''] }))
  }

  const removeAktiviti = (index: number) => {
    if (data.aktiviti.length > 1) {
      setData(prev => ({ ...prev, aktiviti: prev.aktiviti.filter((_, i) => i !== index) }))
    }
  }

  const updateAktiviti = (index: number, value: string) => {
    setData(prev => ({
      ...prev,
      aktiviti: prev.aktiviti.map((a, i) => i === index ? value : a)
    }))
  }

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const availableSlots = 8 - data.gambarBase64.length
    if (availableSlots <= 0) {
      toast.error('Maksimum 8 gambar sahaja')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
    const maxSizeMB = 5
    const maxSizeBytes = maxSizeMB * 1024 * 1024

    const selected: File[] = []
    const errors: string[] = []

    Array.from(files).slice(0, availableSlots).forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Format tidak disokong`)
        return
      }
      if (file.size > maxSizeBytes) {
        errors.push(`${file.name}: Fail terlalu besar (max ${maxSizeMB}MB)`)
        return
      }
      selected.push(file)
    })

    if (errors.length > 0) {
      errors.forEach(err => toast.error(err))
    }

    if (selected.length === 0) return

    const toBase64 = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error('Gagal membaca fail imej'))
        reader.readAsDataURL(file)
      })

    try {
      const uploaded = await Promise.all(selected.map(toBase64))
      setData(prev => ({ ...prev, gambarBase64: [...prev.gambarBase64, ...uploaded] }))
      toast.success(`${selected.length} gambar berjaya dimuat naik`)
    } catch {
      toast.error('Ralat semasa memuat naik gambar')
    }
  }

  const removeImage = (index: number) => {
    setData(prev => ({
      ...prev,
      gambarBase64: prev.gambarBase64.filter((_, i) => i !== index)
    }))
  }

  const completedAktiviti = data.aktiviti.filter(a => a.trim()).length

  return (
    <div className="space-y-2">
      {/* Maklumat Program */}
      <Collapsible open={openSections.program} onOpenChange={() => toggleSection('program')}>
        <Card className="shadow-sm border-slate-200 dark:border-slate-700 overflow-hidden">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 py-2.5 px-3 sm:px-4 bg-slate-50/50 dark:bg-slate-800/30 transition-colors">
              <CardTitle className="text-sm flex items-center justify-between font-semibold">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  Maklumat Program
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${openSections.program ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="grid gap-2.5 sm:gap-3 sm:grid-cols-2 p-3 sm:p-4 pt-2">
              {/* Nama Program - Full Width */}
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  Nama Program <span className="text-red-500">*</span>
                </Label>
                <Input 
                  value={data.namaProgram} 
                  onChange={e => updateField('namaProgram', e.target.value)} 
                  placeholder="MESYUARAT AGUNG PPIM 2026"
                  className="h-9 text-sm"
                />
              </div>

              {/* Tarikh & Masa - 2 columns */}
              <div className="space-y-1">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  Tarikh
                </Label>
                <Input 
                  type="date"
                  value={data.tarikh} 
                  onChange={e => updateField('tarikh', e.target.value)} 
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-slate-400" />
                  Masa
                </Label>
                <Input 
                  value={data.masa} 
                  onChange={e => updateField('masa', e.target.value)} 
                  placeholder="7.30 pagi"
                  className="h-9 text-sm"
                />
              </div>

              {/* Tempat - Full Width */}
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-slate-400" />
                  Tempat
                </Label>
                <Input 
                  value={data.tempat} 
                  onChange={e => updateField('tempat', e.target.value)} 
                  placeholder="Surau SK Ayer Tawar"
                  className="h-9 text-sm"
                />
              </div>

              {/* PGB - Full Width */}
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <User className="h-3 w-3 text-slate-400" />
                  Nama Penuh PGB
                </Label>
                <Input 
                  value={data.namaPgb} 
                  onChange={e => updateField('namaPgb', e.target.value)} 
                  placeholder="Nama Guru Besar"
                  className="h-9 text-sm"
                />
              </div>

              {/* Pegawai Terlibat - Full Width */}
              <div className="space-y-1 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Users className="h-3 w-3 text-slate-400" />
                    Pegawai Terlibat
                  </Label>
                  <span className="text-[10px] text-slate-400">Satu nama per baris</span>
                </div>
                <Textarea
                  value={pegawaiInput}
                  onChange={e => handlePegawaiChange(e.target.value)}
                  placeholder="PN. KHADIJAH&#10;PN. IFA YUSNANI&#10;..."
                  rows={4}
                  className="text-sm font-mono resize-none"
                />
              </div>

              {/* Kehadiran - Full Width */}
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-medium">Kehadiran / Sasaran</Label>
                <Textarea
                  value={data.kehadiranSasaran}
                  onChange={e => updateField('kehadiranSasaran', e.target.value)}
                  placeholder="Semua murid/peraserta..."
                  rows={2}
                  className="text-sm resize-none"
                />
              </div>

              {/* Isu - Full Width */}
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3 text-slate-400" />
                  Isu / Masalah
                </Label>
                <Textarea
                  value={data.isuMasalah}
                  onChange={e => updateField('isuMasalah', e.target.value)}
                  placeholder="Berjalan seperti telah dirancang"
                  rows={2}
                  className="text-sm resize-none"
                />
              </div>

              {/* Disediakan Oleh - Full Width */}
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-medium">Disediakan Oleh</Label>
                <Input
                  value={data.disediakanOleh}
                  onChange={e => updateField('disediakanOleh', e.target.value)}
                  placeholder="Nama / Jawatan"
                  className="h-9 text-sm"
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Senarai Aktiviti */}
      <Collapsible open={openSections.aktiviti} onOpenChange={() => toggleSection('aktiviti')}>
        <Card className="shadow-sm border-slate-200 dark:border-slate-700 overflow-hidden">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 py-2.5 px-3 sm:px-4 bg-slate-50/50 dark:bg-slate-800/30 transition-colors">
              <CardTitle className="text-sm flex items-center justify-between font-semibold">
                <span className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-emerald-600" />
                  Senarai Aktiviti
                  {completedAktiviti > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                      {completedAktiviti}
                    </Badge>
                  )}
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${openSections.aktiviti ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-2 p-3 sm:p-4 pt-2">
              {data.aktiviti.map((a, index) => (
                <div key={index} className="flex gap-2 items-start group">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 mt-1">
                    {index + 1}
                  </div>
                  <Textarea 
                    value={a} 
                    onChange={e => updateAktiviti(index, e.target.value)} 
                    placeholder={`Aktiviti ${index + 1}...`}
                    className="flex-1 text-sm min-h-[60px] resize-none"
                    rows={2}
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                    onClick={() => removeAktiviti(index)}
                    disabled={data.aktiviti.length <= 1}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
              ))}
              <Button 
                type="button" 
                variant="outline" 
                className="w-full h-9 gap-1.5 text-xs mt-1 border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all duration-200" 
                onClick={addAktiviti}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Aktiviti</span>
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Gambar */}
      <Card className="shadow-sm border-slate-200 dark:border-slate-700 overflow-hidden">
        <CardHeader className="py-2.5 px-3 sm:px-4 bg-slate-50/50 dark:bg-slate-800/30">
          <CardTitle className="text-sm flex items-center justify-between font-semibold">
            <span className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-emerald-600" />
              Gambar
            </span>
            <Badge 
              variant={data.gambarBase64.length > 0 ? "default" : "secondary"} 
              className="text-[10px] h-5 px-1.5"
            >
              {data.gambarBase64.length}/8
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-3 sm:p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="text-amber-600 font-medium">Format:</span> JPG, PNG, WEBP, HEIC • Max 5MB
          </p>
          

          <Input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.heic,.heif,image/heic,image/heif"
            multiple
            onChange={e => {
              void handleImageUpload(e.target.files)
              e.target.value = ''
            }}
            className="h-9 text-sm file:text-xs file:mr-3"
          />

          {data.gambarBase64.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
              {data.gambarBase64.map((img, index) => (
                <div key={index} className="relative rounded-lg overflow-hidden border bg-slate-50 dark:bg-slate-800 aspect-square group">
                  <img 
                    src={img} 
                    alt={`Gambar ${index + 1}`} 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <span className="absolute bottom-1 left-1 text-[9px] text-white bg-black/50 px-1.5 py-0.5 rounded">
                    {index + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
