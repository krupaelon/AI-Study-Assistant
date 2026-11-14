import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './layouts/AppLayout'

import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import SubjectsPage from './pages/SubjectsPage'
import UploadNotePage from './pages/UploadNotePage'
import NoteDetailPage from './pages/NoteDetailPage'
import AIChatPage from './pages/AIChatPage'
import QuizPage from './pages/QuizPage'
import FlashcardsPage from './pages/FlashcardsPage'
import StudyPlannerPage from './pages/StudyPlannerPage'
import ProfilePage from './pages/ProfilePage'
import ResumeAnalyzerPage from './pages/ResumeAnalyzerPage'
import MockInterviewPage from './pages/MockInterviewPage'
import NotFoundPage from './pages/NotFoundPage'
import CommunicationFeedbackPage from './pages/CommunicationFeedbackPage'
import CareerGuidancePage from './pages/CareerGuidancePage'
import PerformanceAnalytics from "./pages/PerformanceAnalytics";
import RecommendationEngine from "./pages/RecommendationEngine";

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{ duration: 3500 }}
      />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route path="/subjects" element={<SubjectsPage />} />

          <Route
            path="/subjects/:subjectId/upload"
            element={<UploadNotePage />}
          />

          <Route
            path="/notes/:noteId"
            element={<NoteDetailPage />}
          />
          <Route
            path="/communication-feedback"
            element={<CommunicationFeedbackPage />}
           />

          <Route
            path="/notes/:noteId/chat"
            element={<AIChatPage />}
          />

          <Route
            path="/notes/:noteId/quiz"
            element={<QuizPage />}
          />

          <Route
            path="/notes/:noteId/flashcards"
            element={<FlashcardsPage />}
          />

          <Route
            path="/planner"
            element={<StudyPlannerPage />}
          />

          <Route
            path="/profile"
            element={<ProfilePage />}
          />

          <Route
            path="/resume-analyzer"
            element={<ResumeAnalyzerPage />}
          />

          <Route
            path="/mock-interview"
            element={<MockInterviewPage />}
          />
          <Route
            path="/career-guidance"
            element={<CareerGuidancePage />}
          />
          <Route
            path="/performance"
            element={<PerformanceAnalytics />}
          />
          <Route
            path="/recommendations"
            element={<RecommendationEngine />}
          />
        </Route>

        <Route
          path="*"
          element={<NotFoundPage />}
        />
      </Routes>
    </>
  )
}