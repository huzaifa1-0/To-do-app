import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import 'bootstrap/dist/css/bootstrap.min.css'

function ResetPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('http://localhost:8000/api/password-reset/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          navigate('/verify-code', { state: { email } })
        }, 1500)
      } else {
        alert('Failed to send reset link. Please check your email.')
      }
    } catch (err) {
      console.error(err)
      alert('Network error. Is the server running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-light min-vh-100">
      {/* Reset Password Form */}
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
                  <p className="text-muted mb-3">Reset Password</p>
                </div>

                  {success ? (
                    <div className="alert alert-success" role="alert">
                      <h5 className="alert-heading">✓ Reset Link Sent!</h5>
                      <p className="mb-0">
                        We've sent a verification code to <strong>{email}</strong>
                      </p>
                      <p className="small mt-2 mb-0">Redirecting to verification page...</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit}>
                      <div className="mb-4">
                        <label htmlFor="email" className="form-label">Email Address</label>
                        <input
                          type="email"
                          className="form-control"
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          required
                        />
                        <div className="form-text">
                          Enter the email address associated with your account
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary w-100 mb-3"
                        disabled={loading}
                      >
                        {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
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

export default ResetPassword
