'use client'
import { useEffect, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import Cookies from "js-cookie"
import { useTheme } from "../../../../contexts/ThemeContext"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { WorkingTimeSkeleton } from "./SkeletonLoader"

export default function WorkingTimeCircle() {
  const { theme } = useTheme()
  const [avgTime, setAvgTime] = useState(0)
  const [chart, setChart] = useState<any[]>([])
  const [totalExpected, setTotalExpected] = useState(0)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [currentDate])

  const loadData = async () => {
    setLoading(true)
    try {
      const userCookie = Cookies.get("user")
      if (!userCookie) {
        setLoading(false)
        return
      }

      let user;
      try {
        user = JSON.parse(userCookie)
      } catch (e) {
        console.error("Error parsing user cookie", e)
        setLoading(false)
        return
      }

      if (!user || !user.email) {
        setLoading(false)
        return
      }

      // Fetch all required data in parallel
      const [attRes, wRes, lRes, cRes, hReqRes] = await Promise.all([
        fetch(`/api/attendance/get-calendar-attendance?email=${user.email}`, { cache: 'no-store' }),
        fetch(`/api/attendance/weekend-requests?email=${user.email}`, { cache: 'no-store' }),
        fetch(`/api/users/dashboard/leaves/getleaves?email=${user.email}`, { cache: 'no-store' }),
        fetch('/api/users/dashboard/company-holidays', { cache: 'no-store' }),
        fetch(`/api/attendance/holiday-requests?email=${user.email}`, { cache: 'no-store' })
      ])

      const attData = await attRes.json()
      const wData = await wRes.json()
      const lData = await lRes.json()
      const cData = await cRes.json()
      const hReqData = await hReqRes.json()

      const records = attData.data?.records || []
      const weekendRequests = wData.data || []
      const leaves = lData.data || []
      const companyHolidays = cData.data || []
      const holidayRequests = hReqData.data || []

      const realNow = new Date()
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const daysInMonth = new Date(year, month + 1, 0).getDate()

      let worked = 0
      let absent = 0
      let leaveDays = 0
      let weekends = 0
      let compHolidays = 0

      let totalWorkingDays = 0
      let totalHours = 0
      let countHours = 0

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day)
        const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`

        const record = records.find((r: any) => r.date === dateStr)
        const isWeekend = date.getDay() === 0 || date.getDay() === 6

        const weekendReq = weekendRequests.find((w: any) => w.date === dateStr)
        const isWeekendApproved = weekendReq?.status === 'approved'

        // A working day is any weekday, or an approved weekend.
        if (!isWeekend || isWeekendApproved) {
          totalWorkingDays++
        }

        // Strip time from 'realNow' for accurate today/past/future comparison
        const todayAtMidnight = new Date(realNow.getFullYear(), realNow.getMonth(), realNow.getDate())
        const isFuture = date > todayAtMidnight

        const companyHoliday = companyHolidays.find((h: any) => {
          const hDate = new Date(h.date);
          const hDateStr = `${hDate.getFullYear()}-${(hDate.getMonth() + 1).toString().padStart(2, '0')}-${hDate.getDate().toString().padStart(2, '0')}`;
          return hDateStr === dateStr;
        })

        let isLeave = false
        leaves.forEach((l: any) => {
          if (l.status !== 'approved') return
          const lStart = new Date(l.fromDate)
          const lEnd = new Date(l.toDate)
          lStart.setHours(0, 0, 0, 0)
          lEnd.setHours(0, 0, 0, 0)
          if (date.getTime() >= lStart.getTime() && date.getTime() <= lEnd.getTime()) {
            isLeave = true
          }
        })

        // Accumulate hours if present
        if (record?.entryTime && record?.exitTime) {
          const start = new Date(`${dateStr} ${record.entryTime}`)
          const end = new Date(`${dateStr} ${record.exitTime}`)
          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
          if (hours > 0) {
            totalHours += hours
            countHours++
          }
        }

        const holidayReq = holidayRequests.find((h: any) => h.holidayDate === dateStr)
        const isHolidayWorkApproved = holidayReq?.status === 'approved'

        // Logic for Pie Chart Slices
        if (isWeekend && !isWeekendApproved) {
          weekends++ // Display ALL weekends for the entire month
        } else if (companyHoliday && (!record?.entryTime || (!record?.completed && !isHolidayWorkApproved))) {
          compHolidays++ // Display ALL company holidays for the entire month
        } else if (isLeave) {
          if (!isFuture) leaveDays++
        } else if (record?.entryTime) {
          if (!isFuture) worked++
        } else if (!isFuture) {
          absent++
        }
      }

      setAvgTime(countHours > 0 ? totalHours / countHours : 0)
      setTotalExpected(totalWorkingDays)

      const newChart = []
      if (worked > 0) newChart.push({ name: "Worked", value: worked, color: "#22c55e" }) // Green
      if (compHolidays > 0) newChart.push({ name: "Company Holiday", value: compHolidays, color: "#ec4899" }) // distinct pink
      if (absent > 0) newChart.push({ name: "Absent", value: absent, color: "#ef4444" }) // Red
      if (leaveDays > 0) newChart.push({ name: "Leave", value: leaveDays, color: "#f97316" }) // Orange
      if (weekends > 0) newChart.push({ name: "Weekend", value: weekends, color: "#6b7280" }) // Gray

      if (newChart.length === 0) {
        setChart([{ name: "No Data", value: 1, color: "#e5e7eb" }])
      } else {
        setChart(newChart)
      }

    } catch (error) {
      console.error('Error loading working time data:', error);
    } finally {
      setLoading(false);
    }
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  // Find worked days count for center text
  const workedObj = chart.find(c => c.name === "Worked")
  const workedDays = workedObj ? workedObj.value : 0

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const showSkeleton = loading && chart.length === 0

  if (showSkeleton) {
    return <WorkingTimeSkeleton />
  }

  return (
    <div className={`rounded-4xl p-6 shadow h-90 flex flex-col items-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} relative`}>

      <div className="w-full flex items-center justify-between mb-1">
        <button onClick={handlePrevMonth} className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          <ChevronLeft size={20} />
        </button>
        <div className="flex flex-col items-center">
          <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Work Progress
          </h2>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
        </div>
        <button onClick={handleNextMonth} className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* GAUGE CHART CONTAINER */}
      <div className="w-56 h-36 relative flex-shrink-0 mt-4">

        {loading && !showSkeleton && (
          <div className={`absolute inset-0 z-10 flex items-center justify-center rounded-full ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-[1px]`}>
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* CENTER TEXT FOR GAUGE (Moved behind chart) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-8 pointer-events-none z-0">
          <h1 className={`text-5xl font-extrabold tracking-tight mb-0.5 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {workedDays}
          </h1>
          <p className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Worked Days
          </p>
        </div>

        <ResponsiveContainer width="100%" height="100%" className="relative z-20">
          <PieChart>
            <Pie
              data={chart}
              cx="50%"
              cy="80%"
              innerRadius={70}
              outerRadius={88}
              startAngle={180}
              endAngle={0}
              paddingAngle={4}
              cornerRadius={10}
              dataKey="value"
              stroke="none"
            >
              {chart.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              wrapperStyle={{ outline: 'none', zIndex: 1000 }}
              contentStyle={{
                backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                borderRadius: '8px',
                color: theme === 'dark' ? '#ffffff' : '#000000',
                padding: '4px 8px',
                fontSize: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              itemStyle={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col items-center mt-2">
        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          out of <span className="font-bold">{totalExpected}</span> working days
        </p>

        <p className={`text-xs mt-1 px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
          {avgTime.toFixed(1)} hrs average
        </p>
      </div>
    </div>
  )
}

