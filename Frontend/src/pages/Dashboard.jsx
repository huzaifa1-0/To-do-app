import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Calendar, DollarSign, LogOut, User, Users, PlusCircle, Trash2, Wallet, Clock, CheckCircle } from 'lucide-react'
import 'bootstrap/dist/css/bootstrap.min.css'
import { API_BASE_URL as BASE_URL } from '../api/config'

const API_BASE_URL = `${BASE_URL}/expenses/`
const USERS_API_URL = `${BASE_URL}/`
const INCOME_API_URL = `${BASE_URL}/expenses/incomes/`
const FUTURE_EXPENSE_API_URL = `${BASE_URL}/expenses/future-expenses/`

const categories = ['All', 'Food', 'Travel', 'Transportation', 'Shopping', 'Entertainment', 'Healthcare', 'Utilities', 'Miscellaneous', 'Others']

function Dashboard() {
  const [showAllExpenses, setShowAllExpenses] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [viewMode, setViewMode] = useState('recent') // 'recent', 'categories', 'category-expenses', 'employees'
  const [employees, setEmployees] = useState([])
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [monthlyLimitInput, setMonthlyLimitInput] = useState(0)
  
  // Finance States
  const [totalBalance, setTotalBalance] = useState(0)
  const [incomes, setIncomes] = useState([])
  const [futureExpenses, setFutureExpenses] = useState([])
  
  // Modals for Finance
  const [showIncomeModal, setShowIncomeModal] = useState(false)
  const [incomeForm, setIncomeForm] = useState({ source: '', amount: '', expected_date: '' })
  const [incomeMessage, setIncomeMessage] = useState('')
  
  const [futureExpenseForm, setFutureExpenseForm] = useState({ title: '', amount: '', expected_date: '' })
  const [futureExpenseMessage, setFutureExpenseMessage] = useState('')
  const [incomeWarning, setIncomeWarning] = useState('')
  const [limitError, setLimitError] = useState('')

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
        setTotalBalance(parseFloat(totalData.total_balance) || 0)
        const limit = parseFloat(totalData.monthly_limit) || 0;
        setMonthlyLimitInput(limit);
        
        // Simple alert for exceeding limit
        if (limit > 0 && (totalData.today_total || 0) > limit) {
           alert(`⚠️ Warning: You have exceeded your monthly spending limit of Rs. ${limit}!`);
        }

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

        // Fetch Incomes
        const incomesRes = await fetch(INCOME_API_URL, { headers: authHeaders })
        if (incomesRes.ok) {
            const incomesData = await incomesRes.json()
            setIncomes(incomesData)
        }

        // Fetch Future Expenses
        const feRes = await fetch(FUTURE_EXPENSE_API_URL, { headers: authHeaders })
        if (feRes.ok) {
            const feData = await feRes.json()
            setFutureExpenses(feData)
        }

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
          setTotalBalance(prev => Math.max(0, prev - parseFloat(newExpense.amount)))

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
        setTotalBalance(prev => prev + parseFloat(amount))

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

  const handleIncomeChange = (e) => {
    const { name, value } = e.target;
    setIncomeForm(prev => ({ ...prev, [name]: value }));
    if (name === 'amount' && parseFloat(value) > 100000) {
      setIncomeWarning('⚠️ High value income detected!');
    } else if (name === 'amount') {
      setIncomeWarning('');
    }
  };

  const handleAddIncome = async (e) => {
    e.preventDefault()

    // Date Validation
    const selectedDate = new Date(incomeForm.expected_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setIncomeMessage('⚠️ Date cannot be in the past.');
      return;
    }

    setIncomeMessage('Adding...')
    try {
      const accessToken = localStorage.getItem('access_token')
      const res = await fetch(INCOME_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify(incomeForm)
      })
      if (res.ok) {
        const data = await res.json()
        setIncomes(prev => [...prev, data].sort((a,b) => new Date(a.expected_date) - new Date(b.expected_date)))
        setIncomeMessage('✅ Income Added!')
        setIncomeForm({ source: '', amount: '', expected_date: '' })
        setTimeout(() => { setShowIncomeModal(false); setIncomeMessage('') }, 1500)
      } else {
        setIncomeMessage('⚠️ Error adding income')
      }
    } catch (err) {
      setIncomeMessage('⚠️ Network error')
    }
  }

  const handleReceiveIncome = async (id) => {
    try {
      const accessToken = localStorage.getItem('access_token')
      const res = await fetch(`${INCOME_API_URL}${id}/receive/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        setIncomes(prev => prev.map(inc => inc.id === id ? { ...inc, status: 'Received' } : inc))
        setTotalBalance(parseFloat(data.new_balance) || 0)
      } else {
        const errData = await res.json()
        alert('Failed to mark income as received: ' + (errData.error || res.statusText))
      }
    } catch (err) {
        console.error(err)
        alert('Network error while marking income as received.')
    }
  }

  const handleAddFutureExpense = async (e) => {
    e.preventDefault()

    // Date Validation
    const selectedDate = new Date(futureExpenseForm.expected_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setFutureExpenseMessage('⚠️ Date cannot be in the past.');
      return;
    }

    setFutureExpenseMessage('Adding...')
    try {
      const accessToken = localStorage.getItem('access_token')
      const res = await fetch(FUTURE_EXPENSE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify(futureExpenseForm)
      })
      if (res.ok) {
        const data = await res.json()
        setFutureExpenses(prev => [...prev, data].sort((a,b) => new Date(a.expected_date) - new Date(b.expected_date)))
        setFutureExpenseMessage('✅ Future Expense Added!')
        setFutureExpenseForm({ title: '', amount: '', expected_date: '' })
        setTimeout(() => { setShowFutureExpenseModal(false); setFutureExpenseMessage('') }, 1500)
      } else {
        setFutureExpenseMessage('⚠️ Error adding future expense')
      }
    } catch (err) {
      setFutureExpenseMessage('⚠️ Network error')
    }
  }

  const handleConfirmFutureExpense = async (id) => {
    if (!window.confirm('Confirm this expense has actually occurred? It will deduct from your balance.')) return
    try {
      const accessToken = localStorage.getItem('access_token')
      const res = await fetch(`${FUTURE_EXPENSE_API_URL}${id}/confirm/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        setFutureExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, status: 'Confirmed' } : exp))
        setTotalBalance(parseFloat(data.new_balance) || 0)
        // Refresh local expenses cache as it's now tracked
        const fe = futureExpenses.find(x => x.id === id)
        const dummyExp = { id: Date.now(), title: fe.title, amount: fe.amount, category_name: 'Others', created_at: new Date().toISOString() }
        setTodayExpenses(prev => [dummyExp, ...prev.slice(0, 4)])
        setAllExpenses(prev => [dummyExp, ...prev])
        setTotalExpenses(prev => prev + parseFloat(fe.amount))
      } else {
        const errData = await res.json()
        alert('Failed to confirm expense: ' + (errData.error || res.statusText))
      }
    } catch (err) {
        console.error(err)
        alert('Network error while confirming expense.')
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

            <div className="mt-3 text-white">
               <button className="btn btn-sm btn-outline-light rounded-pill" onClick={() => setShowLimitModal(true)}>
                  Set Monthly Limit
               </button>
            </div>

            {showLimitModal && (
                <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100}}>
                   <div className="modal-dialog modal-dialog-centered">
                      <div className="modal-content text-dark p-3">
                         <h5 className="fw-bold">Set Monthly Spending Limit</h5>
                         <input 
                            type="number" 
                            className={`form-control ${limitError ? 'is-invalid' : ''}`}
                            step="1"
                            value={monthlyLimitInput} 
                            onChange={(e) => {
                               const val = e.target.value;
                               setMonthlyLimitInput(val);
                               if (parseFloat(val) <= 0) {
                                  setLimitError('Limit must be greater than 0');
                               } else if (!Number.isInteger(Number(val))) {
                                  setLimitError('Limit must be a round number');
                               } else {
                                  setLimitError('');
                               }
                            }}
                         />
                         {limitError && <div className="invalid-feedback">{limitError}</div>}
                         <div className="mt-3 d-flex gap-2">
                            <button className="btn btn-primary" disabled={limitError !== '' || !monthlyLimitInput} onClick={async () => {
                                const accessToken = localStorage.getItem('access_token');
                                const res = await fetch(`${BASE_URL}/expenses/update-monthly-limit/`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                                    body: JSON.stringify({ monthly_limit: monthlyLimitInput })
                                });
                                if (res.ok) {
                                   setShowLimitModal(false);
                                   window.location.reload(); // Refresh to update status
                                } else {
                                   const d = await res.json();
                                   setLimitError(d.error || 'Failed to update');
                                }
                            }}>Save</button>
                            <button className="btn btn-secondary" onClick={() => setShowLimitModal(false)}>Cancel</button>
                         </div>
                      </div>
                   </div>
                </div>
            )}

            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4 text-white">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-white rounded-circle p-3 d-flex justify-content-center align-items-center text-primary shadow-sm">
                  <Wallet size={36} />
                </div>
                <div>
                  <h5 className="mb-1 opacity-75">Total Balance</h5>
                  <h1 className="fw-bold mb-0">Rs. {totalBalance.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</h1>
                </div>
              </div>
              <div className="d-flex align-items-center gap-3 border-start border-white border-opacity-25 ps-md-4">
                <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex justify-content-center align-items-center text-white">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h6 className="mb-0 opacity-75">Today's Expenses</h6>
                  <h4 className="fw-bold mb-0">Rs. {totalExpenses.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</h4>
                  <p className="mb-0 small opacity-75 d-none d-md-block">{allExpenses.length} total recorded</p>
                </div>
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

        {/* Finance Overview Grid */}
        {viewMode === 'recent' && (
          <div className="row g-4 mb-4">
            {/* Upcoming Income Section */}
            <div className="col-md-6">
              <div className="card shadow-sm h-100 border-0">
                <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                    <Wallet size={18} className="text-success" />
                    Upcoming Income
                  </h5>
                  <button className="btn btn-sm btn-outline-success rounded-pill" onClick={() => setShowIncomeModal(true)}>
                    <PlusCircle size={14} className="me-1" /> Add
                  </button>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0 align-middle">
                      <tbody>
                        {incomes.filter(inc => inc.status === 'Pending').slice(0, 3).length === 0 ? (
                          <tr>
                            <td className="text-center py-4 text-muted small">No pending incomes.</td>
                          </tr>
                        ) : (
                          incomes.filter(inc => inc.status === 'Pending').slice(0, 3).map(inc => (
                            <tr key={inc.id}>
                              <td className="ps-4">
                                <div className="fw-medium">{inc.source}</div>
                                <div className="text-muted small">{new Date(inc.expected_date).toLocaleDateString()}</div>
                              </td>
                              <td className="text-end fw-bold text-success">
                                Rs. {(parseFloat(inc.amount) || 0).toLocaleString('en-PK')}
                              </td>
                              <td className="text-end pe-4">
                                <button className="btn btn-sm btn-link text-success p-0" title="Receive" onClick={() => handleReceiveIncome(inc.id)}>
                                  <CheckCircle size={18} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {incomes.length > 0 && (
                    <div className="card-footer bg-white border-0 text-center py-2">
                      <button className="btn btn-link btn-sm text-decoration-none" onClick={() => setViewMode('incomes')}>View All Incomes</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Upcoming Expenses Section */}
            <div className="col-md-6">
              <div className="card shadow-sm h-100 border-0">
                <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                    <Clock size={18} className="text-warning" />
                    Upcoming Expenses
                  </h5>
                  <button className="btn btn-sm btn-outline-warning rounded-pill" onClick={() => setShowFutureExpenseModal(true)}>
                    <PlusCircle size={14} className="me-1" /> Plan
                  </button>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0 align-middle">
                      <tbody>
                        {futureExpenses.filter(exp => exp.status === 'Planned').slice(0, 3).length === 0 ? (
                          <tr>
                            <td className="text-center py-4 text-muted small">No planned expenses.</td>
                          </tr>
                        ) : (
                          futureExpenses.filter(exp => exp.status === 'Planned').slice(0, 3).map(exp => (
                            <tr key={exp.id}>
                              <td className="ps-4">
                                <div className="fw-medium">{exp.title}</div>
                                <div className="text-muted small">{new Date(exp.expected_date).toLocaleDateString()}</div>
                              </td>
                              <td className="text-end fw-bold text-danger">
                                Rs. {(parseFloat(exp.amount) || 0).toLocaleString('en-PK')}
                              </td>
                              <td className="text-end pe-4">
                                <button className="btn btn-sm btn-link text-warning p-0" title="Confirm" onClick={() => handleConfirmFutureExpense(exp.id)}>
                                  <CheckCircle size={18} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {futureExpenses.length > 0 && (
                    <div className="card-footer bg-white border-0 text-center py-2">
                      <button className="btn btn-link btn-sm text-decoration-none" onClick={() => setViewMode('future_expenses')}>View All Plans</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

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

        {viewMode !== 'recent' && viewMode !== 'employees' && viewMode !== 'incomes' && viewMode !== 'future_expenses' && (
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

        {['employees', 'incomes', 'future_expenses'].includes(viewMode) && (
          <button
            className="btn btn-primary mb-3"
            onClick={() => setViewMode('recent')}
          >
            ← Back to Dashboard
          </button>
        )}

        {viewMode === 'incomes' ? (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="mb-0 d-flex align-items-center gap-2">
                <Wallet className="text-primary" /> Upcoming Income
              </h3>
              <button className="btn btn-primary d-flex align-items-center gap-2"
                onClick={() => setShowIncomeModal(true)}>
                <PlusCircle size={18} /> Add Income
              </button>
            </div>
            
            <div className="row g-4">
              {incomes.length === 0 ? (
                <div className="col-12 text-center py-5">
                  <p className="text-muted">No upcoming incomes scheduled.</p>
                </div>
              ) : (
                incomes.map(inc => (
                  <div key={inc.id} className="col-md-6 col-lg-4">
                    <div className="card shadow-sm h-100 border-0">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h5 className="fw-bold mb-0">{inc.source}</h5>
                          <span className={`badge ${inc.status === 'Received' ? 'bg-success' : 'bg-warning text-dark'}`}>{inc.status}</span>
                        </div>
                        <h4 className="text-primary fw-bold mb-3">Rs. {(parseFloat(inc.amount) || 0).toLocaleString('en-PK')}</h4>
                        <div className="text-muted small mb-3">Expected Date: <strong>{new Date(inc.expected_date).toLocaleDateString()}</strong></div>
                        
                        {inc.status === 'Pending' && (
                          <button 
                            className="btn btn-outline-success w-100 d-flex align-items-center justify-content-center gap-2"
                            onClick={() => handleReceiveIncome(inc.id)}
                          >
                            <CheckCircle size={16} /> Mark as Received
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        ) : viewMode === 'future_expenses' ? (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="mb-0 d-flex align-items-center gap-2">
                <Clock className="text-primary" /> Upcoming Expenses
              </h3>
              <button className="btn btn-primary d-flex align-items-center gap-2"
                onClick={() => setShowFutureExpenseModal(true)}>
                <PlusCircle size={18} /> Plan Expense
              </button>
            </div>
            
            <div className="row g-4">
              {futureExpenses.length === 0 ? (
                <div className="col-12 text-center py-5">
                  <p className="text-muted">No upcoming expenses planned.</p>
                </div>
              ) : (
                futureExpenses.map(exp => (
                  <div key={exp.id} className="col-md-6 col-lg-4">
                    <div className="card shadow-sm h-100 border-0">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h5 className="fw-bold mb-0">{exp.title}</h5>
                          <span className={`badge ${exp.status === 'Confirmed' ? 'bg-success' : 'bg-secondary'}`}>{exp.status}</span>
                        </div>
                        <h4 className="text-danger fw-bold mb-3">Rs. {(parseFloat(exp.amount) || 0).toLocaleString('en-PK')}</h4>
                        <div className="text-muted small mb-3">Expected Date: <strong>{new Date(exp.expected_date).toLocaleDateString()}</strong></div>
                        
                        {exp.status === 'Planned' && (
                          <button 
                            className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2"
                            onClick={() => handleConfirmFutureExpense(exp.id)}
                          >
                            <CheckCircle size={16} /> Confirm Expense
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        ) : viewMode === 'employees' ? (
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

      {/* Global Modals for Financial Planning */}
      {showIncomeModal && (
        <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Add Upcoming Income</h5>
                <button type="button" className="btn-close" onClick={() => setShowIncomeModal(false)}></button>
              </div>
              <div className="modal-body">
                {incomeMessage && <div className={`alert py-2 ${incomeMessage.includes('✅') ? 'alert-success' : 'alert-warning'}`}>{incomeMessage}</div>}
                <form onSubmit={handleAddIncome}>
                  {incomeWarning && <div className="text-warning small mb-2 fw-bold">{incomeWarning}</div>}
                  <div className="mb-3">
                    <label className="form-label text-muted small">Source/Title</label>
                    <input type="text" className="form-control" placeholder="e.g. Salary, Freelance" value={incomeForm.source} onChange={e => setIncomeForm({...incomeForm, source: e.target.value})} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted small">Amount (Rs.)</label>
                    <input type="number" className="form-control" placeholder="e.g. 50000" min="1" step="0.01" name="amount" value={incomeForm.amount} onChange={handleIncomeChange} required />
                  </div>
                  <div className="mb-4">
                    <label className="form-label text-muted small">Expected Date</label>
                    <input type="date" className="form-control" value={incomeForm.expected_date} onChange={e => setIncomeForm({...incomeForm, expected_date: e.target.value})} required />
                  </div>
                  <button type="submit" className="btn btn-primary w-100 mb-2">Save Income</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFutureExpenseModal && (
        <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Plan Future Expense</h5>
                <button type="button" className="btn-close" onClick={() => setShowFutureExpenseModal(false)}></button>
              </div>
              <div className="modal-body">
                {futureExpenseMessage && <div className={`alert py-2 ${futureExpenseMessage.includes('✅') ? 'alert-success' : 'alert-warning'}`}>{futureExpenseMessage}</div>}
                <form onSubmit={handleAddFutureExpense}>
                  <div className="mb-3">
                    <label className="form-label text-muted small">Description</label>
                    <input type="text" className="form-control" placeholder="e.g. Electric Bill, Rent" value={futureExpenseForm.title} onChange={e => setFutureExpenseForm({...futureExpenseForm, title: e.target.value})} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted small">Amount (Rs.)</label>
                    <input type="number" className="form-control" placeholder="e.g. 15000" min="1" step="0.01" value={futureExpenseForm.amount} onChange={e => setFutureExpenseForm({...futureExpenseForm, amount: e.target.value})} required />
                  </div>
                  <div className="mb-4">
                    <label className="form-label text-muted small">Expected Date</label>
                    <input type="date" className="form-control" value={futureExpenseForm.expected_date} onChange={e => setFutureExpenseForm({...futureExpenseForm, expected_date: e.target.value})} required />
                  </div>
                  <button type="submit" className="btn btn-primary w-100 mb-2">Save Plan</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
