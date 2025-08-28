"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { auth, db } from "@/firebase"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth"
import { doc, getDoc, serverTimestamp } from "firebase/firestore"
import { createOrReplaceUserProfile, fetchUserProfile } from "@/lib/firestoreUser"
import Dashboard from "@/components/Dashboard"

export default function Home() {
  const [currentView, setCurrentView] = useState<"landing" | "login" | "signup" | "dashboard">("landing")

  // Form state for signup
  const [formData, setFormData] = useState({
    name: "",
    enrollmentNo: "",
    email: "",
    password: "",
    phone: "",
    course: "",
    section: "",
    semester: "",
    githubRepoLink: "",
  })

  // Login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  })

  // Loading and error states
  const [loading, setLoading] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [error, setError] = useState("")
  const [loginError, setLoginError] = useState("")
  // success state removed – immediate redirect after signup
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)

  // Check for existing user session on component mount
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser)
      if (fbUser) {
        const ref = doc(db, "user_profiles", fbUser.uid)
        const snap = await getDoc(ref)
        if (snap.exists()) setProfile(snap.data())
        if (currentView === "login" || currentView === "signup" || currentView === "landing") {
          setCurrentView("dashboard")
        }
      } else {
        setProfile(null)
      }
    })
    return () => unsub()
  }, [currentView])

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  // Handle login input changes
  const handleLoginInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    })
  }

  // Handle login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError("")

    try {
      const email = loginData.email.trim().toLowerCase()
      await signInWithEmailAndPassword(auth, email, loginData.password)
      setCurrentView("dashboard")
      setLoginData({ email: "", password: "" })
    } catch (err: any) {
      setLoginError(err.message || "Login failed")
    } finally {
      setLoginLoading(false)
    }
  }

  // Handle logout
  const handleLogout = async () => {
    await signOut(auth)
    setUser(null)
    setCurrentView("landing")
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const email = formData.email.trim().toLowerCase()
      const cred = await createUserWithEmailAndPassword(auth, email, formData.password)
      const uid = cred.user.uid
      try {
        await createOrReplaceUserProfile({
          user_id: uid,
          name: formData.name,
          enrollment_no: formData.enrollmentNo,
          email,
          phone: formData.phone,
          course: formData.course,
          section: formData.section,
          semester: formData.semester,
          github_repo_link: formData.githubRepoLink,
          created_at: serverTimestamp(),
        })
        const prof = await fetchUserProfile(uid)
        setProfile(prof)
      } catch (writeErr: any) {
        console.error("Firestore profile write failed:", writeErr)
        throw writeErr
      }
      setCurrentView("dashboard")
      setFormData({
        name: "",
        enrollmentNo: "",
        email: "",
        password: "",
        phone: "",
        course: "",
        section: "",
        semester: "",
        githubRepoLink: "",
      })
    } catch (err: any) {
      console.error("Signup flow error:", err)
      setError(err.message || "Signup failed")
    } finally {
      setLoading(false)
    }
  }

  const handleGetStarted = () => {
    setCurrentView("login")
  }

  const handleBackToLanding = () => {
    setCurrentView("landing")
  }

  const handleShowSignup = () => {
    setCurrentView("signup")
  }

  const handleBackToLogin = () => {
    setCurrentView("login")
  }

  const handleBack = () => {
    if (currentView === "signup") {
      setCurrentView("login")
    } else if (currentView === "login") {
      setCurrentView("landing")
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center overflow-hidden transition-all duration-700 ease-in-out px-4 sm:px-8"
      style={{ backgroundColor: "#FED3A8" }}
    >
      {currentView === "landing" ? (
        <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between relative animate-in fade-in duration-700 gap-8 lg:gap-0">
          {/* Left side - Orange semi-circle with logo - hidden on mobile, adjusted on desktop */}
          <div className="relative flex-1 hidden lg:flex items-center justify-start">
            <div
              className="w-[600px] xl:w-[800px] h-screen rounded-full flex items-center justify-center absolute -left-48 xl:-left-96 top-1/2 -translate-y-1/2"
              style={{ backgroundColor: "#FF7D21" }}
            >
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Change%20Colors%20in%20PNG%20%281%29-fZIVIcqIH0X1btrffyMybOH5t9eqX8.png"
                alt="acc logo"
                className="w-32 xl:w-48 h-auto ml-24 xl:ml-48"
              />
            </div>
          </div>

          {/* Mobile logo - shown only on mobile */}
          <div className="lg:hidden mb-8">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Change%20Colors%20in%20PNG%20%281%29-fZIVIcqIH0X1btrffyMybOH5t9eqX8.png"
              alt="acc logo"
              className="w-24 h-auto mx-auto"
            />
          </div>

          {/* Right side - Content - responsive layout */}
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 sm:space-y-8 lg:pl-16 text-center">
            {user ? (
              // Logged in user content
              <>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 text-center leading-tight font-arbutus">
                  Welcome Back!
                  <br />
                  45 Days of Code
                </h1>

                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-transparent border-2 border-gray-900 rounded-lg flex items-center justify-center">
                  <span className="text-gray-900 text-xl sm:text-2xl font-mono">{"</>"}</span>
                </div>

                <div className="text-center">
                  <p className="text-gray-700 text-base sm:text-lg font-jura">
                    Welcome back, <span className="font-bold">{user?.email}</span>!
                  </p>
                  <p className="text-gray-600 text-sm mt-2 font-jura">
                    Continue your coding journey and track your progress.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full max-w-sm">
                  <Button
                    onClick={() => setCurrentView("dashboard")}
                    className="px-6 sm:px-8 py-3 text-white font-semibold rounded-full hover:shadow-xl transition-shadow duration-200 font-jura border border-black shadow-none h-12 flex-1"
                    style={{ backgroundColor: "#FF7D21" }}
                  >
                    Dashboard
                  </Button>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="px-6 sm:px-8 py-3 font-semibold rounded-full hover:shadow-xl transition-shadow duration-200 font-jura border-2 border-black h-12 flex-1 bg-transparent"
                  >
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              // Not logged in content
              <>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 text-center leading-tight font-arbutus">
                  Welcome to 45 Days
                  <br />
                  of Code
                </h1>

                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-transparent border-2 border-gray-900 rounded-lg flex items-center justify-center">
                  <span className="text-gray-900 text-xl sm:text-2xl font-mono">{"</>"}</span>
                </div>

                <p className="text-gray-700 text-base sm:text-lg text-center max-w-md leading-relaxed font-jura px-4">
                  Commit to your coding journey, build a daily habit, and watch your skills grow.
                </p>

                <Button
                  onClick={handleGetStarted}
                  className="px-8 py-3 text-white font-semibold rounded-full hover:shadow-xl transition-shadow duration-200 font-jura border border-black shadow-none h-12 w-40"
                  style={{ backgroundColor: "#FF7D21" }}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      ) : currentView === "dashboard" ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : currentView === "login" ? (
        <div className="animate-in fade-in duration-700 w-full max-w-md mx-auto">
          <button
            onClick={handleBack}
            className="absolute top-4 sm:top-8 left-4 sm:left-8 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors z-10"
          >
            ←
          </button>
          <div className="w-full bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-black">
            <div className="flex flex-col sm:flex-row min-h-96">
              {/* Left side - Orange section with title */}
              <div
                className="flex-1 flex items-center justify-center py-8 sm:py-0"
                style={{ backgroundColor: "#FF7D21" }}
              >
                <div className="text-center">
                  <h2 className="text-2xl sm:text-3xl font-bold text-black font-arbutus leading-tight">
                    45 Days
                    <br />
                    of Code
                  </h2>
                </div>
              </div>

              {/* Right side - Login form */}
              <div className="flex-1 bg-black flex flex-col justify-center px-6 py-8">
                <h3 className="text-white text-xl sm:text-2xl font-semibold mb-4 font-jura">Login</h3>

                {loginError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-xs leading-tight">
                    Firebase: Error (auth/invalid-credential).
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-3">
                  <div>
                    <label className="text-white text-sm font-jura block mb-1">Email</label>
                    <Input
                      name="email"
                      type="email"
                      value={loginData.email}
                      onChange={handleLoginInputChange}
                      required
                      className="w-full h-10 rounded-full border-0 bg-gray-400 text-black text-sm px-3 placeholder-gray-600"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <label className="text-white text-sm font-jura block mb-1">Password</label>
                    <Input
                      name="password"
                      type="password"
                      value={loginData.password}
                      onChange={handleLoginInputChange}
                      required
                      className="w-full h-10 rounded-full border-0 bg-gray-400 text-black text-sm px-3 placeholder-gray-600"
                      placeholder="Enter your password"
                    />
                  </div>

                  <div className="pt-2 space-y-2">
                    <Button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full h-10 rounded-full text-white font-semibold text-sm font-jura disabled:opacity-50"
                      style={{ backgroundColor: "#FF7D21" }}
                    >
                      {loginLoading ? "Logging in..." : "Continue"}
                    </Button>

                    <button
                      type="button"
                      onClick={handleShowSignup}
                      className="w-full h-6 bg-orange-100 text-black text-xs rounded-full font-jura hover:bg-orange-200 transition-colors"
                    >
                      Sign up
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in duration-700 w-full max-w-lg mx-auto">
          <button
            onClick={handleBack}
            className="absolute top-4 sm:top-8 left-4 sm:left-8 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors z-10"
          >
            ←
          </button>
          <div
            className="w-full max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden border-4 border-black overflow-y-auto"
            style={{ backgroundColor: "#FF7D21" }}
          >
            <div className="flex flex-col h-full p-4 sm:p-8">
              {/* Header */}
              <h2 className="text-2xl sm:text-4xl font-bold text-black text-center mb-6 sm:mb-8 font-arbutus">
                Create Account
              </h2>

              {/* Form */}
              <div className="flex-1 space-y-4 sm:space-y-6">
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* First row - Name and Enrollment No. - stack on mobile */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 sm:mb-6">
                    <div>
                      <label className="text-black text-sm font-jura block mb-2">Name</label>
                      <Input
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full h-10 sm:h-12 rounded-full border-2 border-black text-black text-sm px-4"
                        style={{ backgroundColor: "#FED3A8" }}
                      />
                    </div>
                    <div>
                      <label className="text-black text-sm font-jura block mb-2">Enrollment No.</label>
                      <Input
                        name="enrollmentNo"
                        type="text"
                        value={formData.enrollmentNo}
                        onChange={handleInputChange}
                        required
                        className="w-full h-10 sm:h-12 rounded-full border-2 border-black text-black text-sm px-4"
                        style={{ backgroundColor: "#FED3A8" }}
                      />
                    </div>
                  </div>

                  {/* Second row - Email and Password - stack on mobile */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 sm:mb-6">
                    <div>
                      <label className="text-black text-sm font-jura block mb-2">Email</label>
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full h-10 sm:h-12 rounded-full border-2 border-black text-black text-sm px-4"
                        style={{ backgroundColor: "#FED3A8" }}
                        placeholder="amitycodingclub@gmail.com"
                      />
                    </div>
                    <div>
                      <label className="text-black text-sm font-jura block mb-2">Password</label>
                      <Input
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        minLength={6}
                        className="w-full h-10 sm:h-12 rounded-full border-2 border-black text-black text-sm px-4"
                        style={{ backgroundColor: "#FED3A8" }}
                        placeholder="••••••"
                      />
                    </div>
                  </div>

                  {/* Third row - Phone and Course - stack on mobile */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 sm:mb-6">
                    <div>
                      <label className="text-black text-sm font-jura block mb-2">Phone</label>
                      <Input
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full h-10 sm:h-12 rounded-full border-2 border-black text-black text-sm px-4"
                        style={{ backgroundColor: "#FED3A8" }}
                      />
                    </div>
                    <div>
                      <label className="text-black text-sm font-jura block mb-2 font-semibold">Course</label>
                      <div className="relative">
                        <select
                          name="course"
                          value={formData.course}
                          onChange={handleInputChange}
                          required
                          className="w-full h-10 sm:h-12 rounded-full border-2 border-black text-black text-sm px-4 pr-10 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 hover:border-gray-600"
                          style={{ backgroundColor: "#FED3A8", fontFamily: "var(--font-jura)" }}
                        >
                          <option value="" disabled className="text-gray-500">
                            Select Course
                          </option>
                          <option value="BCA" className="text-black font-medium">
                            BCA (Bachelor of Computer Applications)
                          </option>
                          <option value="IT" className="text-black font-medium">
                            IT (Information Technology)
                          </option>
                          <option value="CSE" className="text-black font-medium">
                            CSE (Computer Science Engineering)
                          </option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fourth row - Section and Semester - stack on mobile */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 sm:mb-6">
                    <div>
                      <label className="text-black text-sm font-jura block mb-2 font-semibold">Section</label>
                      <div className="relative">
                        <select
                          name="section"
                          value={formData.section}
                          onChange={handleInputChange}
                          required
                          className="w-full h-10 sm:h-12 rounded-full border-2 border-black text-black text-sm px-4 pr-10 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 hover:border-gray-600"
                          style={{ backgroundColor: "#FED3A8", fontFamily: "var(--font-jura)" }}
                        >
                          <option value="" disabled className="text-gray-500">
                            Select Section
                          </option>
                          <option value="A" className="text-black font-medium">
                            Section A
                          </option>
                          <option value="B" className="text-black font-medium">
                            Section B
                          </option>
                          <option value="C" className="text-black font-medium">
                            Section C
                          </option>
                          <option value="D" className="text-black font-medium">
                            Section D
                          </option>
                          <option value="E" className="text-black font-medium">
                            Section E
                          </option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-black text-sm font-jura block mb-2 font-semibold">Semester</label>
                      <div className="relative">
                        <select
                          name="semester"
                          value={formData.semester}
                          onChange={handleInputChange}
                          required
                          className="w-full h-10 sm:h-12 rounded-full border-2 border-black text-black text-sm px-4 pr-10 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 hover:border-gray-600"
                          style={{ backgroundColor: "#FED3A8", fontFamily: "var(--font-jura)" }}
                        >
                          <option value="" disabled className="text-gray-500">
                            Select Semester
                          </option>
                          <option value="1" className="text-black font-medium">
                            1st Semester
                          </option>
                          <option value="2" className="text-black font-medium">
                            2nd Semester
                          </option>
                          <option value="3" className="text-black font-medium">
                            3rd Semester
                          </option>
                          <option value="4" className="text-black font-medium">
                            4th Semester
                          </option>
                          <option value="5" className="text-black font-medium">
                            5th Semester
                          </option>
                          <option value="6" className="text-black font-medium">
                            6th Semester
                          </option>
                          <option value="7" className="text-black font-medium">
                            7th Semester
                          </option>
                          <option value="8" className="text-black font-medium">
                            8th Semester
                          </option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* GitHub repo link - larger field */}
                  <div className="mb-4 sm:mb-6">
                    <label className="text-black text-sm font-jura block mb-2">GitHub Repo Link</label>
                    <Input
                      name="githubRepoLink"
                      type="url"
                      value={formData.githubRepoLink}
                      onChange={handleInputChange}
                      required
                      className="w-full h-12 sm:h-16 rounded-full border-2 border-black text-black text-sm px-4"
                      style={{ backgroundColor: "#FED3A8" }}
                      placeholder="https://github.com/username/repository"
                    />
                  </div>

                  {/* Submit button */}
                  <div className="mt-6 sm:mt-8 flex justify-center">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="px-8 sm:px-12 py-3 bg-black text-white font-semibold rounded-full hover:bg-gray-800 transition-colors font-jura text-base sm:text-lg disabled:opacity-50 w-full sm:w-auto"
                    >
                      {loading ? "Creating Account..." : "Submit"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
