import { useState } from 'react'
import {
  FiTarget,
  FiBookOpen,
  FiTrendingUp,
  FiCheckCircle,
  FiAlertCircle,
  FiAward,
  FiRefreshCw,
  FiBriefcase,
  FiMessageSquare,
  FiCode,
} from 'react-icons/fi'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function CareerGuidancePage() {
  const [targetRole, setTargetRole] = useState('')
  const [currentSkills, setCurrentSkills] = useState('')
  const [interests, setInterests] = useState('')
  const [areasToImprove, setAreasToImprove] = useState('')

  const [guidance, setGuidance] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generateGuidance = async (e) => {
    e.preventDefault()

    if (!targetRole.trim()) {
      setError('Please enter your target role.')
      return
    }

    if (!currentSkills.trim()) {
      setError('Please enter your current skills.')
      return
    }

    if (!interests.trim()) {
      setError('Please enter your career interests.')
      return
    }

    if (!areasToImprove.trim()) {
      setError('Please enter the areas you want to improve.')
      return
    }

    setLoading(true)
    setError('')
    setGuidance(null)

    try {
      const token = localStorage.getItem('asa_token')

      const response = await fetch(`${API_URL}/api/career/guidance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          target_role: targetRole,
          current_skills: currentSkills,
          interests: interests,
          areas_to_improve: areasToImprove,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to generate career guidance.')
      }

      setGuidance(data.guidance)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const resetGuidance = () => {
    setGuidance(null)
    setError('')
  }

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-xl bg-indigo-100 p-3">
              <FiTarget className="text-2xl text-indigo-600" />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Career Guidance
              </h1>

              <p className="mt-1 text-gray-600">
                Get personalized career guidance based on your skills,
                interests and goals.
              </p>
            </div>
          </div>
        </div>

        {/* Input Form */}
        {!guidance && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-md">

            <form onSubmit={generateGuidance}>

              {/* Target Role */}
              <div className="mb-6">
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <FiBriefcase className="text-indigo-600" />
                  Target Role
                </label>

                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Software Developer"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Current Skills */}
              <div className="mb-6">
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <FiCode className="text-indigo-600" />
                  Current Skills
                </label>

                <textarea
                  value={currentSkills}
                  onChange={(e) => setCurrentSkills(e.target.value)}
                  placeholder="e.g. Python, Java, SQL, HTML, CSS, JavaScript, Machine Learning"
                  rows={4}
                  className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Interests */}
              <div className="mb-6">
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <FiBookOpen className="text-indigo-600" />
                  Career Interests
                </label>

                <textarea
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="e.g. Software development, Artificial Intelligence, Web Development"
                  rows={4}
                  className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Areas to Improve */}
              <div className="mb-6">
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <FiTrendingUp className="text-indigo-600" />
                  Areas to Improve
                </label>

                <textarea
                  value={areasToImprove}
                  onChange={(e) => setAreasToImprove(e.target.value)}
                  placeholder="e.g. DSA, System Design, Java, Interview Communication"
                  rows={4}
                  className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                  <FiAlertCircle className="mt-0.5 flex-shrink-0" />

                  <p className="text-sm">
                    {error}
                  </p>
                </div>
              )}

              {/* Button */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <FiRefreshCw className="animate-spin" />
                    Generating Career Guidance...
                  </>
                ) : (
                  <>
                    <FiTarget />
                    Generate Career Guidance
                  </>
                )}
              </button>

            </form>
          </div>
        )}

        {/* Results */}
        {guidance && (
          <div className="space-y-6">

            {/* Career Direction */}
            <div className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-md">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-indigo-100 p-3">
                  <FiTarget className="text-xl text-indigo-600" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Recommended Career Direction
                  </h2>

                  <p className="text-sm text-gray-500">
                    Based on your profile
                  </p>
                </div>
              </div>

              <p className="text-lg font-semibold text-indigo-700">
                {guidance.career_direction}
              </p>
            </div>

            {/* Strengths */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-green-100 p-3">
                  <FiCheckCircle className="text-xl text-green-600" />
                </div>

                <h2 className="text-xl font-bold text-gray-900">
                  Your Strengths
                </h2>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {guidance.strengths?.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-xl bg-green-50 p-4"
                  >
                    <FiCheckCircle className="mt-0.5 flex-shrink-0 text-green-600" />

                    <span className="text-gray-800">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Gaps */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-orange-100 p-3">
                  <FiAlertCircle className="text-xl text-orange-600" />
                </div>

                <h2 className="text-xl font-bold text-gray-900">
                  Skill Gaps
                </h2>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {guidance.skill_gaps?.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-xl bg-orange-50 p-4"
                  >
                    <FiAlertCircle className="mt-0.5 flex-shrink-0 text-orange-600" />

                    <span className="text-gray-800">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Technologies */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-blue-100 p-3">
                  <FiCode className="text-xl text-blue-600" />
                </div>

                <h2 className="text-xl font-bold text-gray-900">
                  Technologies to Learn
                </h2>
              </div>

              <div className="flex flex-wrap gap-3">
                {guidance.technologies_to_learn?.map((item, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Learning Priorities */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-purple-100 p-3">
                  <FiBookOpen className="text-xl text-purple-600" />
                </div>

                <h2 className="text-xl font-bold text-gray-900">
                  Learning Priorities
                </h2>
              </div>

              <div className="space-y-3">
                {guidance.learning_priorities?.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-xl bg-purple-50 p-4"
                  >
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-purple-600 text-sm font-bold text-white">
                      {index + 1}
                    </span>

                    <span className="pt-1 text-gray-800">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Career Roadmap */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-indigo-100 p-3">
                  <FiTrendingUp className="text-xl text-indigo-600" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Career Roadmap
                  </h2>

                  <p className="text-sm text-gray-500">
                    Suggested progression toward your target role
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {guidance.career_roadmap?.map((stage, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-5"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 font-bold text-white">
                        {index + 1}
                      </div>

                      <h3 className="text-lg font-bold text-gray-900">
                        {stage.stage}
                      </h3>
                    </div>

                    <p className="mb-3 text-gray-700">
                      <span className="font-semibold">Focus:</span>{' '}
                      {stage.focus}
                    </p>

                    <ul className="space-y-2">
                      {stage.recommended_actions?.map((action, actionIndex) => (
                        <li
                          key={actionIndex}
                          className="flex items-start gap-2 text-gray-700"
                        >
                          <FiCheckCircle className="mt-1 flex-shrink-0 text-indigo-600" />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Interview Preparation */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-pink-100 p-3">
                  <FiMessageSquare className="text-xl text-pink-600" />
                </div>

                <h2 className="text-xl font-bold text-gray-900">
                  Interview Preparation
                </h2>
              </div>

              <div className="space-y-3">
                {guidance.interview_preparation?.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-xl bg-pink-50 p-4"
                  >
                    <FiMessageSquare className="mt-1 flex-shrink-0 text-pink-600" />

                    <span className="text-gray-800">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Final Advice */}
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6 shadow-md">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-yellow-100 p-3">
                  <FiAward className="text-xl text-yellow-700" />
                </div>

                <h2 className="text-xl font-bold text-gray-900">
                  Final Advice
                </h2>
              </div>

              <p className="leading-7 text-gray-800">
                {guidance.final_advice}
              </p>
            </div>

            {/* Start Again */}
            <div className="flex justify-center pb-6">
              <button
                onClick={resetGuidance}
                className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <FiRefreshCw />
                Get New Career Guidance
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}

export default CareerGuidancePage