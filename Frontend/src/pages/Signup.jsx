import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, User } from 'lucide-react'
import 'bootstrap/dist/css/bootstrap.min.css'

function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:8000/api/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password,
          confirm_password: formData.confirmPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Registration successful - auto login
        const loginResponse = await fetch('http://localhost:8000/api/login/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        })

        if (loginResponse.ok) {
          const loginData = await loginResponse.json()
          localStorage.setItem('access_token', loginData.access)
          localStorage.setItem('refresh_token', loginData.refresh)
          localStorage.setItem('user', JSON.stringify({
            email: formData.email,
            first_name: formData.firstName || formData.email.split('@')[0],
            last_name: formData.lastName
          }))
          navigate('/')
        } else {
          // If auto login fails, redirect to login page
          navigate('/login')
        }
      } else {
        // Handle validation errors
        if (data.password) {
          setError(data.password.join(', '))
        } else if (data.email) {
          setError(data.email.join(', '))
        } else if (data.non_field_errors) {
          setError(data.non_field_errors.join(', '))
        } else {
          setError('Registration failed. Please try again.')
        }
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Network error. Please make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-light min-vh-100">
      {/* Signup Form */}
      <div className="container py-5" style={{ marginTop: '30px', marginBottom: '30px' }}>
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card shadow">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <div className="bg-white text-dark rounded-circle d-flex justify-content-center align-items-center fw-bold mx-auto mb-3 border border-2 border-dark" 
                       style={{ width: '70px', height: '70px', fontSize: '28px' }}>
                    TM
                  </div>
                  <h2 className="fw-bold mb-1">The Manager</h2>
                  <p className="text-muted mb-3">Create Account</p>
                </div>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}



                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="firstName" className="form-label">First Name</label>
                      <input
                        type="text"
                        className="form-control"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="John"
                        required
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="lastName" className="form-label">Last Name</label>
                      <input
                        type="text"
                        className="form-control"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter your password"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 mb-3"
                    disabled={loading}
                  >
                    {loading ? 'Creating Account...' : 'Sign Up'}
                  </button>

                  <div className="text-center">
                    <p className="mb-0 text-muted">
                      Already have an account?{' '}
                      <Link to="/login" className="text-primary text-decoration-none fw-bold">
                        Sign In
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

export default Signup
