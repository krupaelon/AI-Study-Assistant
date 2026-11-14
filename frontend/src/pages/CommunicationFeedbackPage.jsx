import { useState } from "react";
import {
  FiMessageSquare,
  FiCheckCircle,
  FiAlertCircle,
  FiTrendingUp,
  FiAward,
  FiRefreshCw,
} from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function CommunicationFeedbackPage() {
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyzeCommunication = async () => {
    setError("");
    setFeedback(null);

    if (!answer.trim()) {
      setError("Please enter an interview answer first.");
      return;
    }

    if (answer.trim().length < 10) {
      setError("Please enter a longer answer for meaningful feedback.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("asa_token");

      const response = await fetch(
        `${API_URL}/api/communication/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            answer: answer.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to analyze communication."
        );
      }

      setFeedback(data.feedback);
    } catch (err) {
      setError(
        err.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setAnswer("");
    setFeedback(null);
    setError("");
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBackground = (score) => {
    if (score >= 80) return "bg-green-50 border-green-200";
    if (score >= 60) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  const ScoreCard = ({ title, score, icon }) => (
    <div
      className={`rounded-xl border p-5 ${getScoreBackground(score)}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">
            {title}
          </p>

          <p
            className={`mt-2 text-3xl font-bold ${getScoreColor(
              score
            )}`}
          >
            {score}
            <span className="text-base text-gray-500">/100</span>
          </p>
        </div>

        <div className="rounded-full bg-white p-3 shadow-sm">
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-600 p-3 text-white">
              <FiMessageSquare size={24} />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Communication Feedback
              </h1>

              <p className="mt-1 text-gray-600">
                Improve your interview communication with AI-powered
                feedback.
              </p>
            </div>
          </div>
        </div>

        {/* Input Section */}
        {!feedback && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-md">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-gray-900">
                Enter Your Interview Answer
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Paste or type an answer you would normally give during
                an interview.
              </p>
            </div>

            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Example: Tell me about yourself..."
              rows={10}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />

            <div className="mt-2 flex justify-between text-sm text-gray-500">
              <span>
                {answer.trim().length} characters
              </span>

              <span>
                Minimum 10 characters
              </span>
            </div>

            {error && (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                <FiAlertCircle className="mt-0.5 flex-shrink-0" />

                <p className="text-sm">
                  {error}
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={analyzeCommunication}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <FiRefreshCw className="animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FiTrendingUp />
                    Analyze Communication
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {feedback && (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="rounded-2xl border border-indigo-200 bg-white p-8 shadow-md">
              <div className="text-center">
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-indigo-50">
                  <div>
                    <p
                      className={`text-4xl font-bold ${getScoreColor(
                        feedback.overall_score
                      )}`}
                    >
                      {feedback.overall_score}
                    </p>

                    <p className="text-xs text-gray-500">
                      / 100
                    </p>
                  </div>
                </div>

                <h2 className="mt-4 text-2xl font-bold text-gray-900">
                  Overall Communication Score
                </h2>

                <p className="mt-2 text-gray-600">
                  Your AI-generated communication assessment
                </p>
              </div>
            </div>

            {/* Score Cards */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <ScoreCard
                title="Clarity"
                score={feedback.clarity_score}
                icon={
                  <FiMessageSquare
                    className="text-indigo-600"
                    size={22}
                  />
                }
              />

              <ScoreCard
                title="Grammar"
                score={feedback.grammar_score}
                icon={
                  <FiCheckCircle
                    className="text-green-600"
                    size={22}
                  />
                }
              />

              <ScoreCard
                title="Confidence"
                score={feedback.confidence_score}
                icon={
                  <FiTrendingUp
                    className="text-blue-600"
                    size={22}
                  />
                }
              />

              <ScoreCard
                title="Professionalism"
                score={feedback.professionalism_score}
                icon={
                  <FiAward
                    className="text-purple-600"
                    size={22}
                  />
                }
              />
            </div>

            {/* Strengths and Improvements */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-green-50 p-2">
                    <FiCheckCircle
                      className="text-green-600"
                      size={20}
                    />
                  </div>

                  <h2 className="text-lg font-semibold text-gray-900">
                    Strengths
                  </h2>
                </div>

                {feedback.strengths?.length > 0 ? (
                  <ul className="space-y-3">
                    {feedback.strengths.map((item, index) => (
                      <li
                        key={index}
                        className="flex gap-3 text-gray-700"
                      >
                        <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">
                    No specific strengths were identified.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-yellow-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-yellow-50 p-2">
                    <FiAlertCircle
                      className="text-yellow-600"
                      size={20}
                    />
                  </div>

                  <h2 className="text-lg font-semibold text-gray-900">
                    Areas for Improvement
                  </h2>
                </div>

                {feedback.areas_for_improvement?.length > 0 ? (
                  <ul className="space-y-3">
                    {feedback.areas_for_improvement.map(
                      (item, index) => (
                        <li
                          key={index}
                          className="flex gap-3 text-gray-700"
                        >
                          <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-yellow-500" />
                          <span>{item}</span>
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="text-gray-500">
                    No specific improvement areas were identified.
                  </p>
                )}
              </div>
            </div>

            {/* Suggestions */}
            <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2">
                  <FiTrendingUp
                    className="text-blue-600"
                    size={20}
                  />
                </div>

                <h2 className="text-lg font-semibold text-gray-900">
                  AI Improvement Suggestions
                </h2>
              </div>

              {feedback.suggestions?.length > 0 ? (
                <div className="space-y-3">
                  {feedback.suggestions.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-xl bg-blue-50 p-4 text-gray-700"
                    >
                      <span className="font-semibold text-blue-700">
                        Tip {index + 1}:
                      </span>{" "}
                      {item}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">
                  No additional suggestions were provided.
                </p>
              )}
            </div>

            {/* Improved Answer */}
            <div className="rounded-2xl border border-purple-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-purple-50 p-2">
                  <FiAward
                    className="text-purple-600"
                    size={20}
                  />
                </div>

                <h2 className="text-lg font-semibold text-gray-900">
                  Improved Version of Your Answer
                </h2>
              </div>

              <div className="rounded-xl bg-purple-50 p-5 text-gray-800 leading-7">
                {feedback.improved_answer}
              </div>
            </div>

            {/* Try Again */}
            <div className="flex justify-center pb-6">
              <button
                onClick={resetAnalysis}
                className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <FiRefreshCw />
                Analyze Another Answer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}