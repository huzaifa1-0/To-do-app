import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import 'bootstrap/dist/css/bootstrap.min.css'

function VerifyCode() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isOtpVerified, setIsOtpVerified] = useState(false)
  const [newPassword, setNewPassword] = useState('')

  const navigate = useNavigate()
  const location = useLocation()

  // Get email from location state
  const { email } = location.state || {}

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:8000/api/password-reset/verify/', {
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

    try {
      const response = await fetch('http://localhost:8000/api/password-reset/confirm/', {
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

                    <div className="mb-4">
                      <label htmlFor="newPassword" className="form-label">New Password</label>
                      <input
                        type="password"
                        className="form-control"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter your new password"
                        required
                      />
                      {error && (
                        <div className="text-danger small mt-1">
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
