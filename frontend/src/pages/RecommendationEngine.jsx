import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function RecommendationEngine() {
  const [targetRole, setTargetRole] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function getRecommendations(e) {
    e.preventDefault()

    try {
      setLoading(true)
      setError('')
      setData(null)

      const token = localStorage.getItem('asa_token')

      const query = targetRole.trim()
        ? `?target_role=${encodeURIComponent(targetRole.trim())}`
        : ''

      const response = await fetch(
        `${API_URL}/api/recommendations/${query}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to generate recommendations.')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Recommendation Engine
        </h1>

        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Get personalized recommendations based on your performance.
        </p>
      </div>

      {/* Target role form */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow p-5">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          Your Career Goal
        </h2>

        <form onSubmit={getRecommendations} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Target Role
            </label>

            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="Example: Software Developer"
              className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading
              ? 'Generating Recommendations...'
              : 'Get Recommendations'}
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-100 text-red-700">
          {error}
        </div>
      )}

      {/* Overall recommendation */}
      {data && (
        <>
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow p-5">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
              Overall Recommendation
            </h2>

            <p className="text-slate-700 dark:text-slate-300">
              {data.overall_recommendation}
            </p>
          </div>

          {/* Individual recommendations */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow p-5">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              Personalized Actions
            </h2>

            <div className="space-y-4">
              {data.recommendations?.map((item, index) => (
                <div
                  key={`${item.category}-${index}`}
                  className="border border-slate-200 dark:border-slate-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <h3 className="font-semibold capitalize text-slate-900 dark:text-white">
                      {item.category}
                    </h3>

                    <span className="text-sm font-medium">
                      Priority: {item.priority}
                    </span>
                  </div>

                  {item.score !== null && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                      Current Score: {item.score}%
                    </p>
                  )}

                  <p className="text-slate-700 dark:text-slate-300">
                    {item.action}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}