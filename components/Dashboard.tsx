"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/firebase"
import { createOrReplaceUserProfile, type UserProfileInput } from "@/lib/firestoreUser"

// Minimal inline button replacement for redesigned static UI areas
function SmallButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        "px-3 py-1 rounded-md border border-black bg-black text-white text-xs font-semibold hover:opacity-80 transition " +
        (props.className || "")
      }
    />
  )
}

interface DashboardProps {
  user: any
  onLogout: () => void
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentStreak, setCurrentStreak] = useState(0)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: "",
    enrollment_no: "",
    email: "",
    phone: "",
    course: "",
    section: "",
    semester: "",
    github_repo_link: "",
  })
  const [todayQuestion, setTodayQuestion] = useState<{ title: string; description: string | null }>({
    title: "Loading today's challenge...",
    description: null,
  })

  const [stats, setStats] = useState({
    hardQuestions: 0,
    mediumQuestions: 0,
    easyQuestions: 0,
    codeOfChoice: 0,
  })

  // Additional state for dynamic data
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set())
  const [userStats, setUserStats] = useState({
    hard: 0,
    medium: 0,
    easy: 0,
    choice: 0,
  })
  const [totalSolved, setTotalSolved] = useState(0)
  const [showDifficultyButtons, setShowDifficultyButtons] = useState(false)
  // Fetch user profile data from Firestore
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.uid) {
        try {
          const ref = doc(db, "user_profiles", user.uid)
          try {
            const snap = await getDoc(ref)
            if (snap.exists()) {
              const profile = snap.data()
              setUserProfile(profile)
              // Update form with existing profile data
              setProfileForm({
                name: profile.name || "",
                enrollment_no: profile.enrollment_no || "",
                email: profile.email || user.email || "",
                phone: profile.phone || "",
                course: profile.course || "",
                section: profile.section || "",
                semester: profile.semester || "",
                github_repo_link: profile.github_repo_link || "",
              })
            } else {
              // Initialize form with user email if no profile exists
              setProfileForm((prev) => ({
                ...prev,
                email: user.email || "",
              }))
            }
          } catch (readErr) {
            console.error("Firestore profile read failed:", readErr)
          }
        } catch (err) {
          console.log("Error fetching user profile:", err)
        }
      }
    }
    fetchUserProfile()
  }, [user])

  // Fetch user progress data and daily question
  useEffect(() => {
    const fetchUserProgress = async () => {
      if (user?.uid) {
        try {
          // Fetch user progress
          const progressRes = await fetch(`/api/student/progress?userId=${user.uid}`)
          const progressData = await progressRes.json()

          if (!progressRes.ok) {
            console.error("Failed to fetch progress data:", progressData.error)
            return
          }

          // Update streak
          setCurrentStreak(progressData.currentStreak || 0)

          // Update stats
          setUserStats(progressData.stats)
          setStats({
            hardQuestions: progressData.stats.hard,
            mediumQuestions: progressData.stats.medium,
            easyQuestions: progressData.stats.easy,
            codeOfChoice: progressData.stats.choice,
          })

          // Update total solved
          setTotalSolved(progressData.totalSolved || 0)

          // Create a set of completed dates for the calendar
          const completedDateSet = new Set<string>()
          if (progressData.completedQuestions) {
            progressData.completedQuestions.forEach((question: any) => {
              if (question.completedAt) {
                const date = new Date(question.completedAt)
                const dateString = date.toISOString().split("T")[0]
                completedDateSet.add(dateString)
              }
            })
          }
          setCompletedDates(completedDateSet)
        } catch (error) {
          console.error("Error fetching user progress:", error)
        }
      }
    }

    const fetchDailyQuestion = async () => {
      try {
        const questionRes = await fetch("/api/student/daily-question")
        const questionData = await questionRes.json()

        if (!questionRes.ok) {
          console.error("Failed to fetch daily question:", questionData.error)
          setTodayQuestion({
            title: "Failed to load today's challenge. Please try again later.",
            description: null,
          })
          return
        }

        if (questionData.question) {
          setTodayQuestion({
            title: questionData.question.title,
            description: questionData.question.description || null,
          })
        } else {
          setTodayQuestion({
            title: "No challenge available for today.",
            description: null,
          })
        }
      } catch (error) {
        console.error("Error fetching daily question:", error)
        setTodayQuestion({
          title: "Failed to load today's challenge. Please try again later.",
          description: null,
        })
      }
    }

    fetchUserProgress()
    fetchDailyQuestion()
  }, [user])

  // Profile modal handlers
  const openProfileModal = () => {
    setShowProfileModal(true)
    setEditingProfile(false)
  }

  const closeProfileModal = () => {
    setShowProfileModal(false)
    setEditingProfile(false)
  }

  const handleProfileEdit = () => {
    setEditingProfile(true)
  }

  const handleProfileSave = async () => {
    try {
      const profileData: UserProfileInput = {
        user_id: user.uid,
        name: profileForm.name,
        enrollment_no: profileForm.enrollment_no,
        email: profileForm.email,
        phone: profileForm.phone,
        course: profileForm.course,
        section: profileForm.section,
        semester: profileForm.semester,
        github_repo_link: profileForm.github_repo_link,
        created_at: new Date(),
      }

      await createOrReplaceUserProfile(profileData)
      setUserProfile(profileData)
      setEditingProfile(false)
      alert("Profile updated successfully!")
    } catch (error) {
      console.error("Error saving profile:", error)
      alert("Failed to save profile. Please try again.")
    }
  }

  const handleProfileChange = (field: string, value: string) => {
    setProfileForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Get current month and year
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const currentMonth = monthNames[currentDate.getMonth()]
  const currentYear = currentDate.getFullYear()

  // Generate calendar days
  const generateCalendarDays = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), -startingDayOfWeek + i + 1)
      days.push({
        day: prevMonthDay.getDate(),
        isCurrentMonth: false,
        date: prevMonthDay,
      })
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), day),
      })
    }

    // Add empty cells for days after month ends
    const remainingCells = 42 - days.length // 6 rows × 7 days
    for (let day = 1; day <= remainingCells; day++) {
      const nextMonthDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, day)
      days.push({
        day: nextMonthDay.getDate(),
        isCurrentMonth: false,
        date: nextMonthDay,
      })
    }

    return days
  }

  const calendarDays = generateCalendarDays()
  const today = new Date()
  const isToday = (d: Date) =>
    d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()

  const goPrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }
  const goNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const baseBg = "#FED3A8" // page background per request
  const orange = "#FF7D21" // primary panel color per request
  const orangeLight = "#FF7D21" // using same orange as accent
  const cream = "#FED3A8"
  const blueBorder = "#2D6FD8"

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: baseBg }}>
      {/* Main Dashboard Content - blur when modal is open */}
      <div className={`transition-all duration-300 ${showProfileModal ? "blur-sm" : ""}`}>
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-5 pt-4 pb-2 gap-4 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-arbutus" style={{ color: "#000" }}>
              45 Days of code
            </h1>
            <p className="text-xs mt-1" style={{ color: "#181818" }}>
              Welcome back, {userProfile?.name || user?.email?.split("@")[0] || "user"}
            </p>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div
              className="flex items-center bg-black text-white rounded-full px-4 sm:px-6 h-10 sm:h-12 border border-black shadow"
              style={{ fontFamily: "var(--font-jura)" }}
            >
              <span className="text-sm sm:text-lg font-semibold mr-2" style={{ fontFamily: "var(--font-jura)" }}>
                Streak
              </span>
              <span
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold"
                style={{ backgroundColor: orangeLight, color: "#000" }}
              >
                {currentStreak}
              </span>
            </div>
            <button
              onClick={openProfileModal}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 border-black flex items-center justify-center bg-black hover:scale-95 transition shadow"
            >
              <span className="text-sm sm:text-lg font-bold text-white">
                {userProfile?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
              </span>
            </button>
          </div>
        </div>

        <div className="px-4 sm:px-6 pb-12 grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 lg:gap-10 items-start">
          {/* Calendar Column */}
          <div className="w-full order-2 lg:order-1">
            {/* Calendar Header Tab */}
            <div
              className="rounded-md mb-4 px-4 sm:px-6 py-3 sm:py-4 font-bold text-lg sm:text-xl border border-black shadow-sm flex items-center justify-center tracking-wide"
              style={{ backgroundColor: orange, color: "#FED3AD", fontFamily: "var(--font-jura)" }}
            >
              Activity Calendar
            </div>
            <div className="rounded-md border border-black p-4 sm:p-5 relative" style={{ backgroundColor: orange }}>
              {/* Month / Year Controls */}
              <div className="flex items-center justify-between mb-3 text-sm font-semibold text-black">
                <button onClick={goPrevMonth} className="px-2 py-1 hover:opacity-70 text-lg">
                  &lt;
                </button>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm sm:text-base">{currentMonth}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm sm:text-base">{currentYear}</span>
                  </div>
                </div>
                <button onClick={goNextMonth} className="px-2 py-1 hover:opacity-70 text-lg">
                  &gt;
                </button>
              </div>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 text-[10px] sm:text-[11px] font-semibold mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, idx) => (
                  <div key={idx} className="text-center text-black/80 py-1 tracking-wide">
                    {d[0]}
                  </div>
                ))}
              </div>
              {/* Days */}
              <div className="grid grid-cols-7 gap-[2px] sm:gap-[4px] text-[10px] sm:text-[12px]">
                {calendarDays.map((d, i) => {
                  const active = d.isCurrentMonth
                  const todayCell = isToday(d.date)
                  const dateStr = d.date.toISOString().split("T")[0]
                  const isCompleted = completedDates.has(dateStr)
                  return (
                    <div
                      key={i}
                      className={
                        "aspect-square flex items-center justify-center rounded-sm border transition-colors " +
                        (todayCell
                          ? "bg-white border-black font-bold shadow"
                          : active
                            ? isCompleted
                              ? "bg-green-500 border-black/40 text-white font-bold"
                              : "bg-[#FED3A8] border-black/40 text-black hover:bg-white"
                            : "bg-transparent border-transparent text-black/30")
                      }
                    >
                      {d.day}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Compact Stats Panel (moved below calendar) */}
            <div className="mt-6 rounded-md border border-black p-4" style={{ backgroundColor: orange }}>
              {(() => {
                const rows = [
                  { key: "hard", label: "Hard Questions", value: stats.hardQuestions, icon: "🧠" },
                  { key: "medium", label: "Medium Questions", value: stats.mediumQuestions, icon: "🧩" },
                  { key: "easy", label: "Easy Questions", value: stats.easyQuestions, icon: "💡" },
                  { key: "choice", label: "Code of Your Choice", value: stats.codeOfChoice, icon: "⭐" },
                ]
                return (
                  <div>
                    <div className="flex items-center mb-3">
                      <span className="mr-2 text-sm" aria-hidden>
                        📊
                      </span>
                      <h3
                        className="font-bold text-base sm:text-lg"
                        style={{ color: "#1A1109", fontFamily: "var(--font-jura)" }}
                      >
                        Stats
                      </h3>
                    </div>
                    <ul className="space-y-2" aria-label="Solved problem counts by category">
                      {rows.map((r) => (
                        <li
                          key={r.key}
                          className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 rounded-md border border-black bg-black/90 text-white"
                          aria-label={`${r.label}: ${r.value}`}
                        >
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <span className="text-sm sm:text-base leading-none" aria-hidden>
                              {r.icon}
                            </span>
                            <span className="text-xs font-medium truncate">{r.label}</span>
                          </div>
                          <span className="text-xs sm:text-sm font-bold font-mono w-6 sm:w-8 text-center rounded bg-white text-black border border-white/20">
                            {r.value}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Right Side Main Content */}
          <div className="flex-1 flex flex-col gap-6 sm:gap-8 min-w-0 order-1 lg:order-2">
            {/* Today's Question Panel */}
            <div
              className="rounded-md border p-6 sm:p-8 relative w-full"
              style={{ backgroundColor: orange, borderColor: "#000", minHeight: "250px" }}
            >
              <h2
                className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 tracking-wide text-center"
                style={{ color: "#3A2A18", fontFamily: "var(--font-jura)" }}
              >
                Today's Question
              </h2>

              {/* Buttons for choosing question or code of choice */}
              <div className="flex flex-col space-y-3 sm:space-y-4 max-w-sm mx-auto">
                {!showDifficultyButtons ? (
                  <>
                    <button
                      onClick={() => setShowDifficultyButtons(true)}
                      className="px-4 sm:px-6 py-3 sm:py-4 rounded-lg border-2 border-black hover:opacity-90 transition-all duration-200 font-bold text-base sm:text-lg"
                      style={{
                        backgroundColor: "#000",
                        color: "#FED3A8",
                        fontFamily: "var(--font-jura)",
                      }}
                    >
                      Choose Question
                    </button>

                    <button
                      onClick={() => {
                        // Navigate to code of choice page
                        router.push("/code-of-choice")
                      }}
                      className="px-4 sm:px-6 py-3 sm:py-4 rounded-lg border-2 border-black hover:opacity-90 transition-all duration-200 font-bold text-base sm:text-lg"
                      style={{
                        backgroundColor: "#000",
                        color: "#FED3A8",
                        fontFamily: "var(--font-jura)",
                      }}
                    >
                      Code of Your Choice
                    </button>
                  </>
                ) : (
                  <>
                    <h3
                      className="text-lg sm:text-xl font-bold text-center mb-3 sm:mb-4"
                      style={{ color: "#3A2A18", fontFamily: "var(--font-jura)" }}
                    >
                      Select Difficulty
                    </h3>
                    <div className="flex flex-col space-y-3">
                      <button
                        onClick={() => {
                          console.log("Easy question selected")
                          setShowDifficultyButtons(false)
                        }}
                        className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg border-2 border-black hover:opacity-90 transition-all duration-200 font-bold text-sm sm:text-base"
                        style={{
                          backgroundColor: "#4CAF50",
                          color: "#FFFFFF",
                          fontFamily: "var(--font-jura)",
                        }}
                      >
                        Easy Question
                      </button>

                      <button
                        onClick={() => {
                          console.log("Medium question selected")
                          setShowDifficultyButtons(false)
                        }}
                        className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg border-2 border-black hover:opacity-90 transition-all duration-200 font-bold text-sm sm:text-base"
                        style={{
                          backgroundColor: "#FF9800",
                          color: "#FFFFFF",
                          fontFamily: "var(--font-jura)",
                        }}
                      >
                        Medium Question
                      </button>

                      <button
                        onClick={() => {
                          console.log("Hard question selected")
                          setShowDifficultyButtons(false)
                        }}
                        className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg border-2 border-black hover:opacity-90 transition-all duration-200 font-bold text-sm sm:text-base"
                        style={{
                          backgroundColor: "#F44336",
                          color: "#FFFFFF",
                          fontFamily: "var(--font-jura)",
                        }}
                      >
                        Hard Question
                      </button>
                    </div>

                    <button
                      onClick={() => setShowDifficultyButtons(false)}
                      className="mt-3 sm:mt-4 px-3 sm:px-4 py-2 rounded-lg border-2 border-black hover:opacity-90 transition-all duration-200 font-bold text-xs sm:text-sm"
                      style={{
                        backgroundColor: "#000",
                        color: "#FED3A8",
                        fontFamily: "var(--font-jura)",
                      }}
                    >
                      Back
                    </button>
                  </>
                )}
              </div>
            </div>
            {/* Mini Total Solved Panel */}
            {(() => {
              // Use dynamic totalSolved state instead of calculating from stats
              const goal = 45 // Assumption: 45 total questions target for the challenge
              const pct = Math.min(100, Math.round((totalSolved / goal) * 100))
              return (
                <div
                  className="rounded-md border px-4 sm:px-5 py-3 sm:py-4 w-full flex flex-col gap-2 sm:gap-3"
                  style={{ backgroundColor: orange }}
                  aria-label={`Total questions solved ${totalSolved} of ${goal}`}
                >
                  <div className="flex items-center justify-between">
                    <h3
                      className="font-bold text-base sm:text-lg"
                      style={{ color: "#1A1109", fontFamily: "var(--font-jura)" }}
                    >
                      Total Questions Solved
                    </h3>
                    <span
                      className="text-xs sm:text-sm font-mono font-semibold px-2 py-1 bg-black text-white rounded"
                      aria-label="Solved count"
                    >
                      {totalSolved}
                    </span>
                  </div>
                  <div
                    className="w-full h-2 sm:h-3 rounded-full overflow-hidden border border-black bg-black/10"
                    aria-hidden
                  >
                    <div className="h-full bg-black transition-all" style={{ width: pct + "%" }} />
                  </div>
                  <span className="text-xs font-medium tracking-wide" style={{ color: "#2A1C0E" }}>
                    {pct}% of {goal} goal
                  </span>
                </div>
              )
            })()}

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="w-full px-4 py-3 rounded-lg border-2 border-black hover:opacity-90 transition-all duration-200 font-bold text-sm sm:text-base"
              style={{
                backgroundColor: "#FF7D21",
                color: "#FED3A8",
                fontFamily: "var(--font-jura)",
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {showProfileModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300"
          onClick={closeProfileModal}
        >
          <div
            className="rounded-2xl border-2 p-4 sm:p-6 w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in duration-300 shadow-2xl"
            style={{ backgroundColor: orange, borderColor: "#000" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold" style={{ color: "#1A1109", fontFamily: "var(--font-jura)" }}>
                Profile Details
              </h2>
              <button
                onClick={closeProfileModal}
                className="hover:opacity-70 transition-opacity duration-200 text-xl sm:text-2xl font-bold"
                style={{ color: "#1A1109" }}
              >
                ×
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {/* Name */}
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "#1A1109", fontFamily: "var(--font-jura)" }}
                >
                  Name
                </label>
                {editingProfile ? (
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => handleProfileChange("name", e.target.value)}
                    className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none transition-all duration-200 text-sm"
                    style={{ backgroundColor: "#FED3A8" }}
                    placeholder="Enter your full name"
                  />
                ) : (
                  <div
                    className="w-full px-3 py-2 border-2 border-black rounded-lg text-sm"
                    style={{ backgroundColor: "#FED3A8", color: "#1A1109" }}
                  >
                    {userProfile?.name || "Not provided"}
                  </div>
                )}
              </div>

              {/* Enrollment Number */}
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "#1A1109", fontFamily: "var(--font-jura)" }}
                >
                  Enrollment Number
                </label>
                {editingProfile ? (
                  <input
                    type="text"
                    value={profileForm.enrollment_no}
                    onChange={(e) => handleProfileChange("enrollment_no", e.target.value)}
                    className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none transition-all duration-200 text-sm"
                    style={{ backgroundColor: "#FED3A8" }}
                    placeholder="Enter enrollment number"
                  />
                ) : (
                  <div
                    className="w-full px-3 py-2 border-2 border-black rounded-lg text-sm"
                    style={{ backgroundColor: "#FED3A8", color: "#1A1109" }}
                  >
                    {userProfile?.enrollment_no || "Not provided"}
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "#1A1109", fontFamily: "var(--font-jura)" }}
                >
                  Email
                </label>
                {editingProfile ? (
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => handleProfileChange("email", e.target.value)}
                    className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none transition-all duration-200 text-sm"
                    style={{ backgroundColor: "#FED3A8" }}
                    placeholder="Enter email address"
                  />
                ) : (
                  <div
                    className="w-full px-3 py-2 border-2 border-black rounded-lg text-sm"
                    style={{ backgroundColor: "#FED3A8", color: "#1A1109" }}
                  >
                    {userProfile?.email || user?.email || "Not provided"}
                  </div>
                )}
              </div>

              {/* Phone */}
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "#1A1109", fontFamily: "var(--font-jura)" }}
                >
                  Phone
                </label>
                {editingProfile ? (
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => handleProfileChange("phone", e.target.value)}
                    className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none transition-all duration-200 text-sm"
                    style={{ backgroundColor: "#FED3A8" }}
                    placeholder="Enter phone number"
                  />
                ) : (
                  <div
                    className="w-full px-3 py-2 border-2 border-black rounded-lg text-sm"
                    style={{ backgroundColor: "#FED3A8", color: "#1A1109" }}
                  >
                    {userProfile?.phone || "Not provided"}
                  </div>
                )}
              </div>

              {/* Course, Section, Semester - stack on mobile, row on larger screens */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Course */}
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#1A1109", fontFamily: "var(--font-jura)" }}
                  >
                    Course
                  </label>
                  {editingProfile ? (
                    <select
                      value={profileForm.course}
                      onChange={(e) => handleProfileChange("course", e.target.value)}
                      className="w-full px-2 py-2 border-2 border-black rounded-lg focus:outline-none transition-all duration-200 text-sm"
                      style={{ backgroundColor: "#FED3A8" }}
                    >
                      <option value="">Select</option>
                      <option value="BCA">BCA</option>
                      <option value="IT">IT</option>
                      <option value="CSE">CSE</option>
                    </select>
                  ) : (
                    <div
                      className="w-full px-2 py-2 border-2 border-black rounded-lg text-sm"
                      style={{ backgroundColor: "#FED3A8", color: "#1A1109" }}
                    >
                      {userProfile?.course || "N/A"}
                    </div>
                  )}
                </div>

                {/* Section */}
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#1A1109", fontFamily: "var(--font-jura)" }}
                  >
                    Section
                  </label>
                  {editingProfile ? (
                    <select
                      value={profileForm.section}
                      onChange={(e) => handleProfileChange("section", e.target.value)}
                      className="w-full px-2 py-2 border-2 border-black rounded-lg focus:outline-none transition-all duration-200 text-sm"
                      style={{ backgroundColor: "#FED3A8" }}
                    >
                      <option value="">Select</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                      <option value="E">E</option>
                    </select>
                  ) : (
                    <div
                      className="w-full px-2 py-2 border-2 border-black rounded-lg text-sm"
                      style={{ backgroundColor: "#FED3A8", color: "#1A1109" }}
                    >
                      {userProfile?.section || "N/A"}
                    </div>
                  )}
                </div>

                {/* Semester */}
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#1A1109", fontFamily: "var(--font-jura)" }}
                  >
                    Semester
                  </label>
                  {editingProfile ? (
                    <select
                      value={profileForm.semester}
                      onChange={(e) => handleProfileChange("semester", e.target.value)}
                      className="w-full px-2 py-2 border-2 border-black rounded-lg focus:outline-none transition-all duration-200 text-sm"
                      style={{ backgroundColor: "#FED3A8" }}
                    >
                      <option value="">Select</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="6">6</option>
                      <option value="7">7</option>
                      <option value="8">8</option>
                    </select>
                  ) : (
                    <div
                      className="w-full px-2 py-2 border-2 border-black rounded-lg text-sm"
                      style={{ backgroundColor: "#FED3A8", color: "#1A1109" }}
                    >
                      {userProfile?.semester || "N/A"}
                    </div>
                  )}
                </div>
              </div>

              {/* GitHub Repo Link */}
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "#1A1109", fontFamily: "var(--font-jura)" }}
                >
                  GitHub Repository
                </label>
                {editingProfile ? (
                  <input
                    type="url"
                    value={profileForm.github_repo_link}
                    onChange={(e) => handleProfileChange("github_repo_link", e.target.value)}
                    className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none transition-all duration-200 text-sm"
                    style={{ backgroundColor: "#FED3A8" }}
                    placeholder="https://github.com/username/repo"
                  />
                ) : (
                  <div
                    className="w-full px-3 py-2 border-2 border-black rounded-lg text-sm"
                    style={{ backgroundColor: "#FED3A8", color: "#1A1109" }}
                  >
                    {userProfile?.github_repo_link ? (
                      <a
                        href={userProfile.github_repo_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline transition-colors duration-200 text-sm font-medium break-all"
                        style={{ color: "#FF7D21" }}
                      >
                        View Repository
                      </a>
                    ) : (
                      "Not provided"
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons - responsive layout */}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-4 sm:mt-6 pt-4 border-t-2 border-black">
              {editingProfile ? (
                <>
                  <button
                    onClick={() => setEditingProfile(false)}
                    className="px-4 py-2 border-2 border-black rounded-lg hover:opacity-80 transition-all duration-200 font-medium text-sm"
                    style={{ backgroundColor: "#FED3A8", color: "#1A1109" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProfileSave}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:opacity-90 transition-all duration-200 font-medium border-2 border-black text-sm"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={closeProfileModal}
                    className="px-4 py-2 border-2 border-black rounded-lg hover:opacity-80 transition-all duration-200 font-medium text-sm"
                    style={{ backgroundColor: "#FED3A8", color: "#1A1109" }}
                  >
                    Close
                  </button>
                  <button
                    onClick={handleProfileEdit}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:opacity-90 transition-all duration-200 font-medium border-2 border-black text-sm"
                  >
                    Edit Profile
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
