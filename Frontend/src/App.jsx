import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Dashboard_2 from './pages/Dashboard_2'
import ResetPassword from './pages/ResetPassword'
import VerifyCode from './pages/VerifyCode'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-code" element={<VerifyCode />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard2" element={<Dashboard_2 />} />
      </Routes>
    </Router>
  )
}

export default App