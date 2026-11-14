import { useEffect, useState } from "react";
import {
  FiBarChart2,
  FiAward,
  FiTarget,
  FiActivity,
  FiTrendingUp,
} from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function PerformanceAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("asa_token");

      const response = await fetch(`${API_URL}/api/performance/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch performance data.");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Performance Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Track your academic and career preparation performance.
          </p>
        </div>

        <div className="card flex items-center justify-center py-16">
          <div className="text-center">
            <FiActivity
              size={32}
              className="mx-auto text-primary animate-pulse mb-3"
            />
            <p className="text-slate-500 dark:text-slate-400">
              Loading performance data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Performance Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Track your academic and career preparation performance.
          </p>
        </div>

        <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-5">
          <p className="font-medium text-red-700 dark:text-red-400">
            {error}
          </p>
        </div>
      </div>
    );
  }

  const summaryCards = [
    {
      title: "Total Attempts",
      value: data?.total_records ?? 0,
      icon: FiActivity,
      iconStyle:
        "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    },
    {
      title: "Average Score",
      value: `${data?.average_score ?? 0}%`,
      icon: FiTrendingUp,
      iconStyle:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    },
    {
      title: "Weakest Area",
      value: data?.weakest_category?.category || "No data",
      subtitle: data?.weakest_category
        ? `Average: ${data.weakest_category.average_score}%`
        : null,
      icon: FiTarget,
      iconStyle:
        "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    },
  ];

  return (
    <div className="space-y-7">
      {/* Page heading */}
      <div>
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <FiBarChart2 size={21} />
          </div>

          <div>
            <h1 className="page-title">Performance Analytics</h1>

            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Track your academic and career preparation performance.
            </p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map(
          ({ title, value, subtitle, icon: Icon, iconStyle }) => (
            <div
              key={title}
              className="card hover:-translate-y-1 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`h-11 w-11 rounded-xl flex items-center justify-center ${iconStyle}`}
                >
                  <Icon size={19} />
                </div>

                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                  Performance
                </span>
              </div>

              <div className="mt-5">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {title}
                </p>

                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 capitalize">
                  {value}
                </p>

                {subtitle && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          )
        )}
      </div>

      {/* Best performing area */}
      {data?.best_category && (
        <div className="card">
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 flex items-center justify-center shrink-0">
              <FiAward size={20} />
            </div>

            <div>
              <p className="section-label">Top Performance</p>

              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                Best Performing Area
              </h2>

              <p className="text-lg font-semibold text-primary capitalize mt-2">
                {data.best_category.category}
              </p>

              <div className="flex flex-wrap gap-5 mt-2">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Average Score:{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {data.best_category.average_score}%
                  </span>
                </p>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Best Score:{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {data.best_category.best_score}%
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category performance */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <FiBarChart2 size={18} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Category Performance
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              See how you are performing across different activities.
            </p>
          </div>
        </div>

        {data?.category_summary?.length > 0 ? (
          <div className="space-y-6">
            {data.category_summary.map((item) => (
              <div key={item.category}>
                <div className="flex items-center justify-between mb-2">
                  <span className="capitalize font-semibold text-slate-700 dark:text-slate-200">
                    {item.category}
                  </span>

                  <span className="font-bold text-slate-900 dark:text-white">
                    {item.average_score}%
                  </span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-primary h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(item.average_score, 100)}%`,
                    }}
                  />
                </div>

                <div className="flex justify-between mt-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Attempts: {item.attempts}
                  </p>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Best: {item.best_score}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <FiBarChart2
              size={32}
              className="mx-auto text-slate-300 dark:text-slate-600 mb-3"
            />

            <p className="text-slate-500 dark:text-slate-400">
              No performance data available yet.
            </p>
          </div>
        )}
      </div>

      {/* Recent attempts */}
      <div className="card !p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Recent Attempts
          </h2>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Your latest academic and career activities.
          </p>
        </div>

        {data?.recent_records?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Category
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Title
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Score
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {data.recent_records.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-slate-100 dark:border-slate-800 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold capitalize">
                        {record.category}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {record.title || "-"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {record.score}%
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {record.created_at
                        ? new Date(
                            record.created_at
                          ).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-slate-500 dark:text-slate-400">
              No recent attempts available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PerformanceAnalytics;