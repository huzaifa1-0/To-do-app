import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import 'bootstrap/dist/css/bootstrap.min.css'

function VerifyCode() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  
  // Get email from location state
  const { email } = location.state || {}

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Mock verification - accept any 6-digit code
    setTimeout(() => {
      if (code.length >= 4) {
        // Store user info in localStorage
        const mockUser = {
          email: email || 'user@example.com',
          first_name: email ? email.split('@')[0] : 'User'
        }
        localStorage.setItem('token', 'mock-token-' + Date.now())
        localStorage.setItem('user', JSON.stringify(mockUser))
        
        // Navigate to dashboard
        navigate('/')
      } else {
        setError('Invalid code. Please enter a valid verification code.')
        setLoading(false)
      }
    }, 1000)
  }

  return (
    <div className="bg-light min-vh-100">
      {/* Verify Code Form */}
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
                  <p className="text-muted mb-3">Verify Code</p>
                </div>

                <div className="alert alert-info" role="alert">
                  <p className="mb-0 small">
                    We've sent a verification code to <strong>{email}</strong>. Please enter it below.
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
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
                    {loading ? 'Verifying...' : 'Verify Code'}
                  </button>

                  <div className="text-center">
                    <Link to="/login" className="btn btn-outline-dark w-100 text-decoration-none fw-bold">
                       Back to Login
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyCode
