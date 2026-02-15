'use client'

import { useState, useRef } from 'react'
import { useSettings, Member, FrequentContent } from '@/lib/settings-context'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Settings, Plus, Trash2, Upload, X, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsDialog() {
  const { 
    settings, 
    updateSettings, 
    addMember, 
    updateMember, 
    removeMember,
    addFrequentContent,
    updateFrequentContent,
    removeFrequentContent,
    resetSettings 
  } = useSettings()
  
  const [open, setOpen] = useState(false)
  const [newMember, setNewMember] = useState({ nama: '', jawatan: '' })
  const [newFrequent, setNewFrequent] = useState<FrequentContent>({
    id: '', name: '', category: 'ucapanPengerusi', content: ''
  })
  
  const logo1Ref = useRef<HTMLInputElement>(null)
  const logo2Ref = useRef<HTMLInputElement>(null)
  const ttdSetiausahaRef = useRef<HTMLInputElement>(null)
  const ttdKetuaPanitiaRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo1' | 'logo2' | 'ttdSetiausaha' | 'ttdKetuaPanitia') => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 500000) {
        toast.error('Fail terlalu besar. Maksimum 500KB.')
        return
      }
      const reader = new FileReader()
      reader.onload = (event) => {
        updateSettings({ [field]: event.target?.result as string })
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Settings className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Tetapan</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="school" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="school">Sekolah</TabsTrigger>
            <TabsTrigger value="members">Ahli</TabsTrigger>
            <TabsTrigger value="logos">Logo & TTD</TabsTrigger>
            <TabsTrigger value="frequent">Kerap</TabsTrigger>
            <TabsTrigger value="font">Font</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[60vh] mt-4">
            {/* School Settings */}
            <TabsContent value="school" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Maklumat Sekolah</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Nama Sekolah</Label>
                    <Input 
                      value={settings.namaSekolah} 
                      onChange={e => updateSettings({ namaSekolah: e.target.value })}
                      placeholder="SEKOLAH KEBANGSAAN AYER TAWAR"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Alamat</Label>
                    <Input 
                      value={settings.alamatSekolah} 
                      onChange={e => updateSettings({ alamatSekolah: e.target.value })}
                      placeholder="32400 AYER TAWAR, PERAK"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Kod Sekolah</Label>
                      <Input 
                        value={settings.kodSekolah} 
                        onChange={e => updateSettings({ kodSekolah: e.target.value })}
                        placeholder="ABA 1006"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefon/Faks</Label>
                      <Input 
                        value={settings.telefon} 
                        onChange={e => updateSettings({ telefon: e.target.value })}
                        placeholder="05-6724248"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input 
                        value={settings.email} 
                        onChange={e => updateSettings({ email: e.target.value })}
                        placeholder="ABA1006@moe.edu.my"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Members Settings */}
            <TabsContent value="members" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Senarai Ahli Panitia</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    {settings.members.map((member) => (
                      <div key={member.id} className="flex items-center gap-2 p-2 rounded-lg border bg-slate-50 dark:bg-slate-900">
                        <div className="flex-1 grid gap-2 sm:grid-cols-2">
                          <Input 
                            value={member.nama} 
                            onChange={e => updateMember(member.id, { nama: e.target.value })}
                            placeholder="Nama"
                            className="bg-white dark:bg-slate-800"
                          />
                          <Select 
                            value={member.jawatan} 
                            onValueChange={v => updateMember(member.id, { jawatan: v })}
                          >
                            <SelectTrigger className="bg-white dark:bg-slate-800">
                              <SelectValue placeholder="Jawatan" />
                            </SelectTrigger>
                            <SelectContent>
                              {jawatanList.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeMember(member.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <Separator />
                  
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Input 
                      value={newMember.nama}
                      onChange={e => setNewMember(prev => ({ ...prev, nama: e.target.value }))}
                      placeholder="Nama ahli baru"
                    />
                    <Select 
                      value={newMember.jawatan}
                      onValueChange={v => setNewMember(prev => ({ ...prev, jawatan: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jawatan" />
                      </SelectTrigger>
                      <SelectContent>
                        {jawatanList.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleAddMember}
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Tambah</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Penetapan Jawatan</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Setiausaha Panitia</Label>
                    <Select 
                      value={settings.setiausahaId || ''} 
                      onValueChange={v => updateSettings({ setiausahaId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih setiausaha" />
                      </SelectTrigger>
                      <SelectContent>
                        {settings.members.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.nama}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ketua Panitia</Label>
                    <Select 
                      value={settings.ketuaPanitiaId || ''} 
                      onValueChange={v => updateSettings({ ketuaPanitiaId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih ketua panitia" />
                      </SelectTrigger>
                      <SelectContent>
                        {settings.members.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.nama}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Logos & Signatures */}
            <TabsContent value="logos" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Logo Sekolah</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Logo 1 (Kiri)</Label>
                    <div className="flex items-center gap-2">
                      {settings.logo1 && (
                        <img src={settings.logo1} alt="Logo 1" className="h-16 w-16 object-contain rounded border" />
                      )}
                      <input 
                        ref={logo1Ref}
                        type="file" 
                        accept="image/png,image/jpeg,image/jpg"
                        className="hidden"
                        onChange={e => handleImageUpload(e, 'logo1')}
                      />
                      <Button variant="outline" onClick={() => logo1Ref.current?.click()}>
                        <Upload className="h-4 w-4 mr-2" /> Muat Naik
                      </Button>
                      {settings.logo1 && (
                        <Button variant="ghost" size="icon" onClick={() => updateSettings({ logo1: null })}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Logo 2 (Kanan)</Label>
                    <div className="flex items-center gap-2">
                      {settings.logo2 && (
                        <img src={settings.logo2} alt="Logo 2" className="h-16 w-16 object-contain rounded border" />
                      )}
                      <input 
                        ref={logo2Ref}
                        type="file" 
                        accept="image/png,image/jpeg,image/jpg"
                        className="hidden"
                        onChange={e => handleImageUpload(e, 'logo2')}
                      />
                      <Button variant="outline" onClick={() => logo2Ref.current?.click()}>
                        <Upload className="h-4 w-4 mr-2" /> Muat Naik
                      </Button>
                      {settings.logo2 && (
                        <Button variant="ghost" size="icon" onClick={() => updateSettings({ logo2: null })}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Tandatangan</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>TTD Setiausaha</Label>
                    <div className="flex items-center gap-2">
                      {settings.ttdSetiausaha && (
                        <img src={settings.ttdSetiausaha} alt="TTD Setiausaha" className="h-12 object-contain rounded border" />
                      )}
                      <input 
                        ref={ttdSetiausahaRef}
                        type="file" 
                        accept="image/png,image/jpeg,image/jpg"
                        className="hidden"
                        onChange={e => handleImageUpload(e, 'ttdSetiausaha')}
                      />
                      <Button variant="outline" onClick={() => ttdSetiausahaRef.current?.click()}>
                        <Upload className="h-4 w-4 mr-2" /> Muat Naik
                      </Button>
                      {settings.ttdSetiausaha && (
                        <Button variant="ghost" size="icon" onClick={() => updateSettings({ ttdSetiausaha: null })}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>TTD Ketua Panitia</Label>
                    <div className="flex items-center gap-2">
                      {settings.ttdKetuaPanitia && (
                        <img src={settings.ttdKetuaPanitia} alt="TTD Ketua Panitia" className="h-12 object-contain rounded border" />
                      )}
                      <input 
                        ref={ttdKetuaPanitiaRef}
                        type="file" 
                        accept="image/png,image/jpeg,image/jpg"
                        className="hidden"
                        onChange={e => handleImageUpload(e, 'ttdKetuaPanitia')}
                      />
                      <Button variant="outline" onClick={() => ttdKetuaPanitiaRef.current?.click()}>
                        <Upload className="h-4 w-4 mr-2" /> Muat Naik
                      </Button>
                      {settings.ttdKetuaPanitia && (
                        <Button variant="ghost" size="icon" onClick={() => updateSettings({ ttdKetuaPanitia: null })}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Frequent Content */}
            <TabsContent value="frequent" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Kandungan Kerap</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {['ucapanPengerusi', 'minitLalu', 'ucapanPenangguhan'].map(category => (
                    <div key={category} className="space-y-2">
                      <Label className="font-semibold">{categoryLabels[category as keyof typeof categoryLabels]}</Label>
                      {settings.frequentContents
                        .filter(f => f.category === category)
                        .map(content => (
                          <div key={content.id} className="flex items-start gap-2 p-2 rounded border bg-slate-50 dark:bg-slate-900">
                            <div className="flex-1 space-y-2">
                              <Input 
                                value={content.name}
                                onChange={e => updateFrequentContent(content.id, { name: e.target.value })}
                                placeholder="Nama"
                                className="bg-white dark:bg-slate-800"
                              />
                              <Textarea 
                                value={content.content}
                                onChange={e => updateFrequentContent(content.id, { content: e.target.value })}
                                placeholder="Kandungan"
                                className="bg-white dark:bg-slate-800"
                              />
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeFrequentContent(content.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label>Tambah Kandungan Kerap Baru</Label>
                    <div className="grid gap-2">
                      <Input 
                        value={newFrequent.name}
                        onChange={e => setNewFrequent(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nama kandungan"
                      />
                      <Select 
                        value={newFrequent.category}
                        onValueChange={v => setNewFrequent(prev => ({ ...prev, category: v as FrequentContent['category'] }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ucapanPengerusi">Ucapan Pengerusi</SelectItem>
                          <SelectItem value="minitLalu">Minit Mesyuarat Lalu</SelectItem>
                          <SelectItem value="ucapanPenangguhan">Ucapan Penangguhan</SelectItem>
                        </SelectContent>
                      </Select>
                      <Textarea 
                        value={newFrequent.content}
                        onChange={e => setNewFrequent(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Kandungan..."
                      />
                      <Button onClick={handleAddFrequent}>
                        <Plus className="h-4 w-4 mr-2" /> Tambah
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Font Settings */}
            <TabsContent value="font" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Pilihan Font</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Font Dokumen</Label>
                      <p className="text-sm text-muted-foreground">
                        Pilih font untuk dokumen yang dijana
                      </p>
                    </div>
                    <Select 
                      value={settings.font}
                      onValueChange={v => updateSettings({ font: v as 'calibri' | 'timesNewRoman' })}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="calibri">Calibri</SelectItem>
                        <SelectItem value="timesNewRoman">Times New Roman</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="p-4 rounded border bg-slate-50 dark:bg-slate-900">
                    <p className="text-sm text-muted-foreground mb-2">Pratonton:</p>
                    <p style={{ fontFamily: settings.font === 'calibri' ? 'Calibri, sans-serif' : 'Times New Roman, serif' }}>
                      MINIT MESYUARAT PANITIA BAHASA ARAB
                    </p>
                    <p style={{ fontFamily: settings.font === 'calibri' ? 'Calibri, sans-serif' : 'Times New Roman, serif' }}>
                      Ini adalah contoh teks biasa untuk dokumen mesyuarat.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-red-600">Set Semula Tetapan</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ini akan memadamkan semua tetapan termasuk logo dan tandatangan yang telah dimuat naik.
                  </p>
                  <Button variant="destructive" onClick={() => {
                    resetSettings()
                    toast.success('Tetapan telah diset semula')
                  }}>
                    Set Semula ke Tetapan Asal
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
