import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, User } from 'lucide-react'
import 'bootstrap/dist/css/bootstrap.min.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)

    // Create a mock user with random input
    const mockUser = {
      email: email,
      first_name: email.split('@')[0] || 'User'
    }

    // Store user info in localStorage
    localStorage.setItem('token', 'mock-token-' + Date.now())
    localStorage.setItem('user', JSON.stringify(mockUser))
    
    // Redirect to dashboard
    setTimeout(() => {
      navigate('/')
    }, 500) // Small delay for better UX
  }

  return (
    <div className="bg-light min-vh-100">
      {/* Login Form */}
      <div className="container py-5" style={{ marginTop: '30px', marginBottom: '40px' }}>
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
                  <p className="text-muted mb-3">Welcome Back!</p>
                </div>



                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
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
                  </div>

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                  </div>

                  <div className="text-end mb-3">
                    <Link to="/reset-password" className="text-primary text-decoration-none small fw-bold">
                      Forgot Password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 mb-3"
                    disabled={loading}
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </button>

                  <div className="text-center">
                    <p className="mb-0 text-muted">
                      Don't have an account?{' '}
                      <Link to="/signup" className="text-primary text-decoration-none fw-bold">
                        Sign Up
                      </Link>
                    </p>
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

export default Login
