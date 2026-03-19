'use client'
import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { useTheme } from '../../../contexts/ThemeContext'
import Loading from '../../../components/ui/Loading'
import { motion } from 'framer-motion'
import { getAllFestivals, Festival } from '../../../utils/indianHolidays'
import { Star } from 'lucide-react'

interface AttendanceRecord {
  date: string
  entryTime: string
  exitTime?: string
  workedHours?: number
  completed?: boolean
}

interface WeekendReq {
  _id: string
  userEmail: string
  date: string
  dayName: string
  status: 'pending' | 'approved' | 'rejected'
}

export default function CalendarPage() {
  const { theme } = useTheme()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [weekendRequests, setWeekendRequests] = useState<WeekendReq[]>([])
  const [holidayRequests, setHolidayRequests] = useState<any[]>([])
  const [leaves, setLeaves] = useState<any[]>([])
  const [companyHolidays, setCompanyHolidays] = useState<any[]>([])
  const [festivals] = useState<Festival[]>(getAllFestivals())
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get('token')
    if (!token) window.location.href = '/landing/auth/login'
  }, [])

  useEffect(() => {
    fetchAttendance()
  }, [currentDate])

  const fetchAttendance = async () => {
    try {
      const user = JSON.parse(Cookies.get('user') || '{}')

      // Fetch attendance records
      const res = await fetch(
        `/api/attendance/get-calendar-attendance?email=${user.email}`, { cache: 'no-store' }
      )
      const data = await res.json()
      if (data.success) setRecords(data.data.records || [])

      // Fetch weekend requests for this user
      const wRes = await fetch(
        `/api/attendance/weekend-requests?email=${user.email}`, { cache: 'no-store' }
      )
      const wData = await wRes.json()
      if (wData.success) setWeekendRequests(wData.data || [])

      // Fetch holiday work requests for this user
      const hReqRes = await fetch(
        `/api/attendance/holiday-requests?email=${user.email}`, { cache: 'no-store' }
      )
      const hReqData = await hReqRes.json()
      if (hReqData.success) setHolidayRequests(hReqData.data || [])

      // Fetch leaves for this user
      const lRes = await fetch(
        `/api/users/dashboard/leaves/getleaves?email=${user.email}`
      )
      const lData = await lRes.json()
      if (lData.success) setLeaves(lData.data || [])

      // Fetch company holidays
      const cRes = await fetch('/api/users/dashboard/company-holidays')
      const cData = await cRes.json()
      if (cData.success) setCompanyHolidays(cData.data || [])
    } finally {
      setLoading(false)
    }
  }

  /* ---------------- TIME HELPERS ---------------- */

  const parseTime = (time: string) => {
    if (!time) return 0

    const [timePart, meridianRaw] = time.trim().split(' ')
    const meridian = meridianRaw?.toUpperCase()

    const parts = timePart.split(':').map(Number)
    let h = parts[0]
    const m = parts[1]
    const s = parts[2] || 0

    if (meridian === 'PM' && h !== 12) h += 12
    if (meridian === 'AM' && h === 12) h = 0

    return h * 60 + m + s / 60
  }

  const getWorkedHours = (entry: string, exit?: string) => {
    const start = parseTime(entry)
    const end = exit
      ? parseTime(exit)
      : new Date().getHours() * 60 + new Date().getMinutes()

    const diff = (end - start) / 60
    return Math.max(0, diff)
  }

  /* ---------------- CALENDAR HELPERS ---------------- */

  const getDaysInMonth = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()

  const getFirstDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), 1).getDay()

  const renderCalendar = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDay(currentDate)

    const cells: any[] = []

    for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} />)

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateStr = `${year}-${(month + 1)
        .toString()
        .padStart(2, '0')}-${day.toString().padStart(2, '0')}`

      const record = records.find(r => r.date === dateStr)
      const isWeekend = date.getDay() === 0 || date.getDay() === 6
      const isFuture = date > new Date()

      // Check if this is today
      const today = new Date()
      const isToday = date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()

      // 🔥 Check weekend request status for this date
      const weekendReq = weekendRequests.find(w => w.date === dateStr)
      const isWeekendApproved = weekendReq?.status === 'approved'
      const isWeekendPending = weekendReq?.status === 'pending'

      // 🔥 Check holiday work request status for this date
      const holidayReq = holidayRequests.find(h => h.holidayDate === dateStr)
      const isHolidayWorkApproved = holidayReq?.status === 'approved'

      // Check Company Holiday
      // ensure we compare exactly 'YYYY-MM-DD' since dateStr is in that format
      const companyHoliday = companyHolidays.find(h => {
        const hDate = new Date(h.date);
        const hDateStr = `${hDate.getFullYear()}-${(hDate.getMonth() + 1).toString().padStart(2, '0')}-${hDate.getDate().toString().padStart(2, '0')}`;
        return hDateStr === dateStr;
      })

      // Check Festive (Panchang)
      const fest = festivals.find(f => f.date === dateStr)

      const qDate = new Date(year, month, day)
      const qTime = qDate.getTime()

      let isLeaveStart = false
      let isLeaveMiddle = false
      let isLeaveEnd = false

      // Check if this date falls within an approved leave
      const leaveForDate = leaves.find((l: any) => {
        if (l.status !== 'approved') return false
        const lStart = new Date(l.fromDate)
        const lEnd = new Date(l.toDate)
        lStart.setHours(0, 0, 0, 0)
        lEnd.setHours(0, 0, 0, 0)

        if (qTime >= lStart.getTime() && qTime <= lEnd.getTime()) {
          if (lStart.getTime() !== lEnd.getTime()) {
            if (qTime === lStart.getTime()) isLeaveStart = true
            else if (qTime === lEnd.getTime()) isLeaveEnd = true
            else isLeaveMiddle = true
          }
          return true
        }
        return false
      })

      // Build the cell
      let label = ''
      let className = ''
      let fillColor = ''
      let fillPct = 0
      let textColor = 'white'
      let tooltip = ''

      let baseBg = theme === 'dark' ? '#1f2937' : '#e5e7eb'

      let roundingClass = 'rounded-xl'
      let showRightConnector = false

      // Check for approved holiday work first, so if they checked in, it shows as working.
      if (companyHoliday && (!record?.entryTime || (!record?.completed && !isHolidayWorkApproved))) {
        // 🏨 Official Company Holiday
        baseBg = '#ec4899' // distinct bright pink 🎀
        textColor = 'white'
        label = companyHoliday.title
        if (companyHoliday.animationUrl) {
          tooltip = `✨ ${companyHoliday.title}`
        }
      } else if (leaveForDate) {
        // 🗓️ Approved Leave (Personal)
        baseBg = '#f97316' // orange
        label = 'Leave'
        tooltip = `Reason: ${leaveForDate.reason}`

        const isLeftRounded = (!isLeaveMiddle && !isLeaveEnd) || date.getDay() === 0
        const isRightRounded = (!isLeaveMiddle && !isLeaveStart) || date.getDay() === 6

        if (leaveForDate && (isLeaveStart || isLeaveMiddle || isLeaveEnd)) {
          if (isLeftRounded && isRightRounded) roundingClass = 'rounded-xl'
          else if (isLeftRounded && !isRightRounded) roundingClass = 'rounded-l-xl rounded-r-none'
          else if (!isLeftRounded && isRightRounded) roundingClass = 'rounded-r-xl rounded-l-none'
          else roundingClass = 'rounded-none'

          showRightConnector = (!isLeaveEnd) && (date.getDay() !== 6)
        }
      } else if (isWeekend && record?.entryTime && isWeekendApproved) {
        // ✅ Weekend + Has attendance + Admin APPROVED → show as Working (green)
        if (record?.exitTime) {
          const hours = record.workedHours || getWorkedHours(record.entryTime, record.exitTime)
          fillPct = Math.max(2, Math.min((hours / 6) * 100, 100))
          fillColor = '#22c55e' // green
          label = hours >= 6 ? '6h ✓' : `${hours.toFixed(1)}h`
        } else if (isToday) {
          baseBg = '#3b82f6' // blue
          className = 'animate-pulse'
          label = 'Active'
        } else {
          fillColor = '#22c55e'
          fillPct = 100
        }

      } else if (isWeekend) {
        // 📅 Weekend (no attendance OR rejected) → Holiday
        baseBg = '#6b7280' // grey
        textColor = '#111'
        label = 'Holiday'
      } else if (record?.entryTime && record?.exitTime) {
        // ✅ Normal weekday with complete attendance
        const hours = record.workedHours || getWorkedHours(record.entryTime, record.exitTime)
        fillPct = Math.max(2, Math.min((hours / 6) * 100, 100))
        fillColor = '#22c55e' // green
        label = hours >= 6 ? '6h ✓' : `${hours.toFixed(1)}h`
      } else if (record?.entryTime && !record?.exitTime) {
        // 🔵 Checked in but not out
        if (isToday) {
          baseBg = '#3b82f6' // blue
          className = 'animate-pulse'
          label = 'Active'
        } else {
          fillColor = '#22c55e'
          fillPct = 100
        }
      } else if (isFuture) {
        textColor = theme === 'dark' ? '#9ca3af' : '#6b7280'
      } else {
        // Absent
        fillColor = '#ef4444' // red
        fillPct = 100
      }

      cells.push(
        <motion.div
          key={day}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.3, delay: day * 0.02 }}
          className={`h-14 ${roundingClass} flex flex-col items-center justify-center
          text-sm font-semibold shadow-lg cursor-pointer relative overflow-hidden group ${className}`}
          style={{ background: baseBg, color: textColor }}
        >
          {/* 🎬 Holiday Animation Background */}
          {companyHoliday?.animationUrl && (!record?.entryTime || !record?.completed) && (
            (() => {
              const isVid = companyHoliday.animationResourceType === 'video' ||
                companyHoliday.animationUrl.match(/\.(mp4|webm|ogg|mov)$|^.*\/video\/upload\/.*$/i);

              if (isVid) {
                return (
                  <video
                    src={companyHoliday.animationUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none"
                  />
                )
              }
              return (
                <img
                  src={companyHoliday.animationUrl}
                  alt=""
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                  className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none"
                />
              )
            })()
          )}

          {/* Fill gap connector for multi-day leaves */}
          {showRightConnector && (
            <div className="absolute top-0 right-[-0.5rem] w-2 h-full bg-[#f97316] z-0" />
          )}

          {/* Animated color fill bar (left → right) */}
          {fillPct > 0 && fillColor && (
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${fillPct}%` }}
              transition={{ duration: 0.8, delay: day * 0.03 + 0.2, ease: 'easeOut' }}
              className="absolute left-0 top-0 bottom-0 rounded-xl"
              style={{ background: fillColor, zIndex: 0 }}
            />
          )}
          <span className="relative z-10">{day}</span>
          {label && <span className="relative z-10 text-[10px] opacity-90">{label}</span>}

          {/* ✨ Animated Festive Bubble Tooltip */}
          {tooltip && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              whileHover={{ opacity: 1, y: -5, scale: 1 }}
              className="absolute bottom-[110%] left-1/2 -translate-x-1/2 px-3 py-2 rounded-2xl 
                         bg-white/10 backdrop-blur-xl border border-white/20 text-white text-[11px] 
                         font-bold shadow-2xl pointer-events-none z-[100] whitespace-nowrap
                         hidden group-hover:flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              {tooltip}
              {/* Tooltip Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white/10" />
            </motion.div>
          )}
        </motion.div>
      )
    }

    return cells
  }

  if (loading) return <Loading fullPage />

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div
      className={`min-h-screen p-6 ${theme === 'dark'
        ? 'bg-black'
        : 'bg-white'
        }`}
    >
      <div className="max-w-4xl mx-auto">
        <h1
          className={`text-3xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
        >
          📅 Attendance Calendar
        </h1>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className={`p-6 rounded-2xl shadow-2xl ${theme === 'dark'
            ? 'bg-white/10 backdrop-blur-xl'
            : 'bg-white'
            }`}
        >
          <div className="flex justify-between items-center mb-5 text-lg font-semibold">
            <button
              className="px-3 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-white/20 cursor-pointer"
              onClick={() =>
                setCurrentDate(
                  new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() - 1,
                    1
                  )
                )
              }
            >
              ⬅
            </button>

            <b>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </b>

            <button
              className="px-3 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-white/20 cursor-pointer"
              onClick={() =>
                setCurrentDate(
                  new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() + 1,
                    1
                  )
                )
              }
            >
              ➡
            </button>
          </div>

          <div className="grid grid-cols-7 text-center font-semibold mb-3 opacity-80">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-3">
            {renderCalendar()}
          </div>

          {/* 🔥 LEGEND */}
          <div className={`mt-6 flex flex-wrap gap-4 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#22c55e]" />
              <span>Working</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#3b82f6]" />
              <span>Active (Today)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#ef4444]" />
              <span>Absent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#6b7280]" />
              <span>Holiday</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#ec4899]" />
              <span>Company Holiday</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm border border-rose-500 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
              </div>
              <span>Festival Animation</span>
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  )
}

