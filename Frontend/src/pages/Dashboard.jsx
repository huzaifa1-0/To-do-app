import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Calendar, DollarSign, LogOut, User } from 'lucide-react'
import 'bootstrap/dist/css/bootstrap.min.css'
import { API_BASE_URL as BASE_URL } from '../api/config'

const API_BASE_URL = `${BASE_URL}/expenses/`

const categories = ['All', 'Office', 'Meals', 'Technology', 'Transport', 'Travel', 'Events']

function Dashboard() {
  const [showAllExpenses, setShowAllExpenses] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [viewMode, setViewMode] = useState('recent') // 'recent', 'categories', 'category-expenses'
  const [searchInput, setSearchInput] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const navigate = useNavigate()

  // Check if user is logged in
  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      setCurrentUser(JSON.parse(user))
    }
    // Don't redirect - allow access with mock user
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  // Helper function to make authenticated API calls
  const fetchWithAuth = async (url, options = {}) => {
    const accessToken = localStorage.getItem('access_token')

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      ...options.headers
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: authHeaders
      })

      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        navigate('/login')
        throw new Error('Unauthorized')
      }

      return response
    } catch (error) {
      console.error('API request error:', error)
      throw error
    }
  }

  // API data states
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [allExpenses, setAllExpenses] = useState([])
  const [categorySummary, setCategorySummary] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch data from APIs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Get access token from localStorage
        const accessToken = localStorage.getItem('access_token')

        // Headers with JWT authentication
        const authHeaders = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }

        // Fetch today's expenses total
        const totalRes = await fetch(`${API_BASE_URL}today-total/`, {
          headers: authHeaders
        })

        if (totalRes.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          navigate('/login')
          return
        }

        const totalData = await totalRes.json()
        setTotalExpenses(totalData.today_total || 0)

        // Fetch all expenses
        const expensesRes = await fetch(`${API_BASE_URL}`, {
          headers: authHeaders
        })
        const expensesData = await expensesRes.json()
        setAllExpenses(expensesData)

        // Fetch category summary
        const summaryRes = await fetch(`${API_BASE_URL}summary/`, {
          headers: authHeaders
        })
        const summaryData = await summaryRes.json()
        console.log('Category Summary:', summaryData)
        setCategorySummary(summaryData)

        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Get today's expenses for recent view
  const [todayExpenses, setTodayExpenses] = useState([])
  const [categoryExpenses, setCategoryExpenses] = useState([])
  const [loadingExpenses, setLoadingExpenses] = useState(false)
  const [processingAI, setProcessingAI] = useState(false)
  const [aiMessage, setAiMessage] = useState('')

  // Handle AI expense submission
  const handleAIExpenseSubmit = async () => {
    if (!searchInput.trim()) {
      setAiMessage('⚠️ Please enter an expense description')
      return
    }

    setProcessingAI(true)
    setAiMessage('🤖 Processing with AI...')

    try {
      const accessToken = localStorage.getItem('access_token')
      const res = await fetch(`${API_BASE_URL}ai-process/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          text: searchInput
        })
      })

      const data = await res.json()

      if (res.ok) {
        setAiMessage('✅ Expense Added!')
        setSearchInput('') // clear input

        // Update local state to reflect new expense instantly
        if (data.data) {
          const newExpense = data.data
          setAllExpenses(prev => [newExpense, ...prev])
          setTodayExpenses(prev => [newExpense, ...prev.slice(0, 4)]) // Keep max 5
          setTotalExpenses(prev => prev + parseFloat(newExpense.amount))

          // Optionally update categories
          setCategorySummary(prev => {
            const catIndex = prev.findIndex(c => c.category === newExpense.category)
            if (catIndex >= 0) {
              const newSummary = [...prev]
              newSummary[catIndex].total += parseFloat(newExpense.amount)
              newSummary[catIndex].count += 1
              return newSummary.sort((a, b) => b.total - a.total)
            } else {
              const newCat = { category: newExpense.category, total: parseFloat(newExpense.amount), count: 1 }
              return [...prev, newCat].sort((a, b) => b.total - a.total)
            }
          })
        }

        // Clear success message after 3 seconds
        setTimeout(() => setAiMessage(''), 3000)
      } else {
        setAiMessage(`⚠️ ${data.error || 'Failed to process AI expense.'}`)
      }
    } catch (err) {
      console.error('AI Processing error:', err)
      setAiMessage('⚠️ Error connecting to server.')
    } finally {
      setProcessingAI(false)
    }
  }

  // Fetch today's expenses when in recent mode
  useEffect(() => {
    if (viewMode === 'recent') {
      const fetchTodayExpenses = async () => {
        try {
          const accessToken = localStorage.getItem('access_token')
          const authHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }

          // First try to get today's expenses
          const res = await fetch(`${API_BASE_URL}?filter=today`, {
            headers: authHeaders
          })
          const data = await res.json()

          if (data.length > 0) {
            // Show today's expenses if available
            setTodayExpenses(data.slice(0, 5))
          } else {
            // Fallback: Get the 5 most recent expenses from all time
            const allRes = await fetch(`${API_BASE_URL}`, {
              headers: authHeaders
            })
            const allData = await allRes.json()
            setTodayExpenses(allData.slice(0, 5))
          }
        } catch (error) {
          console.error('Error fetching today expenses:', error)
        }
      }
      fetchTodayExpenses()
    }
  }, [viewMode])

  // Fetch category expenses when a category is selected
  useEffect(() => {
    if (selectedCategory && viewMode === 'category-expenses') {
      const fetchCategoryExpenses = async () => {
        try {
          setLoadingExpenses(true)
          const accessToken = localStorage.getItem('access_token')
          const authHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
          const res = await fetch(`${API_BASE_URL}?category=${selectedCategory}`, {
            headers: authHeaders
          })
          const data = await res.json()
          setCategoryExpenses(data)
          setLoadingExpenses(false)
        } catch (error) {
          console.error('Error fetching category expenses:', error)
          setLoadingExpenses(false)
        }
      }
      fetchCategoryExpenses()
    }
  }, [selectedCategory, viewMode])

  const recentExpenses = todayExpenses

  // Get unique categories with their total amounts from API summary
  const categoriesWithTotals = categorySummary.map(item => ({
    name: item.category,
    count: allExpenses.filter(e => e.category === item.category).length,
    total: item.total
  }))

  const filteredExpenses = categoryExpenses

  const expensesToShow = viewMode === 'category-expenses' ? filteredExpenses : recentExpenses

  return (
    <div className="bg-light min-vh-100">
      <header className="bg-dark text-white py-3">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <div className="bg-white text-dark rounded-circle d-flex justify-content-center align-items-center fw-bold"
                style={{ width: '40px', height: '40px', fontSize: '18px' }}>
                TM
              </div>
              <h1 className="mb-0">The Manager</h1>
            </div>

            {currentUser && (
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center gap-2">
                  <div className="bg-light text-dark rounded-circle d-flex justify-content-center align-items-center"
                    style={{ width: '35px', height: '35px' }}>
                    <User size={18} />
                  </div>
                  <span className="text-white small">
                    {currentUser.first_name || currentUser.email}
                  </span>
                </div>
                <button
                  className="btn btn-outline-light btn-sm"
                  onClick={handleLogout}
                >
                  <LogOut size={16} className="me-1" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container py-5">

        {showMenu && (
          <div className="card shadow mb-4">
            <div className="card-body">
              <h5 className="card-title mb-3">Select Category</h5>
              <div className="d-flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    className={`btn ${selectedCategory === category ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => {
                      setSelectedCategory(category)
                      setShowMenu(false)
                      setShowAllExpenses(true)
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="card shadow mb-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}>
          <div className="card-body">
            <div className="row g-3 align-items-end mb-3">
              <div className="col-12">
                <div className="position-relative">
                  <input
                    type="text"
                    id="searchInput"
                    className="form-control form-control-lg border-0 shadow-sm"
                    placeholder="🔍 Enter expense (e.g., 'Lunch Rs. 500')..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAIExpenseSubmit()}
                    disabled={processingAI}
                    style={{
                      borderRadius: '50px',
                      paddingLeft: '25px',
                      paddingRight: '120px',
                      fontSize: '16px',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                      opacity: processingAI ? 0.7 : 1
                    }}
                  />
                  <button
                    className="btn btn-light position-absolute top-50 end-0 translate-middle-y me-2"
                    onClick={handleAIExpenseSubmit}
                    disabled={processingAI}
                    style={{
                      borderRadius: '50px',
                      padding: '8px 20px',
                      fontWeight: '600',
                      color: '#667eea',
                      fontSize: '14px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {processingAI ? '⏳ Processing...' : 'Enter →'}
                  </button>
                </div>
                {aiMessage && (
                  <div className={`mt-2 text-center small fw-bold ${aiMessage.includes('✅') ? 'text-success' : aiMessage.includes('⚠️') ? 'text-warning' : 'text-danger'}`}>
                    {aiMessage}
                  </div>
                )}
              </div>
            </div>

            <div className="d-flex align-items-center gap-4 text-white">
              <div className="bg-white rounded-circle p-3">
                <TrendingUp size={40} className="text-success" />
              </div>
              <div>
                <h4 className="mb-1 opacity-75">Today's Expenses</h4>
                <h2 className="fw-bold mb-1">Rs. {totalExpenses.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</h2>
                <p className="mb-0 small opacity-75">{allExpenses.length} all-time expenses recorded</p>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="d-flex align-items-center gap-2">
            <Calendar size={20} />
            {viewMode === 'recent'
              ? 'Recent Expenses'
              : viewMode === 'categories'
                ? 'Select a Category'
                : `${selectedCategory} Expenses`}
          </h4>

          {viewMode === 'recent' && (
            <button
              className="btn btn-primary"
              onClick={() => setViewMode('categories')}
            >
              See All
            </button>
          )}
        </div>

        {viewMode !== 'recent' && (
          <button
            className="btn btn-primary mb-3"
            onClick={() => {
              setViewMode('recent')
              setSelectedCategory(null)
            }}
          >
            ← Back to Recent
          </button>
        )}

        {viewMode === 'categories' ? (
          <div className="row g-4">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading categories...</span>
                </div>
              </div>
            ) : categoriesWithTotals.length === 0 ? (
              <div className="col-12 text-center py-5">
                <p className="text-muted mb-3">No categories available yet.</p>
                <p className="text-muted small">Add some expenses to see categories.</p>
              </div>
            ) : (
              categoriesWithTotals.map(category => (
                <div key={category.name} className="col-6 col-md-6">
                  <div
                    className="card h-100 shadow-sm"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedCategory(category.name)
                      setViewMode('category-expenses')
                    }}
                  >
                    <div className="card-body">
                      <h5 className="card-title">{category.name}</h5>
                      <p className="card-text text-muted">
                        {category.count} expense{category.count !== 1 ? 's' : ''}
                      </p>
                      <h4 className="text-primary fw-bold">Rs. {category.total.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</h4>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : loading || loadingExpenses ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {expensesToShow.length === 0 ? (
              <p className="text-muted">No expenses found.</p>
            ) : (
              expensesToShow.map(expense => (
                <div key={expense.id} className="col-md-6">
                  <div className="card h-100 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h5 className="card-title">{expense.description}</h5>
                          <span className="badge bg-secondary">{expense.category}</span>
                        </div>
                        <h5 className="text-primary fw-bold">Rs. {expense.amount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</h5>
                      </div>
                      <div className="mt-3 text-muted small d-flex align-items-center gap-2">
                        <Calendar size={14} />
                        {new Date(expense.created_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
