'use client'

import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, ListChecks, ChevronDown, ChevronUp, Image as ImageIcon, Calendar, Clock, MapPin, Users, AlertCircle, FileText, User } from 'lucide-react'

import { useSettings } from '@/lib/settings-context'
import { toast } from 'sonner'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

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

// Section Header Component
const SectionHeader = ({ number, title }: { number: string; title: string }) => (
  <div className="flex items-center gap-2 mb-4">
    <span className="section-badge">{number}</span>
    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800">{title}</h2>
  </div>
)

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
  const officerCount = data.pegawaiTerlibat.filter(p => p.trim()).length
  
  // Layout limit warnings
  const getActivityWarning = () => {
    if (data.aktiviti.length >= 8) return { type: 'error', msg: 'Maksimum 8 aktiviti untuk satu halaman A4' }
    if (data.aktiviti.length >= 6) return { type: 'warning', msg: '6+ aktiviti akan menggunakan susunan padat' }
    return null
  }
  
  const getOfficerWarning = () => {
    if (officerCount >= 12) return { type: 'error', msg: 'Maksimum 12 pegawai untuk satu halaman A4' }
    if (officerCount >= 8) return { type: 'warning', msg: '8+ pegawai akan menggunakan susunan padat' }
    return null
  }
  
  const getImageWarning = () => {
    if (data.gambarBase64.length >= 8) return { type: 'error', msg: 'Maksimum 8 gambar untuk satu halaman A4' }
    if (data.gambarBase64.length >= 7) return { type: 'warning', msg: 'Susunan sangat padat akan digunakan' }
    if (data.gambarBase64.length >= 5) return { type: 'info', msg: '5+ gambar akan menggunakan susunan padat' }
    return null
  }
  
  const activityWarning = getActivityWarning()
  const officerWarning = getOfficerWarning()
  const imageWarning = getImageWarning()

  return (
    <div className="space-y-8">
      {/* Section 01: Maklumat Program */}
      <section>
        <SectionHeader number="01" title="Maklumat Program" />
        <div className="border-l border-t border-[var(--grid-border)]">
          <Collapsible open={openSections.program} onOpenChange={() => toggleSection('program')}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-4 border-r border-b border-[var(--grid-border)] bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wide">Butiran Program</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${openSections.program ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid grid-cols-1 md:grid-cols-2 border-r border-b border-[var(--grid-border)]">
                {/* Nama Program - Full Width */}
                <div className="p-4 border-b border-[var(--grid-border)] md:col-span-2 bg-white">
                  <label className="block text-[10px] font-bold uppercase opacity-50 mb-2 flex items-center gap-1">
                    Nama Program <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    value={data.namaProgram} 
                    onChange={e => updateField('namaProgram', e.target.value)} 
                    placeholder="MESYUARAT AGUNG PPIM 2026"
                    className="text-sm border-slate-200 focus:border-primary" 
                  />
                </div>

                {/* Tarikh */}
                <div className="p-4 border-b md:border-r border-[var(--grid-border)] bg-white">
                  <label className="block text-[10px] font-bold uppercase opacity-50 mb-2 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Tarikh
                  </label>
                  <Input 
                    type="date"
                    value={data.tarikh} 
                    onChange={e => updateField('tarikh', e.target.value)} 
                    className="text-sm border-slate-200 focus:border-primary"
                  />
                </div>

                {/* Masa */}
                <div className="p-4 border-b border-[var(--grid-border)] bg-white">
                  <label className="block text-[10px] font-bold uppercase opacity-50 mb-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Masa
                  </label>
                  <Input 
                    value={data.masa} 
                    onChange={e => updateField('masa', e.target.value)} 
                    placeholder="7.30 pagi"
                    className="text-sm border-slate-200 focus:border-primary"
                  />
                </div>

                {/* Tempat - Full Width */}
                <div className="p-4 border-b border-[var(--grid-border)] md:col-span-2 bg-white">
                  <label className="block text-[10px] font-bold uppercase opacity-50 mb-2 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Tempat
                  </label>
                  <Input 
                    value={data.tempat} 
                    onChange={e => updateField('tempat', e.target.value)} 
                    placeholder="Surau SK Ayer Tawar"
                    className="text-sm border-slate-200 focus:border-primary"
                  />
                </div>

                {/* Nama PGB - Full Width */}
                <div className="p-4 border-b border-[var(--grid-border)] md:col-span-2 bg-white">
                  <label className="block text-[10px] font-bold uppercase opacity-50 mb-2 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Nama Penuh PGB
                  </label>
                  <Input 
                    value={data.namaPgb} 
                    onChange={e => updateField('namaPgb', e.target.value)} 
                    placeholder="Nama Guru Besar"
                    className="text-sm border-slate-200 focus:border-primary"
                  />
                </div>

                {/* Pegawai Terlibat - Full Width */}
                <div className="p-4 border-b border-[var(--grid-border)] md:col-span-2 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] font-bold uppercase opacity-50 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Pegawai Terlibat
                    </label>
                    <div className="flex items-center gap-2">
                      {officerWarning && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 flex items-center gap-1 ${
                          officerWarning.type === 'error' ? 'bg-red-100 text-red-700 border border-red-200' :
                          'bg-amber-100 text-amber-700 border border-amber-200'
                        }`}>
                          <AlertCircle className="h-3 w-3" />
                          {officerCount}/12
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">Satu nama per baris</span>
                    </div>
                  </div>
                  <Textarea
                    value={pegawaiInput}
                    onChange={e => handlePegawaiChange(e.target.value)}
                    placeholder="PN. KHADIJAH&#10;PN. IFA YUSNANI&#10;..."
                    rows={4}
                    className="text-sm font-mono border-slate-200 focus:border-primary resize-none"
                  />
                  {officerWarning && (
                    <div className={`mt-2 p-2 text-[10px] ${
                      officerWarning.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      <div className="flex items-start gap-1.5">
                        <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">{officerWarning.type === 'error' ? 'Had Maksimum: ' : 'Amaran: '}</span>
                          {officerWarning.msg}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Kehadiran - Full Width */}
                <div className="p-4 border-b border-[var(--grid-border)] md:col-span-2 bg-white">
                  <label className="block text-[10px] font-bold uppercase opacity-50 mb-2">Kehadiran / Sasaran</label>
                  <Textarea
                    value={data.kehadiranSasaran}
                    onChange={e => updateField('kehadiranSasaran', e.target.value)}
                    placeholder="Semua murid/peraserta..."
                    rows={2}
                    className="text-sm border-slate-200 focus:border-primary resize-none"
                  />
                </div>

                {/* Isu - Full Width */}
                <div className="p-4 border-b border-[var(--grid-border)] md:col-span-2 bg-white">
                  <label className="block text-[10px] font-bold uppercase opacity-50 mb-2 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Isu / Masalah
                  </label>
                  <Textarea
                    value={data.isuMasalah}
                    onChange={e => updateField('isuMasalah', e.target.value)}
                    placeholder="Berjalan seperti telah dirancang"
                    rows={2}
                    className="text-sm border-slate-200 focus:border-primary resize-none"
                  />
                </div>

                {/* Disediakan Oleh - Full Width */}
                <div className="p-4 border-b border-[var(--grid-border)] md:col-span-2 bg-white">
                  <label className="block text-[10px] font-bold uppercase opacity-50 mb-2">Disediakan Oleh</label>
                  <Input
                    value={data.disediakanOleh}
                    onChange={e => updateField('disediakanOleh', e.target.value)}
                    placeholder="Nama / Jawatan"
                    className="text-sm border-slate-200 focus:border-primary"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </section>

      {/* Section 02: Senarai Aktiviti */}
      <section>
        <SectionHeader number="02" title="Senarai Aktiviti" />
        <div className="border-l border-t border-[var(--grid-border)]">
          <Collapsible open={openSections.aktiviti} onOpenChange={() => toggleSection('aktiviti')}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-4 border-r border-b border-[var(--grid-border)] bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <ListChecks className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wide">Aktiviti</span>
                  {completedAktiviti > 0 && (
                    <span className="text-[10px] font-bold bg-primary text-white px-1.5 py-0.5">
                      {completedAktiviti}
                    </span>
                  )}
                  {activityWarning && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 flex items-center gap-1 ${
                      activityWarning.type === 'error' ? 'bg-red-100 text-red-700 border border-red-200' :
                      activityWarning.type === 'warning' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                      'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}>
                      <AlertCircle className="h-3 w-3" />
                      {activityWarning.type === 'error' ? 'Maksimum' : activityWarning.type === 'warning' ? 'Padat' : 'Info'}
                    </span>
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${openSections.aktiviti ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="border-r border-b border-[var(--grid-border)] bg-white p-4 space-y-3">
                {data.aktiviti.map((a, index) => (
                  <div key={index} className="flex gap-3 items-start group">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center bg-primary/10 text-[10px] font-black text-primary">
                      {index + 1}
                    </div>
                    <Textarea 
                      value={a} 
                      onChange={e => updateAktiviti(index, e.target.value)} 
                      placeholder={`Aktiviti ${index + 1}...`}
                      className="flex-1 text-sm min-h-[60px] resize-none border-slate-200 focus:border-primary"
                      rows={2}
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon"
                      className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeAktiviti(index)}
                      disabled={data.aktiviti.length <= 1}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                ))}
                {activityWarning && (
                  <div className={`p-3 text-xs ${
                    activityWarning.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                    activityWarning.type === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">
                          {activityWarning.type === 'error' ? 'Had Maksimum Dicapai' : 
                           activityWarning.type === 'warning' ? 'Susunan Padat' : 'Maklumat'}
                        </p>
                        <p className="mt-0.5 opacity-80">{activityWarning.msg}</p>
                        {activityWarning.type === 'error' && (
                          <p className="mt-1 text-[10px] opacity-70">Lebih daripada 8 aktiviti akan dipotong untuk muat dalam satu halaman A4.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <button 
                  onClick={addAktiviti}
                  disabled={data.aktiviti.length >= 8}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-slate-300 hover:border-primary hover:bg-blue-50/30 transition-all group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-300 disabled:hover:bg-transparent"
                >
                  <Plus className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-primary transition-colors">
                    {data.aktiviti.length >= 8 ? 'Had Maksimum (8)' : 'Tambah Aktiviti'}
                  </span>
                </button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </section>

      {/* Section 03: Gambar */}
      <section>
        <SectionHeader number="03" title="Gambar" />
        <div className="border-l border-t border-r border-b border-[var(--grid-border)] bg-white">
          <div className="p-4 border-b border-[var(--grid-border)] bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ImageIcon className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wide">Muat Naik Gambar</span>
              {imageWarning && (
                <span className={`text-[10px] font-bold px-2 py-0.5 flex items-center gap-1 ${
                  imageWarning.type === 'error' ? 'bg-red-100 text-red-700 border border-red-200' :
                  imageWarning.type === 'warning' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                  'bg-blue-100 text-blue-700 border border-blue-200'
                }`}>
                  <AlertCircle className="h-3 w-3" />
                  {imageWarning.type === 'error' ? 'Maks' : imageWarning.type === 'warning' ? 'Padat' : 'Info'}
                </span>
              )}
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 ${
              data.gambarBase64.length >= 8 ? 'bg-red-500 text-white' :
              data.gambarBase64.length >= 5 ? 'bg-amber-500 text-white' :
              data.gambarBase64.length > 0 ? 'bg-primary text-white' : 
              'bg-slate-200 text-slate-600'
            }`}>
              {data.gambarBase64.length}/8
            </span>
          </div>
          <div className="p-4 space-y-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              <span className="text-amber-600 font-bold">Format:</span> JPG, PNG, WEBP, HEIC • Max 5MB
            </p>

            {imageWarning && (
              <div className={`p-3 text-xs ${
                imageWarning.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                imageWarning.type === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">
                      {imageWarning.type === 'error' ? 'Had Maksimum Dicapai' : 
                       imageWarning.type === 'warning' ? 'Susunan Sangat Padat' : 'Maklumat Layout'}
                    </p>
                    <p className="mt-0.5 opacity-80">{imageWarning.msg}</p>
                    {imageWarning.type === 'error' && (
                      <p className="mt-1 text-[10px] opacity-70">
                        Hanya 8 gambar pertama akan digunakan untuk menjana laporan.
                      </p>
                    )}
                    {imageWarning.type === 'warning' && (
                      <p className="mt-1 text-[10px] opacity-70">
                        Gambar akan dipaparkan dalam saiz lebih kecil untuk muat dalam satu halaman.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="relative">
              <Input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.heic,.heif,image/heic,image/heif"
                multiple
                disabled={data.gambarBase64.length >= 8}
                onChange={e => {
                  void handleImageUpload(e.target.files)
                  e.target.value = ''
                }}
                className="text-sm file:text-xs file:mr-3 border-slate-200 focus:border-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {data.gambarBase64.length >= 8 && (
                <p className="mt-2 text-[10px] text-red-600 font-medium">
                  Had maksimum 8 gambar telah dicapai. Sila buang gambar untuk menambah yang baru.
                </p>
              )}
            </div>

            {data.gambarBase64.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
                {data.gambarBase64.map((img, index) => (
                  <div key={index} className="relative overflow-hidden border border-[var(--grid-border)] bg-slate-50 aspect-square group">
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
                    <span className="absolute bottom-1 left-1 text-[9px] text-white bg-black/50 px-1.5 py-0.5 font-bold">
                      {index + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
