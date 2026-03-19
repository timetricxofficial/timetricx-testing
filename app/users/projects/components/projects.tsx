'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '../../../../contexts/ThemeContext'
import { useToast } from '../../../../contexts/ToastContext'
import Cookies from 'js-cookie'
import { motion } from 'framer-motion'
import {
  Search,
  Calendar,
  CheckCircle,
  Users,
  ListChecks
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string
  status: 'active' | 'completed' | 'pending'
  priority: 'low' | 'medium' | 'high'
  progress: number
  deadline: string
  descriptionDriveLink?: string
  liveLink?: string
  tasks: {
    completed: number
    total: number
  }
  teamEmails: string[]
}

interface UsersMap {
  [email: string]: {
    name: string
    profilePicture: string | null
  }
}

export default function ProjectsComponent() {
  const { theme } = useTheme()
  const { success } = useToast()

  const [search, setSearch] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [usersMap, setUsersMap] = useState<UsersMap>({})
  const [loading, setLoading] = useState(true)

  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [completed, setCompleted] = useState(0)
  const [total, setTotal] = useState(0)

  // 🔥 Live Link State
  const [openLinkModal, setOpenLinkModal] = useState(false)
  const [linkProject, setLinkProject] = useState<Project | null>(null)
  const [liveLink, setLiveLink] = useState('')
  const [originalLink, setOriginalLink] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasExistingLink, setHasExistingLink] = useState(false)

  const fetchData = async () => {
    const userCookie = Cookies.get('user')
    if (!userCookie) return

    const user = JSON.parse(userCookie)
    const res = await fetch(`/api/users/projects/list?email=${user.email}`)
    const data = await res.json()

    if (data.success) {
      setProjects(data.projects)
      setUsersMap(data.usersMap)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className={`mt-10 text-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Loading...</div>

  return (
    <>
      {/* SEARCH */}
      <div className="flex justify-between mb-6">
        <div className="relative w-64">
          <Search className={`absolute left-3 top-2.5 w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search project..."
            className={`w-full pl-9 py-2 rounded-lg border outline-none
              ${theme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300'
              }`}
          />
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map(p => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="relative group hover:-translate-y-2 hover:scale-[1.02] transition-transform duration-300"
          >
            {/* SCATTER GLOW */}
            <div className="absolute -inset-6 rounded-3xl opacity-0 group-hover:opacity-100 transition duration-500
              bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.45),transparent_60%)] blur-2xl" />

            {/* BLUE BACKGROUND - hover with parent */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 
              group-hover:shadow-xl group-hover:shadow-blue-500/30 transition-all duration-300">

              {/* + BUTTON (TASK MODAL) */}
              <button
                onClick={() => {
                  setActiveProject(p)
                  setCompleted(p.tasks.completed)
                  setTotal(p.tasks.total)
                }}
                className="absolute top-2 right-2 w-10 h-10 text-white
                flex items-center justify-center
                transition-all duration-300
                hover:scale-110 hover:rotate-90 cursor-pointer"
              >
                <svg width="26" height="26" viewBox="0 0 24 24">
                  <path fill="currentColor"
                    d="M11 13H6q-.425 0-.712-.288T5 12t.288-.712T6 11h5V6q0-.425.288-.712T12 5t.713.288T13 6v5h5q.425 0 .713.288T19 12t-.288.713T18 13h-5v5q0 .425-.288.713T12 19t-.712-.288T11 18z"/>
                </svg>
              </button>
            </div>

            {/* CLIP PATH */}
            <svg width="0" height="0">
              <defs>
                <clipPath id={`cut-${p.id}`} clipPathUnits="objectBoundingBox">
                  <path d="M0,0 H0.82 Q0.86,0 0.86,0.04 V0.12 Q0.86,0.16 0.90,0.16 H0.96 Q1,0.16 1,0.20 V1 H0 Z" />
                </clipPath>
              </defs>
            </svg>

            {/* CARD - hover with parent */}
            <motion.div
              style={{ clipPath: `url(#cut-${p.id})` }}
              className={`relative z-10 p-6 h-80 rounded-2xl
              ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
            >
              {/* HEADER */}
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">{p.name}</h3>
                <span className="text-xs px-3 py-1 mr-10 rounded-full bg-blue-100 text-blue-700">
                  {p.status}
                </span>
              </div>

              {/* DESC */}
              <div className="flex justify-between items-center mt-2">
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{p.description}</p>
                <button
                  disabled={!p.descriptionDriveLink}
                  onClick={() =>
                    p.descriptionDriveLink &&
                    window.open(p.descriptionDriveLink, '_blank')
                  }
                  className="text-blue-600 disabled:opacity-40 cursor-pointer"
                >
                  <ListChecks size={22} />
                </button>
              </div>

              {/* PROGRESS */}
              <div className="mt-4">
                <div className="flex justify-between text-sm">
                  <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Progress</span>
                  <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{p.progress}%</span>
                </div>
                <div className={`h-2 rounded mt-1 overflow-hidden ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${p.progress}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-2 bg-blue-600 rounded"
                  />
                </div>
              </div>

              {/* TASK COUNT */}
              <div className="flex gap-2 mt-4 text-sm">
                <CheckCircle size={16} className="text-green-600" />
                {p.tasks.completed}/{p.tasks.total} tasks
              </div>

              {/* TEAM */}
              <div className="flex mt-4">
                {p.teamEmails.map((email, i) => {
                  const user = usersMap[email]
                  return (
                    <div
                      key={i}
                      className={`w-9 h-9 -ml-2 first:ml-0 rounded-full overflow-hidden flex items-center justify-center ${
                        theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-200 border-white'
                      } border-2`}
                    >
                      {user?.profilePicture ? (
                        <img src={user.profilePicture} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-semibold">
                          {(user?.name || email)[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* DEADLINE */}
              <div className="flex gap-2 mt-4 text-sm">
                <Calendar size={16} />
                {new Date(p.deadline).toDateString()}
              </div>

              {/* LIVE LINK BUTTON */}
              <div className="absolute bottom-4 right-4">
                <button
                  onClick={async () => {
                    setLinkProject(p)
                    setOpenLinkModal(true)
                    setLinkLoading(true)

                    const userCookie = Cookies.get('user')
                    if (!userCookie) return
                    const user = JSON.parse(userCookie)

                    const res = await fetch(
                      `/api/users/projects/live-link/get?email=${user.email}&projectName=${p.name}`
                    )
                    const data = await res.json()

                    if (data.success) {
                      const existingUrl = data.data?.liveUrl || ''
                      setLiveLink(existingUrl)
                      setOriginalLink(existingUrl)
                      setHasExistingLink(existingUrl !== '')
                    }

                    setLinkLoading(false)
                  }}
                  className={`px-3 py-1 text-xs rounded-lg text-white transition-all duration-200 ${
                    p.liveLink 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {p.liveLink ? 'View Link' : 'Add Link'}
                </button>
              </div>

            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* TASK MODAL */}
      {activeProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`w-[420px] p-8 rounded-2xl shadow-2xl transform transition-all duration-300 ${
            theme === 'dark' 
              ? 'bg-gray-900/90 text-white border border-gray-700' 
              : 'bg-white/90 text-gray-900 border border-gray-200'
          } backdrop-blur-xl`}>
            
            {/* HEADER */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Manage Tasks
              </h3>
              <button
                onClick={() => setActiveProject(null)}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
              {activeProject.name}
            </p>

            {/* COMPLETED INPUT */}
            <div className="mb-5">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Completed Tasks
              </label>
              <input
                type="number"
                value={completed}
                min={0}
                onChange={e => setCompleted(Math.max(0, +e.target.value))}
                className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                  theme === 'dark'
                    ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'
                } backdrop-blur-sm`}
              />
            </div>

            {/* TOTAL INPUT */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Total Tasks
              </label>
              <input
                type="number"
                value={total}
                min={0}
                onChange={e => setTotal(Math.max(0, +e.target.value))}
                className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                  theme === 'dark'
                    ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'
                } backdrop-blur-sm`}
              />
            </div>

            {/* PROGRESS BAR PREVIEW */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Progress Preview</span>
                <span className="font-semibold">{total > 0 ? Math.round((completed / total) * 100) : 0}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${total > 0 ? Math.min((completed / total) * 100, 100) : 0}%` }}
                />
              </div>
            </div>

            {/* BUTTONS */}
            <div className="flex gap-3">
              <button
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 
                hover:from-green-600 hover:to-green-700 text-white rounded-xl 
                cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg font-medium"
                onClick={async () => {
                  const userCookie = Cookies.get('user')
                  if (!userCookie) return
                  const user = JSON.parse(userCookie)

                  const res = await fetch('/api/users/projects/tasks-completed', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      email: user.email,
                      projectName: activeProject.name,
                      completedTasks: completed
                    })
                  })

                  const result = await res.json()

                  if (result.success) {
                    await fetchData()
                    setActiveProject(null)
                  }
                }}
              >
                Save Changes
              </button>
              
              <button
                onClick={() => setActiveProject(null)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 Live Link Modal remains same (no change) */}
{/* 🔥 LIVE LINK MODAL */}
{openLinkModal && linkProject && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
    <div className={`w-[420px] p-8 rounded-2xl shadow-2xl transform transition-all duration-300 ${
      theme === 'dark' 
        ? 'bg-gray-900/90 text-white border border-gray-700' 
        : 'bg-white/90 text-gray-900 border border-gray-200'
    } backdrop-blur-xl`}>

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
          Live Link – {linkProject.name}
        </h3>

        {/* ❌ CLOSE ICON */}
        <button
          onClick={() => setOpenLinkModal(false)}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {linkLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* INPUT */}
          <div className="space-y-4">
            {/* PREVIOUS LINK DISPLAY */}
            {hasExistingLink && originalLink && (
              <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <label className="block text-xs font-medium mb-1 text-gray-500 dark:text-gray-400">
                  Previous Link
                </label>
                <p className="text-sm text-gray-700 dark:text-gray-300 truncate" title={originalLink}>
                  {originalLink}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                {hasExistingLink ? 'New Live URL' : 'Live Project URL'}
              </label>

              <input
                type="text"
                value={liveLink}
                onChange={(e) => setLiveLink(e.target.value)}
                placeholder="https://your-project-link.com"
                className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                  theme === 'dark'
                    ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'
                } backdrop-blur-sm`}
              />
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex gap-3 mt-6">

            {/* 🔵 OPEN LINK BUTTON */}
            {liveLink && (
              <button
                onClick={() => {
                  const url = liveLink.startsWith('http') ? liveLink : `https://${liveLink}`
                  window.open(url, '_blank')
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 
                hover:from-blue-600 hover:to-blue-700 text-white rounded-xl 
                cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                Open Link
              </button>
            )}

            {/* 🟢 SAVE/UPDATE BUTTON */}
            <button
              disabled={isSaving || (hasExistingLink && liveLink === originalLink)}
              className={`flex-1 px-4 py-3 rounded-xl text-white font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                isSaving || (hasExistingLink && liveLink === originalLink)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 cursor-pointer'
              }`}
              onClick={async () => {
                setIsSaving(true)
                const userCookie = Cookies.get('user')
                if (!userCookie) return
                const user = JSON.parse(userCookie)

                const res = await fetch('/api/users/projects/live-link/save', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email: user.email,
                    projectName: linkProject.name,
                    liveUrl: liveLink
                  })
                })

                const result = await res.json()
                setIsSaving(false)

                if (result.success) {
                  success(hasExistingLink ? 'Link updated successfully!' : 'Link saved successfully!')
                  await fetchData()
                  setOpenLinkModal(false)
                }
              }}
            >
              {isSaving 
                ? (hasExistingLink ? 'Updating...' : 'Saving...') 
                : (hasExistingLink ? 'Update' : 'Save')
              }
            </button>

          </div>
        </>
      )}

      {/* ⚪ CANCEL BUTTON */}
      <button
        className={`mt-6 w-full py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
          theme === 'dark'
            ? 'bg-gray-700 hover:bg-gray-600 text-white'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        }`}
        onClick={() => setOpenLinkModal(false)}
      >
        Cancel
      </button>

    </div>
  </div>
)}

    </>
  )
}
