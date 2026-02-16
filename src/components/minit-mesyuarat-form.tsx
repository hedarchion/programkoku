'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2, Copy, Pencil } from 'lucide-react'
import { useSettings } from '@/lib/settings-context'
import { toast } from 'sonner'

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

interface MinitFormData {
  bilangan: string
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

const getYearFromTarikh = (tarikh: string): string => {
  if (!tarikh) return new Date().getFullYear().toString()
  try {
    return new Date(tarikh).getFullYear().toString()
  } catch {
    return new Date().getFullYear().toString()
  }
}

const generateId = () => Math.random().toString(36).substr(2, 9)

// Section Header Component
const SectionHeader = ({ number, title }: { number: string; title: string }) => (
  <div className="flex items-center gap-2 mb-4">
    <span className="section-badge">{number}</span>
    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800">{title}</h2>
  </div>
)

// Editable Section Header Component
const EditableSectionHeader = ({ 
  number, 
  title, 
  isEditing,
  onEdit,
  onSave,
  onCancel,
  editValue,
  onChange,
  inputRef
}: { 
  number: string; 
  title: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  editValue: string;
  onChange: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSave()
    if (e.key === 'Escape') onCancel()
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 mb-4">
        <span className="section-badge">{number}</span>
        <Input
          ref={inputRef}
          value={editValue}
          onChange={e => onChange(e.target.value)}
          onBlur={onSave}
          onKeyDown={handleKeyDown}
          className="h-7 text-sm py-0 px-2 flex-1 border-slate-300"
        />
      </div>
    )
  }

  return (
    <div 
      className="flex items-center gap-2 mb-4 group cursor-pointer"
      onClick={onEdit}
    >
      <span className="section-badge">{number}</span>
      <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800">{title}</h2>
      <Pencil className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  )
}

// Form Cell Component
const FormCell = ({ 
  label, 
  children, 
  className = '',
  colSpan = 1
}: { 
  label: string; 
  children: React.ReactNode; 
  className?: string;
  colSpan?: number;
}) => (
  <div className={`form-cell border-r border-b border-[var(--grid-border)] ${colSpan > 1 ? `md:col-span-${colSpan}` : ''} ${className}`}>
    <label>{label}</label>
    {children}
  </div>
)

export default function MinitMesyuaratForm({ onDataChange }: Props) {
  const { settings, currentProfile } = useSettings()
  const userMember = settings.members.find(m => m.id === settings.userMemberId)
  const ketuaPanitiaMember = settings.members.find(m => m.jawatan.toLowerCase().includes('ketua panitia'))
  const guruBesarMember = settings.members.find(m => m.jawatan.toLowerCase().includes('guru besar'))
  
  const [data, setData] = useState<MinitFormData>(() => ({
    bilangan: '1',
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
  
  // Section title editing state
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editTitleValue, setEditTitleValue] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    if (editingSection && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingSection])
  
  const startEditingTitle = (key: string, currentValue: string) => {
    setEditingSection(key)
    setEditTitleValue(currentValue)
  }
  
  const saveTitle = (key: keyof MinitFormData['sectionTitles']) => {
    if (editTitleValue.trim()) {
      updateSectionTitle(key, editTitleValue.trim())
    }
    setEditingSection(null)
  }
  
  const cancelEdit = (originalValue: string) => {
    setEditTitleValue(originalValue)
    setEditingSection(null)
  }
  
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

  const getSectionNumbers = useCallback(() => {
    let currentNum = 1
    const numbers: Record<string, number> = {}
    
    if (data.sections.ucapanPengerusi) numbers.ucapanPengerusi = currentNum++
    if (data.sections.ucapanPenasihat) numbers.ucapanPenasihat = currentNum++
    if (data.sections.minitLalu) numbers.minitLalu = currentNum++
    if (data.sections.perkaraBerbangkit) numbers.perkaraBerbangkit = currentNum++
    
    const numberedAgendaCount = data.agendaItems.length
    numbers.agendaStart = currentNum
    numbers.agendaEnd = currentNum + numberedAgendaCount - 1
    currentNum += numberedAgendaCount
    
    if (data.sections.halHalLain) numbers.halHalLain = currentNum++
    if (data.sections.ucapanPenangguhan) numbers.ucapanPenangguhan = currentNum
    
    return numbers
  }, [data.sections, data.agendaItems])

  const sectionNums = getSectionNumbers()

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
          <span className="text-xs text-slate-500">{sectionNum}.</span>
          <Input
            ref={inputRef}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="h-7 text-sm py-0 px-2 flex-1 border-slate-300"
          />
        </div>
      )
    }

    return (
      <div 
        className="flex items-center gap-2 group cursor-pointer"
        onClick={() => setIsEditing(true)}
      >
        <span className="text-xs text-slate-500">{sectionNum}.</span>
        <span className="text-xs font-bold uppercase tracking-tight">{value}</span>
        <Pencil className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Section 01: Maklumat Mesyuarat */}
      <section>
        <SectionHeader number="01" title="Maklumat Mesyuarat" />
        <div className="grid grid-cols-1 md:grid-cols-4 border-l border-t border-[var(--grid-border)]">
          <FormCell label="Bilangan">
            <Input 
              value={data.bilangan} 
              onChange={e => updateField('bilangan', e.target.value)} 
              placeholder="1"
              className="border-0 p-0 text-sm font-medium bg-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none" 
            />
          </FormCell>
          <FormCell label="Tarikh">
            <Input 
              type="date"
              value={data.tarikh} 
              onChange={e => {
                const tarikh = e.target.value
                const hari = getHariFromTarikh(tarikh)
                setData(prev => ({ ...prev, tarikh, hari }))
              }}
              className="border-0 p-0 text-sm font-medium bg-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none" 
            />
          </FormCell>
          <FormCell label="Masa">
            <div className="flex items-center gap-2">
              <Input 
                type="time"
                value={data.masa} 
                onChange={e => updateField('masa', e.target.value)}
                className="border-0 p-0 text-sm font-medium bg-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none w-24" 
              />
              {data.masa && (
                <span className="text-xs text-slate-500">
                  = {formatTimeWithSuffix(data.masa)}
                </span>
              )}
            </div>
          </FormCell>
          <FormCell label="Tempat" colSpan={3}>
            <Input 
              value={data.tempat} 
              onChange={e => updateField('tempat', e.target.value)} 
              placeholder="Bilik j-QAF"
              className="border-0 p-0 text-sm font-medium bg-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none" 
            />
          </FormCell>
          <FormCell label="Organisasi">
            <Input 
              value={data.panitia} 
              onChange={e => updateField('panitia', e.target.value)} 
              placeholder={currentProfile?.name || 'Nama Organisasi'}
              className="border-0 p-0 text-sm font-medium bg-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none" 
            />
          </FormCell>
        </div>
      </section>

      {/* Section 02: Kehadiran */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <SectionHeader number="02" title="Kehadiran Ahli" />
          <div className="flex gap-4">
            <button 
              onClick={() => setSelectedMembers(settings.members.map(m => m.id))}
              className="text-[10px] font-bold uppercase underline decoration-primary underline-offset-4 text-slate-600 hover:text-primary transition-colors"
            >
              Tandakan Semua
            </button>
            <button 
              onClick={() => {
                setSelectedMembers([])
                setData(prev => ({ ...prev, ahli: [] }))
              }}
              className="text-[10px] font-bold uppercase opacity-40 hover:opacity-60 transition-opacity"
            >
              Kosongkan
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-l border-t border-[var(--grid-border)]">
          {settings.members.map(member => (
            <div 
              key={member.id}
              onClick={() => toggleMember(member.id)}
              className={`p-3 border-r border-b border-[var(--grid-border)] flex items-center justify-between cursor-pointer transition-colors ${
                selectedMembers.includes(member.id) 
                  ? 'bg-blue-50/50 hover:bg-blue-50' 
                  : 'bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{member.nama}</div>
                <div className="text-[10px] text-slate-500 truncate">{member.jawatan}</div>
              </div>
              <Checkbox
                checked={selectedMembers.includes(member.id)}
                onCheckedChange={() => toggleMember(member.id)}
                className="shrink-0 rounded-none border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Section 03: Ucapan Pengerusi */}
      {data.sections.ucapanPengerusi && (
        <section>
          <EditableSectionHeader 
            number={String(sectionNums.ucapanPengerusi).padStart(2, '0')} 
            title={data.sectionTitles.ucapanPengerusi}
            isEditing={editingSection === 'ucapanPengerusi'}
            onEdit={() => startEditingTitle('ucapanPengerusi', data.sectionTitles.ucapanPengerusi)}
            onSave={() => saveTitle('ucapanPengerusi')}
            onCancel={() => cancelEdit(data.sectionTitles.ucapanPengerusi)}
            editValue={editTitleValue}
            onChange={setEditTitleValue}
            inputRef={editInputRef}
          />
          <div className="border-l border-t border-[var(--grid-border)]">
            {settings.frequentContent.filter(c => c.category === 'ucapanPengerusi').length > 0 && (
              <div className="p-4 border-r border-b border-[var(--grid-border)] bg-white">
                <label className="block text-[10px] font-bold uppercase opacity-50 mb-2">Kandungan Kerap:</label>
                <div className="flex flex-wrap gap-1.5">
                  {settings.frequentContent.filter(c => c.category === 'ucapanPengerusi').map(fc => (
                    <Button 
                      key={fc.id} 
                      variant="outline" 
                      size="sm"
                      className="h-7 text-[10px] rounded-none border-slate-200 hover:border-primary hover:bg-blue-50"
                      onClick={() => insertFrequentContent('ucapanPengerusi', fc.content)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      {fc.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {data.ucapanPengerusi.map((u, index) => (
              <div key={index} className="flex gap-3 p-4 border-r border-b border-[var(--grid-border)] bg-white items-start">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-slate-100 text-[10px] font-bold text-slate-600 mt-1">
                  {sectionNums.ucapanPengerusi}.{index + 1}
                </span>
                <Textarea 
                  value={u} 
                  onChange={e => {
                    const newUcapan = [...data.ucapanPengerusi]
                    newUcapan[index] = e.target.value
                    updateField('ucapanPengerusi', newUcapan)
                  }} 
                  placeholder="Butiran ucapan..."
                  className="flex-1 text-sm border-0 bg-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none shadow-none"
                  rows={2}
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-none"
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
          <button 
            onClick={() => updateField('ucapanPengerusi', [...data.ucapanPengerusi, ''])}
            className="btn-add mt-4"
          >
            <Plus className="h-3.5 w-3.5 opacity-40 group-hover:text-primary transition-colors" />
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Tambah Butiran</span>
          </button>
        </section>
      )}

      {/* Section 04: Ucapan Penasihat */}
      {data.sections.ucapanPenasihat && (
        <section>
          <EditableSectionHeader 
            number={String(sectionNums.ucapanPenasihat).padStart(2, '0')} 
            title={data.sectionTitles.ucapanPenasihat}
            isEditing={editingSection === 'ucapanPenasihat'}
            onEdit={() => startEditingTitle('ucapanPenasihat', data.sectionTitles.ucapanPenasihat)}
            onSave={() => saveTitle('ucapanPenasihat')}
            onCancel={() => cancelEdit(data.sectionTitles.ucapanPenasihat)}
            editValue={editTitleValue}
            onChange={setEditTitleValue}
            inputRef={editInputRef}
          />
          <div className="border-l border-t border-[var(--grid-border)]">
            {data.ucapanPenasihat.map((u, index) => (
              <div key={index} className="flex gap-3 p-4 border-r border-b border-[var(--grid-border)] bg-white items-start">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-slate-100 text-[10px] font-bold text-slate-600 mt-1">
                  {sectionNums.ucapanPenasihat}.{index + 1}
                </span>
                <Textarea 
                  value={u} 
                  onChange={e => {
                    const newUcapan = [...data.ucapanPenasihat]
                    newUcapan[index] = e.target.value
                    updateField('ucapanPenasihat', newUcapan)
                  }} 
                  placeholder="Butiran ucapan..."
                  className="flex-1 text-sm border-0 bg-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none shadow-none"
                  rows={2}
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-none"
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
          </div>
          <button 
            onClick={() => updateField('ucapanPenasihat', [...data.ucapanPenasihat, ''])}
            className="btn-add mt-4"
          >
            <Plus className="h-3.5 w-3.5 opacity-40 group-hover:text-primary transition-colors" />
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Tambah Butiran</span>
          </button>
        </section>
      )}

      {/* Section 05: Minit Mesyuarat Lalu */}
      {data.sections.minitLalu && (
        <section>
          <EditableSectionHeader 
            number={String(sectionNums.minitLalu).padStart(2, '0')} 
            title={data.sectionTitles.minitLalu}
            isEditing={editingSection === 'minitLalu'}
            onEdit={() => startEditingTitle('minitLalu', data.sectionTitles.minitLalu)}
            onSave={() => saveTitle('minitLalu')}
            onCancel={() => cancelEdit(data.sectionTitles.minitLalu)}
            editValue={editTitleValue}
            onChange={setEditTitleValue}
            inputRef={editInputRef}
          />
          <div className="border-l border-t border-[var(--grid-border)]">
            {settings.frequentContent.filter(c => c.category === 'minitLalu').length > 0 && (
              <div className="p-4 border-r border-b border-[var(--grid-border)] bg-white">
                <label className="block text-[10px] font-bold uppercase opacity-50 mb-2">Kandungan Kerap:</label>
                <div className="flex flex-wrap gap-1.5">
                  {settings.frequentContent.filter(c => c.category === 'minitLalu').map(fc => (
                    <Button 
                      key={fc.id} 
                      variant="outline" 
                      size="sm"
                      className="h-7 text-[10px] rounded-none border-slate-200 hover:border-primary hover:bg-blue-50"
                      onClick={() => {
                        let content = fc.content
                          .replace('[bil]', String(parseInt(data.bilangan) - 1))
                          .replace('[tahun]', getYearFromTarikh(data.tarikh))
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
            <div className="p-4 border-r border-b border-[var(--grid-border)] bg-white">
              <label className="block text-[10px] font-bold uppercase opacity-50 mb-2">Dibentangkan</label>
              <Textarea 
                value={data.minitLalu.dibentang} 
                onChange={e => updateField('minitLalu', { ...data.minitLalu, dibentang: e.target.value })} 
                placeholder="Minit mesyuarat bil 2/2025 telah dibentangkan..."
                className="text-sm border-0 bg-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none shadow-none"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-4 border-r border-b border-[var(--grid-border)] bg-white">
                <label className="block text-[10px] font-bold uppercase opacity-50 mb-2">Dicadangkan oleh</label>
                <select 
                  value={data.minitLalu.dicadangkan}
                  onChange={e => updateField('minitLalu', { ...data.minitLalu, dicadangkan: e.target.value })}
                  className="w-full text-sm bg-slate-50 border border-slate-200 p-2 focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="">Pilih ahli</option>
                  {data.ahli.filter(a => a.nama).map((a, i) => (
                    <option key={i} value={a.nama}>{a.nama}</option>
                  ))}
                </select>
              </div>
              <div className="p-4 border-r border-b border-[var(--grid-border)] bg-white">
                <label className="block text-[10px] font-bold uppercase opacity-50 mb-2">Disokong oleh</label>
                <select 
                  value={data.minitLalu.disokong}
                  onChange={e => updateField('minitLalu', { ...data.minitLalu, disokong: e.target.value })}
                  className="w-full text-sm bg-slate-50 border border-slate-200 p-2 focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="">Pilih ahli</option>
                  {data.ahli.filter(a => a.nama).map((a, i) => (
                    <option key={i} value={a.nama}>{a.nama}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Section 06: Perkara Berbangkit */}
      {data.sections.perkaraBerbangkit && (
        <section>
          <EditableSectionHeader 
            number={String(sectionNums.perkaraBerbangkit).padStart(2, '0')} 
            title={data.sectionTitles.perkaraBerbangkit}
            isEditing={editingSection === 'perkaraBerbangkit'}
            onEdit={() => startEditingTitle('perkaraBerbangkit', data.sectionTitles.perkaraBerbangkit)}
            onSave={() => saveTitle('perkaraBerbangkit')}
            onCancel={() => cancelEdit(data.sectionTitles.perkaraBerbangkit)}
            editValue={editTitleValue}
            onChange={setEditTitleValue}
            inputRef={editInputRef}
          />
          <div className="border-l border-t border-r border-b border-[var(--grid-border)] bg-white">
            <div className="p-4">
              <Textarea 
                value={data.perkaraBerbangkit[0]} 
                onChange={e => updateField('perkaraBerbangkit', [e.target.value])} 
                placeholder="Tiada atau nyatakan perkara..."
                className="text-sm border-0 bg-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none shadow-none"
                rows={2}
              />
            </div>
          </div>
        </section>
      )}

      {/* Agenda Items */}
      {data.agendaItems.map((agenda, agendaIndex) => {
        let agendaNum = sectionNums.agendaStart
        for (let i = 0; i < agendaIndex; i++) {
          agendaNum++
        }
        
        return (
          <section key={agenda.id}>
            <div className={`border-l border-t border-r border-[var(--grid-border)] ${agenda.included ? 'bg-white' : 'bg-slate-50/50'}`}>
              <div className="card-header-numbered">
                <span className="card-header-number">{agendaNum}.0</span>
                <div className="flex-1 flex items-center justify-between">
                  <EditableTitle 
                    sectionNum={agendaNum} 
                    titleKey="perkaraBerbangkit" 
                    value={agenda.perkara || 'Perkara Baru'} 
                  />
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase opacity-50">Terdapat?</span>
                    <Switch 
                      checked={agenda.included} 
                      onCheckedChange={() => toggleAgendaIncluded(agenda.id)}
                      className="data-[state=checked]:bg-primary"
                    />
                    {data.agendaItems.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-7 w-7 rounded-none"
                        onClick={() => removeAgendaItem(agenda.id)}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              {agenda.included && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase opacity-50 mb-2">Tajuk Perkara</label>
                    <Input 
                      value={agenda.perkara} 
                      onChange={e => updateAgendaItem(agenda.id, 'perkara', e.target.value)} 
                      placeholder="Tajuk perkara"
                      className="text-sm border-slate-200 focus:border-primary" 
                    />
                  </div>
                  {agenda.butiran.map((b, bIndex) => (
                    <div key={bIndex} className="flex gap-3 items-start">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-slate-100 text-[10px] font-bold text-slate-600 mt-1">
                        {agendaNum}.{bIndex + 1}
                      </span>
                      <Textarea 
                        value={b} 
                        onChange={e => updateButiran(agenda.id, bIndex, e.target.value)} 
                        placeholder="Butiran..."
                        className="flex-1 text-sm border-slate-200 focus:border-primary resize-none"
                        rows={2}
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 shrink-0 rounded-none"
                        onClick={() => removeButiran(agenda.id, bIndex)}
                        disabled={agenda.butiran.length <= 1}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-1 text-xs border-dashed rounded-none" 
                    onClick={() => addButiran(agenda.id)}
                  >
                    <Plus className="h-3 w-3" />
                    <span>Butiran</span>
                  </Button>
                  <div>
                    <label className="block text-[10px] font-bold uppercase opacity-50 mb-2">Tindakan</label>
                    <Input 
                      value={agenda.tindakan} 
                      onChange={e => updateAgendaItem(agenda.id, 'tindakan', e.target.value)} 
                      placeholder="Semua GBA"
                      className="text-sm border-slate-200 focus:border-primary" 
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
        )
      })}

      <button 
        onClick={addAgendaItem}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-slate-300 hover:border-primary hover:bg-blue-50/30 transition-all group"
      >
        <Plus className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-primary transition-colors">Tambah Agenda Seterusnya</span>
      </button>

      {/* Section: Hal-hal Lain */}
      {data.sections.halHalLain && (
        <section>
          <EditableSectionHeader 
            number={String(sectionNums.halHalLain).padStart(2, '0')} 
            title={data.sectionTitles.halHalLain}
            isEditing={editingSection === 'halHalLain'}
            onEdit={() => startEditingTitle('halHalLain', data.sectionTitles.halHalLain)}
            onSave={() => saveTitle('halHalLain')}
            onCancel={() => cancelEdit(data.sectionTitles.halHalLain)}
            editValue={editTitleValue}
            onChange={setEditTitleValue}
            inputRef={editInputRef}
          />
          <div className="border-l border-t border-[var(--grid-border)]">
            {data.halHalLain.map((h, index) => (
              <div key={index} className="flex gap-3 p-4 border-r border-b border-[var(--grid-border)] bg-white items-start">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-slate-100 text-[10px] font-bold text-slate-600 mt-1">
                  {sectionNums.halHalLain}.{index + 1}
                </span>
                <Textarea 
                  value={h} 
                  onChange={e => {
                    const newHal = [...data.halHalLain]
                    newHal[index] = e.target.value
                    updateField('halHalLain', newHal)
                  }} 
                  placeholder="Perkara..."
                  className="flex-1 text-sm border-0 bg-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none shadow-none"
                  rows={2}
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-none"
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
          </div>
          <button 
            onClick={() => updateField('halHalLain', [...data.halHalLain, ''])}
            className="btn-add mt-4"
          >
            <Plus className="h-3.5 w-3.5 opacity-40 group-hover:text-primary transition-colors" />
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Tambah Perkara</span>
          </button>
        </section>
      )}

      {/* Section: Ucapan Penangguhan */}
      {data.sections.ucapanPenangguhan && (
        <section>
          <EditableSectionHeader 
            number={String(sectionNums.ucapanPenangguhan).padStart(2, '0')} 
            title={data.sectionTitles.ucapanPenangguhan}
            isEditing={editingSection === 'ucapanPenangguhan'}
            onEdit={() => startEditingTitle('ucapanPenangguhan', data.sectionTitles.ucapanPenangguhan)}
            onSave={() => saveTitle('ucapanPenangguhan')}
            onCancel={() => cancelEdit(data.sectionTitles.ucapanPenangguhan)}
            editValue={editTitleValue}
            onChange={setEditTitleValue}
            inputRef={editInputRef}
          />
          <div className="border-l border-t border-[var(--grid-border)]">
            {settings.frequentContent.filter(c => c.category === 'ucapanPenangguhan').length > 0 && (
              <div className="p-4 border-r border-b border-[var(--grid-border)] bg-white">
                <label className="block text-[10px] font-bold uppercase opacity-50 mb-2">Kandungan Kerap:</label>
                <div className="flex flex-wrap gap-1.5">
                  {settings.frequentContent.filter(c => c.category === 'ucapanPenangguhan').map(fc => (
                    <Button 
                      key={fc.id} 
                      variant="outline" 
                      size="sm"
                      className="h-7 text-[10px] rounded-none border-slate-200 hover:border-primary hover:bg-blue-50"
                      onClick={() => insertFrequentContent('ucapanPenangguhan', fc.content)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      {fc.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div className="p-4 border-r border-b border-[var(--grid-border)] bg-white">
              <Textarea 
                value={data.ucapanPenangguhan[0]} 
                onChange={e => updateField('ucapanPenangguhan', [e.target.value])} 
                placeholder="Mesyuarat diakhiri dengan..."
                className="text-sm border-0 bg-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none shadow-none"
                rows={2}
              />
            </div>
          </div>
        </section>
      )}

      {/* Section 04: Pengesahan & Penandatangan */}
      <section>
        <SectionHeader number="04" title="Pengesahan & Penandatangan" />
        <div className="grid grid-cols-1 md:grid-cols-2 border-l border-t border-[var(--grid-border)]">
          {/* Setiausaha */}
          <div className="p-4 border-r border-b border-[var(--grid-border)] bg-white">
            <label className="block text-[10px] font-bold uppercase opacity-50 mb-3">Disediakan Oleh (Setiausaha)</label>
            <select 
              value={settings.members.find(m => m.nama === data.setiausaha.name)?.id || ''}
              onChange={e => selectSignatureMember('setiausaha', e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 p-2 mb-2 focus:border-primary focus:outline-none transition-colors"
            >
              <option value="">Pilih ahli</option>
              {settings.members.map(member => (
                <option key={member.id} value={member.id}>{member.nama}</option>
              ))}
            </select>
            <Input 
              value={data.setiausaha.title1} 
              disabled 
              className="text-xs bg-slate-100 border-0" 
            />
          </div>
          
          {/* Ketua Panitia */}
          <div className="p-4 border-r border-b border-[var(--grid-border)] bg-white">
            <label className="block text-[10px] font-bold uppercase opacity-50 mb-3">Disemak oleh (Ketua Panitia)</label>
            <select 
              value={settings.members.find(m => m.nama === data.ketuaPanitia.name)?.id || ''}
              onChange={e => selectSignatureMember('ketuaPanitia', e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 p-2 mb-2 focus:border-primary focus:outline-none transition-colors"
            >
              <option value="">Pilih ahli</option>
              {settings.members.map(member => (
                <option key={member.id} value={member.id}>{member.nama}</option>
              ))}
            </select>
            <Input 
              value={data.ketuaPanitia.title1} 
              disabled 
              className="text-xs bg-slate-100 border-0" 
            />
          </div>
        </div>
      </section>
    </div>
  )
}
