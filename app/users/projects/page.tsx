'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import OverallDetails from './components/overalldetails'
import ProjectsComponent from './components/projects'
import Loading from '../../../components/ui/Loading'

export default function ProjectsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      try {
        const userCookie = Cookies.get('user')
        const token = Cookies.get('token')

        if (!userCookie || !token) {
          router.replace('/landing/auth/login')
          return
        }

        setLoading(false)
      } catch (err) {
        console.error(err)
        router.replace('/landing/auth/login')
      }
    }

    checkAuth()
  }, [router])

  if (loading) return <Loading fullPage />

  return (
    <div className="p-6">
      <OverallDetails />
      <ProjectsComponent />
    </div>
  )
}
