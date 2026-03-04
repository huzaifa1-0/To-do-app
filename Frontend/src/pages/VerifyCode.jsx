import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle, Eye, EyeOff } from 'lucide-react'
import 'bootstrap/dist/css/bootstrap.min.css'
import { API_BASE_URL } from '../api/config'

function VerifyCode() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isOtpVerified, setIsOtpVerified] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

  // Get email from location state
  const { email } = location.state || {}

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/password-reset/verify/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          otp: code
        })
      })

      const data = await response.json()

      if (response.ok) {
        setIsOtpVerified(true)
      } else {
        setError(data.otp?.[0] || 'Verification failed. Please check your code.')
      }
    } catch (err) {
      console.error(err)
      setError('Network error. Is the server running?')
    } finally {
      setLoading(false)
    }
  }

  const handleSetNewPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/password-reset/confirm/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          otp: code,
          new_password: newPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        navigate('/login')
      } else {
        setError(data.otp?.[0] || data.new_password?.[0] || 'Failed to update password.')
      }
    } catch (err) {
      console.error(err)
      setError('Network error. Is the server running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-light min-vh-100">
      <div className="container py-5" style={{ marginTop: '30px', marginBottom: '30px' }}>
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <div className="bg-white text-dark rounded-circle d-flex justify-content-center align-items-center fw-bold mx-auto mb-3 border border-2 border-dark"
                    style={{ width: '70px', height: '70px', fontSize: '28px' }}>
                    TM
                  </div>
                  <h2 className="fw-bold mb-1">The Manager</h2>
                  <p className="text-muted mb-3">{isOtpVerified ? "Set New Password" : "Verify Code"}</p>
                </div>

                {!isOtpVerified && (
                  <div className="alert alert-info" role="alert">
                    <p className="mb-0 small">
                      We've sent a verification code to <strong>{email}</strong>. Please enter it below.
                    </p>
                  </div>
                )}

                {isOtpVerified ? (
                  <form onSubmit={handleSetNewPassword}>
                    <div className="alert alert-success d-flex align-items-center mb-4" role="alert">
                      <CheckCircle className="me-2" size={20} />
                      <div>OTP Verified! Enter your new password.</div>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="newPassword" className="form-label">New Password</label>
                      <div className="input-group shadow-sm">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          className="form-control"
                          id="newPassword"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter your new password"
                          required
                        />
                        <button
                          className="btn btn-outline-secondary bg-white border"
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff size={18} className="text-muted" /> : <Eye size={18} className="text-muted" />}
                        </button>
                      </div>
                      <div className="form-text mt-2 text-muted small pb-1">
                        <strong className="d-block mb-1">Password must contain:</strong>
                        <ul className="mb-0 ps-3" style={{ listStyleType: "circle" }}>
                          <li>At least 8 characters long</li>
                          <li>One uppercase and one lowercase letter</li>
                          <li>One number and one special character (!@#$%^&*)</li>
                        </ul>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="confirmNewPassword" className="form-label">Confirm New Password</label>
                      <div className="input-group shadow-sm">
                        <input
                          type={showConfirmNewPassword ? "text" : "password"}
                          className="form-control"
                          id="confirmNewPassword"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="Re-enter your new password"
                          required
                        />
                        <button
                          className="btn btn-outline-secondary bg-white border"
                          type="button"
                          onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                        >
                          {showConfirmNewPassword ? <EyeOff size={18} className="text-muted" /> : <Eye size={18} className="text-muted" />}
                        </button>
                      </div>
                      {error && (
                        <div className="text-danger small mt-2 fw-bold">
                          {error}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary w-100 mb-3"
                      disabled={loading}
                    >
                      {loading ? 'Updating...' : 'Set New Password'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp}>
                    <div className="mb-4">
                      <label htmlFor="code" className="form-label">Verification Code</label>
                      <input
                        type="text"
                        className="form-control"
                        id="code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Enter verification code"
                        maxLength={6}
                        required
                      />
                      {error && (
                        <div className="text-danger small mt-1">
                          {error}
                        </div>
                      )}
                      <div className="form-text">
                        Enter the 6-digit code sent to your email
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary w-100 mb-3"
                      disabled={loading}
                    >
                      {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>

                    <div className="text-center">
                      <Link to="/login" className="btn btn-outline-dark w-100 text-decoration-none fw-bold">
                        Back to Login
                      </Link>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyCode
