"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import AdminDashboard from "@/components/AdminDashboard"

// Hardcoded admin credentials from environment variables
const ADMIN_CREDENTIALS = [
  {
    email: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@codestreak.com',
    password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'AdminPass123!'
  },
  {
    email: process.env.NEXT_PUBLIC_ADMIN_EMAIL_2 || 'mohit@codestreak.com',
    password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD_2 || 'MohitAdmin456!'
  }
]

export default function AdminPage() {
  const [currentView, setCurrentView] = useState<"login" | "dashboard">("login")
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [adminUser, setAdminUser] = useState<{email: string} | null>(null)

  // Check for existing admin session in localStorage
  useEffect(() => {
    const savedAdmin = localStorage.getItem('adminSession')
    if (savedAdmin) {
      const adminData = JSON.parse(savedAdmin)
      setAdminUser(adminData)
      setCurrentView("dashboard")
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: loginData.email,
          password: loginData.password
        })
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Login error response:', text);
        throw new Error('Login failed - server error');
      }

      const data = await response.json();

      if (response.ok && data.success) {
        const adminData = { email: data.admin.email }
        setAdminUser(adminData)
        setCurrentView("dashboard")
        
        // Save session to localStorage
        localStorage.setItem('adminSession', JSON.stringify(adminData))
      } else {
        throw new Error(data.error || 'Login failed')
      }
      
    } catch (err: any) {
      console.error('Admin login error:', err)
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      setAdminUser(null)
      setCurrentView("login")
      setLoginData({ email: '', password: '' })
      
      // Clear session from localStorage
      localStorage.removeItem('adminSession')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Color scheme matching Dashboard
  const baseBg = '#FED3A8' // page background
  const orange = '#FF7D21' // primary panel color
  const cream = '#FED3A8'

  if (currentView === "dashboard" && adminUser) {
    return <AdminDashboard user={adminUser} onLogout={handleLogout} />
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ backgroundColor: baseBg }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tight font-arbutus mb-2" style={{ color: '#000' }}>
            Admin Access
          </h1>
          <p className="text-sm" style={{ color: '#181818' }}>
            Administrative login required
          </p>
        </div>

        {/* Login Form */}
        <div
          className="rounded-md border-2 border-black p-8 shadow-lg"
          style={{ backgroundColor: orange }}
        >
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div 
                className="rounded-md border-2 border-red-500 p-4 text-center text-sm font-semibold"
                style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
              >
                {error}
              </div>
            )}

            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-semibold mb-2"
                style={{ color: '#1A1109' }}
              >
                Admin Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={loginData.email}
                onChange={handleInputChange}
                placeholder="admin@codestreak.com"
                required
                className="w-full border-2 border-black bg-white"
              />
            </div>

            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-semibold mb-2"
                style={{ color: '#1A1109' }}
              >
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                value={loginData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
                className="w-full border-2 border-black bg-white"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white border-2 border-black hover:opacity-80 font-semibold py-3"
            >
              {loading ? 'Signing in...' : 'Admin Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => window.location.href = '/'}
              className="text-sm underline hover:opacity-80"
              style={{ color: '#1A1109' }}
            >
              ← Back to main site
            </button>
          </div>
        </div>

        {/* Admin Info */}
        <div
          className="mt-6 rounded-md border-2 border-black p-4 text-center text-xs"
          style={{ backgroundColor: cream, color: '#27190D' }}
        >
          <div className="font-semibold mb-3">Admin Login Credentials:</div>
          <div className="space-y-2 text-left">
            <div className="bg-black/5 p-2 rounded font-mono text-xs">
              <div><strong>Email:</strong> {ADMIN_CREDENTIALS[0].email}</div>
              <div><strong>Password:</strong> {ADMIN_CREDENTIALS[0].password}</div>
            </div>
            <div className="bg-black/5 p-2 rounded font-mono text-xs">
              <div><strong>Email:</strong> {ADMIN_CREDENTIALS[1].email}</div>
              <div><strong>Password:</strong> {ADMIN_CREDENTIALS[1].password}</div>
            </div>
          </div>
          <div className="mt-3 text-center font-semibold">Features:</div>
          <div className="space-y-1">
            <div>• User management and moderation</div>
            <div>• System analytics and statistics</div>
            <div>• Daily question content management</div>
            <div>• System settings and configuration</div>
          </div>
        </div>
      </div>
    </div>
  )
}
