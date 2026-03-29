import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import StudentSignupPage from './pages/student/StudentSignupPage.jsx'
import StudentLoginPage from './pages/student/StudentLoginPage.jsx'
import StudentDashboard from './pages/student/StudentDashboard.jsx'
import SuperadminLoginPage from './pages/superadmin/SuperadminLoginPage.jsx'
import SuperadminDashboard from './pages/superadmin/SuperadminDashboard.jsx'
import StaffLoginPage from './pages/staff/StaffLoginPage.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import TechnicianDashboard from './pages/technician/TechnicianDashboard.jsx'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/student/signup" element={<StudentSignupPage />} />
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
            <Route
              path="/superadmin/dashboard"
              element={<SuperadminDashboard />}
            />
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
    </BrowserRouter>
  )
}

export default App
