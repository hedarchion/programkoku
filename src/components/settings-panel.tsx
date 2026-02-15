'use client'

import { useState, useRef } from 'react'
import { useSettings, Member, FrequentContent } from '@/lib/settings-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
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
import { 
  Plus, 
  Trash2, 
  Edit, 
  Upload,
  X,
  RotateCcw,
  Building2,
  Users,
  Copy,
  Check
} from 'lucide-react'
import { toast } from 'sonner'

const jawatanOptions = [
  'PK HEM',
  'PK Pentadbiran',
  'PK Kokurikulum',
  'PK Kurikulum',
  'Ketua Panitia',
  'Setiausaha Panitia',
  'Bendahari Panitia',
  'Ahli Panitia',
  'GBA',
  'GPI'
]

const categoryOptions = [
  { value: 'ucapanPengerusi', label: 'Ucapan Pengerusi' },
  { value: 'minitLalu', label: 'Minit Lalu (3.1)' },
  { value: 'ucapanPenangguhan', label: 'Ucapan Penangguhan' }
]

export default function SettingsPanel() {
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

  const [newMember, setNewMember] = useState({ nama: '', jawatan: '' })
  const [newFrequent, setNewFrequent] = useState<FrequentContent>({
    id: '',
    name: '',
    category: 'ucapanPengerusi',
    content: ''
  })
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [editingFrequent, setEditingFrequent] = useState<FrequentContent | null>(null)
  const [newProfileName, setNewProfileName] = useState('')
  const [newProfileType, setNewProfileType] = useState<'school' | 'society'>('society')
  const [duplicateName, setDuplicateName] = useState('')

  const logo1Ref = useRef<HTMLInputElement>(null)
  const logo2Ref = useRef<HTMLInputElement>(null)
  const sigSetiausahaRef = useRef<HTMLInputElement>(null)
  const sigKetuaRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, key: 'logo1' | 'logo2' | 'setiausahaSignature' | 'ketuaPanitiaSignature') => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 500000) {
        toast.error('Fail terlalu besar. Maksimum 500KB.')
        return
      }
      const reader = new FileReader()
      reader.onload = (event) => {
        updateSettings({ [key]: event.target?.result as string })
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
    toast.success('Ahli berjaya ditambah')
  }

  const handleAddFrequent = () => {
    if (!newFrequent.name || !newFrequent.content) {
      toast.error('Sila isi nama dan kandungan')
      return
    }
    addFrequent(newFrequent)
    setNewFrequent({ id: '', name: '', category: 'ucapanPengerusi', content: '' })
    toast.success('Kandungan kerap berjaya ditambah')
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

  const getUserMember = () => {
    return settings.members.find(m => m.id === settings.userMemberId)
  }

  const getKetuaPanitia = () => {
    return settings.members.find(m => m.jawatan.toLowerCase().includes('ketua panitia'))
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="profiles">
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="profiles" className="text-xs py-1.5">Profil</TabsTrigger>
          <TabsTrigger value="general" className="text-xs py-1.5">Umum</TabsTrigger>
          <TabsTrigger value="members" className="text-xs py-1.5">Ahli</TabsTrigger>
          <TabsTrigger value="images" className="text-xs py-1.5">Imej</TabsTrigger>
          <TabsTrigger value="frequent" className="text-xs py-1.5 hidden sm:block">Templat</TabsTrigger>
        </TabsList>

        {/* Profiles Tab */}
        <TabsContent value="profiles" className="space-y-3 mt-3">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Profil Organisasi ({profiles.length})</span>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      className="h-7 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-all duration-200"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Profil Baru</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle className="text-base">Buat Profil Baru</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Nama Profil</Label>
                        <Input 
                          value={newProfileName}
                          onChange={e => setNewProfileName(e.target.value)}
                          placeholder="Contoh: Panitia Sains, SK Taman Maluri"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Jenis</Label>
                        <Select 
                          value={newProfileType}
                          onValueChange={(v: 'school' | 'society') => setNewProfileType(v)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="society">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>Persatuan / Panitia</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="school">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                <span>Sekolah Lain</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {newProfileType === 'society' 
                          ? 'Membuat profil baru dengan tetapan semasa (ahli, templat)'
                          : 'Membuat profil baru dengan tetapan lalai'}
                      </p>
                    </div>
                    <DialogFooter>
                      <Button size="sm" onClick={handleCreateProfile}>Buat</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {profiles.map(profile => (
                  <div 
                    key={profile.id} 
                    className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                      profile.id === currentProfile?.id 
                        ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700' 
                        : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {profile.type === 'school' ? (
                        <Building2 className="h-4 w-4 shrink-0 text-blue-600" />
                      ) : (
                        <Users className="h-4 w-4 shrink-0 text-purple-600" />
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{profile.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {profile.type === 'school' ? 'Sekolah' : 'Persatuan/Panitia'}
                          {' • '}{profile.settings.members.length} ahli
                        </div>
                      </div>
                      {profile.id === currentProfile?.id && (
                        <Badge variant="default" className="bg-emerald-600 text-[10px] px-1.5 py-0 shrink-0">
                          Aktif
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {profile.id !== currentProfile?.id && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-7 gap-1.5 text-xs font-medium hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                          onClick={() => switchProfile(profile.id)}
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Pilih</span>
                        </Button>
                      )}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setDuplicateName(`${profile.name} (Salinan)`)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-sm">
                          <DialogHeader>
                            <DialogTitle className="text-base">Salin Profil</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3 py-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Nama Profil Baru</Label>
                              <Input 
                                value={duplicateName}
                                onChange={e => setDuplicateName(e.target.value)}
                                className="h-9"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button size="sm" onClick={handleDuplicateProfile}>Salin</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      {profiles.length > 1 && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Padam profil?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Profil "{profile.name}" akan dipadamkan secara kekal.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction 
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">Tetapan Profil Semasa</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nama Profil</Label>
                <Input 
                  value={currentProfile?.name || ''}
                  onChange={e => {
                    if (currentProfile) {
                      updateProfile(currentProfile.id, { name: e.target.value })
                    }
                  }}
                  className="h-9"
                />
              </div>
              <div className="flex items-center justify-between">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 text-xs text-red-600">
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Set Semula Profil
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Set Semula Profil?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Semua tetapan dalam profil ini akan dikembalikan kepada nilai lalai.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={resetCurrentProfile}>Set Semula</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-3 mt-3">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">Maklumat Sekolah</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nama Sekolah</Label>
                  <Input 
                    value={settings.schoolName}
                    onChange={e => updateSettings({ schoolName: e.target.value })}
                    placeholder="SEKOLAH KEBANGSAAN AYER TAWAR"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Kod Sekolah</Label>
                  <Input 
                    value={settings.schoolCode}
                    onChange={e => updateSettings({ schoolCode: e.target.value })}
                    placeholder="ABA 1006"
                    className="h-9"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Alamat</Label>
                <Input 
                  value={settings.schoolAddress}
                  onChange={e => updateSettings({ schoolAddress: e.target.value })}
                  placeholder="32400 AYER TAWAR, PERAK"
                  className="h-9"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">Font</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Select 
                value={settings.font} 
                onValueChange={(v: 'calibri' | 'times' | 'poppins') => updateSettings({ font: v })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calibri">Calibri</SelectItem>
                  <SelectItem value="times">Times New Roman</SelectItem>
                  <SelectItem value="poppins">Poppins</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">Pengguna Semasa (Setiausaha)</CardTitle>
              <CardDescription className="text-xs">Pilih ahli yang mewakili anda</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Select 
                value={settings.userMemberId || ''} 
                onValueChange={v => updateSettings({ userMemberId: v })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Pilih ahli" />
                </SelectTrigger>
                <SelectContent>
                  {settings.members.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.nama} ({m.jawatan})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members */}
        <TabsContent value="members" className="space-y-3 mt-3">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Senarai Ahli ({settings.members.length})</span>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      className="h-7 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-all duration-200"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Tambah Ahli</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle className="text-base">Tambah Ahli Baru</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Nama</Label>
                        <Input 
                          value={newMember.nama}
                          onChange={e => setNewMember(prev => ({ ...prev, nama: e.target.value }))}
                          placeholder="Nama penuh ahli"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Jawatan</Label>
                        <Select 
                          value={newMember.jawatan}
                          onValueChange={v => setNewMember(prev => ({ ...prev, jawatan: v }))}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Pilih jawatan" />
                          </SelectTrigger>
                          <SelectContent>
                            {jawatanOptions.map(j => (
                              <SelectItem key={j} value={j}>{j}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button size="sm" onClick={handleAddMember}>Tambah</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {settings.members.map(member => (
                  <div 
                    key={member.id} 
                    className="flex items-center justify-between p-2 rounded-lg border bg-slate-50 dark:bg-slate-900"
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      <div className="font-medium text-sm truncate">{member.nama}</div>
                      <div className="text-xs text-muted-foreground truncate">{member.jawatan}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {member.id === settings.userMemberId && (
                        <Badge variant="default" className="bg-emerald-600 text-[10px] px-1.5 py-0">Anda</Badge>
                      )}
                      {member.jawatan.toLowerCase().includes('ketua panitia') && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Penyemak</Badge>
                      )}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setEditingMember(member)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-sm">
                          <DialogHeader>
                            <DialogTitle className="text-base">Edit Ahli</DialogTitle>
                          </DialogHeader>
                          {editingMember && (
                            <div className="space-y-3 py-3">
                              <div className="space-y-1.5">
                                <Label className="text-xs">Nama</Label>
                                <Input 
                                  value={editingMember.nama}
                                  onChange={e => setEditingMember(prev => prev ? { ...prev, nama: e.target.value } : null)}
                                  className="h-9"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Jawatan</Label>
                                <Select 
                                  value={editingMember.jawatan}
                                  onValueChange={v => setEditingMember(prev => prev ? { ...prev, jawatan: v } : null)}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {jawatanOptions.map(j => (
                                      <SelectItem key={j} value={j}>{j}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                          <DialogFooter>
                            <Button size="sm" onClick={() => {
                              if (editingMember) {
                                updateMember(editingMember.id, editingMember)
                                setEditingMember(null)
                                toast.success('Ahli berjaya dikemaskini')
                              }
                            }}>Simpan</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-7 w-7"
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Images */}
        <TabsContent value="images" className="space-y-3 mt-3">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">Logo Sekolah</CardTitle>
              <CardDescription className="text-xs">Muat naik dua logo untuk dokumen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Logo 1 (Kiri)</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={logo1Ref}
                      accept="image/png,image/jpeg"
                      className="hidden"
                      onChange={e => handleImageUpload(e, 'logo1')}
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => logo1Ref.current?.click()}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      Muat Naik
                    </Button>
                    {settings.logo1 && (
                      <>
                        <img src={settings.logo1} alt="Logo 1" className="h-8 w-8 object-contain" />
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateSettings({ logo1: null })}
                        >
                          <X className="h-3 w-3 text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Logo 2 (Kanan)</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={logo2Ref}
                      accept="image/png,image/jpeg"
                      className="hidden"
                      onChange={e => handleImageUpload(e, 'logo2')}
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => logo2Ref.current?.click()}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      Muat Naik
                    </Button>
                    {settings.logo2 && (
                      <>
                        <img src={settings.logo2} alt="Logo 2" className="h-8 w-8 object-contain" />
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateSettings({ logo2: null })}
                        >
                          <X className="h-3 w-3 text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">Tandatangan</CardTitle>
              <CardDescription className="text-xs">PNG/JPG dengan latar putih</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Setiausaha ({getUserMember()?.nama?.split(' ')[0] || 'Anda'})</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={sigSetiausahaRef}
                      accept="image/png,image/jpeg"
                      className="hidden"
                      onChange={e => handleImageUpload(e, 'setiausahaSignature')}
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => sigSetiausahaRef.current?.click()}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      Muat Naik
                    </Button>
                    {settings.setiausahaSignature && (
                      <>
                        <img src={settings.setiausahaSignature} alt="Sig" className="h-8 object-contain" />
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateSettings({ setiausahaSignature: null })}
                        >
                          <X className="h-3 w-3 text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Ketua Panitia ({getKetuaPanitia()?.nama?.split(' ')[0] || 'Ketua'})</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={sigKetuaRef}
                      accept="image/png,image/jpeg"
                      className="hidden"
                      onChange={e => handleImageUpload(e, 'ketuaPanitiaSignature')}
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => sigKetuaRef.current?.click()}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      Muat Naik
                    </Button>
                    {settings.ketuaPanitiaSignature && (
                      <>
                        <img src={settings.ketuaPanitiaSignature} alt="Sig" className="h-8 object-contain" />
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateSettings({ ketuaPanitiaSignature: null })}
                        >
                          <X className="h-3 w-3 text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Frequent Content */}
        <TabsContent value="frequent" className="space-y-3 mt-3">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Kandungan Kerap</span>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-7 text-xs">
                      <Plus className="h-3 w-3 mr-1" /> Tambah
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle className="text-base">Tambah Kandungan Kerap</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Nama</Label>
                        <Input 
                          value={newFrequent.name}
                          onChange={e => setNewFrequent(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Nama kandungan"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Kategori</Label>
                        <Select 
                          value={newFrequent.category}
                          onValueChange={v => setNewFrequent(prev => ({ ...prev, category: v as FrequentContent['category'] }))}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categoryOptions.map(c => (
                              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Kandungan</Label>
                        <Textarea 
                          value={newFrequent.content}
                          onChange={e => setNewFrequent(prev => ({ ...prev, content: e.target.value }))}
                          placeholder="Isi kandungan..."
                          rows={3}
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button size="sm" onClick={handleAddFrequent}>Tambah</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                {categoryOptions.map(cat => (
                  <div key={cat.value}>
                    <h4 className="font-medium text-xs mb-1.5">{cat.label}</h4>
                    <div className="space-y-1.5">
                      {settings.frequentContent
                        .filter(c => c.category === cat.value)
                        .map(content => (
                          <div 
                            key={content.id} 
                            className="p-2 rounded border bg-slate-50 dark:bg-slate-900"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-xs">{content.name}</div>
                                <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{content.content}</div>
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => setEditingFrequent(content)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-sm">
                                    <DialogHeader>
                                      <DialogTitle className="text-base">Edit Kandungan</DialogTitle>
                                    </DialogHeader>
                                    {editingFrequent && (
                                      <div className="space-y-3 py-3">
                                        <div className="space-y-1.5">
                                          <Label className="text-xs">Nama</Label>
                                          <Input 
                                            value={editingFrequent.name}
                                            onChange={e => setEditingFrequent(prev => prev ? { ...prev, name: e.target.value } : null)}
                                            className="h-9"
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label className="text-xs">Kategori</Label>
                                          <Select 
                                            value={editingFrequent.category}
                                            onValueChange={v => setEditingFrequent(prev => prev ? { ...prev, category: v as FrequentContent['category'] } : null)}
                                          >
                                            <SelectTrigger className="h-9">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {categoryOptions.map(c => (
                                                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label className="text-xs">Kandungan</Label>
                                          <Textarea 
                                            value={editingFrequent.content}
                                            onChange={e => setEditingFrequent(prev => prev ? { ...prev, content: e.target.value } : null)}
                                            rows={3}
                                            className="text-sm"
                                          />
                                        </div>
                                      </div>
                                    )}
                                    <DialogFooter>
                                      <Button size="sm" onClick={() => {
                                        if (editingFrequent) {
                                          updateFrequentContent(editingFrequent.id, editingFrequent)
                                          setEditingFrequent(null)
                                          toast.success('Kandungan berjaya dikemaskini')
                                        }
                                      }}>Simpan</Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-6 w-6"
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
                        <p className="text-[10px] text-muted-foreground">Tiada kandungan kerap</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
