import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  FiBook,
  FiFileText,
  FiHelpCircle,
  FiLayers,
  FiUploadCloud,
  FiCalendar,
  FiFile,
  FiArrowRight,
  FiBarChart2,
  FiTarget,
  FiBriefcase,
} from 'react-icons/fi'
import { getDashboardStats } from '../services/historyService'
import { useAuth } from '../context/AuthContext'
import { PageLoader, EmptyState } from '../components/Common'
import { getErrorMessage } from '../services/api'

const quickActions = [
  {
    to: '/subjects',
    label: 'Manage Subjects',
    description: 'Upload notes and study materials',
    icon: FiBook,
  },
  {
    to: '/planner',
    label: 'Study Planner',
    description: 'Plan your study sessions',
    icon: FiCalendar,
  },
  {
    to: '/performance',
    label: 'View Performance',
    description: 'Track your scores and progress',
    icon: FiBarChart2,
  },
  {
    to: '/recommendations',
    label: 'Get Recommendations',
    description: 'See what you should improve next',
    icon: FiTarget,
  },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const statCards = [
    {
      label: 'Total Subjects',
      value: stats?.total_subjects ?? 0,
      icon: FiBook,
      iconStyle: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    },
    {
      label: 'Total Notes',
      value: stats?.total_notes ?? 0,
      icon: FiFileText,
      iconStyle: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    },
    {
      label: 'Quizzes Generated',
      value: stats?.total_quizzes_generated ?? 0,
      icon: FiHelpCircle,
      iconStyle: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    },
    {
      label: 'Flashcard Sets',
      value: stats?.total_flashcard_sets ?? 0,
      icon: FiLayers,
      iconStyle: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
    },
    {
      label: 'Resumes Analyzed',
      value: stats?.total_resumes ?? 0,
      icon: FiBriefcase,
      iconStyle: 'bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-400',
    },
  ]

  return (
    <div className="space-y-7">
      {/* Welcome section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-blue-600 to-indigo-700 p-7 md:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <p className="text-sm font-medium text-blue-100 mb-2">
            Your personal learning workspace
          </p>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Welcome back 👋
          </h1>

          <p className="mt-3 text-blue-100 text-sm md:text-base leading-relaxed">
            Keep learning, track your progress, and let AI help you prepare
            for your academic and career goals.
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              to="/subjects"
              className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-50 transition-colors"
            >
              <FiUploadCloud size={17} />
              Upload Notes
            </Link>

            <Link
              to="/performance"
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <FiBarChart2 size={17} />
              View Progress
            </Link>
          </div>
        </div>

        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10" />
        <div className="absolute right-20 -bottom-32 h-72 w-72 rounded-full bg-white/5" />
      </section>

      {/* Statistics */}
<section>
  <div className="flex items-center justify-between mb-4">
    <div>
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
        Your Activity
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
        A quick snapshot of your learning activity.
      </p>
    </div>
  </div>

  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
    {statCards.map(({ label, value, icon: Icon, iconStyle }) => (
      <div
        key={label}
        className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
      >
        <div className="flex items-start justify-between">
          <div
            className={`h-11 w-11 rounded-xl flex items-center justify-center ${iconStyle} group-hover:scale-105 transition-transform duration-200`}
          >
            <Icon size={19} />
          </div>

          <span className="text-xs font-medium text-slate-300 dark:text-slate-600">
            Activity
          </span>
        </div>

        <div className="mt-5">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>

          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            {label}
          </p>
        </div>
      </div>
    ))}
  </div>
</section>

      {/* Main content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent uploads */}
        <section className="lg:col-span-2 card !p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">
                Recent Uploads
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Your latest study materials
              </p>
            </div>

            <Link
              to="/subjects"
              className="text-sm text-primary font-semibold flex items-center gap-1 hover:gap-2 transition-all"
            >
              View all
              <FiArrowRight size={14} />
            </Link>
          </div>

          <div className="p-5">
            {stats?.recent_uploads?.length ? (
              <div className="space-y-2">
                {stats.recent_uploads.map((note) => (
                  <Link
                    key={note.id}
                    to={`/notes/${note.id}`}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-all"
                  >
                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                      <FiFile size={17} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                        {note.title}
                      </p>

                      <p className="text-xs text-slate-400 mt-0.5 uppercase">
                        {note.file_type}
                      </p>
                    </div>

                    <FiArrowRight
                      size={16}
                      className="text-slate-400 shrink-0"
                    />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={FiUploadCloud}
                title="No notes yet"
                description="Upload your first set of notes to start using AI-powered study tools."
                action={
                  <Link to="/subjects" className="btn-primary">
                    Go to Subjects
                  </Link>
                }
              />
            )}
          </div>
        </section>

        {/* Quick actions */}
        <section className="card !p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-bold text-slate-900 dark:text-white">
              Quick Actions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Jump into your most useful tools
            </p>
          </div>

          <div className="p-4 space-y-2">
            {quickActions.map(
              ({ to, label, description, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                >
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                    <Icon size={17} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                      {label}
                    </p>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {description}
                    </p>
                  </div>

                  <FiArrowRight
                    size={15}
                    className="text-slate-400 group-hover:text-primary transition-colors"
                  />
                </Link>
              )
            )}
          </div>
        </section>
      </div>
    </div>
  )
}