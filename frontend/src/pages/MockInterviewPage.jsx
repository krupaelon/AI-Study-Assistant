import { useState } from "react";
import {
  FiMic,
  FiPlay,
  FiChevronRight,
  FiCheckCircle,
  FiBriefcase,
  FiFileText,
  FiBarChart2,
  FiAlertCircle,
  FiTrendingUp,
} from "react-icons/fi";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

function MockInterviewPage() {
  const [resumeId, setResumeId] = useState("");
  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [numQuestions, setNumQuestions] = useState(5);

  const [interview, setInterview] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState([]);

  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("asa_token");

  // ================================
  // START INTERVIEW
  // ================================
  const startInterview = async () => {
    setError("");

    if (!resumeId || !role.trim()) {
      setError("Please enter your Resume ID and target role.");
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams({
        resume_id: resumeId,
        role: role.trim(),
        difficulty,
        num_questions: numQuestions,
      });

      const response = await fetch(
        `${API_URL}/api/interview/start?${params.toString()}`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to start mock interview."
        );
      }

      setInterview(data.interview);
      setCurrentQuestion(0);
      setAnswer("");
      setAnswers([]);
      setEvaluation(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // SAVE ANSWER
  // ================================
  const saveAnswerAndNext = () => {
    if (!answer.trim()) {
      setError("Please enter your answer before continuing.");
      return;
    }

    setError("");

    const current = interview.questions[currentQuestion];

    const updatedAnswers = [
      ...answers,
      {
        question_number: current.question_number,
        question: current.question,
        answer: answer.trim(),
      },
    ];

    setAnswers(updatedAnswers);
    setAnswer("");

    if (currentQuestion < interview.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setCurrentQuestion(interview.questions.length);
    }
  };

  // ================================
  // EVALUATE INTERVIEW
  // ================================
  const evaluateInterview = async () => {
    setError("");
    setEvaluating(true);

    try {
      const response = await fetch(
        `${API_URL}/api/interview/evaluate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            role: interview.role,
            questions: interview.questions,
            answers: answers,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to evaluate interview."
        );
      }

      setEvaluation(data.evaluation);
    } catch (err) {
      setError(err.message);
    } finally {
      setEvaluating(false);
    }
  };

  // ================================
  // RESTART
  // ================================
  const restartInterview = () => {
    setInterview(null);
    setCurrentQuestion(0);
    setAnswer("");
    setAnswers([]);
    setEvaluation(null);
    setError("");
  };

  // ================================
  // START SCREEN
  // ================================
  if (!interview) {
    return (
      <div className="min-h-screen bg-gray-100 px-6 py-8">
        <div className="mx-auto max-w-4xl">

          <div className="mb-8">
            <div className="mb-3 flex items-center gap-3">

              <div className="rounded-xl bg-indigo-100 p-3">
                <FiMic className="text-2xl text-indigo-600" />
              </div>

              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Mock Interview
                </h1>

                <p className="text-gray-600">
                  Practice interview questions based on your resume.
                </p>
              </div>

            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-md">

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900">
                Start a New Interview
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                Choose your resume, target role and interview difficulty.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">

              {/* Resume ID */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800">
                  Resume ID
                </label>

                <div className="relative">
                  <FiFileText className="absolute left-3 top-3.5 text-gray-400" />

                  <input
                    type="number"
                    value={resumeId}
                    onChange={(e) => setResumeId(e.target.value)}
                    placeholder="Example: 1"
                    className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <p className="mt-1 text-xs text-gray-500">
                  Use the Resume ID from Resume Analyzer.
                </p>
              </div>

              {/* Target Role */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800">
                  Target Role
                </label>

                <div className="relative">
                  <FiBriefcase className="absolute left-3 top-3.5 text-gray-400" />

                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Example: Python Developer"
                    className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800">
                  Difficulty
                </label>

                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              {/* Number of Questions */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800">
                  Number of Questions
                </label>

                <select
                  value={numQuestions}
                  onChange={(e) =>
                    setNumQuestions(Number(e.target.value))
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value={3}>3 Questions</option>
                  <option value={5}>5 Questions</option>
                  <option value={7}>7 Questions</option>
                  <option value={10}>10 Questions</option>
                </select>
              </div>

            </div>

            {error && (
              <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              onClick={startInterview}
              disabled={loading}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiPlay />

              {loading
                ? "Generating Interview..."
                : "Start Mock Interview"}
            </button>

          </div>
        </div>
      </div>
    );
  }

  // ================================
  // COMPLETED SCREEN
  // ================================
  if (currentQuestion >= interview.questions.length) {
    return (
      <div className="min-h-screen bg-gray-100 px-6 py-8">
        <div className="mx-auto max-w-5xl">

          {!evaluation ? (
            <div className="flex min-h-[70vh] items-center justify-center">

              <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-md">

                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <FiCheckCircle className="text-3xl text-green-600" />
                </div>

                <h1 className="text-3xl font-bold text-gray-900">
                  Interview Completed!
                </h1>

                <p className="mt-3 text-gray-600">
                  You have answered all {interview.questions.length} questions.
                </p>

                {error && (
                  <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-left text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  onClick={evaluateInterview}
                  disabled={evaluating}
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FiBarChart2 />

                  {evaluating
                    ? "Evaluating Your Answers..."
                    : "Evaluate My Interview"}
                </button>

              </div>
            </div>
          ) : (
            <div>

              {/* Evaluation Header */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Interview Evaluation
                  </h1>

                  <p className="mt-1 text-sm text-gray-600">
                    AI evaluation for {interview.role}
                  </p>
                </div>

                <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-indigo-50">
                  <span className="text-4xl font-bold text-indigo-600">
                    {evaluation.overall_score}
                  </span>

                  <span className="text-sm text-gray-500">
                    / 100
                  </span>
                </div>
              </div>

              {/* Overall Feedback */}
              <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900">
                  Overall Feedback
                </h2>

                <p className="mt-3 leading-relaxed text-gray-600">
                  {evaluation.overall_feedback}
                </p>
              </div>

              {/* Strengths and Weaknesses */}
              <div className="grid gap-6 md:grid-cols-2">

                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <FiCheckCircle className="text-xl text-green-600" />

                    <h2 className="text-xl font-semibold text-gray-900">
                      Strengths
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {evaluation.strengths?.map((item, index) => (
                      <div
                        key={index}
                        className="rounded-xl bg-green-50 p-4 text-sm leading-relaxed text-gray-700"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <FiAlertCircle className="text-xl text-orange-500" />

                    <h2 className="text-xl font-semibold text-gray-900">
                      Areas to Improve
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {evaluation.weaknesses?.map((item, index) => (
                      <div
                        key={index}
                        className="rounded-xl bg-orange-50 p-4 text-sm leading-relaxed text-gray-700"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Improvement Suggestions */}
              <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">

                <div className="mb-5 flex items-center gap-2">
                  <FiTrendingUp className="text-xl text-indigo-600" />

                  <h2 className="text-xl font-semibold text-gray-900">
                    Improvement Suggestions
                  </h2>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {evaluation.improvement_suggestions?.map(
                    (item, index) => (
                      <div
                        key={index}
                        className="rounded-xl bg-indigo-50 p-4 text-sm leading-relaxed text-gray-700"
                      >
                        {item}
                      </div>
                    )
                  )}
                </div>

              </div>

              {/* Question-wise Feedback */}
              <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">

                <div className="mb-6 flex items-center gap-2">
                  <FiBarChart2 className="text-xl text-indigo-600" />

                  <h2 className="text-xl font-semibold text-gray-900">
                    Question-wise Feedback
                  </h2>
                </div>

                <div className="space-y-5">
                  {evaluation.question_feedback?.map(
                    (item, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-gray-100 p-5"
                      >

                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

                          <h3 className="font-semibold text-gray-900">
                            Question {item.question_number}
                          </h3>

                          <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-600">
                            {item.score}/100
                          </span>

                        </div>

                        <p className="mt-4 text-sm leading-relaxed text-gray-600">
                          <strong>Feedback:</strong>{" "}
                          {item.feedback}
                        </p>

                        <p className="mt-3 text-sm leading-relaxed text-gray-600">
                          <strong>What was good:</strong>{" "}
                          {item.what_was_good}
                        </p>

                        <p className="mt-3 text-sm leading-relaxed text-gray-600">
                          <strong>What to improve:</strong>{" "}
                          {item.what_to_improve}
                        </p>

                      </div>
                    )
                  )}
                </div>

              </div>

              {/* Restart */}
              <div className="flex justify-center py-8">

                <button
                  onClick={restartInterview}
                  className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
                >
                  Start Another Interview
                </button>

              </div>

            </div>
          )}

        </div>
      </div>
    );
  }

  // ================================
  // QUESTION SCREEN
  // ================================
  const question = interview.questions[currentQuestion];

  const progress =
    ((currentQuestion + 1) / interview.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-8">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div>

            <div className="flex items-center gap-2">

              <FiMic className="text-xl text-indigo-600" />

              <h1 className="text-2xl font-bold text-gray-900">
                Mock Interview
              </h1>

            </div>

            <p className="mt-1 text-sm text-gray-600">
              {interview.role} ·{" "}
              <span className="capitalize">
                {interview.difficulty}
              </span>
            </p>

          </div>

          <div className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm">
            Question {currentQuestion + 1} of{" "}
            {interview.questions.length}
          </div>

        </div>

        {/* Progress */}
        <div className="mb-6 h-2 overflow-hidden rounded-full bg-gray-200">

          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />

        </div>

        {/* Question Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-md">

          <div className="mb-6 flex items-center justify-between">

            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">
              {question.type}
            </span>

            <span className="text-sm text-gray-400">
              {question.question_number} /{" "}
              {interview.questions.length}
            </span>

          </div>

          <h2 className="text-2xl font-semibold leading-relaxed text-gray-900">
            {question.question}
          </h2>

          {/* Expected Focus */}
          <div className="mt-6 rounded-xl bg-gray-50 p-4">

            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              What the interviewer is looking for
            </p>

            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              {question.expected_focus}
            </p>

          </div>

          {/* Answer */}
          <div className="mt-8">

            <label className="mb-2 block text-sm font-semibold text-gray-800">
              Your Answer
            </label>

            <textarea
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value);
                setError("");
              }}
              placeholder="Type your answer here..."
              rows={8}
              className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-4 text-gray-900 placeholder:text-gray-400 leading-relaxed outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />

          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Next Button */}
          <div className="mt-6 flex justify-end">

            <button
              onClick={saveAnswerAndNext}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
            >

              {currentQuestion === interview.questions.length - 1
                ? "Finish Interview"
                : "Next Question"}

              <FiChevronRight />

            </button>

          </div>

        </div>
      </div>
    </div>
  );
}

export default MockInterviewPage;