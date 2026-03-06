import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  LogOut, 
  User, 
  Users, 
  PlusCircle, 
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  Share2,
  QrCode,
  Settings,
  Bell,
  CreditCard
} from 'lucide-react'
import 'bootstrap/dist/css/bootstrap.min.css'
import { API_BASE_URL as BASE_URL } from '../api/config'

const API_BASE_URL = `${BASE_URL}/expenses/`
const USERS_API_URL = `${BASE_URL}/`

const categories = ['All', 'Food', 'Travel', 'Transportation', 'Shopping', 'Entertainment', 'Healthcare', 'Utilities', 'Miscellaneous', 'Others']
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function Dashboard_2() {
  const [showAllExpenses, setShowAllExpenses] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [viewMode, setViewMode] = useState('recent') // 'recent', 'categories', 'category-expenses', 'employees'
  const [employees, setEmployees] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())

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
        const accessToken = localStorage.getItem('access_token')

        const authHeaders = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }

        // Fetch today's expenses total
        const totalRes = await fetch(`${API_BASE_URL}today-total/`, {
          headers: authHeaders
        })

        if (totalRes.status === 401) {
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
        setSearchInput('')

        if (data.data) {
          const newExpense = data.data
          setAllExpenses(prev => [newExpense, ...prev])
          setTodayExpenses(prev => [newExpense, ...prev.slice(0, 4)])
          setTotalExpenses(prev => prev + parseFloat(newExpense.amount))

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

          const res = await fetch(`${API_BASE_URL}?filter=today`, {
            headers: authHeaders
          })
          const data = await res.json()

          if (data.length > 0) {
            setTodayExpenses(data.slice(0, 5))
          } else {
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
        setAllExpenses(prev => prev.filter(e => e.id !== expenseId))
        setTodayExpenses(prev => prev.filter(e => e.id !== expenseId))
        setCategoryExpenses(prev => prev.filter(e => e.id !== expenseId))
        setTotalExpenses(prev => Math.max(0, prev - parseFloat(amount)))
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
          }).filter(cat => cat.count > 0)
        })
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
  const categoriesWithTotals = categorySummary.map(item => ({
    name: item.category,
    count: allExpenses.filter(e => e.category_name === item.category).length,
    total: item.total
  }))
  const filteredExpenses = categoryExpenses
  const expensesToShow = viewMode === 'category-expenses' ? filteredExpenses : recentExpenses

  // Calculate total assigned budget (future income)
  const totalAssignedBudget = employees.reduce((sum, emp) => sum + (parseFloat(emp.assigned_amount) || 0), 0)

  // Calculate month transactions
  const getMonthTransactions = () => {
    return allExpenses.filter(expense => {
      const expenseDate = new Date(expense.created_at)
      return expenseDate.getMonth() === selectedMonth
    })
  }

  const monthTransactions = getMonthTransactions()

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#0F0F0F' }}>
      
      {/* Section 1: Financial Dashboard - Yellow Background */}
      <div className="py-4 px-3" style={{ backgroundColor: '#F5E04C' }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-0" style={{ fontSize: '28px' }}>The Manager</h2>
          </div>
        </div>

        {/* Balance Area */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <p className="mb-0" style={{ fontSize: '14px', opacity: 0.7 }}>Total Balance</p>
            <h1 className="fw-bold mb-0" style={{ fontSize: '36px' }}>Rs. {totalExpenses.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</h1>
          </div>
          <div className="d-flex gap-2">
          </div>
        </div>

        {/* Action Cards */}
        <div className="row g-3 mb-4">
          <div className="col-6">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '24px', backgroundColor: '#F2F2F2' }}>
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <p className="mb-0 small fw-bold" style={{ fontSize: '12px' }}>Today's Expenses</p>
                    <h4 className="fw-bold mt-2 mb-0" style={{ fontSize: '20px' }}>Rs. {totalExpenses.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</h4>
                  </div>
                  <div className="bg-dark rounded-circle p-2">
                    <ArrowUpRight size={20} className="text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-6">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '24px', backgroundColor: '#F2F2F2' }}>
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <p className="mb-0 small fw-bold" style={{ fontSize: '12px' }}>Future Income</p>
                    <h4 className="fw-bold mt-2 mb-0" style={{ fontSize: '20px' }}>Rs. {totalAssignedBudget.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</h4>
                  </div>
                  <div className="bg-dark rounded-circle p-2">
                    <ArrowDownLeft size={20} className="text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses Overview Card */}
        <div className="card border-0 shadow" style={{ borderRadius: '24px', backgroundColor: '#FFFFFF' }}>
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0">Expenses Overview</h5>
              <select 
                className="form-select form-select-sm border-0" 
                style={{ width: 'auto', backgroundColor: '#F2F2F2', borderRadius: '12px' }}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              >
                {months.map((month, index) => (
                  <option key={month} value={index}>{month}</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <p className="mb-0 small text-muted">Transactions: {monthTransactions.length}</p>
              <p className="mb-0 fw-bold">{months[selectedMonth]}</p>
            </div>
            {monthTransactions.length > 0 && (
              <div className="d-flex gap-2">
                {monthTransactions.slice(0, 5).map((expense, idx) => (
                  <div 
                    key={idx} 
                    className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white fw-bold"
                    style={{ width: '32px', height: '32px', fontSize: '12px' }}
                  >
                    {expense.category_name?.charAt(0) || 'U'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Expense Input */}
        <div className="mt-3 position-relative">
          <input
            type="text"
            className="form-control form-control-lg border-0"
            placeholder=" Enter expense (e.g., 'Lunch Rs. 500')..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAIExpenseSubmit()}
            disabled={processingAI}
            style={{
              borderRadius: '50px',
              paddingLeft: '20px',
              paddingRight: '100px',
              fontSize: '14px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}
          />
          <button
            className="btn btn-dark position-absolute top-50 end-0 translate-middle-y me-2"
            onClick={handleAIExpenseSubmit}
            disabled={processingAI}
            style={{
              borderRadius: '50px',
              padding: '8px 16px',
              fontWeight: '600',
              fontSize: '13px'
            }}
          >
            {processingAI ? '⏳' : 'Enter →'}
          </button>
          {aiMessage && (
            <div className={`mt-2 text-center small fw-bold ${aiMessage.includes('✅') ? 'text-success' : aiMessage.includes('⚠️') ? 'text-warning' : 'text-danger'}`}>
              {aiMessage}
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Monthly Limit - Dark Background */}
      <div className="py-4 px-3" style={{ backgroundColor: '#0F0F0F' }}>
        {/* Navigation */}
        <div className="d-flex justify-content-between align-items-center mb-4">
        </div>
        {/* Recent Transactions - Moved here */}
        <div className="mt-4">
          <h5 className="fw-bold mb-3 text-white">Recent Transactions</h5>
          <div className="space-y-3">
            {expensesToShow.length === 0 ? (
              <p className="text-muted text-center py-4">No transactions found.</p>
            ) : (
              expensesToShow.map((expense, idx) => (
                <div key={idx} className="card border-0 shadow-sm mb-3" style={{ borderRadius: '20px', backgroundColor: '#1A1A1A' }}>
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-3">
                        <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white fw-bold"
                          style={{ width: '44px', height: '44px', fontSize: '16px' }}>
                          {expense.category_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="mb-0 fw-bold text-white">{expense.title}</p>
                          <p className="mb-0 small" style={{ color: '#999' }}>
                            {new Date(expense.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-end">
                        <p className={`mb-0 fw-bold ${expense.amount >= 0 ? 'text-success' : 'text-danger'}`} style={{ fontSize: '16px' }}>
                          {expense.amount >= 0 ? '+' : '-'}Rs. {Math.abs(expense.amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </p>
                        <button
                          className="btn btn-sm btn-outline-danger border-0 mt-1"
                          onClick={() => handleDeleteExpense(expense.id, expense.amount, expense.category_name)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Limit Card */}
        <div className="card border-0 shadow mb-4" style={{ 
          borderRadius: '24px', 
          background: 'linear-gradient(135deg, #7BE26B 0%, #5CB85C 100%)' 
        }}>
          <div className="card-body p-4">
            <h5 className="fw-bold mb-3 text-dark">Monthly Limit</h5>
            <div className="text-center mb-3">
              {/* Simple gauge visualization */}
              <div className="position-relative d-inline-block">
                <svg width="120" height="60" viewBox="0 0 120 60">
                  <path d="M 10 50 A 40 40 0 0 1 110 50" fill="none" stroke="#0F0F0F" strokeWidth="12" strokeLinecap="round" opacity="0.3"/>
                  <path d="M 10 50 A 40 40 0 0 1 110 50" fill="none" stroke="#0F0F0F" strokeWidth="12" strokeLinecap="round" 
                    strokeDasharray={`${(budgetStatus.reduce((sum, item) => sum + item.spent, 0) / budgetStatus.reduce((sum, item) => sum + item.allocated, 0)) * 126} 126`}
                  />
                </svg>
                <div className="position-absolute top-50 start-50 translate-middle text-center">
                  <span className="fw-bold" style={{ fontSize: '16px' }}>
                    {Math.round((budgetStatus.reduce((sum, item) => sum + item.spent, 0) / budgetStatus.reduce((sum, item) => sum + item.allocated, 0)) * 100) || 0}%
                  </span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="mb-0 fw-bold text-dark" style={{ fontSize: '20px' }}>
                Rs. {budgetStatus.reduce((sum, item) => sum + item.spent, 0).toLocaleString('en-PK')} / {budgetStatus.reduce((sum, item) => sum + item.allocated, 0).toLocaleString('en-PK')}
              </p>
              <p className="mb-0 small text-dark" style={{ opacity: 0.8 }}>Total Spent / Total Budget</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Profile & Transactions - Dark Theme */}
      <div className="py-4 px-3" style={{ backgroundColor: '#0F0F0F' }}>
        {/* Profile Area */}
        {currentUser && (
          <div className="text-center mb-4">
            <div className="rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto mb-2"
              style={{ width: '80px', height: '80px', fontSize: '32px', fontWeight: 'bold' }}>
              {currentUser.first_name ? currentUser.first_name[0].toUpperCase() : currentUser.email[0].toUpperCase()}
            </div>
            <h5 className="fw-bold mb-0 text-white">{currentUser.first_name || currentUser.email}</h5>
            <p className="mb-0 small" style={{ color: '#999' }}>{currentUser.email}</p>
          </div>
        )}

        {/* Action Cards */}
        <div className="row g-3 mb-4">
          <div className="col-6">
            <div className="card border-0 shadow" style={{ borderRadius: '24px', backgroundColor: '#F5E04C' }}>
              <div className="card-body p-4 text-center">
                <QrCode size={32} className="text-dark mb-2" />
                <p className="mb-0 fw-bold text-dark small">QR Code</p>
              </div>
            </div>
          </div>
          <div className="col-6">
            <div className="card border-0 shadow" style={{ borderRadius: '24px', backgroundColor: '#7BE26B' }}>
              <div className="card-body p-4 text-center">
                <Share2 size={32} className="text-dark mb-2" />
                <p className="mb-0 fw-bold text-dark small">Share Link</p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Cards (when in categories view) */}
        {viewMode === 'categories' && (
          <div className="row g-3 mt-3">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-light" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : categoriesWithTotals.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted">No categories available yet.</p>
              </div>
            ) : (
              categoriesWithTotals.map(category => (
                <div key={category.name} className="col-6">
                  <div
                    className="card h-100 border-0 shadow"
                    style={{ borderRadius: '20px', backgroundColor: '#1A1A1A', cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedCategory(category.name)
                      setViewMode('category-expenses')
                    }}
                  >
                    <div className="card-body p-3">
                      <h6 className="fw-bold text-white mb-1">{category.name}</h6>
                      <p className="mb-0 small" style={{ color: '#999' }}>{category.count} expenses</p>
                      <h5 className="fw-bold text-success mt-2 mb-0" style={{ fontSize: '16px' }}>
                        Rs. {category.total.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </h5>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Back button for category-expenses view */}
        {viewMode === 'category-expenses' && (
          <button
            className="btn btn-light w-100 mt-3"
            onClick={() => {
              setViewMode('recent')
              setSelectedCategory(null)
            }}
            style={{ borderRadius: '16px' }}
          >
            ← Back to Dashboard
          </button>
        )}

        {/* Employees View */}
        {viewMode === 'employees' && (
          <div className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0 text-white">Team Management</h5>
              <button className="btn btn-light btn-sm d-flex align-items-center gap-2"
                onClick={() => setShowInviteModal(true)}
                style={{ borderRadius: '16px' }}
              >
                <PlusCircle size={16} /> Invite
              </button>
            </div>

            {employees.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted">No employees yet.</p>
              </div>
            ) : (
              employees.map(emp => (
                <div key={emp.id} className="card border-0 shadow-sm mb-3" style={{ borderRadius: '20px', backgroundColor: '#1A1A1A' }}>
                  <div className="card-body p-3">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div className="rounded-circle bg-light text-dark d-flex align-items-center justify-content-center fw-bold"
                        style={{ width: '50px', height: '50px', fontSize: '20px' }}>
                        {emp.first_name ? emp.first_name[0].toUpperCase() : emp.email[0].toUpperCase()}
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="mb-0 fw-bold text-white">{emp.first_name} {emp.last_name}</h6>
                        <p className="mb-0 small" style={{ color: '#999' }}>{emp.email}</p>
                      </div>
                    </div>
                    <div className="row g-2 mb-3">
                      <div className="col-4">
                        <p className="mb-0 small" style={{ color: '#999' }}>Assigned</p>
                        <p className="mb-0 fw-bold text-white">Rs. {(parseFloat(emp.assigned_amount) || 0).toLocaleString('en-PK')}</p>
                      </div>
                      <div className="col-4">
                        <p className="mb-0 small" style={{ color: '#999' }}>Spent</p>
                        <p className="mb-0 fw-bold text-danger">Rs. {(parseFloat(emp.total_expenses) || 0).toLocaleString('en-PK')}</p>
                      </div>
                      <div className="col-4">
                        <p className="mb-0 small" style={{ color: '#999' }}>Remaining</p>
                        <p className="mb-0 fw-bold text-success">Rs. {(parseFloat(emp.remaining_balance) || 0).toLocaleString('en-PK')}</p>
                      </div>
                    </div>
                    <button
                      className="btn btn-light w-100"
                      onClick={() => {
                        setSelectedEmployee(emp)
                        setShowAssignModal(true)
                      }}
                      style={{ borderRadius: '16px' }}
                    >
                      <DollarSign size={16} className="me-1" /> Assign Money
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow" style={{ borderRadius: '24px' }}>
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
                  <button type="submit" className="btn btn-dark w-100 mb-2" style={{ borderRadius: '16px' }}>Send Invitation</button>
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
            <div className="modal-content border-0 shadow" style={{ borderRadius: '24px' }}>
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
                  <button type="submit" className="btn btn-dark w-100 mb-2" style={{ borderRadius: '16px' }}>Confirm Assignment</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Dashboard_2
