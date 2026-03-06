import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Calendar, DollarSign, LogOut, User, Users, PlusCircle, Trash2 } from 'lucide-react'
import 'bootstrap/dist/css/bootstrap.min.css'
import { API_BASE_URL as BASE_URL } from '../api/config'

const API_BASE_URL = `${BASE_URL}/expenses/`
const USERS_API_URL = `${BASE_URL}/`

const categories = ['All', 'Food', 'Travel', 'Transportation', 'Shopping', 'Entertainment', 'Healthcare', 'Utilities', 'Miscellaneous', 'Others']

function Dashboard() {
  const [showAllExpenses, setShowAllExpenses] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [viewMode, setViewMode] = useState('recent') // 'recent', 'categories', 'category-expenses', 'employees'
  const [employees, setEmployees] = useState([])

  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')

  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [assignAmount, setAssignAmount] = useState('')
  const [assignCategory, setAssignCategory] = useState('')
  const [assignMessage, setAssignMessage] = useState('')
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
  const [budgetStatus, setBudgetStatus] = useState([])
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
        const parsedSummary = summaryData.map(item => ({
          ...item,
          total: parseFloat(item.total) || 0
        }))
        setCategorySummary(parsedSummary)

        // Fetch budget status
        const budgetRes = await fetch(`${API_BASE_URL}budget-status/`, {
          headers: authHeaders
        })
        const budgetData = await budgetRes.json()
        const parsedBudgets = budgetData.map(item => ({
          ...item,
          allocated: parseFloat(item.allocated) || 0,
          spent: parseFloat(item.spent) || 0,
          remaining: parseFloat(item.remaining) || 0
        }))
        setBudgetStatus(parsedBudgets)

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
            const catIndex = prev.findIndex(c => c.category === newExpense.category_name)
            if (catIndex >= 0) {
              const newSummary = [...prev]
              newSummary[catIndex].total += parseFloat(newExpense.amount)
              newSummary[catIndex].count += 1
              return newSummary.sort((a, b) => b.total - a.total)
            } else {
              const newCat = { category: newExpense.category_name, total: parseFloat(newExpense.amount), count: 1 }
              return [...prev, newCat].sort((a, b) => b.total - a.total)
            }
          })

          // Update budget status locally to reflect the new expense
          setBudgetStatus(prev => {
            const amount = parseFloat(newExpense.amount)
            return prev.map(item => {
              if (item.category === newExpense.category_name || item.category === newExpense.category) {
                const newSpent = item.spent + amount
                return {
                  ...item,
                  spent: newSpent,
                  remaining: item.allocated - newSpent
                }
              }
              return item
            })
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

  // Fetch employees
  useEffect(() => {
    if (viewMode === 'employees') {
      const fetchEmployees = async () => {
        try {
          const accessToken = localStorage.getItem('access_token')
          if (!accessToken) return;
          const res = await fetch(`${USERS_API_URL}employees/`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          })
          if (res.ok) {
            const data = await res.json()
            setEmployees(data)
          }
        } catch (error) {
          console.error('Error fetching employees:', error)
        }
      }
      fetchEmployees()
    }
  }, [viewMode])

  const handleInvite = async (e) => {
    e.preventDefault()
    setInviteMessage('Sending invitation...')
    try {
      const accessToken = localStorage.getItem('access_token')
      const res = await fetch(`${USERS_API_URL}invite/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ email: inviteEmail })
      })
      const data = await res.json()
      if (res.ok) {
        setInviteMessage('✅ ' + data.message)
        setInviteEmail('')
        setTimeout(() => { setShowInviteModal(false); setInviteMessage('') }, 2000)
      } else {
        setInviteMessage('⚠️ ' + (data.error || 'Failed to send invite'))
      }
    } catch (err) {
      setInviteMessage('⚠️ Network error')
    }
  }

  const handleAssign = async (e) => {
    e.preventDefault()
    setAssignMessage('Assigning money...')
    try {
      const accessToken = localStorage.getItem('access_token')
      const res = await fetch(`${USERS_API_URL}assign-money/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          employee_id: selectedEmployee.id,
          amount: assignAmount,
          category: assignCategory || null
        })
      })
      const data = await res.json()
      if (res.ok) {
        setAssignMessage('✅ ' + data.message)
        // update employee list locally
        setEmployees(prev => prev.map(emp =>
          emp.id === selectedEmployee.id
            ? { ...emp, assigned_amount: data.new_balance, remaining_balance: data.new_balance - emp.total_expenses }
            : emp
        ))
        setAssignAmount('')
        setAssignCategory('')
        setTimeout(() => { setShowAssignModal(false); setAssignMessage('') }, 2000)
      } else {
        setAssignMessage('⚠️ ' + (data.error || 'Failed to assign money'))
      }
    } catch (err) {
      setAssignMessage('⚠️ Network error')
    }
  }

  const handleDeleteExpense = async (expenseId, amount, categoryName) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return

    try {
      const accessToken = localStorage.getItem('access_token')
      const res = await fetch(`${API_BASE_URL}${expenseId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (res.ok) {
        // Remove from all local states
        setAllExpenses(prev => prev.filter(e => e.id !== expenseId))
        setTodayExpenses(prev => prev.filter(e => e.id !== expenseId))
        setCategoryExpenses(prev => prev.filter(e => e.id !== expenseId))

        // Update totals
        setTotalExpenses(prev => Math.max(0, prev - parseFloat(amount)))

        // Update category summary
        setCategorySummary(prev => {
          return prev.map(cat => {
            if (cat.category === categoryName) {
              return {
                ...cat,
                total: Math.max(0, cat.total - parseFloat(amount)),
                count: Math.max(0, cat.count - 1)
              }
            }
            return cat
          }).filter(cat => cat.count > 0) // Remove categories with 0 expenses
        })

        // Update budget status remaining balance
        setBudgetStatus(prev => {
          return prev.map(item => {
            if (item.category === categoryName) {
              const newSpent = Math.max(0, item.spent - parseFloat(amount))
              return {
                ...item,
                spent: newSpent,
                remaining: item.allocated - newSpent
              }
            }
            return item
          })
        })
      } else {
        alert('Failed to delete expense.')
      }
    } catch (err) {
      console.error('Error deleting expense:', err)
      alert('Network error while deleting expense.')
    }
  }

  const recentExpenses = todayExpenses

  // Get unique categories with their total amounts from API summary
  const categoriesWithTotals = categorySummary.map(item => ({
    name: item.category,
    count: allExpenses.filter(e => e.category_name === item.category).length,
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
                <div className="d-flex align-items-center gap-2">
                  <button
                    className={`btn btn-sm ${viewMode === 'employees' ? 'btn-light text-primary' : 'btn-outline-light'}`}
                    onClick={() => setViewMode('employees')}
                  >
                    <Users size={16} className="me-1" />
                    Team
                  </button>
                  <button
                    className="btn btn-outline-light btn-sm"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} className="me-1" />
                    Logout
                  </button>
                </div>
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

        {/* Budget Overview Section */}
        {viewMode === 'recent' && budgetStatus.length > 0 && (
          <div className="card shadow-sm mb-4 border-0">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                <DollarSign size={18} className="text-primary" />
                Budget Overview
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">Category</th>
                      <th className="text-center">Allocated</th>
                      <th className="text-center">Spent</th>
                      <th className="text-end pe-4">Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgetStatus.map((item, index) => (
                      <tr key={index}>
                        <td className="ps-4 fw-medium">{item.category}</td>
                        <td className="text-center text-muted">Rs. {item.allocated.toLocaleString('en-PK')}</td>
                        <td className="text-center text-danger">Rs. {item.spent.toLocaleString('en-PK')}</td>
                        <td className="text-end pe-4 fw-bold text-success">
                          Rs. {item.remaining.toLocaleString('en-PK')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {viewMode !== 'recent' && viewMode !== 'employees' && (
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

        {viewMode === 'employees' && (
          <button
            className="btn btn-primary mb-3"
            onClick={() => setViewMode('recent')}
          >
            ← Back to Dashboard
          </button>
        )}

        {viewMode === 'employees' ? (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="mb-0 d-flex align-items-center gap-2">
                <Users className="text-primary" /> Team Management
              </h3>
              <button className="btn btn-primary d-flex align-items-center gap-2"
                onClick={() => setShowInviteModal(true)}>
                <PlusCircle size={18} /> Invite Employee
              </button>
            </div>

            <div className="row g-4">
              {employees.length === 0 ? (
                <div className="col-12 text-center py-5">
                  <p className="text-muted">You have no employees yet. Invite them to get started.</p>
                </div>
              ) : (
                employees.map(emp => (
                  <div key={emp.id} className="col-md-6 col-lg-4">
                    <div className="card shadow-sm h-100 border-0">
                      <div className="card-body">
                        <div className="d-flex align-items-center gap-3 mb-3">
                          <div className="bg-light text-primary rounded-circle d-flex justify-content-center align-items-center fw-bold" style={{ width: '50px', height: '50px', fontSize: '20px' }}>
                            {emp.first_name ? emp.first_name[0].toUpperCase() : emp.email[0].toUpperCase()}
                          </div>
                          <div>
                            <h5 className="mb-0 fw-bold">{emp.first_name} {emp.last_name}</h5>
                            <p className="mb-0 text-muted small">{emp.email}</p>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between mb-1">
                            <span className="text-muted small">Assigned Budget</span>
                            <span className="fw-bold">Rs. {(parseFloat(emp.assigned_amount) || 0).toLocaleString('en-PK')}</span>
                          </div>
                          <div className="d-flex justify-content-between mb-1">
                            <span className="text-muted small">Total Spent</span>
                            <span className="text-danger fw-bold">Rs. {(parseFloat(emp.total_expenses) || 0).toLocaleString('en-PK')}</span>
                          </div>
                          <div className="d-flex justify-content-between border-top pt-2 mt-2">
                            <span className="text-primary fw-bold small">Remaining</span>
                            <span className="text-success fw-bold">Rs. {(parseFloat(emp.remaining_balance) || 0).toLocaleString('en-PK')}</span>
                          </div>
                        </div>
                        <button
                          className="btn btn-outline-primary w-100"
                          onClick={() => {
                            setSelectedEmployee(emp)
                            setShowAssignModal(true)
                          }}
                        >
                          <DollarSign size={16} className="me-1" /> Assign Money
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
              <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content border-0 shadow">
                    <div className="modal-header border-0 pb-0">
                      <h5 className="modal-title fw-bold">Invite Employee</h5>
                      <button type="button" className="btn-close" onClick={() => setShowInviteModal(false)}></button>
                    </div>
                    <div className="modal-body">
                      {inviteMessage && <div className="alert alert-info py-2">{inviteMessage}</div>}
                      <form onSubmit={handleInvite}>
                        <div className="mb-3">
                          <label className="form-label text-muted small">Email Address</label>
                          <input type="email" className="form-control" placeholder="employee@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
                        </div>
                        <button type="submit" className="btn btn-primary w-100 mb-2">Send Invitation</button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Assign Modal */}
            {showAssignModal && selectedEmployee && (
              <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content border-0 shadow">
                    <div className="modal-header border-0 pb-0">
                      <h5 className="modal-title fw-bold">Assign Money to {selectedEmployee.first_name || 'Employee'}</h5>
                      <button type="button" className="btn-close" onClick={() => setShowAssignModal(false)}></button>
                    </div>
                    <div className="modal-body">
                      {assignMessage && <div className="alert alert-info py-2">{assignMessage}</div>}
                      <form onSubmit={handleAssign}>
                        <div className="mb-3">
                          <label className="form-label text-muted small">Amount (Rs.)</label>
                          <input type="number" className="form-control" placeholder="e.g. 5000" min="1" step="0.01" value={assignAmount} onChange={e => setAssignAmount(e.target.value)} required />
                        </div>
                        <div className="mb-4">
                          <label className="form-label text-muted small">Category (Optional)</label>
                          <select className="form-select" value={assignCategory} onChange={e => setAssignCategory(e.target.value)}>
                            <option value="">General (No Category limit)</option>
                            {categories.filter(c => c !== 'All').map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                          <div className="form-text mt-2 small text-muted">If General is selected, the budget goes to the overall account. Else it's bound to a specific category.</div>
                        </div>
                        <button type="submit" className="btn btn-primary w-100 mb-2">Confirm Assignment</button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        ) : viewMode === 'categories' ? (
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
                          <h5 className="card-title">{expense.title}</h5>
                          <span className="badge bg-secondary">{expense.category_name}</span>
                        </div>
                        <div className="text-end">
                          <h5 className="text-primary fw-bold mb-2">Rs. {expense.amount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</h5>
                          <button
                            className="btn btn-sm btn-outline-danger border-0"
                            onClick={() => handleDeleteExpense(expense.id, expense.amount, expense.category_name)}
                            title="Delete Expense"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
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
