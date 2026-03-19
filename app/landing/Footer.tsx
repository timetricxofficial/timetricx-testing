'use client'

import Link from 'next/link'
import { useTheme } from '../../contexts/ThemeContext'
import {
  Users,
  FileText,
  HelpCircle,
  Book,
  Github,
  Twitter,
  Linkedin,
  Mail,
  Phone,
} from 'lucide-react'

export default function Footer() {
  const { theme } = useTheme()

  const features = [
    'Smart Face Attendance',
    'Secure Access Control',
    'Team Chat',
    'Attendance Lock Engine',
    'Time Intelligence',
    'Attendance Reports',
  ]

  const resources = [
    { name: 'Documentation', icon: Book, href: '/landing/footer/docs' },
    { name: 'API Reference', icon: FileText, href: '/landing/footer/api' },
    { name: 'Blog', icon: Book, href: '/landing/footer/blog' },
    // { name: 'Support Center', icon: HelpCircle, href: '/landing/footer/support' },
  ]

  const company = [
    { name: 'About Timetricx', icon: Users, href: '/landing/footer/about' },
    { name: 'Contact Us', icon: Mail, href: '/landing/footer/contact' },
    // { name: 'Customer Support', icon: Phone, href: '/landing/footer/support' },
  ]

  const legal = [
    { name: 'Privacy Policy', href: '/landing/footer/privacy' },
    { name: 'Terms & Conditions', href: '/landing/footer/terms' },
    { name: 'Cookie Policy', href: '/landing/footer/cookies' },
  ]

  const socialLinks = [
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'LinkedIn', icon: Linkedin, href: '#' },
    { name: 'GitHub', icon: Github, href: '#' },
  ]

  return (
    <footer
      className={`relative transition-colors
        ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-gray-900'}
      `}
    >
      {/* Top Glow Line */}
      <div
        className="absolute top-0 left-0 w-full h-[2px]"
        style={{
          background:
            'linear-gradient(to right, transparent, rgba(37,99,235,0.7), transparent)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">

          {/* BRAND */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <img src="/Timetricx logo.svg" className="w-11 h-11" />
              <span className="text-2xl font-bold font-paralucent">
                TIMETRICX
              </span>
            </div>

            <p
              className={`text-lg max-w-md leading-relaxed
                ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}
              `}
            >
              A modern team management platform combining AI-powered attendance,
              secure authentication, project visibility, and real-time collaboration.
            </p>

            <div className="flex flex-wrap gap-4 mt-7">
              <Link
                href="/landing/auth/login"
                className="px-6 py-3 rounded-lg text-sm font-semibold text-white
                bg-gradient-to-r from-blue-600 to-indigo-600
                hover:from-blue-500 hover:to-indigo-500
                transition-all shadow-lg hover:scale-105"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* FEATURES */}
          <div>
            <h3 className="text-lg font-semibold mb-4 font-paralucent">
              Features
            </h3>
            <ul className="space-y-3">
              {features.map((feature, i) => (
                <li
                  key={i}
                  className={`flex items-center gap-2
                    ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}
                  `}
                >
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* RESOURCES */}
          <div>
            <h3 className="text-lg font-semibold mb-4 font-paralucent">
              Resources
            </h3>
            <ul className="space-y-3">
              {resources.map((item, i) => {
                const Icon = item.icon
                return (
                  <li key={i}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-2 hover:translate-x-1 transition-all
                        ${theme === 'dark'
                          ? 'text-gray-300 hover:text-white'
                          : 'text-gray-600 hover:text-gray-900'}
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* COMPANY & LEGAL */}
          <div>
            <h3 className="text-lg font-semibold mb-4 font-paralucent">
              Company
            </h3>
            <ul className="space-y-3 mb-6">
              {company.map((item, i) => {
                const Icon = item.icon
                return (
                  <li key={i}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-2 hover:translate-x-1 transition-all
                        ${theme === 'dark'
                          ? 'text-gray-300 hover:text-white'
                          : 'text-gray-600 hover:text-gray-900'}
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>

            <h3 className="text-lg font-semibold mb-4 font-paralucent">
              Legal
            </h3>
            <ul className="space-y-3">
              {legal.map((item, i) => (
                <li key={i}>
                  <Link
                    href={item.href}
                    className={`hover:translate-x-1 transition-all
                      ${theme === 'dark'
                        ? 'text-gray-300 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'}
                    `}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* BOTTOM */}
        <div
          className={`border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4
            ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}
          `}
        >
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            © 2024 TIMETRICX. All rights reserved.
          </p>

          <div className="flex gap-4">
            {socialLinks.map((social, i) => {
              const Icon = social.icon
              return (
                <a
                  key={i}
                  href={social.href}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center
                    transition-all hover:-translate-y-1 hover:shadow-lg
                    ${theme === 'dark'
                      ? 'bg-gray-900 text-gray-400 hover:text-white'
                      : 'bg-gray-100 text-gray-600 hover:text-gray-900'}
                  `}
                >
                  <Icon className="w-5 h-5" />
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </footer>
  )
}
