import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import ContractTermsPage from './pages/ContractTermsPage'
import SalaryPage from './pages/SalaryPage'
import LeavePage from './pages/LeavePage'
import ActivityLogPage from './pages/ActivityLogPage'
import PayslipPage from './pages/PayslipPage'
import AdminPage from './pages/AdminPage'
import MessagesPage from './pages/MessagesPage'
import MarketplacePage from './pages/MarketplacePage'
import EmployerAccessPage from './pages/EmployerAccessPage'
import SignupPage from './pages/SignupPage'
import HelperAccessPage from './pages/HelperAccessPage'
import AgencyWorkspacePage from './pages/AgencyWorkspacePage'
import ValidatorPage from './pages/ValidatorPage'
import RequireAuth from './components/RequireAuth'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 })
  }, [pathname])

  return null
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/helpers" element={<MarketplacePage />} />
        <Route path="/employer" element={<EmployerAccessPage />} />
        <Route path="/helpers/join" element={<HelperAccessPage />} />
        <Route path="/helper" element={<Navigate to="/helpers/join" replace />} />
        <Route path="/agency" element={<AgencyWorkspacePage />} />
        <Route path="/validator" element={<ValidatorPage />} />
        <Route path="/marketplace" element={<Navigate to="/helpers" replace />} />
        <Route element={<RequireAuth />}>
          <Route path="/app" element={<HomePage />} />
          <Route path="/app/contract-terms" element={<ContractTermsPage />} />
          <Route path="/app/salary" element={<SalaryPage />} />
          <Route path="/app/leave" element={<LeavePage />} />
          <Route path="/app/activity" element={<ActivityLogPage />} />
          <Route path="/app/payslip" element={<PayslipPage />} />
          <Route path="/app/messages" element={<MessagesPage />} />
          <Route path="/app/profile" element={<AdminPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App

