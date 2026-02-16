'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback, useRef } from 'react'

export interface Member {
  id: string
  nama: string
  jawatan: string
}

export interface FrequentContent {
  id: string
  name: string
  category: 'ucapanPengerusi' | 'minitLalu' | 'ucapanPenangguhan'
  content: string
}

export interface Profile {
  id: string
  name: string
  type: 'school' | 'society'
  createdAt: string
  updatedAt: string
  settings: ProfileSettings
}

export interface ProfileSettings {
  schoolName: string
  schoolCode: string
  schoolAddress: string
  font: 'calibri' | 'times' | 'poppins'
  members: Member[]
  userMemberId: string | null
  logo1: string | null
  logo2: string | null
  setiausahaSignature: string | null
  ketuaPanitiaSignature: string | null
  frequentContent: FrequentContent[]
}

interface SettingsContextType {
  profiles: Profile[]
  currentProfileId: string | null
  currentProfile: Profile | null
  settings: ProfileSettings
  createProfile: (name: string, type: 'school' | 'society') => string
  updateProfile: (id: string, updates: Partial<Pick<Profile, 'name' | 'type'>>) => void
  deleteProfile: (id: string) => void
  duplicateProfile: (id: string, newName: string) => string
  switchProfile: (id: string) => void
  updateSettings: (updates: Partial<ProfileSettings>) => void
  addMember: (member: Omit<Member, 'id'>) => void
  updateMember: (id: string, updates: Partial<Member>) => void
  removeMember: (id: string) => void
  addFrequentContent: (content: Omit<FrequentContent, 'id'>) => void
  updateFrequentContent: (id: string, updates: Partial<FrequentContent>) => void
  removeFrequentContent: (id: string) => void
  resetCurrentProfile: () => void
}

const defaultSettings: ProfileSettings = {
  schoolName: 'SEKOLAH KEBANGSAAN AYER TAWAR',
  schoolCode: 'ABA 1006',
  schoolAddress: '32400 AYER TAWAR, PERAK',
  font: 'calibri',
  members: [
    { id: '1', nama: 'Megat Nor Shahfiee bin Megat Hussin', jawatan: 'Guru Besar' },
    { id: '2', nama: 'Nor Laili binti Razali', jawatan: 'PK Pentadbiran' },
    { id: '3', nama: 'Roslawati binti Ismail', jawatan: 'PK HEM' },
    { id: '4', nama: 'Muhamad Nor bin Samsudin', jawatan: 'PK Kokurikulum' },
    { id: '5', nama: 'Kharidah Bahiah binti Sarkawi', jawatan: 'Penyelaras PPKI' },
    { id: '6', nama: 'Norhayu binti Rasid', jawatan: 'Ketua Panitia Bahasa Arab' },
    { id: '7', nama: 'Nurul Athifah binti Azammudin', jawatan: 'Setiausaha Panitia Bahasa Arab' },
    { id: '8', nama: 'Afifah binti Ramli', jawatan: 'Bendahari Panitia Bahasa Arab' },
    { id: '9', nama: 'Mohamad Ridhuan bin Hasan', jawatan: 'GBA/GPI' },
    { id: '10', nama: 'Ifa Yusnani binti Ismail', jawatan: 'GBA/GPI' },
    { id: '11', nama: 'Khadijah binti Ibrahim', jawatan: 'GBA/GPI' },
    { id: '12', nama: 'Nur Amal \'Adilah binti Mohd Yusoff', jawatan: 'GBA/GPI' },
    { id: '13', nama: 'Zaiton binti Ahmad', jawatan: 'GBA/GPI' }
  ],
  userMemberId: '7',
  logo1: null,
  logo2: null,
  setiausahaSignature: null,
  ketuaPanitiaSignature: null,
  frequentContent: [
    { id: '1', name: 'Bacaan Al-Fatihah', category: 'ucapanPengerusi', content: 'Pengerusi memulakan mesyuarat dengan meminta semua hadirin membaca surah Al-Fatihah.' },
    { id: '2', name: 'Ucapan Alu-aluan', category: 'ucapanPengerusi', content: 'Pengerusi mengucapkan terima kasih kepada semua ahli Panitia yang hadir dan berharap mesyuarat berjalan dengan lancar.' },
    { id: '3', name: 'Halatuju Panitia', category: 'ucapanPengerusi', content: 'Pengerusi merangkumi halatuju Panitia Bahasa Arab untuk tahun semasa dan menekankan kepentingan kerjasama semua pihak.' },
    { id: '4', name: 'Minit Lalu Standard', category: 'minitLalu', content: 'Minit mesyuarat Panitia Bahasa Arab bil [bil]/[tahun] telah dibentangkan oleh setiausaha dan disahkan tanpa pembetulan.' },
    { id: '5', name: 'Penangguhan Standard', category: 'ucapanPenangguhan', content: 'Mesyuarat ditangguhkan pada tarikh yang akan ditentukan kelak. Mesyuarat diakhiri dengan bacaan surah Al-Asr dan tasbih kaffarah.' },
    { id: '6', name: 'Penangguhan dengan Doa', category: 'ucapanPenangguhan', content: 'Mesyuarat diakhiri dengan doa penutup oleh Pengerusi dan selawat ke atas Nabi Muhammad SAW.' }
  ]
}

const createDefaultProfile = (): Profile => ({
  id: 'default',
  name: 'Panitia Bahasa Arab',
  type: 'society',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  settings: { ...defaultSettings }
})

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

// Helper to load image and convert to base64
async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  // For CSR, start with default and only load from localStorage after mount
  const [profiles, setProfiles] = useState<Profile[]>([createDefaultProfile()])
  const [currentProfileId, setCurrentProfileId] = useState<string | null>('default')
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from localStorage and preload logos on client after mount
  useEffect(() => {
    const loadSettingsAndLogos = async () => {
      try {
        let loadedProfiles: Profile[] = [createDefaultProfile()]
        let loadedProfileId: string | null = 'default'
        
        const saved = localStorage.getItem('document-generator-profiles')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed.profiles) loadedProfiles = parsed.profiles
          if (parsed.currentProfileId) loadedProfileId = parsed.currentProfileId
        }
        
        // Preload default logos if not already set
        const currentProfile = loadedProfiles.find(p => p.id === loadedProfileId) || loadedProfiles[0]
        if (currentProfile && !currentProfile.settings.logo1 && !currentProfile.settings.logo2) {
          const [logo1Base64, logo2Base64] = await Promise.all([
            loadImageAsBase64('/logos/kiri.png'),
            loadImageAsBase64('/logos/kanan.png')
          ])
          
          if (logo1Base64 || logo2Base64) {
            loadedProfiles = loadedProfiles.map(p => {
              if (p.id === currentProfile.id) {
                return {
                  ...p,
                  settings: {
                    ...p.settings,
                    logo1: logo1Base64 || p.settings.logo1,
                    logo2: logo2Base64 || p.settings.logo2
                  }
                }
              }
              return p
            })
          }
        }
        
        setProfiles(loadedProfiles)
        setCurrentProfileId(loadedProfileId)
        setIsHydrated(true)
      } catch {
        setIsHydrated(true)
      }
    }
    
    loadSettingsAndLogos()
  }, [])

  // Debounced save to localStorage
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem('document-generator-profiles', JSON.stringify({
        profiles,
        currentProfileId
      }))
    }, 300)
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [profiles, currentProfileId])

  const currentProfile = useMemo(() => 
    profiles.find(p => p.id === currentProfileId) || profiles[0],
    [profiles, currentProfileId]
  )
  
  const settings = useMemo(() => 
    currentProfile?.settings || defaultSettings,
    [currentProfile]
  )

  const switchProfile = useCallback((id: string) => {
    setCurrentProfileId(id)
  }, [])

  const updateSettings = useCallback((updates: Partial<ProfileSettings>) => {
    setProfiles(prev => prev.map(p => 
      p.id === currentProfileId 
        ? { ...p, settings: { ...p.settings, ...updates }, updatedAt: new Date().toISOString() }
        : p
    ))
  }, [currentProfileId])

  const createProfile = useCallback((name: string, type: 'school' | 'society'): string => {
    const id = Date.now().toString()
    const now = new Date().toISOString()
    const newProfile: Profile = {
      id,
      name,
      type,
      createdAt: now,
      updatedAt: now,
      settings: {
        ...defaultSettings,
        schoolName: type === 'school' ? '' : settings.schoolName,
        schoolCode: type === 'school' ? '' : settings.schoolCode,
        schoolAddress: type === 'school' ? '' : settings.schoolAddress,
        members: type === 'society' ? [...settings.members] : [],
        frequentContent: [...settings.frequentContent]
      }
    }
    setProfiles(prev => [...prev, newProfile])
    setCurrentProfileId(id)
    return id
  }, [settings])

  const updateProfile = useCallback((id: string, updates: Partial<Pick<Profile, 'name' | 'type'>>) => {
    setProfiles(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    ))
  }, [])

  const deleteProfile = useCallback((id: string) => {
    if (profiles.length <= 1) return
    setProfiles(prev => {
      const newProfiles = prev.filter(p => p.id !== id)
      if (currentProfileId === id) {
        setCurrentProfileId(newProfiles[0]?.id || null)
      }
      return newProfiles
    })
  }, [profiles.length, currentProfileId])

  const duplicateProfile = useCallback((id: string, newName: string): string => {
    const profile = profiles.find(p => p.id === id)
    if (!profile) return ''
    
    const newId = Date.now().toString()
    const now = new Date().toISOString()
    const newProfile: Profile = {
      ...profile,
      id: newId,
      name: newName,
      createdAt: now,
      updatedAt: now,
      settings: { ...profile.settings }
    }
    
    setProfiles(prev => [...prev, newProfile])
    return newId
  }, [profiles])

  const addMember = useCallback((member: Omit<Member, 'id'>) => {
    const id = Date.now().toString()
    updateSettings({ members: [...settings.members, { ...member, id }] })
  }, [settings.members, updateSettings])

  const updateMember = useCallback((id: string, updates: Partial<Member>) => {
    updateSettings({ members: settings.members.map(m => m.id === id ? { ...m, ...updates } : m) })
  }, [settings.members, updateSettings])

  const removeMember = useCallback((id: string) => {
    updateSettings({ members: settings.members.filter(m => m.id !== id) })
  }, [settings.members, updateSettings])

  const addFrequentContent = useCallback((content: Omit<FrequentContent, 'id'>) => {
    const id = Date.now().toString()
    updateSettings({ frequentContent: [...settings.frequentContent, { ...content, id }] })
  }, [settings.frequentContent, updateSettings])

  const updateFrequentContent = useCallback((id: string, updates: Partial<FrequentContent>) => {
    updateSettings({ frequentContent: settings.frequentContent.map(c => c.id === id ? { ...c, ...updates } : c) })
  }, [settings.frequentContent, updateSettings])

  const removeFrequentContent = useCallback((id: string) => {
    updateSettings({ frequentContent: settings.frequentContent.filter(c => c.id !== id) })
  }, [settings.frequentContent, updateSettings])

  const resetCurrentProfile = useCallback(() => {
    updateSettings(defaultSettings)
  }, [updateSettings])

  const value = useMemo(() => ({
    profiles,
    currentProfileId,
    currentProfile,
    settings,
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
  }), [
    profiles,
    currentProfileId,
    currentProfile,
    settings,
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
  ])

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
