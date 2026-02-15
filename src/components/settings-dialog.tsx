'use client'

import { useState, useRef } from 'react'
import { useSettings, Member, FrequentContent } from '@/lib/settings-context'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Settings, Plus, Trash2, Upload, X, Building2, Users, RotateCcw, Check, Copy, Signature } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'

// Section Header Component
const SectionHeader = ({ number, title }: { number: string; title: string }) => (
  <div className="flex items-center gap-2 mb-4">
    <span className="section-badge">{number}</span>
    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800">{title}</h2>
  </div>
)

export default function SettingsDialog() {
  const { 
    settings, 
    currentProfile,
    profiles,
    createProfile,
    updateProfile,
    deleteProfile,
    duplicateProfile,
    switchProfile,
    updateSettings, 
    addMember, 
    updateMember, 
    removeMember,
    addFrequentContent,
    updateFrequentContent,
    removeFrequentContent,
    resetCurrentProfile 
  } = useSettings()
  
  const [open, setOpen] = useState(false)
  const [newMember, setNewMember] = useState({ nama: '', jawatan: '' })
  const [newFrequent, setNewFrequent] = useState<FrequentContent>({
    id: '', name: '', category: 'ucapanPengerusi', content: ''
  })
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [editingFrequent, setEditingFrequent] = useState<FrequentContent | null>(null)
  const [newProfileName, setNewProfileName] = useState('')
  const [newProfileType, setNewProfileType] = useState<'school' | 'society'>('society')
  const [duplicateName, setDuplicateName] = useState('')
  const [activeTab, setActiveTab] = useState('profiles')
  
  const logo1Ref = useRef<HTMLInputElement>(null)
  const logo2Ref = useRef<HTMLInputElement>(null)
  const ttdSetiausahaRef = useRef<HTMLInputElement>(null)
  const ttdKetuaPanitiaRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo1' | 'logo2' | 'setiausahaSignature' | 'ketuaPanitiaSignature') => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 500000) {
        toast.error('Fail terlalu besar. Maksimum 500KB.')
        return
      }
      const reader = new FileReader()
      reader.onload = (event) => {
        updateSettings({ [field]: event.target?.result as string })
        toast.success('Imej berjaya dimuat naik')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddMember = () => {
    if (!newMember.nama || !newMember.jawatan) {
      toast.error('Sila isi nama dan jawatan')
      return
    }
    addMember(newMember)
    setNewMember({ nama: '', jawatan: '' })
    toast.success('Ahli ditambah')
  }

  const handleAddFrequent = () => {
    if (!newFrequent.name || !newFrequent.content) {
      toast.error('Sila isi nama dan kandungan')
      return
    }
    addFrequentContent(newFrequent)
    setNewFrequent({ id: '', name: '', category: 'ucapanPengerusi', content: '' })
    toast.success('Kandungan kerap ditambah')
  }

  const handleCreateProfile = () => {
    if (!newProfileName.trim()) {
      toast.error('Sila masukkan nama profil')
      return
    }
    createProfile(newProfileName.trim(), newProfileType)
    setNewProfileName('')
    toast.success('Profil baru berjaya dibuat')
  }

  const handleDuplicateProfile = () => {
    if (!duplicateName.trim()) {
      toast.error('Sila masukkan nama profil')
      return
    }
    if (currentProfile) {
      duplicateProfile(currentProfile.id, duplicateName.trim())
      setDuplicateName('')
      toast.success('Profil berjaya disalin')
    }
  }

  const jawatanList = [
    'PK HEM', 'PK Pentadbiran', 'PK Kokurikulum', 'PK Kurikulum',
    'Ketua Panitia', 'Setiausaha Panitia', 'Bendahari Panitia', 'Ahli Panitia',
    'GBA', 'GPI', 'Guru Besar'
  ]

  const categoryLabels = {
    ucapanPengerusi: 'Ucapan Pengerusi',
    minitLalu: 'Minit Mesyuarat Lalu',
    ucapanPenangguhan: 'Ucapan Penangguhan'
  }

  const categoryOptions = [
    { value: 'ucapanPengerusi', label: 'Ucapan Pengerusi' },
    { value: 'minitLalu', label: 'Minit Lalu (3.1)' },
    { value: 'ucapanPenangguhan', label: 'Ucapan Penangguhan' }
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-slate-400 hover:text-slate-700 transition-colors">
          <Settings className="h-5 w-5" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 gap-0 border border-[var(--grid-border)] rounded-none">
        <DialogHeader className="p-4 border-b border-[var(--grid-border)] bg-slate-50">
          <DialogTitle className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Tetapan
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-auto bg-white border-b border-[var(--grid-border)] rounded-none p-0">
            <TabsTrigger 
              value="profiles" 
              className="text-[10px] font-bold uppercase tracking-wider py-3 rounded-none border-r border-[var(--grid-border)] last:border-r-0 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary"
            >
              Profil
            </TabsTrigger>
            <TabsTrigger 
              value="school"
              className="text-[10px] font-bold uppercase tracking-wider py-3 rounded-none border-r border-[var(--grid-border)] last:border-r-0 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary"
            >
              Sekolah
            </TabsTrigger>
            <TabsTrigger 
              value="members"
              className="text-[10px] font-bold uppercase tracking-wider py-3 rounded-none border-r border-[var(--grid-border)] last:border-r-0 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary"
            >
              Ahli
            </TabsTrigger>
            <TabsTrigger 
              value="logos"
              className="text-[10px] font-bold uppercase tracking-wider py-3 rounded-none border-r border-[var(--grid-border)] last:border-r-0 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary"
            >
              Logo & TTD
            </TabsTrigger>
            <TabsTrigger 
              value="frequent"
              className="text-[10px] font-bold uppercase tracking-wider py-3 rounded-none border-r border-[var(--grid-border)] last:border-r-0 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary"
            >
              Templat
            </TabsTrigger>
          </TabsList>
          
          <div className="h-[60vh] overflow-y-auto p-6">
            {/* Profiles Tab */}
            <TabsContent value="profiles" className="space-y-6 mt-0">
              <section>
                <SectionHeader number="01" title="Profil Organisasi" />
                <div className="border-l border-t border-r border-[var(--grid-border)]">
                  <div className="p-4 border-b border-[var(--grid-border)] bg-slate-50 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide">Senarai Profil ({profiles.length})</span>
                    <div className="flex items-center gap-2">
                      <Input
                        value={newProfileName}
                        onChange={e => setNewProfileName(e.target.value)}
                        placeholder="Nama profil baru"
                        className="h-8 text-xs w-48 border-slate-200 rounded-none"
                      />
                      <Select 
                        value={newProfileType}
                        onValueChange={(v: 'school' | 'society') => setNewProfileType(v)}
                      >
                        <SelectTrigger className="h-8 text-xs w-36 rounded-none border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="society">
                            <div className="flex items-center gap-2 text-xs">
                              <Users className="h-3 w-3" />
                              <span>Panitia</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="school">
                            <div className="flex items-center gap-2 text-xs">
                              <Building2 className="h-3 w-3" />
                              <span>Sekolah</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        size="sm" 
                        onClick={handleCreateProfile}
                        className="btn-primary h-8"
                      >
                        <Plus className="h-3 w-3" />
                        <span className="text-[10px]">Baru</span>
                      </Button>
                    </div>
                  </div>
                  <div className="max-h-[40vh] overflow-y-auto bg-white">
                    {profiles.map(profile => (
                      <div 
                        key={profile.id} 
                        className={`flex items-center justify-between p-3 border-b border-[var(--grid-border)] transition-colors ${
                          profile.id === currentProfile?.id 
                            ? 'bg-primary/10' 
                            : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {profile.type === 'school' ? (
                            <Building2 className="h-4 w-4 shrink-0 text-primary" />
                          ) : (
                            <Users className="h-4 w-4 shrink-0 text-slate-600" />
                          )}
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{profile.name}</div>
                            <div className="text-[10px] text-slate-500">
                              {profile.type === 'school' ? 'Sekolah' : 'Persatuan/Panitia'}
                              {' • '}{profile.settings.members.length} ahli
                            </div>
                          </div>
                          {profile.id === currentProfile?.id && (
                            <Badge className="bg-primary text-[10px] px-1.5 py-0 shrink-0 rounded-none">
                              Aktif
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          {profile.id !== currentProfile?.id && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-7 gap-1.5 text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors rounded-none"
                              onClick={() => switchProfile(profile.id)}
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Pilih</span>
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-7 w-7 rounded-none"
                                onClick={() => setDuplicateName(`${profile.name} (Salinan)`)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-none border border-[var(--grid-border)] p-0">
                              <AlertDialogHeader className="p-4 border-b border-[var(--grid-border)]">
                                <AlertDialogTitle className="text-sm font-bold uppercase tracking-wide">Salin Profil</AlertDialogTitle>
                                <AlertDialogDescription className="text-xs pt-2">
                                  Salin profil &quot;{profile.name}&quot; dengan tetapan baharu.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="p-4 space-y-3">
                                <div className="space-y-2">
                                  <Label className="text-[10px] font-bold uppercase opacity-50">Nama Profil Baru</Label>
                                  <Input 
                                    value={duplicateName}
                                    onChange={e => setDuplicateName(e.target.value)}
                                    className="h-9 text-sm border-slate-200 focus:border-primary rounded-none"
                                  />
                                </div>
                              </div>
                              <AlertDialogFooter className="p-4 border-t border-[var(--grid-border)]">
                                <AlertDialogCancel className="rounded-none text-[10px] font-bold uppercase tracking-wide">Batal</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="btn-primary text-[10px]"
                                  onClick={handleDuplicateProfile}
                                >
                                  Salin
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          {profiles.length > 1 && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none">
                                  <Trash2 className="h-3 w-3 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-none border border-[var(--grid-border)] p-0">
                                <AlertDialogHeader className="p-4 border-b border-[var(--grid-border)]">
                                  <AlertDialogTitle className="text-sm font-bold uppercase tracking-wide">Padam profil?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-xs pt-2">
                                    Profil &quot;{profile.name}&quot; akan dipadamkan secara kekal.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="p-4 border-t border-[var(--grid-border)]">
                                  <AlertDialogCancel className="rounded-none text-[10px] font-bold uppercase tracking-wide">Batal</AlertDialogCancel>
                                  <AlertDialogAction 
                                    className="bg-red-500 hover:bg-red-600 rounded-none text-[10px] font-bold uppercase tracking-wide"
                                    onClick={() => {
                                      deleteProfile(profile.id)
                                      toast.success('Profil berjaya dipadam')
                                    }}
                                  >
                                    Padam
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section>
                <SectionHeader number="02" title="Tetapan Profil Semasa" />
                <div className="border-l border-t border-r border-[var(--grid-border)] bg-white p-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase opacity-50">Nama Profil</Label>
                    <Input 
                      value={currentProfile?.name || ''}
                      onChange={e => {
                        if (currentProfile) {
                          updateProfile(currentProfile.id, { name: e.target.value })
                        }
                      }}
                      className="h-9 text-sm border-slate-200 focus:border-primary rounded-none"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--grid-border)]">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="flex items-center gap-2 text-[10px] font-bold uppercase text-red-600 hover:text-red-700 transition-colors">
                          <RotateCcw className="h-3 w-3" />
                          Set Semula Profil
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-none border border-[var(--grid-border)] p-0">
                        <AlertDialogHeader className="p-4 border-b border-[var(--grid-border)]">
                          <AlertDialogTitle className="text-sm font-bold uppercase tracking-wide">Set Semula Profil?</AlertDialogTitle>
                          <AlertDialogDescription className="text-xs pt-2">
                            Semua tetapan dalam profil ini akan dikembalikan kepada nilai lalai.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="p-4 border-t border-[var(--grid-border)]">
                          <AlertDialogCancel className="rounded-none text-[10px] font-bold uppercase tracking-wide">Batal</AlertDialogCancel>
                          <AlertDialogAction className="bg-red-500 hover:bg-red-600 rounded-none text-[10px] font-bold uppercase tracking-wide" onClick={resetCurrentProfile}>Set Semula</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </section>
            </TabsContent>
            
            {/* School Settings */}
            <TabsContent value="school" className="space-y-6 mt-0">
              <section>
                <SectionHeader number="01" title="Maklumat Sekolah" />
                <div className="grid grid-cols-1 md:grid-cols-2 border-l border-t border-[var(--grid-border)]">
                  <div className="p-4 border-r border-b border-[var(--grid-border)] bg-white md:col-span-2">
                    <Label className="text-[10px] font-bold uppercase opacity-50 mb-2 block">Nama Sekolah</Label>
                    <Input 
                      value={settings.schoolName} 
                      onChange={e => updateSettings({ schoolName: e.target.value })}
                      placeholder="SEKOLAH KEBANGSAAN AYER TAWAR"
                      className="h-9 text-sm border-slate-200 focus:border-primary rounded-none"
                    />
                  </div>
                  <div className="p-4 border-r border-b border-[var(--grid-border)] bg-white">
                    <Label className="text-[10px] font-bold uppercase opacity-50 mb-2 block">Kod Sekolah</Label>
                    <Input 
                      value={settings.schoolCode} 
                      onChange={e => updateSettings({ schoolCode: e.target.value })}
                      placeholder="ABA 1006"
                      className="h-9 text-sm border-slate-200 focus:border-primary rounded-none"
                    />
                  </div>
                  <div className="p-4 border-r border-b border-[var(--grid-border)] bg-white">
                    <Label className="text-[10px] font-bold uppercase opacity-50 mb-2 block">Font</Label>
                    <Select 
                      value={settings.font} 
                      onValueChange={(v: 'calibri' | 'times' | 'poppins') => updateSettings({ font: v })}
                    >
                      <SelectTrigger className="h-9 rounded-none border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="calibri">Calibri</SelectItem>
                        <SelectItem value="times">Times New Roman</SelectItem>
                        <SelectItem value="poppins">Poppins</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-4 border-r border-b border-[var(--grid-border)] bg-white md:col-span-2">
                    <Label className="text-[10px] font-bold uppercase opacity-50 mb-2 block">Alamat</Label>
                    <Input 
                      value={settings.schoolAddress} 
                      onChange={e => updateSettings({ schoolAddress: e.target.value })}
                      placeholder="32400 AYER TAWAR, PERAK"
                      className="h-9 text-sm border-slate-200 focus:border-primary rounded-none"
                    />
                  </div>
                </div>
              </section>

              <section>
                <SectionHeader number="02" title="Pengguna Semasa" />
                <div className="border-l border-t border-r border-[var(--grid-border)] bg-white p-4">
                  <Label className="text-[10px] font-bold uppercase opacity-50 mb-2 block">Pilih Ahli (Setiausaha)</Label>
                  <Select 
                    value={settings.userMemberId || ''} 
                    onValueChange={v => updateSettings({ userMemberId: v })}
                  >
                    <SelectTrigger className="h-9 rounded-none border-slate-200">
                      <SelectValue placeholder="Pilih ahli" />
                    </SelectTrigger>
                    <SelectContent>
                      {settings.members.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.nama} ({m.jawatan})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </section>
            </TabsContent>
            
            {/* Members Settings */}
            <TabsContent value="members" className="space-y-6 mt-0">
              <section>
                <div className="flex items-center justify-between mb-4">
                  <SectionHeader number="01" title="Senarai Ahli" />
                  <div className="flex items-center gap-2">
                    <Input
                      value={newMember.nama}
                      onChange={e => setNewMember(prev => ({ ...prev, nama: e.target.value }))}
                      placeholder="Nama ahli"
                      className="h-8 text-xs w-40 border-slate-200 rounded-none"
                    />
                    <Select 
                      value={newMember.jawatan}
                      onValueChange={v => setNewMember(prev => ({ ...prev, jawatan: v }))}
                    >
                      <SelectTrigger className="h-8 text-xs w-32 rounded-none border-slate-200">
                        <SelectValue placeholder="Jawatan" />
                      </SelectTrigger>
                      <SelectContent>
                        {jawatanList.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleAddMember}
                      className="btn-primary h-8"
                      size="sm"
                    >
                      <Plus className="h-3 w-3" />
                      <span className="text-[10px]">Tambah</span>
                    </Button>
                  </div>
                </div>
                <div className="border-l border-t border-r border-[var(--grid-border)]">
                  <div className="max-h-[50vh] overflow-y-auto bg-white">
                    {settings.members.map((member) => (
                      <div 
                        key={member.id} 
                        className="flex items-center justify-between p-3 border-b border-[var(--grid-border)] bg-white hover:bg-primary/5 transition-colors"
                      >
                        <div className="flex-1 min-w-0 mr-2">
                          <div className="font-medium text-sm truncate">{member.nama}</div>
                          <div className="text-xs text-slate-500 truncate">{member.jawatan}</div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {member.id === settings.userMemberId && (
                            <Badge className="bg-primary text-[10px] px-1.5 py-0 rounded-none">Anda</Badge>
                          )}
                          {member.jawatan.toLowerCase().includes('ketua panitia') && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded-none bg-slate-200 text-slate-700">Penyemak</Badge>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-7 w-7 rounded-none"
                            onClick={() => {
                              if (editingMember?.id === member.id) {
                                updateMember(member.id, editingMember)
                                setEditingMember(null)
                                toast.success('Ahli berjaya dikemaskini')
                              } else {
                                setEditingMember(member)
                              }
                            }}
                          >
                            {editingMember?.id === member.id ? (
                              <Check className="h-3 w-3 text-primary" />
                            ) : (
                              <span className="text-[10px] font-medium">Edit</span>
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-7 w-7 rounded-none"
                            onClick={() => {
                              removeMember(member.id)
                              toast.success('Ahli berjaya dipadam')
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </TabsContent>
            
            {/* Logos & Signatures */}
            <TabsContent value="logos" className="space-y-6 mt-0">
              <section>
                <SectionHeader number="01" title="Logo Sekolah" />
                <div className="border-l border-t border-r border-[var(--grid-border)] bg-white">
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[var(--grid-border)]">
                    <div className="p-4 space-y-3">
                      <Label className="text-[10px] font-bold uppercase opacity-50 block">Logo 1 (Kiri)</Label>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 border border-[var(--grid-border)] bg-slate-50 flex items-center justify-center overflow-hidden">
                          {settings.logo1 ? (
                            <img src={settings.logo1} alt="Logo 1" className="h-10 w-10 object-contain" />
                          ) : (
                            <span className="material-symbols-outlined text-slate-300 text-xl">image</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="file"
                            ref={logo1Ref}
                            accept="image/png,image/jpeg"
                            className="hidden"
                            onChange={e => handleImageUpload(e, 'logo1')}
                          />
                          <button 
                            onClick={() => logo1Ref.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-primary hover:bg-primary/10 transition-colors text-[10px] font-bold uppercase tracking-wide"
                          >
                            <Upload className="h-3 w-3" />
                            Muat Naik
                          </button>
                          {settings.logo1 && (
                            <button 
                              className="flex items-center justify-center h-7 w-7 border border-slate-200 hover:border-red-300 hover:bg-red-50 transition-colors"
                              onClick={() => updateSettings({ logo1: null })}
                            >
                              <X className="h-3 w-3 text-red-500" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <Label className="text-[10px] font-bold uppercase opacity-50 block">Logo 2 (Kanan)</Label>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 border border-[var(--grid-border)] bg-slate-50 flex items-center justify-center overflow-hidden">
                          {settings.logo2 ? (
                            <img src={settings.logo2} alt="Logo 2" className="h-10 w-10 object-contain" />
                          ) : (
                            <span className="material-symbols-outlined text-slate-300 text-xl">image</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="file"
                            ref={logo2Ref}
                            accept="image/png,image/jpeg"
                            className="hidden"
                            onChange={e => handleImageUpload(e, 'logo2')}
                          />
                          <button 
                            onClick={() => logo2Ref.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-primary hover:bg-primary/10 transition-colors text-[10px] font-bold uppercase tracking-wide"
                          >
                            <Upload className="h-3 w-3" />
                            Muat Naik
                          </button>
                          {settings.logo2 && (
                            <button 
                              className="flex items-center justify-center h-7 w-7 border border-slate-200 hover:border-red-300 hover:bg-red-50 transition-colors"
                              onClick={() => updateSettings({ logo2: null })}
                            >
                              <X className="h-3 w-3 text-red-500" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              
              <section>
                <SectionHeader number="02" title="Tandatangan" />
                <div className="border-l border-t border-r border-[var(--grid-border)] bg-white">
                  <div className="p-3 bg-slate-50 border-b border-[var(--grid-border)]">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">PNG/JPG dengan latar putih</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[var(--grid-border)]">
                    <div className="p-4 space-y-3">
                      <Label className="text-[10px] font-bold uppercase opacity-50 block">Setiausaha</Label>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-24 border border-[var(--grid-border)] bg-slate-50 flex items-center justify-center overflow-hidden">
                          {settings.setiausahaSignature ? (
                            <img src={settings.setiausahaSignature} alt="Sig" className="h-10 object-contain" />
                          ) : (
                            <Signature className="h-5 w-5 text-slate-300" />
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="file"
                            ref={ttdSetiausahaRef}
                            accept="image/png,image/jpeg"
                            className="hidden"
                            onChange={e => handleImageUpload(e, 'setiausahaSignature')}
                          />
                          <button 
                            onClick={() => ttdSetiausahaRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-primary hover:bg-primary/10 transition-colors text-[10px] font-bold uppercase tracking-wide"
                          >
                            <Upload className="h-3 w-3" />
                            Muat Naik
                          </button>
                          {settings.setiausahaSignature && (
                            <button 
                              className="flex items-center justify-center h-7 w-7 border border-slate-200 hover:border-red-300 hover:bg-red-50 transition-colors"
                              onClick={() => updateSettings({ setiausahaSignature: null })}
                            >
                              <X className="h-3 w-3 text-red-500" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <Label className="text-[10px] font-bold uppercase opacity-50 block">Ketua Panitia</Label>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-24 border border-[var(--grid-border)] bg-slate-50 flex items-center justify-center overflow-hidden">
                          {settings.ketuaPanitiaSignature ? (
                            <img src={settings.ketuaPanitiaSignature} alt="Sig" className="h-10 object-contain" />
                          ) : (
                            <Signature className="h-5 w-5 text-slate-300" />
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="file"
                            ref={ttdKetuaPanitiaRef}
                            accept="image/png,image/jpeg"
                            className="hidden"
                            onChange={e => handleImageUpload(e, 'ketuaPanitiaSignature')}
                          />
                          <button 
                            onClick={() => ttdKetuaPanitiaRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-primary hover:bg-primary/10 transition-colors text-[10px] font-bold uppercase tracking-wide"
                          >
                            <Upload className="h-3 w-3" />
                            Muat Naik
                          </button>
                          {settings.ketuaPanitiaSignature && (
                            <button 
                              className="flex items-center justify-center h-7 w-7 border border-slate-200 hover:border-red-300 hover:bg-red-50 transition-colors"
                              onClick={() => updateSettings({ ketuaPanitiaSignature: null })}
                            >
                              <X className="h-3 w-3 text-red-500" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </TabsContent>
            
            {/* Frequent Content */}
            <TabsContent value="frequent" className="space-y-6 mt-0">
              <section>
                <div className="flex items-center justify-between mb-4">
                  <SectionHeader number="01" title="Kandungan Kerap" />
                  <div className="flex items-center gap-2">
                    <Input
                      value={newFrequent.name}
                      onChange={e => setNewFrequent(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nama"
                      className="h-8 text-xs w-32 border-slate-200 rounded-none"
                    />
                    <Select 
                      value={newFrequent.category}
                      onValueChange={v => setNewFrequent(prev => ({ ...prev, category: v as FrequentContent['category'] }))}
                    >
                      <SelectTrigger className="h-8 text-xs w-32 rounded-none border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleAddFrequent}
                      className="btn-primary h-8"
                      size="sm"
                    >
                      <Plus className="h-3 w-3" />
                      <span className="text-[10px]">Tambah</span>
                    </Button>
                  </div>
                </div>
                <div className="border-l border-t border-r border-[var(--grid-border)]">
                  <div className="max-h-[50vh] overflow-y-auto bg-white">
                    {categoryOptions.map(cat => (
                      <div key={cat.value} className="border-b border-[var(--grid-border)]">
                        <div className="p-3 bg-slate-50 border-b border-[var(--grid-border)]">
                          <h4 className="font-bold text-xs uppercase tracking-wide">{cat.label}</h4>
                        </div>
                        <div className="divide-y divide-[var(--grid-border)]">
                          {settings.frequentContent
                            .filter(c => c.category === cat.value)
                            .map(content => (
                              <div 
                                key={content.id} 
                                className="p-3 hover:bg-primary/5 transition-colors"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm">{content.name}</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{content.content}</div>
                                  </div>
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      className="h-6 w-6 rounded-none"
                                      onClick={() => {
                                        if (editingFrequent?.id === content.id) {
                                          updateFrequentContent(content.id, editingFrequent)
                                          setEditingFrequent(null)
                                          toast.success('Kandungan berjaya dikemaskini')
                                        } else {
                                          setEditingFrequent(content)
                                        }
                                      }}
                                    >
                                      {editingFrequent?.id === content.id ? (
                                        <Check className="h-3 w-3 text-primary" />
                                      ) : (
                                        <span className="text-[10px]">Edit</span>
                                      )}
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      className="h-6 w-6 rounded-none"
                                      onClick={() => {
                                        removeFrequentContent(content.id)
                                        toast.success('Kandungan berjaya dipadam')
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3 text-red-500" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          {settings.frequentContent.filter(c => c.category === cat.value).length === 0 && (
                            <p className="p-3 text-[10px] text-slate-500">Tiada kandungan kerap</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
