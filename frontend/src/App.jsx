import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/common/ProtectedRoute.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import HomePage from './pages/public/HomePage.jsx'
import LoginPage from './pages/public/LoginPage.jsx'
import SignupPage from './pages/public/SignupPage.jsx'
import StudentSignupPage from './pages/public/StudentSignupPage.jsx'
import StudentLoginPage from './pages/public/StudentLoginPage.jsx'
import StudentVerifyOtpPage from './pages/student/StudentVerifyOtpPage.jsx'
import ForgotPasswordPage from './pages/student/ForgotPasswordPage.jsx'
import ForgotPasswordVerifyOtpPage from './pages/student/ForgotPasswordVerifyOtpPage.jsx'
import ResetPasswordPage from './pages/student/ResetPasswordPage.jsx'
import StudentDashboard from './pages/student/StudentDashboard.jsx'
import SuperadminLoginPage from './pages/public/SuperadminLoginPage.jsx'
import SuperadminDashboard from './pages/superadmin/SuperadminDashboard.jsx'
import StaffLoginPage from './pages/public/StaffLoginPage.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import TechnicianDashboard from './pages/technician/TechnicianDashboard.jsx'
import { ToastProvider } from './components/ToastProvider.jsx'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />

            <Route path="/student/signup" element={<StudentSignupPage />} />
            <Route path="/student/verify-otp" element={<StudentVerifyOtpPage />} />
            <Route path="/student/forgot-password" element={<ForgotPasswordPage />} />
            <Route
              path="/student/forgot-password/verify-otp"
              element={<ForgotPasswordVerifyOtpPage />}
            />
            <Route path="/student/forgot-password/reset" element={<ResetPasswordPage />} />
            <Route path="/student/login" element={<StudentLoginPage />} />
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={['STUDENT']}
                  redirectTo="/student/login"
                />
              }
            >
              <Route path="/student/*" element={<StudentDashboard />} />
            </Route>

            <Route path="/superadmin/login" element={<SuperadminLoginPage />} />
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={['SUPERADMIN']}
                  redirectTo="/superadmin/login"
                />
              }
            >
              <Route path="/superadmin/dashboard" element={<SuperadminDashboard />} />
            </Route>

            <Route path="/staff/login" element={<StaffLoginPage />} />
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={['ADMIN']}
                  redirectTo="/staff/login"
                />
              }
            >
              <Route path="/admin/*" element={<AdminDashboard />} />
            </Route>
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={['TECHNICIAN']}
                  redirectTo="/staff/login"
                />
              }
            >
              <Route path="/technician/*" element={<TechnicianDashboard />} />
            </Route>

            <Route
              path="/signin"
              element={<Navigate to="/student/login" replace />}
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
