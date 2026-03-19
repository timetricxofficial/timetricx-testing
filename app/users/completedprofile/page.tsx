'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../../../contexts/ToastContext'
import { useTheme } from '../../../contexts/ThemeContext'
import Loading from '../../../components/ui/Loading'
import GitHubRepos from '../dashboard/components/GitHubRepos'

export default function CompleteProfilePage() {
  const router = useRouter()
  const { success, error } = useToast()
  const { theme } = useTheme()

  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState<any>(null)
  const [showRepos, setShowRepos] = useState(false)

  /* AUTH */
  useEffect(() => {
    const token = Cookies.get('token')
    if (!token) window.location.href = '/landing/auth/login'
  }, [])

  /* FETCH PROFILE */
  useEffect(() => {
    const fetchProfile = async () => {
      const userCookie = Cookies.get('user')
      if (!userCookie) {
        router.replace('/landing/auth/login')
        return
      }

      const { email } = JSON.parse(userCookie)
      const res = await fetch(
        `/api/completedprofile?email=${encodeURIComponent(email)}`
      )

      if (!res.ok) {
        router.replace('/landing/auth/login')
        return
      }

      const data = await res.json()
      setForm(data.data)
      setLoading(false)
    }

    fetchProfile()
  }, [router])

  /* UPDATE FIELD */
  const updateField = (path: string, value: any) => {
    setForm((prev: any) => {
      const copy = { ...prev }
      const keys = path.split('.')
      let obj = copy
      keys.slice(0, -1).forEach(k => {
        obj[k] = { ...obj[k] }
        obj = obj[k]
      })
      obj[keys[keys.length - 1]] =
        value === '' || value == null ? undefined : value
      return copy
    })
  }

  /* VALIDATE FORM */
  const validateForm = () => {
    if (!form.name || form.name.trim() === '') {
      error('Full name is required and cannot be empty')
      return false
    }
    return true
  }

  const handleGitHubConnect = () => {
    if (!form?.email) return
    const state = JSON.stringify({
      mode: 'connect',
      email: form.email,
      redirect: '/users/completedprofile'
    })
    window.location.href = `/api/auth/github?state=${encodeURIComponent(state)}`
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setIsSaving(true)
    try {
      const res = await fetch('/api/update-full-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (!res.ok) throw new Error('Save failed')

      success('Profile updated successfully!')
      router.push('/users/dashboard')
    } catch (e) {
      console.error(e)
      error('Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) return <Loading fullPage />
  if (!form) return null

  return (
    <div
      className={`min-h-screen py-10 transition-colors
      ${theme === 'dark'
          ? 'bg-[#000000]'
          : 'bg-[#FFFFFF]'
        }`}
    >
      <div className="max-w-4xl mx-auto px-4 space-y-6">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative rounded-2xl p-6 shadow-xl overflow-hidden
          ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}
        >
          <div className="absolute -inset-6 bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-2xl" />
          <div className="relative">
            <h1
              className={`text-2xl font-bold
              ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
            >
              Complete Your Profile
            </h1>
            <p
              className={
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }
            >
              Make your profile stand out with complete information
            </p>
          </div>
        </motion.div>

        {/* BASIC INFO */}
        <Section title="Basic Information" theme={theme}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="flex justify-center items-center">
              <div className="relative w-32 h-32 rounded-full border-4 border-blue-500/30 p-1 bg-black/5 overflow-hidden shadow-inner">
                <img
                  src={form.profilePicture || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + form.email}
                  className="w-full h-full rounded-full object-cover shadow-2xl"
                  alt="Profile"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/initials/svg?seed=' + form.name;
                  }}
                />
              </div>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                theme={theme}
                label="Full Name"
                value={form.name}
                onChange={v => updateField('name', v)}
                required
                error={!form.name || form.name.trim() === '' ? 'Full name is required' : ''}
              />
              <Input theme={theme} label="Email" value={form.email} disabled />

              {form.authProviders?.google?.email && (
                <Input
                  theme={theme}
                  label="Connected Google Account"
                  value={form.authProviders.google.email}
                  disabled
                  helper="This account is linked via Google Login"
                />
              )}

              {form.authProviders?.github?.username ? (
                <div className="md:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <div className="md:col-span-2">
                      <Input
                        theme={theme}
                        label="Connected GitHub Account"
                        value={form.authProviders.github.username}
                        disabled
                        helper={`Connected as ${form.authProviders.github.email || 'GitHub User'}`}
                      />
                    </div>
                    <div className="pb-1">
                      <button
                        onClick={() => setShowRepos(true)}
                        className={`w-full py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm
                        ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700' : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200'}`}
                      >
                        <img src="https://github.com/favicon.ico" className={`w-3.5 h-3.5 ${theme === 'dark' ? 'invert' : ''}`} alt="GitHub" />
                        View Repos
                      </button>
                    </div>
                    <div className="pb-1">
                      <button
                        onClick={handleGitHubConnect}
                        className={`w-full py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm
                        ${theme === 'dark' ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                        Switch
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <Input
                    theme={theme}
                    label="GitHub Username"
                    value={form.authProviders?.github?.id}
                    onChange={(v: string) => updateField('authProviders.github.id', v)}
                    helper="Enter username for tracking"
                  />
                  <div className="flex flex-col gap-1">
                    <label className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}> GitHub Auth </label>
                    <button
                      onClick={handleGitHubConnect}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors w-full justify-center text-sm font-bold"
                    >
                      <img src="https://github.com/favicon.ico" className="w-4 h-4 invert" alt="Github" />
                      Connect GitHub
                    </button>
                  </div>
                </>
              )}

              <Input theme={theme} label="Mobile Number" value={form.mobileNumber} onChange={v => updateField('mobileNumber', v)} />
              <Input theme={theme} label="Working Role" value={form.workingRole} onChange={v => updateField('workingRole', v)} />
            </div>
          </div>
        </Section>

        {/* PROFESSIONAL */}
        <Section title="Professional Details" theme={theme}>
          <Input
            theme={theme}
            label="Skills"
            value={form.skills?.join(', ') || ''}
            helper="Separate skills with commas"
            onChange={v =>
              updateField('skills', v.split(',').map((s: string) => s.trim()))
            }
          />
          <Textarea
            theme={theme}
            label="Bio"
            value={form.profile?.bio}
            onChange={v => updateField('profile.bio', v)}
          />
        </Section>

        {/* ADDITIONAL */}
        <Section title="Additional Information" theme={theme}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input theme={theme} label="Portfolio" value={form.profile?.website} onChange={v => updateField('profile.website', v)} />
            <Input theme={theme} label="Location" value={form.profile?.location} onChange={v => updateField('profile.location', v)} />
            <Select
              theme={theme}
              label="Gender"
              value={form.profile?.gender}
              onChange={v => updateField('profile.gender', v)}
              options={[
                ['', 'Select Gender'],
                ['male', 'Male'],
                ['female', 'Female'],
                ['other', 'Other'],
              ]}
            />
          </div>
        </Section>

        {/* SOCIAL */}
        <Section title="Social Links" theme={theme}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input theme={theme} label="LinkedIn" value={form.socialLinks?.linkedin} onChange={v => updateField('socialLinks.linkedin', v)} />
            <Input theme={theme} label="Twitter" value={form.socialLinks?.twitter} onChange={v => updateField('socialLinks.twitter', v)} />
            <Input theme={theme} label="Instagram" value={form.socialLinks?.instagram} onChange={v => updateField('socialLinks.instagram', v)} />
            <Input theme={theme} label="Facebook" value={form.socialLinks?.facebook} onChange={v => updateField('socialLinks.facebook', v)} />
          </div>
        </Section>

        {/* ACTIONS */}
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.03 }}
            disabled={isSaving}
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600
            text-white font-semibold shadow-lg disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loading size="small" />
                Saving...
              </>
            ) : (
              'Save Profile'
            )}
          </motion.button>

          <button
            onClick={() => router.replace('/users/dashboard')}
            className="px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 font-medium cursor-pointer"
          >
            Skip
          </button>
        </div>
      </div>
      <AnimatePresence>
        {showRepos && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowRepos(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-black/60"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-2xl max-h-[85vh] rounded-[40px] shadow-2xl relative flex flex-col
              ${theme === 'dark' ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-gray-200'}`}
            >
              <button
                onClick={() => setShowRepos(false)}
                className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full flex items-center justify-center bg-gray-500/10 hover:bg-gray-500/20 transition-colors"
              >
                <span className="text-2xl text-gray-500">×</span>
              </button>

              <div className="p-4 overflow-y-auto rounded-[40px]">
                <GitHubRepos />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ================= COMPONENTS ================= */

function Section({ title, children, theme }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`rounded-2xl p-6 shadow-xl
      ${theme === 'dark' ? 'bg-slate-900/80 border border-slate-700' : 'bg-white'}`}
    >
      <h2
        className={`text-lg font-semibold mb-4
        ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
      >
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </motion.div>
  )
}

function Input({ label, value, onChange, disabled, helper, theme, error, required }: any) {
  return (
    <div>
      <label
        className={`text-sm font-medium
        ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        value={value || ''}
        disabled={disabled}
        onChange={e => onChange?.(e.target.value)}
        className={`w-full mt-1 px-3 py-2 rounded-lg border text-sm
        ${disabled
            ? theme === 'dark'
              ? 'bg-slate-800 border-slate-700 text-gray-500'
              : 'bg-gray-100 border-gray-200 text-gray-500'
            : error
              ? 'border-red-500 focus:ring-2 focus:ring-red-500'
              : theme === 'dark'
                ? 'bg-slate-900 border-slate-700 text-white focus:ring-2 focus:ring-blue-500'
                : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500'
          }
        `}
      />
      {error && (
        <p className="text-xs mt-1 text-red-500">
          {error}
        </p>
      )}
      {helper && !error && (
        <p
          className={`text-xs mt-1
          ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}
        >
          {helper}
        </p>
      )}
    </div>
  )
}

function Textarea({ label, value, onChange, theme }: any) {
  return (
    <div>
      <label
        className={`text-sm font-medium
        ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}
      >
        {label}
      </label>
      <textarea
        rows={4}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className={`w-full mt-1 px-3 py-2 rounded-lg border text-sm resize-none
        ${theme === 'dark'
            ? 'bg-slate-900 border-slate-700 text-white focus:ring-2 focus:ring-blue-500'
            : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500'
          }`}
      />
    </div>
  )
}

function Select({ label, value, onChange, options, theme }: any) {
  return (
    <div>
      <label
        className={`text-sm font-medium
        ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}
      >
        {label}
      </label>
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className={`w-full mt-1 px-3 py-2 rounded-lg border text-sm
        ${theme === 'dark'
            ? 'bg-slate-900 border-slate-700 text-white focus:ring-2 focus:ring-blue-500'
            : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500'
          }`}
      >
        {options.map((o: any) => (
          <option key={o[0]} value={o[0]}>{o[1]}</option>
        ))}
      </select>
    </div>
  )
}
