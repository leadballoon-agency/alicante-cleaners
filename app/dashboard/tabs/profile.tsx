'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { signOut } from 'next-auth/react'
import { Cleaner } from '../page'
import LanguageSelector from '@/components/language-selector'
import { useToast } from '@/components/ui/toast'

type TeamService = {
  id: string
  name: string
  description: string | null
  type: 'CUSTOM' | 'ADDON'
  priceType: 'HOURLY' | 'FIXED'
  price: number | null
  hours: number | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  sortOrder: number
}

const SERVICE_AREAS = [
  'Alicante City',
  'San Juan',
  'Playa de San Juan',
  'El Campello',
  'Mutxamel',
  'San Vicente',
  'Jijona',
]

type Props = {
  cleaner: Cleaner
  onUpdate?: (cleaner: Cleaner) => void
}

type EditMode = 'profile' | 'pricing' | 'areas' | 'phone' | null
type PhoneStep = 'initial' | 'verify'

export default function ProfileTab({ cleaner, onUpdate }: Props) {
  const { showToast } = useToast()
  const bookingUrl = `alicantecleaners.com/${cleaner.slug}`

  const [editMode, setEditMode] = useState<EditMode>(null)
  const [saving, setSaving] = useState(false)

  // Edit form state
  const [name, setName] = useState(cleaner.name)
  const [bio, setBio] = useState(cleaner.bio || '')
  const [hourlyRate, setHourlyRate] = useState(cleaner.hourlyRate.toString())
  const [selectedAreas, setSelectedAreas] = useState<string[]>(cleaner.serviceAreas)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // Phone change state
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('initial')
  const [maskedPhone, setMaskedPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [phoneLoading, setPhoneLoading] = useState(false)
  const [phoneError, setPhoneError] = useState('')

  // Services state (team leaders only)
  const [services, setServices] = useState<TeamService[]>([])
  const [isTeamLeader, setIsTeamLeader] = useState(false)
  const [teamName, setTeamName] = useState<string | null>(null)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [editingService, setEditingService] = useState<TeamService | null>(null)
  const [serviceSaving, setServiceSaving] = useState(false)
  // Service form
  const [serviceName, setServiceName] = useState('')
  const [serviceDescription, setServiceDescription] = useState('')
  const [serviceType, setServiceType] = useState<'CUSTOM' | 'ADDON'>('CUSTOM')
  const [servicePriceType, setServicePriceType] = useState<'HOURLY' | 'FIXED'>('HOURLY')
  const [servicePrice, setServicePrice] = useState('')
  const [serviceHours, setServiceHours] = useState('')

  // Fetch services on mount
  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/cleaner/services')
      if (res.ok) {
        const data = await res.json()
        setServices(data.services || [])
        setIsTeamLeader(data.isTeamLeader || false)
        setTeamName(data.teamName || null)
      }
    } catch (err) {
      console.error('Failed to fetch services:', err)
    }
  }, [])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Book ${cleaner.name} for villa cleaning`,
          text: 'Trusted villa cleaning in Alicante',
          url: `https://${bookingUrl}`,
        })
      } catch {
        // User cancelled or share failed
      }
    } else {
      navigator.clipboard.writeText(`https://${bookingUrl}`)
      showToast('Link copied to clipboard!', 'success')
    }
  }

  const openServiceModal = (service?: TeamService) => {
    if (service) {
      setEditingService(service)
      setServiceName(service.name)
      setServiceDescription(service.description || '')
      setServiceType(service.type)
      setServicePriceType(service.priceType)
      setServicePrice(service.price?.toString() || '')
      setServiceHours(service.hours?.toString() || '')
    } else {
      setEditingService(null)
      setServiceName('')
      setServiceDescription('')
      setServiceType('CUSTOM')
      setServicePriceType('HOURLY')
      setServicePrice('')
      setServiceHours('')
    }
    setShowServiceModal(true)
  }

  const handleSaveService = async () => {
    if (!serviceName.trim()) {
      showToast('Service name is required', 'error')
      return
    }

    if (servicePriceType === 'FIXED' && !servicePrice) {
      showToast('Price is required for fixed price services', 'error')
      return
    }

    if (servicePriceType === 'HOURLY' && !serviceHours) {
      showToast('Hours are required for hourly services', 'error')
      return
    }

    setServiceSaving(true)
    try {
      const payload = {
        name: serviceName.trim(),
        description: serviceDescription.trim() || undefined,
        type: serviceType,
        priceType: servicePriceType,
        price: servicePriceType === 'FIXED' ? parseFloat(servicePrice) : undefined,
        hours: servicePriceType === 'HOURLY' ? parseInt(serviceHours) : undefined,
      }

      const url = editingService
        ? `/api/dashboard/cleaner/services/${editingService.id}`
        : '/api/dashboard/cleaner/services'
      const method = editingService ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save service')
      }

      showToast(
        editingService ? 'Service updated!' : 'Service submitted for approval!',
        'success'
      )
      setShowServiceModal(false)
      fetchServices()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save service', 'error')
    } finally {
      setServiceSaving(false)
    }
  }

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return

    try {
      const res = await fetch(`/api/dashboard/cleaner/services/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete service')
      }

      showToast('Service deleted', 'success')
      fetchServices()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete', 'error')
    }
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      showToast('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.', 'error')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      showToast('File too large. Maximum size is 5MB.', 'error')
      return
    }

    setPhotoFile(file)
    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    setPhotoPreview(previewUrl)
  }

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile) return null

    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('file', photoFile)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to upload photo')
      }

      const data = await response.json()
      return data.url
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to upload photo', 'error')
      return null
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updates: Record<string, unknown> = {}

      if (editMode === 'profile') {
        // Upload photo first if one was selected
        if (photoFile) {
          const photoUrl = await uploadPhoto()
          if (photoUrl) {
            updates.photo = photoUrl
          }
        }
        updates.name = name.trim()
        updates.bio = bio.trim()
      } else if (editMode === 'pricing') {
        const rate = parseFloat(hourlyRate)
        if (isNaN(rate) || rate < 10 || rate > 100) {
          showToast('Hourly rate must be between €10 and €100', 'error')
          setSaving(false)
          return
        }
        updates.hourlyRate = rate
      } else if (editMode === 'areas') {
        if (selectedAreas.length === 0) {
          showToast('Please select at least one service area', 'error')
          setSaving(false)
          return
        }
        updates.serviceAreas = selectedAreas
      }

      const response = await fetch('/api/dashboard/cleaner/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update profile')
      }

      const data = await response.json()

      // Update parent state if callback provided
      if (onUpdate && data.cleaner) {
        onUpdate({
          ...cleaner,
          name: data.cleaner.name || cleaner.name,
          bio: data.cleaner.bio,
          hourlyRate: data.cleaner.hourlyRate || cleaner.hourlyRate,
          serviceAreas: data.cleaner.serviceAreas || cleaner.serviceAreas,
          photo: data.cleaner.photo || cleaner.photo,
        })
      }

      showToast('Profile updated successfully!', 'success')
      // Reset photo state
      setPhotoPreview(null)
      setPhotoFile(null)
      setEditMode(null)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleArea = (area: string) => {
    setSelectedAreas(prev =>
      prev.includes(area)
        ? prev.filter(a => a !== area)
        : [...prev, area]
    )
  }

  const menuItems = [
    { icon: '👤', label: 'Edit profile', action: () => setEditMode('profile') },
    { icon: '📱', label: 'Update phone', action: () => {
      setPhoneStep('initial')
      setOtpCode('')
      setNewPhone('')
      setPhoneError('')
      setEditMode('phone')
    }},
    { icon: '💰', label: 'Update pricing', action: () => setEditMode('pricing') },
    { icon: '📍', label: 'Service areas', action: () => setEditMode('areas') },
    { icon: '📅', label: 'Calendar sync', href: '/dashboard/availability' },
    { icon: '💳', label: 'Payment settings', href: '#', disabled: true },
    { icon: '🔔', label: 'Notifications', href: '#', disabled: true },
    { icon: '⚙️', label: 'Account settings', href: '/dashboard/account' },
  ]

  const handleSendPhoneCode = async () => {
    setPhoneLoading(true)
    setPhoneError('')
    try {
      const response = await fetch('/api/dashboard/cleaner/phone', {
        method: 'POST',
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send code')
      }
      setMaskedPhone(data.maskedPhone)
      setPhoneStep('verify')
      showToast('Verification code sent!', 'success')
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : 'Failed to send code')
    } finally {
      setPhoneLoading(false)
    }
  }

  const handleVerifyAndUpdatePhone = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setPhoneError('Please enter the 6-digit code')
      return
    }
    if (!newPhone) {
      setPhoneError('Please enter your new phone number')
      return
    }

    setPhoneLoading(true)
    setPhoneError('')
    try {
      const response = await fetch('/api/dashboard/cleaner/phone', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: otpCode, newPhone }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update phone')
      }
      showToast('Phone number updated!', 'success')
      setEditMode(null)
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : 'Failed to update phone')
    } finally {
      setPhoneLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <div className="bg-white rounded-2xl p-5 border border-[#EBEBEB]">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-[#F5F5F3] flex items-center justify-center overflow-hidden relative">
            {cleaner.photo ? (
              <Image src={cleaner.photo} alt={cleaner.name} fill className="object-cover" unoptimized />
            ) : (
              <span className="text-2xl">👤</span>
            )}
          </div>
          <div>
            <h2 className="font-semibold text-[#1A1A1A]">{cleaner.name}</h2>
            <p className="text-sm text-[#6B6B6B]">
              {cleaner.serviceAreas.length} service area{cleaner.serviceAreas.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="bg-[#F5F5F3] rounded-xl p-4">
          <p className="text-xs text-[#6B6B6B] mb-1">Your booking page</p>
          <p className="font-medium text-[#1A1A1A] text-sm break-all">{bookingUrl}</p>
        </div>

        <div className="flex gap-2 mt-4">
          <Link
            href={`/${cleaner.slug}`}
            className="flex-1 bg-white border border-[#DEDEDE] text-[#1A1A1A] py-2.5 rounded-xl text-sm font-medium text-center active:scale-[0.98] transition-all"
          >
            View page
          </Link>
          <button
            onClick={handleShare}
            className="flex-1 bg-[#1A1A1A] text-white py-2.5 rounded-xl text-sm font-medium active:scale-[0.98] transition-all"
          >
            Share link
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 border border-[#EBEBEB] text-center">
          <p className="text-xl font-semibold text-[#1A1A1A]">€{cleaner.hourlyRate}</p>
          <p className="text-xs text-[#6B6B6B]">/hour</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-[#EBEBEB] text-center">
          <p className="text-xl font-semibold text-[#1A1A1A]">{cleaner.rating?.toFixed(1) || '–'}</p>
          <p className="text-xs text-[#6B6B6B]">rating</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-[#EBEBEB] text-center">
          <p className="text-xl font-semibold text-[#1A1A1A]">{cleaner.reviewCount || 0}</p>
          <p className="text-xs text-[#6B6B6B]">reviews</p>
        </div>
      </div>

      {/* Team Services Section (Team Leaders can add, all team members can view) */}
      {(isTeamLeader || services.length > 0) && (
        <div className="bg-white rounded-2xl p-5 border border-[#EBEBEB]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-[#1A1A1A]">
                {teamName ? `${teamName} Services` : 'Team Services'}
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                {isTeamLeader ? 'Custom services for your team' : 'Available to your team'}
              </p>
            </div>
            {isTeamLeader && (
              <button
                onClick={() => openServiceModal()}
                className="w-10 h-10 bg-[#C4785A] text-white rounded-xl text-xl font-medium active:scale-95 transition-transform flex items-center justify-center"
              >
                +
              </button>
            )}
          </div>

          {services.length === 0 ? (
            <div className="text-center py-6 text-[#6B6B6B]">
              <p className="text-3xl mb-2">🛠️</p>
              <p className="text-sm">No custom services yet</p>
              {isTeamLeader && (
                <p className="text-xs mt-1">Add pool cleaning, laundry, or other services</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#F5F5F3]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#1A1A1A] text-sm truncate">
                        {service.name}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        service.status === 'APPROVED'
                          ? 'bg-[#E8F5E9] text-[#2E7D32]'
                          : service.status === 'PENDING'
                          ? 'bg-[#FFF3E0] text-[#E65100]'
                          : 'bg-[#FFEBEE] text-[#C75050]'
                      }`}>
                        {service.status === 'APPROVED' ? 'Live' : service.status === 'PENDING' ? 'Pending' : 'Rejected'}
                      </span>
                      {service.type === 'ADDON' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#E3F2FD] text-[#1565C0] font-medium">
                          Add-on
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6B6B6B]">
                      {service.priceType === 'FIXED'
                        ? `€${service.price}`
                        : `${service.hours}h × hourly rate`}
                    </p>
                  </div>
                  {isTeamLeader && (
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => openServiceModal(service)}
                        className="p-1.5 text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        className="p-1.5 text-[#6B6B6B] hover:text-[#C75050] transition-colors"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Language preference */}
      <LanguageSelector
        label="Preferred Language"
        description="Messages from owners will be translated to this language"
      />

      {/* Menu items */}
      <div className="bg-white rounded-2xl border border-[#EBEBEB] divide-y divide-[#EBEBEB]">
        {menuItems.map((item) =>
          item.action ? (
            <button
              key={item.label}
              onClick={item.action}
              className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-[#F5F5F3] transition-colors text-left"
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium text-[#1A1A1A]">{item.label}</span>
              <span className="ml-auto text-[#9B9B9B]">→</span>
            </button>
          ) : (
            <Link
              key={item.label}
              href={item.href || '#'}
              className={`flex items-center gap-3 px-4 py-3.5 active:bg-[#F5F5F3] transition-colors ${
                item.disabled ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium text-[#1A1A1A]">{item.label}</span>
              {item.disabled && (
                <span className="ml-auto text-xs text-[#9B9B9B] bg-[#F5F5F3] px-2 py-0.5 rounded">Soon</span>
              )}
              {!item.disabled && <span className="ml-auto text-[#9B9B9B]">→</span>}
            </Link>
          )
        )}
      </div>

      {/* Support & logout */}
      <div className="space-y-3">
        <Link
          href="#"
          className="block w-full bg-white border border-[#EBEBEB] text-[#1A1A1A] py-3.5 rounded-xl font-medium text-center active:scale-[0.98] transition-all"
        >
          Help & Support
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full text-[#C75050] py-3 font-medium text-sm active:opacity-70"
        >
          Log out
        </button>
      </div>

      <p className="text-center text-xs text-[#9B9B9B]">
        VillaCare v1.0 · Made in Alicante
      </p>

      {/* Edit Profile Modal */}
      {editMode === 'profile' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">Edit Profile</h2>
              <button
                onClick={() => {
                  setPhotoPreview(null)
                  setPhotoFile(null)
                  setEditMode(null)
                }}
                className="text-[#9B9B9B] hover:text-[#1A1A1A]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Photo upload */}
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Profile Photo
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-[#F5F5F3] flex items-center justify-center overflow-hidden relative flex-shrink-0">
                    {photoPreview ? (
                      <Image src={photoPreview} alt="Preview" fill className="object-cover" unoptimized />
                    ) : cleaner.photo ? (
                      <Image src={cleaner.photo} alt={cleaner.name} fill className="object-cover" unoptimized />
                    ) : (
                      <span className="text-3xl">👤</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F5F5F3] rounded-xl text-sm font-medium text-[#1A1A1A] cursor-pointer hover:bg-[#EBEBEB] transition-colors">
                      <span>📷</span>
                      <span>{photoFile ? 'Change Photo' : 'Upload Photo'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        capture="user"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-[#9B9B9B] mt-2">
                      JPEG, PNG, WebP or GIF. Max 5MB.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] focus:border-[#1A1A1A] focus:outline-none text-base"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] focus:border-[#1A1A1A] focus:outline-none text-base resize-none"
                  placeholder="Tell owners about yourself and your experience..."
                />
                <p className="text-xs text-[#9B9B9B] mt-1">{bio.length}/500 characters</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setPhotoPreview(null)
                  setPhotoFile(null)
                  setEditMode(null)
                }}
                className="flex-1 py-3 rounded-xl border border-[#DEDEDE] text-[#6B6B6B] font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploadingPhoto || !name.trim()}
                className="flex-1 py-3 rounded-xl bg-[#1A1A1A] text-white font-medium disabled:opacity-50"
              >
                {uploadingPhoto ? 'Uploading...' : saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Pricing Modal */}
      {editMode === 'pricing' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">Update Pricing</h2>
              <button
                onClick={() => setEditMode(null)}
                className="text-[#9B9B9B] hover:text-[#1A1A1A]"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                Hourly Rate (€)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6B6B]">€</span>
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  min="10"
                  max="100"
                  step="0.5"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#DEDEDE] focus:border-[#1A1A1A] focus:outline-none text-base"
                  placeholder="18"
                />
              </div>
              <p className="text-xs text-[#9B9B9B] mt-2">
                Services will be calculated based on this rate:
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between text-[#6B6B6B]">
                  <span>Regular Clean (3 hrs)</span>
                  <span>€{(parseFloat(hourlyRate) * 3 || 0).toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-[#6B6B6B]">
                  <span>Deep Clean (5 hrs)</span>
                  <span>€{(parseFloat(hourlyRate) * 5 || 0).toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-[#6B6B6B]">
                  <span>Arrival Prep (4 hrs)</span>
                  <span>€{(parseFloat(hourlyRate) * 4 || 0).toFixed(0)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditMode(null)}
                className="flex-1 py-3 rounded-xl border border-[#DEDEDE] text-[#6B6B6B] font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-[#1A1A1A] text-white font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Areas Modal */}
      {editMode === 'areas' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">Service Areas</h2>
              <button
                onClick={() => setEditMode(null)}
                className="text-[#9B9B9B] hover:text-[#1A1A1A]"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-[#6B6B6B] mb-4">
              Select the areas where you provide cleaning services.
            </p>

            <div className="space-y-2">
              {SERVICE_AREAS.map((area) => (
                <button
                  key={area}
                  onClick={() => toggleArea(area)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                    selectedAreas.includes(area)
                      ? 'border-[#1A1A1A] bg-[#F5F5F3]'
                      : 'border-[#EBEBEB]'
                  }`}
                >
                  <span className="font-medium text-[#1A1A1A]">{area}</span>
                  {selectedAreas.includes(area) && (
                    <span className="text-[#1A1A1A]">✓</span>
                  )}
                </button>
              ))}
            </div>

            <p className="text-xs text-[#9B9B9B] mt-4">
              {selectedAreas.length} area{selectedAreas.length !== 1 ? 's' : ''} selected
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setSelectedAreas(cleaner.serviceAreas)
                  setEditMode(null)
                }}
                className="flex-1 py-3 rounded-xl border border-[#DEDEDE] text-[#6B6B6B] font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || selectedAreas.length === 0}
                className="flex-1 py-3 rounded-xl bg-[#1A1A1A] text-white font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Phone Modal */}
      {editMode === 'phone' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">Update Phone Number</h2>
              <button
                onClick={() => setEditMode(null)}
                className="text-[#9B9B9B] hover:text-[#1A1A1A]"
              >
                ✕
              </button>
            </div>

            {phoneStep === 'initial' && (
              <div className="space-y-4">
                <p className="text-sm text-[#6B6B6B]">
                  To change your phone number, we need to verify your identity.
                  We&apos;ll send a verification code to your current phone.
                </p>

                {phoneError && (
                  <div className="p-3 bg-[#FFEBEE] text-[#C75050] rounded-xl text-sm">
                    {phoneError}
                  </div>
                )}

                <button
                  onClick={handleSendPhoneCode}
                  disabled={phoneLoading}
                  className="w-full py-3 rounded-xl bg-[#1A1A1A] text-white font-medium disabled:opacity-50"
                >
                  {phoneLoading ? 'Sending...' : 'Send Verification Code'}
                </button>

                <div className="pt-4 border-t border-[#EBEBEB]">
                  <p className="text-xs text-[#9B9B9B] text-center">
                    Lost your phone?{' '}
                    <a
                      href="mailto:support@alicantecleaners.com?subject=Phone%20Change%20Request"
                      className="text-[#C4785A] font-medium"
                    >
                      Contact support
                    </a>
                  </p>
                </div>
              </div>
            )}

            {phoneStep === 'verify' && (
              <div className="space-y-4">
                <p className="text-sm text-[#6B6B6B]">
                  Enter the 6-digit code sent to {maskedPhone}
                </p>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] focus:border-[#1A1A1A] focus:outline-none text-center text-2xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                    New Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] focus:border-[#1A1A1A] focus:outline-none"
                    placeholder="+34 612 345 678"
                  />
                  <p className="text-xs text-[#9B9B9B] mt-1">
                    Include country code (e.g., +34 for Spain)
                  </p>
                </div>

                {phoneError && (
                  <div className="p-3 bg-[#FFEBEE] text-[#C75050] rounded-xl text-sm">
                    {phoneError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setPhoneStep('initial')}
                    className="flex-1 py-3 rounded-xl border border-[#DEDEDE] text-[#6B6B6B] font-medium"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleVerifyAndUpdatePhone}
                    disabled={phoneLoading || otpCode.length !== 6 || !newPhone}
                    className="flex-1 py-3 rounded-xl bg-[#1A1A1A] text-white font-medium disabled:opacity-50"
                  >
                    {phoneLoading ? 'Updating...' : 'Update Phone'}
                  </button>
                </div>

                <button
                  onClick={handleSendPhoneCode}
                  disabled={phoneLoading}
                  className="w-full text-sm text-[#C4785A] font-medium"
                >
                  Resend code
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">
                {editingService ? 'Edit Service' : 'Add Service'}
              </h2>
              <button
                onClick={() => setShowServiceModal(false)}
                className="text-[#9B9B9B] hover:text-[#1A1A1A]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Service Name */}
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] focus:border-[#1A1A1A] focus:outline-none text-base"
                  placeholder="e.g., Pool Cleaning, Ironing"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Description
                </label>
                <textarea
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] focus:border-[#1A1A1A] focus:outline-none text-base resize-none"
                  placeholder="Brief description of the service..."
                />
              </div>

              {/* Service Type */}
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Service Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setServiceType('CUSTOM')}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                      serviceType === 'CUSTOM'
                        ? 'border-[#1A1A1A] bg-[#F5F5F3]'
                        : 'border-[#EBEBEB]'
                    }`}
                  >
                    🛠️ Custom Service
                    <p className="text-xs text-[#6B6B6B] font-normal mt-0.5">Standalone service</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceType('ADDON')}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                      serviceType === 'ADDON'
                        ? 'border-[#1A1A1A] bg-[#F5F5F3]'
                        : 'border-[#EBEBEB]'
                    }`}
                  >
                    ➕ Add-on
                    <p className="text-xs text-[#6B6B6B] font-normal mt-0.5">Extra for bookings</p>
                  </button>
                </div>
              </div>

              {/* Pricing Type */}
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Pricing *
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setServicePriceType('HOURLY')}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                      servicePriceType === 'HOURLY'
                        ? 'border-[#1A1A1A] bg-[#F5F5F3]'
                        : 'border-[#EBEBEB]'
                    }`}
                  >
                    ⏱️ Hourly
                    <p className="text-xs text-[#6B6B6B] font-normal mt-0.5">Hours × your rate</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setServicePriceType('FIXED')}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                      servicePriceType === 'FIXED'
                        ? 'border-[#1A1A1A] bg-[#F5F5F3]'
                        : 'border-[#EBEBEB]'
                    }`}
                  >
                    💰 Fixed Price
                    <p className="text-xs text-[#6B6B6B] font-normal mt-0.5">Set amount</p>
                  </button>
                </div>

                {/* Hours or Price input */}
                {servicePriceType === 'HOURLY' ? (
                  <div>
                    <label className="block text-sm text-[#6B6B6B] mb-1.5">
                      Estimated Hours *
                    </label>
                    <input
                      type="number"
                      value={serviceHours}
                      onChange={(e) => setServiceHours(e.target.value)}
                      min="1"
                      max="24"
                      className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] focus:border-[#1A1A1A] focus:outline-none text-base"
                      placeholder="e.g., 2"
                    />
                    {serviceHours && (
                      <p className="text-xs text-[#6B6B6B] mt-1">
                        Price: {serviceHours}h × €{cleaner.hourlyRate} = €{parseInt(serviceHours) * cleaner.hourlyRate}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm text-[#6B6B6B] mb-1.5">
                      Fixed Price (€) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6B6B]">€</span>
                      <input
                        type="number"
                        value={servicePrice}
                        onChange={(e) => setServicePrice(e.target.value)}
                        min="1"
                        step="0.01"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#DEDEDE] focus:border-[#1A1A1A] focus:outline-none text-base"
                        placeholder="e.g., 50"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Note about approval */}
              <div className="bg-[#FFF3E0] rounded-xl p-3">
                <p className="text-xs text-[#E65100]">
                  ⚠️ New services require admin approval before appearing on your profile.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowServiceModal(false)}
                className="flex-1 py-3 rounded-xl border border-[#DEDEDE] text-[#6B6B6B] font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveService}
                disabled={serviceSaving || !serviceName.trim()}
                className="flex-1 py-3 rounded-xl bg-[#1A1A1A] text-white font-medium disabled:opacity-50"
              >
                {serviceSaving ? 'Saving...' : editingService ? 'Save Changes' : 'Submit for Approval'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
