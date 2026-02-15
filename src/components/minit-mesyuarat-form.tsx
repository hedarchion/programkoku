'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2, Users, Copy, Pencil } from 'lucide-react'
import { useSettings } from '@/lib/settings-context'
import { toast } from 'sonner'

interface AhliEntry {
  id: string
  nama: string
  jawatan: string
  isCustom?: boolean // Whether this was manually added
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

interface MinitFormData {
  bilangan: string
  tahun: string
  tarikh: string
  hari: string
  masa: string
  tempat: string
  panitia: string
  kehadiran: number
  ahli: AhliEntry[]
  ucapanPengerusi: string[]
  ucapanPenasihat: string[]
  minitLalu: { dibentang: string; dicadangkan: string; disokong: string }
  perkaraBerbangkit: string[]
  agendaItems: AgendaItem[]
  halHalLain: string[]
  ucapanPenangguhan: string[]
  // Signature info with editable fields
  setiausaha: SignatureInfo
  ketuaPanitia: SignatureInfo
  guruBesar: SignatureInfo
  // Section visibility toggles
  sections: {
    ucapanPengerusi: boolean
    ucapanPenasihat: boolean
    minitLalu: boolean
    perkaraBerbangkit: boolean
    halHalLain: boolean
    ucapanPenangguhan: boolean
  }
  // Editable section titles
  sectionTitles: {
    ucapanPengerusi: string
    ucapanPenasihat: string
    minitLalu: string
    perkaraBerbangkit: string
    halHalLain: string
    ucapanPenangguhan: string
  }
}

interface Props {
  onDataChange: (data: MinitFormData) => void
}

const hariList = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu']

const getHariFromTarikh = (tarikh: string): string => {
  if (!tarikh) return ''
  try {
    const date = new Date(tarikh)
    return hariList[date.getDay()]
  } catch {
    return ''
  }
}

const getTimeSuffix = (time: string): string => {
  if (!time) return ''
  try {
    const [hours] = time.split(':').map(Number)
    if (hours >= 5 && hours < 12) return 'Pagi'
    if (hours >= 12 && hours < 15) return 'Tengah Hari'
    if (hours >= 15 && hours < 19) return 'Petang'
    return 'Malam'
  } catch {
    return ''
  }
}

const formatTimeWithSuffix = (time: string): string => {
  if (!time) return ''
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const suffix = getTimeSuffix(time)
  const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)
  return `${displayHour}.${minutes} ${suffix}`
}

const generateId = () => Math.random().toString(36).substr(2, 9)

export default function MinitMesyuaratForm({ onDataChange }: Props) {
  const { settings, currentProfile } = useSettings()
  const userMember = settings.members.find(m => m.id === settings.userMemberId)
  const ketuaPanitiaMember = settings.members.find(m => m.jawatan.toLowerCase().includes('ketua panitia'))
  const guruBesarMember = settings.members.find(m => m.jawatan.toLowerCase().includes('guru besar'))
  
  const [data, setData] = useState<MinitFormData>(() => ({
    bilangan: '1',
    tahun: new Date().getFullYear().toString(),
    tarikh: '',
    hari: '',
    masa: '',
    tempat: 'Bilik j-QAF',
    panitia: currentProfile?.name || 'Organisasi',
    kehadiran: 0,
    ahli: [],
    ucapanPengerusi: [''],
    ucapanPenasihat: [''],
    minitLalu: { 
      dibentang: 'Minit mesyuarat Panitia bil [bil]/[tahun] telah dibentangkan oleh setiausaha dan disahkan.', 
      dicadangkan: '', 
      disokong: '' 
    },
    perkaraBerbangkit: ['Tiada'],
    agendaItems: [{ id: generateId(), perkara: '', butiran: [''], tindakan: '', included: true }],
    halHalLain: [''],
    ucapanPenangguhan: ['Mesyuarat diakhiri dengan bacaan surah Al Asr dan Tasbih Kaffarah'],
    setiausaha: {
      name: '',
      title1: 'Setiausaha Panitia',
      title2: '',
      title3: ''
    },
    ketuaPanitia: {
      name: '',
      title1: 'Ketua Panitia',
      title2: '',
      title3: ''
    },
    guruBesar: {
      name: 'GURU BESAR',
      title1: '',
      title2: '',
      title3: ''
    },
    sections: {
      ucapanPengerusi: true,
      ucapanPenasihat: true,
      minitLalu: true,
      perkaraBerbangkit: true,
      halHalLain: true,
      ucapanPenangguhan: true
    },
    sectionTitles: {
      ucapanPengerusi: 'Ucapan Pengerusi / Ketua Panitia',
      ucapanPenasihat: 'Ucapan Penasihat',
      minitLalu: 'Membentangkan dan Mengesahkan Minit Mesyuarat Yang Lalu',
      perkaraBerbangkit: 'Perkara Berbangkit',
      halHalLain: 'Hal-hal Lain',
      ucapanPenangguhan: 'Ucapan Penangguhan'
    }
  }))
  
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const initializedRef = useRef(false)
  
  // Populate from settings after mount (CSR only)
  useEffect(() => {
    if (settings.members.length > 0 && !initializedRef.current) {
      initializedRef.current = true
      const timer = setTimeout(() => {
        setData(prev => ({
          ...prev,
          ahli: settings.members.map(m => ({ 
            id: m.id, 
            nama: m.nama, 
            jawatan: m.jawatan, 
            isCustom: false 
          })),
          setiausaha: {
            ...prev.setiausaha,
            name: userMember?.nama || '',
            title1: userMember?.jawatan || prev.setiausaha.title1,
            title2: '',
            title3: ''
          },
          ketuaPanitia: {
            ...prev.ketuaPanitia,
            name: ketuaPanitiaMember?.nama || '',
            title1: ketuaPanitiaMember?.jawatan || prev.ketuaPanitia.title1,
            title2: '',
            title3: ''
          },
          guruBesar: {
            ...prev.guruBesar,
            name: guruBesarMember?.nama || prev.guruBesar.name,
            title1: guruBesarMember?.jawatan || prev.guruBesar.title1,
            title2: '',
            title3: ''
          }
        }))
        setSelectedMembers(settings.members.map(m => m.id))
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [
    settings.members,
    userMember?.nama,
    userMember?.jawatan,
    ketuaPanitiaMember?.nama,
    ketuaPanitiaMember?.jawatan,
    guruBesarMember?.nama,
    guruBesarMember?.jawatan
  ])
  
  // Debounced onDataChange
  const dataRef = useRef(data)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    dataRef.current = data
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      onDataChange(dataRef.current)
    }, 300)
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, onDataChange])

  const updateField = useCallback(<K extends keyof MinitFormData>(field: K, value: MinitFormData[K]) => {
    setData(prev => ({ ...prev, [field]: value }))
  }, [])

  const toggleMember = useCallback((memberId: string) => {
    const member = settings.members.find(m => m.id === memberId)
    if (!member) return

    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        setData(d => ({
          ...d,
          ahli: d.ahli.filter(a => a.id !== memberId)
        }))
        return prev.filter(id => id !== memberId)
      } else {
        setData(d => ({
          ...d,
          ahli: [...d.ahli, { id: member.id, nama: member.nama, jawatan: member.jawatan, isCustom: false }]
        }))
        return [...prev, memberId]
      }
    })
  }, [settings.members])

  const selectSignatureMember = useCallback((
    role: 'setiausaha' | 'ketuaPanitia' | 'guruBesar',
    memberId: string
  ) => {
    const member = settings.members.find(m => m.id === memberId)
    if (!member) return
    setData(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        name: member.nama,
        title1: member.jawatan,
        title2: '',
        title3: ''
      }
    }))
  }, [settings.members])

  const addAgendaItem = useCallback(() => {
    setData(prev => ({
      ...prev,
      agendaItems: [...prev.agendaItems, { id: generateId(), perkara: '', butiran: [''], tindakan: '', included: true }]
    }))
  }, [])

  const removeAgendaItem = useCallback((id: string) => {
    setData(prev => {
      if (prev.agendaItems.length > 1) {
        return { ...prev, agendaItems: prev.agendaItems.filter(a => a.id !== id) }
      }
      return prev
    })
  }, [])

  const updateAgendaItem = useCallback((id: string, field: 'perkara' | 'tindakan' | 'included', value: string | boolean) => {
    setData(prev => ({
      ...prev,
      agendaItems: prev.agendaItems.map(a => a.id === id ? { ...a, [field]: value } : a)
    }))
  }, [])

  const toggleAgendaIncluded = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      agendaItems: prev.agendaItems.map(a => a.id === id ? { ...a, included: !a.included } : a)
    }))
  }, [])

  const addButiran = useCallback((agendaId: string) => {
    setData(prev => ({
      ...prev,
      agendaItems: prev.agendaItems.map(a => 
        a.id === agendaId ? { ...a, butiran: [...a.butiran, ''] } : a
      )
    }))
  }, [])

  const removeButiran = useCallback((agendaId: string, butiranIndex: number) => {
    setData(prev => ({
      ...prev,
      agendaItems: prev.agendaItems.map(a => 
        a.id === agendaId ? { ...a, butiran: a.butiran.filter((_, bi) => bi !== butiranIndex) } : a
      )
    }))
  }, [])

  const updateButiran = useCallback((agendaId: string, butiranIndex: number, value: string) => {
    setData(prev => ({
      ...prev,
      agendaItems: prev.agendaItems.map(a => 
        a.id === agendaId ? { ...a, butiran: a.butiran.map((b, bi) => bi === butiranIndex ? value : b) } : a
      )
    }))
  }, [])

  const insertFrequentContent = useCallback((category: 'ucapanPengerusi' | 'ucapanPenasihat' | 'ucapanPenangguhan', content: string) => {
    setData(prev => {
      if (category === 'ucapanPengerusi') {
        return { ...prev, ucapanPengerusi: [...prev.ucapanPengerusi.filter(u => u), content] }
      } else if (category === 'ucapanPenasihat') {
        return { ...prev, ucapanPenasihat: [...prev.ucapanPenasihat.filter(u => u), content] }
      } else {
        return { ...prev, ucapanPenangguhan: [content] }
      }
    })
    toast.success('Kandungan kerap ditambah')
  }, [])

  const updateSectionTitle = useCallback((key: keyof MinitFormData['sectionTitles'], value: string) => {
    setData(prev => ({
      ...prev,
      sectionTitles: { ...prev.sectionTitles, [key]: value }
    }))
  }, [])

  // Calculate dynamic section numbers based on what's included
  const getSectionNumbers = useCallback(() => {
    let currentNum = 1
    const numbers: Record<string, number> = {}
    
    if (data.sections.ucapanPengerusi) numbers.ucapanPengerusi = currentNum++
    if (data.sections.ucapanPenasihat) numbers.ucapanPenasihat = currentNum++
    if (data.sections.minitLalu) numbers.minitLalu = currentNum++
    if (data.sections.perkaraBerbangkit) numbers.perkaraBerbangkit = currentNum++
    
    // Reserve numbering for every agenda slot so later sections never duplicate numbers.
    const numberedAgendaCount = data.agendaItems.length
    numbers.agendaStart = currentNum
    numbers.agendaEnd = currentNum + numberedAgendaCount - 1
    currentNum += numberedAgendaCount
    
    if (data.sections.halHalLain) numbers.halHalLain = currentNum++
    if (data.sections.ucapanPenangguhan) numbers.ucapanPenangguhan = currentNum
    
    return numbers
  }, [data.sections, data.agendaItems])

  const sectionNums = getSectionNumbers()
  const ahliCount = data.ahli.filter(a => a.nama).length

  // Editable section title component
  const EditableTitle = ({ 
    sectionNum, 
    titleKey, 
    value 
  }: { 
    sectionNum: number
    titleKey: keyof MinitFormData['sectionTitles']
    value: string 
  }) => {
    const [isEditing, setIsEditing] = useState(false)
    const [editValue, setEditValue] = useState(value)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus()
        inputRef.current.select()
      }
    }, [isEditing])

    const handleSave = () => {
      if (editValue.trim()) {
        updateSectionTitle(titleKey, editValue.trim())
      }
      setIsEditing(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSave()
      if (e.key === 'Escape') {
        setEditValue(value)
        setIsEditing(false)
      }
    }

    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">{sectionNum}.</span>
          <Input
            ref={inputRef}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="h-7 text-sm py-0 px-2 flex-1"
          />
        </div>
      )
    }

    return (
      <div 
        className="flex items-center gap-2 group cursor-pointer"
        onClick={() => setIsEditing(true)}
      >
        <span className="text-sm">{sectionNum}. {value}</span>
        <Pencil className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Maklumat Mesyuarat */}
      <Card className="shadow-sm">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm">Maklumat Mesyuarat</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Bilangan</Label>
            <Input value={data.bilangan} onChange={e => updateField('bilangan', e.target.value)} placeholder="1" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tahun</Label>
            <Input value={data.tahun} onChange={e => updateField('tahun', e.target.value)} placeholder="2025" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tarikh</Label>
            <Input 
              type="date" 
              value={data.tarikh} 
              onChange={e => {
                const tarikh = e.target.value
                const hari = getHariFromTarikh(tarikh)
                setData(prev => ({ ...prev, tarikh, hari }))
              }} 
              className="h-9" 
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Hari</Label>
            <Input 
              value={data.hari || 'Automatik dari tarikh'} 
              disabled 
              className="h-9 bg-slate-100 dark:bg-slate-800" 
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Masa</Label>
            <div className="flex items-center gap-2">
              <Input 
                type="time" 
                value={data.masa} 
                onChange={e => updateField('masa', e.target.value)} 
                className="h-9 w-28" 
              />
              {data.masa && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  = {formatTimeWithSuffix(data.masa)}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tempat</Label>
            <Input value={data.tempat} onChange={e => updateField('tempat', e.target.value)} placeholder="Bilik j-QAF" className="h-9" />
          </div>
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
            <Label className="text-xs">Organisasi</Label>
            <Input value={data.panitia} onChange={e => updateField('panitia', e.target.value)} placeholder={currentProfile?.name || 'Nama Organisasi'} className="h-9" />
          </div>
        </CardContent>
      </Card>

      {/* Kehadiran */}
      <Card className="shadow-sm">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Kehadiran ({ahliCount} orang)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Preconfigured members */}
          <div className="text-xs text-muted-foreground">Pilih kehadiran daripada senarai ahli di Tetapan.</div>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {settings.members.map(member => (
              <label 
                key={member.id} 
                className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors text-sm ${
                  selectedMembers.includes(member.id) 
                    ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700' 
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Checkbox
                  checked={selectedMembers.includes(member.id)}
                  onCheckedChange={() => toggleMember(member.id)}
                  className="shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{member.nama}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{member.jawatan}</div>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 1. Ucapan Pengerusi */}
      {data.sections.ucapanPengerusi && (
        <Card className="shadow-sm">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">
              <EditableTitle sectionNum={sectionNums.ucapanPengerusi} titleKey="ucapanPengerusi" value={data.sectionTitles.ucapanPengerusi} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {settings.frequentContent.filter(c => c.category === 'ucapanPengerusi').length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Kandungan Kerap:</Label>
                <div className="flex flex-wrap gap-1.5">
                  {settings.frequentContent.filter(c => c.category === 'ucapanPengerusi').map(fc => (
                    <Button 
                      key={fc.id} 
                      variant="outline" 
                      size="sm"
                      className="h-7 text-[10px]"
                      onClick={() => insertFrequentContent('ucapanPengerusi', fc.content)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      {fc.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              {data.ucapanPengerusi.map((u, index) => (
                <div key={index} className="flex gap-2">
                  <Textarea 
                    value={u} 
                    onChange={e => {
                      const newUcapan = [...data.ucapanPengerusi]
                      newUcapan[index] = e.target.value
                      updateField('ucapanPengerusi', newUcapan)
                    }} 
                    placeholder={`${sectionNums.ucapanPengerusi}.${index + 1} Butiran ucapan...`}
                    className="flex-1 text-sm"
                    rows={2}
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => {
                      if (data.ucapanPengerusi.length > 1) {
                        updateField('ucapanPengerusi', data.ucapanPengerusi.filter((_, i) => i !== index))
                      }
                    }}
                    disabled={data.ucapanPengerusi.length <= 1}
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              className="h-7 text-xs"
              onClick={() => updateField('ucapanPengerusi', [...data.ucapanPengerusi, ''])}
            >
              <Plus className="h-3 w-3 mr-1" /> Tambah Butiran
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 2. Ucapan Penasihat */}
      {data.sections.ucapanPenasihat && (
        <Card className="shadow-sm">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">
              <EditableTitle sectionNum={sectionNums.ucapanPenasihat} titleKey="ucapanPenasihat" value={data.sectionTitles.ucapanPenasihat} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.ucapanPenasihat.map((u, index) => (
              <div key={index} className="flex gap-2">
                <Textarea 
                  value={u} 
                  onChange={e => {
                    const newUcapan = [...data.ucapanPenasihat]
                    newUcapan[index] = e.target.value
                    updateField('ucapanPenasihat', newUcapan)
                  }} 
                  placeholder={`${sectionNums.ucapanPenasihat}.${index + 1} Butiran ucapan...`}
                  className="flex-1 text-sm"
                  rows={2}
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => {
                    if (data.ucapanPenasihat.length > 1) {
                      updateField('ucapanPenasihat', data.ucapanPenasihat.filter((_, i) => i !== index))
                    }
                  }}
                  disabled={data.ucapanPenasihat.length <= 1}
                >
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            ))}
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              className="h-7 text-xs"
              onClick={() => updateField('ucapanPenasihat', [...data.ucapanPenasihat, ''])}
            >
              <Plus className="h-3 w-3 mr-1" /> Tambah Butiran
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 3. Minit Mesyuarat Lalu */}
      {data.sections.minitLalu && (
        <Card className="shadow-sm">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">
              <EditableTitle sectionNum={sectionNums.minitLalu} titleKey="minitLalu" value={data.sectionTitles.minitLalu} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {settings.frequentContent.filter(c => c.category === 'minitLalu').length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Kandungan Kerap:</Label>
                <div className="flex flex-wrap gap-1.5">
                  {settings.frequentContent.filter(c => c.category === 'minitLalu').map(fc => (
                    <Button 
                      key={fc.id} 
                      variant="outline" 
                      size="sm"
                      className="h-7 text-[10px]"
                      onClick={() => {
                        let content = fc.content
                          .replace('[bil]', String(parseInt(data.bilangan) - 1))
                          .replace('[tahun]', data.tahun)
                        updateField('minitLalu', { ...data.minitLalu, dibentang: content })
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      {fc.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Dibentangkan</Label>
              <Textarea 
                value={data.minitLalu.dibentang} 
                onChange={e => updateField('minitLalu', { ...data.minitLalu, dibentang: e.target.value })} 
                placeholder="Minit mesyuarat bil 2/2025 telah dibentangkan..."
                className="text-sm"
                rows={2}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Dicadangkan oleh</Label>
                <Select 
                  value={data.minitLalu.dicadangkan} 
                  onValueChange={v => updateField('minitLalu', { ...data.minitLalu, dicadangkan: v })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Pilih ahli" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.ahli.filter(a => a.nama).map((a, i) => (
                      <SelectItem key={i} value={a.nama}>{a.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Disokong oleh</Label>
                <Select 
                  value={data.minitLalu.disokong} 
                  onValueChange={v => updateField('minitLalu', { ...data.minitLalu, disokong: v })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Pilih ahli" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.ahli.filter(a => a.nama).map((a, i) => (
                      <SelectItem key={i} value={a.nama}>{a.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. Perkara Berbangkit */}
      {data.sections.perkaraBerbangkit && (
        <Card className="shadow-sm">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">
              <EditableTitle sectionNum={sectionNums.perkaraBerbangkit} titleKey="perkaraBerbangkit" value={data.sectionTitles.perkaraBerbangkit} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea 
              value={data.perkaraBerbangkit[0]} 
              onChange={e => updateField('perkaraBerbangkit', [e.target.value])} 
              placeholder="Tiada atau nyatakan perkara..."
              className="text-sm"
              rows={2}
            />
          </CardContent>
        </Card>
      )}

      {/* Agenda Items */}
      {data.agendaItems.map((agenda, agendaIndex) => {
        // Calculate dynamic number for this agenda item
        let agendaNum = sectionNums.agendaStart
        for (let i = 0; i < agendaIndex; i++) {
          agendaNum++
        }
        
        return (
          <Card key={agenda.id} className={`shadow-sm ${!agenda.included ? 'opacity-50 border-dashed' : ''}`}>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={agenda.included} 
                    onCheckedChange={() => toggleAgendaIncluded(agenda.id)}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                  <span className={agenda.included ? '' : 'text-muted-foreground line-through'}>
                    {agenda.included ? agendaNum : 'Tidak termasuk'}. {agenda.perkara || 'Perkara Baru'}
                  </span>
                </div>
                {data.agendaItems.length > 1 && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => removeAgendaItem(agenda.id)}
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            {agenda.included && (
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tajuk Perkara</Label>
                  <Input 
                    value={agenda.perkara} 
                    onChange={e => updateAgendaItem(agenda.id, 'perkara', e.target.value)} 
                    placeholder="Tajuk perkara"
                    className="h-9"
                  />
                </div>
                {agenda.butiran.map((b, bIndex) => (
                  <div key={bIndex} className="flex gap-2">
                    <Textarea 
                      value={b} 
                      onChange={e => updateButiran(agenda.id, bIndex, e.target.value)} 
                      placeholder={`${agendaNum}.${bIndex + 1} Butiran...`}
                      className="flex-1 text-sm"
                      rows={2}
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => removeButiran(agenda.id, bIndex)}
                      disabled={agenda.butiran.length <= 1}
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="h-7 gap-1 text-xs border-dashed" 
                    onClick={() => addButiran(agenda.id)}
                  >
                    <Plus className="h-3 w-3" />
                    <span>Butiran</span>
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tindakan</Label>
                  <Input 
                    value={agenda.tindakan} 
                    onChange={e => updateAgendaItem(agenda.id, 'tindakan', e.target.value)} 
                    placeholder="Semua GBA"
                    className="h-9"
                  />
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}

      <Button 
        type="button" 
        variant="outline" 
        className="w-full h-9 gap-1.5 text-sm border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all duration-200" 
        onClick={addAgendaItem}
      >
        <Plus className="h-4 w-4" />
        <span>Tambah Perkara Agenda</span>
      </Button>

      {/* Hal-hal Lain */}
      {data.sections.halHalLain && (
        <Card className="shadow-sm">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">
              <EditableTitle sectionNum={sectionNums.halHalLain} titleKey="halHalLain" value={data.sectionTitles.halHalLain} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.halHalLain.map((h, index) => (
              <div key={index} className="flex gap-2">
                <Textarea 
                  value={h} 
                  onChange={e => {
                    const newHal = [...data.halHalLain]
                    newHal[index] = e.target.value
                    updateField('halHalLain', newHal)
                  }} 
                  placeholder={`${sectionNums.halHalLain}.${index + 1} Perkara...`}
                  className="flex-1 text-sm"
                  rows={2}
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => {
                    if (data.halHalLain.length > 1) {
                      updateField('halHalLain', data.halHalLain.filter((_, i) => i !== index))
                    }
                  }}
                  disabled={data.halHalLain.length <= 1}
                >
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            ))}
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              className="h-7 text-xs"
              onClick={() => updateField('halHalLain', [...data.halHalLain, ''])}
            >
              <Plus className="h-3 w-3 mr-1" /> Tambah Perkara
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Ucapan Penangguhan */}
      {data.sections.ucapanPenangguhan && (
        <Card className="shadow-sm">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">
              <EditableTitle sectionNum={sectionNums.ucapanPenangguhan} titleKey="ucapanPenangguhan" value={data.sectionTitles.ucapanPenangguhan} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {settings.frequentContent.filter(c => c.category === 'ucapanPenangguhan').length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Kandungan Kerap:</Label>
                <div className="flex flex-wrap gap-1.5">
                  {settings.frequentContent.filter(c => c.category === 'ucapanPenangguhan').map(fc => (
                    <Button 
                      key={fc.id} 
                      variant="outline" 
                      size="sm"
                      className="h-7 text-[10px]"
                      onClick={() => insertFrequentContent('ucapanPenangguhan', fc.content)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      {fc.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <Textarea 
              value={data.ucapanPenangguhan[0]} 
              onChange={e => updateField('ucapanPenangguhan', [e.target.value])} 
              placeholder="Mesyuarat diakhiri dengan..."
              className="text-sm"
              rows={2}
            />
          </CardContent>
        </Card>
      )}

      {/* Tandatangan */}
      <Card className="shadow-sm">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm">Maklumat Penandatangan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Setiausaha */}
          <div className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-800 space-y-2">
            <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Disediakan oleh (Setiausaha)</div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[10px]">Pilih Penandatangan</Label>
                <Select
                  value={settings.members.find(m => m.nama === data.setiausaha.name)?.id || ''}
                  onValueChange={v => selectSignatureMember('setiausaha', v)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Pilih ahli" />
                  </SelectTrigger>
                  <SelectContent>
                    {settings.members.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Jawatan</Label>
                <Input value={data.setiausaha.title1} disabled className="h-8 text-xs bg-slate-100 dark:bg-slate-700" />
              </div>
            </div>
          </div>

          {/* Ketua Panitia */}
          <div className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-800 space-y-2">
            <div className="text-xs font-medium text-blue-700 dark:text-blue-400">Disemak oleh (Ketua Panitia)</div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[10px]">Pilih Penandatangan</Label>
                <Select
                  value={settings.members.find(m => m.nama === data.ketuaPanitia.name)?.id || ''}
                  onValueChange={v => selectSignatureMember('ketuaPanitia', v)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Pilih ahli" />
                  </SelectTrigger>
                  <SelectContent>
                    {settings.members.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Jawatan</Label>
                <Input value={data.ketuaPanitia.title1} disabled className="h-8 text-xs bg-slate-100 dark:bg-slate-700" />
              </div>
            </div>
          </div>

          {/* Guru Besar */}
          <div className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-800 space-y-2">
            <div className="text-xs font-medium text-purple-700 dark:text-purple-400">Disahkan oleh (Guru Besar)</div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[10px]">Pilih Penandatangan</Label>
                <Select
                  value={settings.members.find(m => m.nama === data.guruBesar.name)?.id || ''}
                  onValueChange={v => selectSignatureMember('guruBesar', v)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Pilih ahli" />
                  </SelectTrigger>
                  <SelectContent>
                    {settings.members.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Jawatan</Label>
                <Input value={data.guruBesar.title1} disabled className="h-8 text-xs bg-slate-100 dark:bg-slate-700" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
