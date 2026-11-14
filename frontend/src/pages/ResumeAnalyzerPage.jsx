import { useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

// ============================================================
// SMALL REUSABLE UI COMPONENTS
// ============================================================

function Card({ children, style = {} }) {
  return (
    <div
      style={{
        background: "#ffffff",
        color: "#111827",
        border: "1px solid #e5e7eb",
        borderRadius: "18px",
        padding: "24px",
        boxShadow: "0 8px 25px rgba(0, 0, 0, 0.08)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ icon, title, subtitle }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: subtitle ? "6px" : "0",
        }}
      >
        {icon && (
          <span
            style={{
              fontSize: "22px",
            }}
          >
            {icon}
          </span>
        )}

        <h3
          style={{
            margin: 0,
            fontSize: "19px",
            fontWeight: "700",
            color: "#111827",
          }}
        >
          {title}
        </h3>
      </div>

      {subtitle && (
        <p
          style={{
            margin: 0,
            color: "#6b7280",
            fontSize: "14px",
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

function Badge({ children, type = "blue" }) {
  const styles = {
    blue: {
      background: "#eff6ff",
      color: "#1d4ed8",
      border: "1px solid #bfdbfe",
    },
    green: {
      background: "#ecfdf5",
      color: "#047857",
      border: "1px solid #a7f3d0",
    },
    orange: {
      background: "#fff7ed",
      color: "#c2410c",
      border: "1px solid #fed7aa",
    },
    red: {
      background: "#fef2f2",
      color: "#b91c1c",
      border: "1px solid #fecaca",
    },
    purple: {
      background: "#f5f3ff",
      color: "#6d28d9",
      border: "1px solid #ddd6fe",
    },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "7px 12px",
        borderRadius: "999px",
        fontSize: "13px",
        fontWeight: "600",
        ...styles[type],
      }}
    >
      {children}
    </span>
  );
}

function ScoreBar({ score, color = "#2563eb" }) {
  const safeScore = Math.max(
    0,
    Math.min(100, Number(score) || 0)
  );

  return (
    <div
      style={{
        width: "100%",
        height: "10px",
        background: "#e5e7eb",
        borderRadius: "999px",
        overflow: "hidden",
        marginTop: "14px",
      }}
    >
      <div
        style={{
          width: `${safeScore}%`,
          height: "100%",
          background: color,
          borderRadius: "999px",
          transition: "width 0.5s ease",
        }}
      />
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <p
      style={{
        color: "#9ca3af",
        fontStyle: "italic",
        margin: 0,
      }}
    >
      {text}
    </p>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function ResumeAnalyzerPage() {
  const [file, setFile] = useState(null);
  const [resumeId, setResumeId] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [matching, setMatching] = useState(false);

  const [analysis, setAnalysis] = useState(null);

  const [jobDescription, setJobDescription] = useState("");
  const [jobMatch, setJobMatch] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ============================================================
  // AUTH TOKEN
  // ============================================================

  const getToken = () => {
    return localStorage.getItem("asa_token") || "";
  };

  // ============================================================
  // SAFE RESPONSE READER
  // ============================================================

  const readResponse = async (response) => {
    const text = await response.text();

    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      return {
        detail: text,
      };
    }
  };

  // ============================================================
  // ERROR HANDLER
  // ============================================================

  const getErrorMessage = (data, fallback) => {
    if (!data) {
      return fallback;
    }

    if (typeof data.detail === "string") {
      return data.detail;
    }

    if (Array.isArray(data.detail)) {
      return data.detail
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

          if (item && item.msg) {
            return item.msg;
          }

          return JSON.stringify(item);
        })
        .join(", ");
    }

    if (typeof data.message === "string") {
      return data.message;
    }

    return fallback;
  };

  // ============================================================
  // SELECT FILE
  // ============================================================

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (
      selectedFile.type !== "application/pdf" &&
      !selectedFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please select a PDF resume.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setResumeId(null);
    setAnalysis(null);
    setJobMatch(null);
    setMessage("");
    setError("");
  };

  // ============================================================
  // UPLOAD RESUME
  // ============================================================

  const uploadResume = async () => {
    if (!file) {
      setError("Please select a PDF resume first.");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a PDF file.");
      return;
    }

    setUploading(true);
    setMessage("");
    setError("");
    setAnalysis(null);
    setJobMatch(null);

    try {
      const token = getToken();

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_URL}/api/resume/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Resume upload failed.")
        );
      }

      setResumeId(data.resume_id);

      setMessage(
        `Resume uploaded successfully! Resume ID: ${data.resume_id}`
      );
    } catch (err) {
      setError(err.message || "Resume upload failed.");
    } finally {
      setUploading(false);
    }
  };

  // ============================================================
  // ANALYZE RESUME
  // ============================================================

  const analyzeResume = async () => {
    if (!resumeId) {
      setError("Please upload your resume first.");
      return;
    }

    setAnalyzing(true);
    setMessage("");
    setError("");

    try {
      const token = getToken();

      const response = await fetch(
        `${API_URL}/api/resume/${resumeId}/analyze`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Resume analysis failed.")
        );
      }

      const result =
        typeof data.analysis === "string"
          ? JSON.parse(data.analysis)
          : data.analysis;

      setAnalysis(result);

      setMessage("Resume analyzed successfully!");
    } catch (err) {
      setError(err.message || "Resume analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  // ============================================================
  // MATCH RESUME WITH JOB
  // ============================================================

  const matchResumeToJob = async () => {
    if (!resumeId) {
      setError("Please upload your resume first.");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Please enter a job description.");
      return;
    }

    setMatching(true);
    setMessage("");
    setError("");

    try {
      const token = getToken();

      const url =
        `${API_URL}/api/resume/${resumeId}/match-job` +
        `?job_description=${encodeURIComponent(jobDescription)}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Job matching failed.")
        );
      }

      setJobMatch(data.match_result);

      setMessage("Resume matched with the job successfully!");
    } catch (err) {
      setError(err.message || "Job matching failed.");
    } finally {
      setMatching(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "34px 24px 60px",
        color: "#ffffff",
      }}
    >
      <div
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
        }}
      >
        {/* ======================================================
            HEADER
        ====================================================== */}

        <div style={{ marginBottom: "32px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "7px 12px",
              borderRadius: "999px",
              background: "rgba(37, 99, 235, 0.15)",
              color: "#60a5fa",
              fontSize: "13px",
              fontWeight: "600",
              marginBottom: "14px",
            }}
          >
            ✨ AI Career Tool
          </div>

          <h1
            style={{
              fontSize: "34px",
              fontWeight: "800",
              margin: "0 0 8px",
              color: "#ffffff",
            }}
          >
            AI Resume Analyzer
          </h1>

          <p
            style={{
              margin: 0,
              color: "#9ca3af",
              fontSize: "16px",
              maxWidth: "720px",
              lineHeight: "1.6",
            }}
          >
            Upload your resume to get an AI-powered ATS score,
            career insights, skill analysis, and personalized
            improvement suggestions.
          </p>
        </div>

        {/* ======================================================
            UPLOAD SECTION
        ====================================================== */}

        <Card
          style={{
            marginBottom: "24px",
          }}
        >
          <SectionTitle
            icon="📄"
            title="Upload Your Resume"
            subtitle="Upload your resume in PDF format."
          />

          <div
            style={{
              border: "2px dashed #d1d5db",
              borderRadius: "14px",
              padding: "24px",
              background: "#f9fafb",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                flexWrap: "wrap",
              }}
            >
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "11px 16px",
                  background: "#111827",
                  color: "#ffffff",
                  borderRadius: "9px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                📁 Choose PDF
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </label>

              <span
                style={{
                  color: "#6b7280",
                  fontSize: "14px",
                  wordBreak: "break-word",
                }}
              >
                {file
                  ? file.name
                  : "No resume selected yet"}
              </span>
            </div>

            {file && (
              <div
                style={{
                  marginTop: "18px",
                  padding: "14px 16px",
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: "700",
                      color: "#111827",
                    }}
                  >
                    Selected Resume
                  </div>

                  <div
                    style={{
                      color: "#6b7280",
                      fontSize: "13px",
                      marginTop: "3px",
                    }}
                  >
                    {file.name}
                  </div>
                </div>

                <Badge type="green">
                  PDF
                </Badge>
              </div>
            )}

            <button
              onClick={uploadResume}
              disabled={!file || uploading}
              style={{
                marginTop: "18px",
                padding: "12px 22px",
                border: "none",
                borderRadius: "9px",
                cursor:
                  !file || uploading
                    ? "not-allowed"
                    : "pointer",
                background: "#111827",
                color: "#ffffff",
                fontWeight: "700",
                fontSize: "14px",
                opacity: !file || uploading ? 0.55 : 1,
              }}
            >
              {uploading
                ? "Uploading..."
                : "Upload Resume"}
            </button>
          </div>

          {resumeId && (
            <div
              style={{
                marginTop: "18px",
                padding: "16px",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "12px",
              }}
            >
              <div
                style={{
                  color: "#1e40af",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Resume uploaded successfully
              </div>

              <div
                style={{
                  color: "#374151",
                  fontSize: "13px",
                  marginTop: "4px",
                }}
              >
                Resume ID:{" "}
                <strong>{resumeId}</strong>
              </div>

              <button
                onClick={analyzeResume}
                disabled={analyzing}
                style={{
                  marginTop: "14px",
                  padding: "12px 22px",
                  border: "none",
                  borderRadius: "9px",
                  cursor: analyzing
                    ? "not-allowed"
                    : "pointer",
                  background: "#2563eb",
                  color: "#ffffff",
                  fontWeight: "700",
                  fontSize: "14px",
                  opacity: analyzing ? 0.6 : 1,
                }}
              >
                {analyzing
                  ? "🤖 AI is analyzing..."
                  : "✨ Analyze Resume"}
              </button>
            </div>
          )}
        </Card>

        {/* ======================================================
            SUCCESS / ERROR
        ====================================================== */}

        {message && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "#ecfdf5",
              color: "#065f46",
              border: "1px solid #a7f3d0",
              borderRadius: "12px",
              padding: "14px 16px",
              marginBottom: "22px",
              fontWeight: "600",
            }}
          >
            ✓ {message}
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#fef2f2",
              color: "#991b1b",
              border: "1px solid #fecaca",
              borderRadius: "12px",
              padding: "14px 16px",
              marginBottom: "22px",
              fontWeight: "600",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* ======================================================
            AI ANALYSIS
        ====================================================== */}

        {analysis && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "15px",
                flexWrap: "wrap",
                marginBottom: "18px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "26px",
                    fontWeight: "800",
                    color: "#ffffff",
                  }}
                >
                  AI Resume Analysis
                </h2>

                <p
                  style={{
                    margin: "5px 0 0",
                    color: "#9ca3af",
                    fontSize: "14px",
                  }}
                >
                  AI-generated insights from your resume
                </p>
              </div>

              <Badge type="purple">
                🤖 AI Generated
              </Badge>
            </div>

            {/* ==================================================
                ATS SCORE + SUMMARY
            ================================================== */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(240px, 0.8fr) minmax(300px, 1.8fr)",
                gap: "20px",
                marginBottom: "20px",
              }}
            >
              {/* SCORE */}

              <Card
                style={{
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    color: "#6b7280",
                    fontSize: "14px",
                    fontWeight: "600",
                    marginBottom: "10px",
                  }}
                >
                  ATS COMPATIBILITY SCORE
                </div>

                <div
                  style={{
                    fontSize: "58px",
                    lineHeight: "1",
                    fontWeight: "900",
                    color: "#2563eb",
                  }}
                >
                  {analysis.ats_score}
                  <span
                    style={{
                      fontSize: "22px",
                      color: "#9ca3af",
                      fontWeight: "600",
                    }}
                  >
                    /100
                  </span>
                </div>

                <ScoreBar
                  score={analysis.ats_score}
                  color="#2563eb"
                />

                <div
                  style={{
                    marginTop: "12px",
                    color: "#6b7280",
                    fontSize: "13px",
                  }}
                >
                  Overall resume strength for ATS systems
                </div>
              </Card>

              {/* SUMMARY */}

              <Card>
                <SectionTitle
                  icon="👤"
                  title="Professional Summary"
                />

                <p
                  style={{
                    margin: 0,
                    lineHeight: "1.8",
                    color: "#374151",
                    fontSize: "15px",
                  }}
                >
                  {analysis.summary}
                </p>
              </Card>
            </div>

            {/* ==================================================
                SKILLS
            ================================================== */}

            <Card style={{ marginBottom: "20px" }}>
              <SectionTitle
                icon="🛠️"
                title="Skills Detected"
                subtitle={`${(analysis.skills || []).length} skills identified from your resume`}
              />

              {analysis.skills?.length ? (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "9px",
                  }}
                >
                  {analysis.skills.map((skill, index) => (
                    <Badge key={index} type="blue">
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <EmptyState text="No skills detected." />
              )}
            </Card>

            {/* ==================================================
                STRENGTHS + WEAKNESSES
            ================================================== */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "20px",
                marginBottom: "20px",
              }}
            >
              {/* STRENGTHS */}

              <Card>
                <SectionTitle
                  icon="💪"
                  title="Your Strengths"
                />

                {analysis.strengths?.length ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {analysis.strengths.map(
                      (item, index) => (
                        <div
                          key={index}
                          style={{
                            display: "flex",
                            gap: "10px",
                            alignItems: "flex-start",
                          }}
                        >
                          <span
                            style={{
                              minWidth: "24px",
                              height: "24px",
                              borderRadius: "50%",
                              background: "#dcfce7",
                              color: "#15803d",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "13px",
                              fontWeight: "800",
                            }}
                          >
                            ✓
                          </span>

                          <span
                            style={{
                              color: "#374151",
                              lineHeight: "1.6",
                              fontSize: "14px",
                            }}
                          >
                            {item}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <EmptyState text="No strengths detected." />
                )}
              </Card>

              {/* WEAKNESSES */}

              <Card>
                <SectionTitle
                  icon="🔧"
                  title="Areas to Improve"
                />

                {analysis.weaknesses?.length ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {analysis.weaknesses.map(
                      (item, index) => (
                        <div
                          key={index}
                          style={{
                            display: "flex",
                            gap: "10px",
                            alignItems: "flex-start",
                          }}
                        >
                          <span
                            style={{
                              minWidth: "24px",
                              height: "24px",
                              borderRadius: "50%",
                              background: "#fff7ed",
                              color: "#ea580c",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "13px",
                              fontWeight: "800",
                            }}
                          >
                            !
                          </span>

                          <span
                            style={{
                              color: "#374151",
                              lineHeight: "1.6",
                              fontSize: "14px",
                            }}
                          >
                            {item}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <EmptyState text="No improvement areas detected." />
                )}
              </Card>
            </div>

            {/* ==================================================
                MISSING SKILLS
            ================================================== */}

            <Card style={{ marginBottom: "20px" }}>
              <SectionTitle
                icon="🎯"
                title="Missing / Recommended Skills"
                subtitle="Skills that could improve your employability"
              />

              {analysis.missing_skills?.length ? (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "9px",
                  }}
                >
                  {analysis.missing_skills.map(
                    (skill, index) => (
                      <Badge key={index} type="orange">
                        + {skill}
                      </Badge>
                    )
                  )}
                </div>
              ) : (
                <EmptyState text="No major missing skills identified." />
              )}
            </Card>

            {/* ==================================================
                SUGGESTIONS
            ================================================== */}

            <Card style={{ marginBottom: "20px" }}>
              <SectionTitle
                icon="💡"
                title="Personalized Suggestions"
                subtitle="AI-generated actions to improve your resume"
              />

              {analysis.suggestions?.length ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {analysis.suggestions.map(
                    (suggestion, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          gap: "14px",
                          padding: "14px",
                          background: "#f9fafb",
                          border: "1px solid #e5e7eb",
                          borderRadius: "12px",
                        }}
                      >
                        <div
                          style={{
                            minWidth: "30px",
                            height: "30px",
                            borderRadius: "8px",
                            background: "#ede9fe",
                            color: "#6d28d9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "800",
                            fontSize: "13px",
                          }}
                        >
                          {index + 1}
                        </div>

                        <div
                          style={{
                            color: "#374151",
                            lineHeight: "1.6",
                            fontSize: "14px",
                          }}
                        >
                          {suggestion}
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <EmptyState text="No suggestions available." />
              )}
            </Card>

            {/* ==================================================
                RECOMMENDED ROLES
            ================================================== */}

            <Card style={{ marginBottom: "30px" }}>
              <SectionTitle
                icon="💼"
                title="Recommended Career Roles"
                subtitle="Roles that match your current profile"
              />

              {analysis.recommended_roles?.length ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(210px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {analysis.recommended_roles.map(
                    (role, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "16px",
                          borderRadius: "12px",
                          background: "#f5f3ff",
                          border: "1px solid #ddd6fe",
                          color: "#4c1d95",
                          fontWeight: "700",
                          fontSize: "14px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "20px",
                            marginBottom: "8px",
                          }}
                        >
                          💼
                        </div>

                        {role}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <EmptyState text="No recommended roles available." />
              )}
            </Card>
          </>
        )}

        {/* ======================================================
            JOB MATCHING
        ====================================================== */}

        {resumeId && (
          <>
            <div
              style={{
                marginBottom: "18px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "26px",
                  fontWeight: "800",
                  color: "#ffffff",
                }}
              >
                Job Matching
              </h2>

              <p
                style={{
                  margin: "6px 0 0",
                  color: "#9ca3af",
                  fontSize: "14px",
                }}
              >
                Compare your resume against a specific job
                description.
              </p>
            </div>

            <Card style={{ marginBottom: "30px" }}>
              <SectionTitle
                icon="🎯"
                title="Match Resume With Job"
                subtitle="Paste a job description and let AI identify your fit."
              />

              <textarea
                value={jobDescription}
                onChange={(event) =>
                  setJobDescription(event.target.value)
                }
                placeholder="Example: We are looking for a Junior Software Developer with skills in Java, Python, SQL, REST APIs, Git, and problem solving..."
                rows={8}
                style={{
                  width: "100%",
                  padding: "15px",
                  border: "1px solid #d1d5db",
                  borderRadius: "12px",
                  resize: "vertical",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  boxSizing: "border-box",
                  color: "#111827",
                  background: "#f9fafb",
                  outline: "none",
                }}
              />

              <button
                onClick={matchResumeToJob}
                disabled={matching}
                style={{
                  marginTop: "14px",
                  padding: "12px 22px",
                  border: "none",
                  borderRadius: "9px",
                  cursor: matching
                    ? "not-allowed"
                    : "pointer",
                  background: "#059669",
                  color: "#ffffff",
                  fontWeight: "700",
                  fontSize: "14px",
                  opacity: matching ? 0.6 : 1,
                }}
              >
                {matching
                  ? "🤖 Matching..."
                  : "🔍 Match Resume With Job"}
              </button>
            </Card>
          </>
        )}

        {/* ======================================================
            JOB MATCH RESULT
        ====================================================== */}

        {jobMatch && (
          <>
            <div
              style={{
                marginBottom: "18px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "26px",
                  fontWeight: "800",
                  color: "#ffffff",
                }}
              >
                Job Match Result
              </h2>

              <p
                style={{
                  margin: "6px 0 0",
                  color: "#9ca3af",
                  fontSize: "14px",
                }}
              >
                AI comparison between your resume and the
                selected job.
              </p>
            </div>

            {/* MATCH SCORE */}

            <Card
              style={{
                marginBottom: "20px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  color: "#6b7280",
                  fontSize: "13px",
                  fontWeight: "700",
                  letterSpacing: "0.5px",
                }}
              >
                JOB MATCH SCORE
              </div>

              <div
                style={{
                  fontSize: "58px",
                  lineHeight: "1",
                  fontWeight: "900",
                  color:
                    Number(jobMatch.match_score) >= 75
                      ? "#059669"
                      : Number(jobMatch.match_score) >= 50
                      ? "#d97706"
                      : "#dc2626",
                  marginTop: "10px",
                }}
              >
                {jobMatch.match_score}
                <span
                  style={{
                    fontSize: "22px",
                    color: "#9ca3af",
                    fontWeight: "600",
                  }}
                >
                  /100
                </span>
              </div>

              <div
                style={{
                  maxWidth: "650px",
                  margin: "0 auto",
                }}
              >
                <ScoreBar
                  score={jobMatch.match_score}
                  color={
                    Number(jobMatch.match_score) >= 75
                      ? "#059669"
                      : Number(jobMatch.match_score) >= 50
                      ? "#d97706"
                      : "#dc2626"
                  }
                />
              </div>

              <p
                style={{
                  margin: "12px 0 0",
                  color: "#6b7280",
                  fontSize: "13px",
                }}
              >
                {Number(jobMatch.match_score) >= 75
                  ? "Strong match for this role."
                  : Number(jobMatch.match_score) >= 50
                  ? "Moderate match. Some improvements are recommended."
                  : "Low match. Consider developing the missing skills."}
              </p>
            </Card>

            {/* MATCHING + MISSING SKILLS */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "20px",
                marginBottom: "20px",
              }}
            >
              {/* MATCHING SKILLS */}

              <Card>
                <SectionTitle
                  icon="✅"
                  title="Matching Skills"
                  subtitle="Skills found in both your resume and the job"
                />

                {jobMatch.matching_skills?.length ? (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "9px",
                    }}
                  >
                    {jobMatch.matching_skills.map(
                      (skill, index) => (
                        <Badge key={index} type="green">
                          ✓ {skill}
                        </Badge>
                      )
                    )}
                  </div>
                ) : (
                  <EmptyState text="No matching skills identified." />
                )}
              </Card>

              {/* MISSING SKILLS */}

              <Card>
                <SectionTitle
                  icon="⚠️"
                  title="Missing Skills"
                  subtitle="Important requirements not clearly present"
                />

                {jobMatch.missing_skills?.length ? (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "9px",
                    }}
                  >
                    {jobMatch.missing_skills.map(
                      (skill, index) => (
                        <Badge key={index} type="orange">
                          + {skill}
                        </Badge>
                      )
                    )}
                  </div>
                ) : (
                  <EmptyState text="No major missing skills identified." />
                )}
              </Card>
            </div>

            {/* ==================================================
                MATCHING EXPERIENCE
            ================================================== */}

            <Card style={{ marginBottom: "20px" }}>
              <SectionTitle
                icon="🧩"
                title="Matching Experience"
                subtitle="Projects and experience relevant to this job"
              />

              {jobMatch.matching_experience?.length ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {jobMatch.matching_experience.map(
                    (experience, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "15px",
                          background: "#f9fafb",
                          border: "1px solid #e5e7eb",
                          borderRadius: "12px",
                          color: "#374151",
                          lineHeight: "1.6",
                          fontSize: "14px",
                        }}
                      >
                        <strong
                          style={{
                            color: "#2563eb",
                            marginRight: "8px",
                          }}
                        >
                          {index + 1}.
                        </strong>

                        {experience}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <EmptyState text="No matching experience identified." />
              )}
            </Card>

            {/* ==================================================
                JOB RECOMMENDATIONS
            ================================================== */}

            <Card style={{ marginBottom: "20px" }}>
              <SectionTitle
                icon="💡"
                title="Recommendations"
                subtitle="How you can improve your resume for this job"
              />

              {jobMatch.recommendations?.length ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {jobMatch.recommendations.map(
                    (recommendation, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          gap: "14px",
                          padding: "14px",
                          background: "#f9fafb",
                          border: "1px solid #e5e7eb",
                          borderRadius: "12px",
                        }}
                      >
                        <div
                          style={{
                            minWidth: "30px",
                            height: "30px",
                            borderRadius: "8px",
                            background: "#dcfce7",
                            color: "#15803d",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "800",
                            fontSize: "13px",
                          }}
                        >
                          {index + 1}
                        </div>

                        <div
                          style={{
                            color: "#374151",
                            lineHeight: "1.6",
                            fontSize: "14px",
                          }}
                        >
                          {recommendation}
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <EmptyState text="No recommendations available." />
              )}
            </Card>

            {/* ==================================================
                JOB FIT SUMMARY
            ================================================== */}

            {jobMatch.job_fit_summary && (
              <Card
                style={{
                  marginBottom: "40px",
                  background:
                    "linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)",
                  border: "1px solid #c7d2fe",
                }}
              >
                <SectionTitle
                  icon="📌"
                  title="Job Fit Summary"
                />

                <p
                  style={{
                    margin: 0,
                    color: "#374151",
                    lineHeight: "1.8",
                    fontSize: "15px",
                  }}
                >
                  {jobMatch.job_fit_summary}
                </p>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}