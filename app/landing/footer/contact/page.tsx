"use client"

import { useState } from "react"
import Link from "next/link"
import { useTheme } from "../../../../contexts/ThemeContext"

export default function ContactPage() {
  const { theme } = useTheme()

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    subject: "",
    category: "support",
    message: "",
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: any) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (data.success) {
        setSuccess(true)
        setForm({
          fullName: "",
          email: "",
          phone: "",
          subject: "",
          category: "support",
          message: "",
        })
      }
    } catch (err) {
      console.error("Contact submit error", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className={`relative min-h-screen overflow-hidden transition-colors duration-500 ${
        theme === "dark"
          ? "bg-black text-white"
          : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[140px] rounded-full" />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

        {/* HEADER */}
        <header className="mb-14">
          <Link
            href="/"
            className="inline-flex items-center rounded-full border bg-blue-500/40 text-white px-4 py-2 text-xs font-semibold hover:bg-blue-500 hover:border-blue-500 hover:translate-x-0.5 transition-all duration-300"
          >
            ← Back
          </Link>

          <p className="text-xs uppercase tracking-[0.25em] text-blue-500 mt-8 mb-4">
            Contact Us
          </p>

          <h1 className="text-3xl sm:text-5xl font-bold mb-6">
            Let’s talk{" "}
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
              👋
            </span>
          </h1>

          <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            Have questions, feedback, or partnership ideas?
            Fill the form and our team will get back to you.
          </p>
        </header>

        {/* FORM CARD */}
        <form
          onSubmit={handleSubmit}
          className={`group relative rounded-2xl p-10 space-y-7 border backdrop-blur-lg transition-all duration-500
          ${
            theme === "dark"
              ? "bg-white/5 border-white/10 hover:border-blue-500/40"
              : "bg-white border-gray-200 hover:border-blue-300"
          }
          hover:shadow-2xl
        `}
        >
          {/* Accent Top Line */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-2xl" />

          {/* INPUT FIELD STYLES */}
          {[
            { label: "Full Name *", name: "fullName", type: "text", required: true },
            { label: "Email *", name: "email", type: "email", required: true },
            { label: "Phone (optional)", name: "phone", type: "text", required: false },
            { label: "Subject *", name: "subject", type: "text", required: true },
          ].map((field, i) => (
            <div key={i}>
              <label className="block text-sm mb-2 font-medium">
                {field.label}
              </label>
              <input
                name={field.name}
                type={field.type}
                value={(form as any)[field.name]}
                onChange={handleChange}
                required={field.required}
                className={`w-full rounded-xl px-4 py-3 text-sm border transition-all duration-300
                ${
                  theme === "dark"
                    ? "bg-black/60 border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    : "bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                }
                focus:outline-none`}
                placeholder={field.label}
              />
            </div>
          ))}

          {/* CATEGORY */}
          <div>
            <label className="block text-sm mb-2 font-medium">
              Category
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className={`w-full rounded-xl px-4 py-3 text-sm border transition-all duration-300
              ${
                theme === "dark"
                  ? "bg-black/60 border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  : "bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              }
              focus:outline-none`}
            >
              <option value="support">Support</option>
              <option value="sales">Sales</option>
              <option value="feedback">Feedback</option>
              <option value="bug">Bug Report</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* MESSAGE */}
          <div>
            <label className="block text-sm mb-2 font-medium">
              Message *
            </label>
            <textarea
              name="message"
              rows={5}
              value={form.message}
              onChange={handleChange}
              required
              className={`w-full rounded-xl px-4 py-3 text-sm resize-none border transition-all duration-300
              ${
                theme === "dark"
                  ? "bg-black/60 border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  : "bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              }
              focus:outline-none`}
              placeholder="Tell us more about your query..."
            />
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="relative w-full py-3 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300
              bg-gradient-to-r from-blue-600 to-indigo-600
              hover:scale-[1.02] hover:shadow-xl
              disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Message"}
          </button>

          {/* SUCCESS */}
          {success && (
            <div className="text-center text-sm text-green-500 animate-pulse">
              ✅ Your message has been sent successfully.
            </div>
          )}
        </form>
      </div>
    </main>
  )
}
