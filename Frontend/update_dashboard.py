import re

# Read original
with open('d:\\The Manager\\To-do-app\\Frontend\\src\\pages\\Dashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    "import { TrendingUp, Calendar, DollarSign, LogOut, User, Users, PlusCircle, Trash2 } from 'lucide-react'",
    "import { TrendingUp, Calendar, DollarSign, LogOut, User, Users, PlusCircle, Trash2, Wallet, Clock, CheckCircle } from 'lucide-react'"
)

# 2. Add API constants
content = content.replace(
    "const USERS_API_URL = `${BASE_URL}/`",
    "const USERS_API_URL = `${BASE_URL}/`\nconst INCOME_API_URL = `${BASE_URL}/expenses/incomes/`\nconst FUTURE_EXPENSE_API_URL = `${BASE_URL}/expenses/future-expenses/`"
)

# 3. Add States
states_target = """  const [employees, setEmployees] = useState([])"""
states_replacement = """  const [employees, setEmployees] = useState([])
  
  // Finance States
  const [totalBalance, setTotalBalance] = useState(0)
  const [incomes, setIncomes] = useState([])
  const [futureExpenses, setFutureExpenses] = useState([])
  
  // Modals for Finance
  const [showIncomeModal, setShowIncomeModal] = useState(false)
  const [incomeForm, setIncomeForm] = useState({ source: '', amount: '', expected_date: '' })
  const [incomeMessage, setIncomeMessage] = useState('')
  
  const [showFutureExpenseModal, setShowFutureExpenseModal] = useState(false)
  const [futureExpenseForm, setFutureExpenseForm] = useState({ title: '', amount: '', expected_date: '' })
  const [futureExpenseMessage, setFutureExpenseMessage] = useState('')"""
content = content.replace(states_target, states_replacement)

# 4. Fetching Logic (Total Balance)
fetch_target = """        const totalData = await totalRes.json()
        setTotalExpenses(totalData.today_total || 0)"""
fetch_replacement = """        const totalData = await totalRes.json()
        setTotalExpenses(totalData.today_total || 0)
        setTotalBalance(parseFloat(totalData.total_balance) || 0)"""
content = content.replace(fetch_target, fetch_replacement)

# 5. Fetching Incomes and Future Expenses
fetch_data_target = """        // Fetch budget status
        const budgetRes = await fetch(`${API_BASE_URL}budget-status/`, {"""
fetch_data_replacement = """        // Fetch Incomes
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
        const budgetRes = await fetch(`${API_BASE_URL}budget-status/`, {"""
content = content.replace(fetch_data_target, fetch_data_replacement)

# 6. Handlers for Finance features
handlers_target = """  const recentExpenses = todayExpenses"""
handlers_replacement = """  // --- Finance Handlers ---
  const handleAddIncome = async (e) => {
    e.preventDefault()
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
        setTotalBalance(data.new_balance)
      } else {
        alert('Failed to mark income as received.')
      }
    } catch (err) {
        console.error(err)
    }
  }

  const handleAddFutureExpense = async (e) => {
    e.preventDefault()
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
        setTotalBalance(data.new_balance)
        // Refresh local expenses cache as it's now tracked
        const fe = futureExpenses.find(x => x.id === id)
        const dummyExp = { id: Date.now(), title: fe.title, amount: fe.amount, category_name: 'Others', created_at: new Date().toISOString() }
        setTodayExpenses(prev => [dummyExp, ...prev.slice(0, 4)])
        setAllExpenses(prev => [dummyExp, ...prev])
        setTotalExpenses(prev => prev + parseFloat(fe.amount))
      } else {
        const errData = await res.json()
        alert(errData.error || 'Failed to confirm expense.')
      }
    } catch (err) {
        console.error(err)
    }
  }

  const recentExpenses = todayExpenses"""
content = content.replace(handlers_target, handlers_replacement)

# 7. AI Submit balance deduction update
ai_submit_target = """          setTotalExpenses(prev => prev + parseFloat(newExpense.amount))"""
ai_submit_replacement = """          setTotalExpenses(prev => prev + parseFloat(newExpense.amount))
          setTotalBalance(prev => Math.max(0, prev - parseFloat(newExpense.amount)))"""
content = content.replace(ai_submit_target, ai_submit_replacement)

# 8. Delete expense balance refund update
delete_expense_target = """        // Update totals
        setTotalExpenses(prev => Math.max(0, prev - parseFloat(amount)))"""
delete_expense_replacement = """        // Update totals
        setTotalExpenses(prev => Math.max(0, prev - parseFloat(amount)))
        setTotalBalance(prev => prev + parseFloat(amount))"""
content = content.replace(delete_expense_target, delete_expense_replacement)

# 9. Header Buttons update
header_nav_target = """                <div className="d-flex align-items-center gap-2">
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
                </div>"""
header_nav_replacement = """                <div className="d-flex align-items-center gap-2">
                  <button 
                    className={`btn btn-sm ${viewMode === 'incomes' ? 'btn-light text-primary' : 'btn-outline-light'}`}
                    onClick={() => setViewMode('incomes')}
                  >
                    <Wallet size={16} className="me-1 d-none d-md-inline" />
                    Income
                  </button>
                  <button 
                    className={`btn btn-sm ${viewMode === 'future_expenses' ? 'btn-light text-primary' : 'btn-outline-light'}`}
                    onClick={() => setViewMode('future_expenses')}
                  >
                    <Clock size={16} className="me-1 d-none d-md-inline" />
                    Future Exp.
                  </button>
                  <button 
                    className={`btn btn-sm ${viewMode === 'employees' ? 'btn-light text-primary' : 'btn-outline-light'}`}
                    onClick={() => setViewMode('employees')}
                  >
                    <Users size={16} className="me-1 d-none d-md-inline" />
                    Team
                  </button>
                  <button
                    className="btn btn-outline-light btn-sm"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} className="me-1 d-none d-md-inline" />
                    Logout
                  </button>
                </div>"""
content = content.replace(header_nav_target, header_nav_replacement)

# 10. Summary Banner (Total Balance and Today's Expenses)
banner_target = """            <div className="d-flex align-items-center gap-4 text-white">
              <div className="bg-white rounded-circle p-3">
                <TrendingUp size={40} className="text-success" />
              </div>
              <div>
                <h4 className="mb-1 opacity-75">Today's Expenses</h4>
                <h2 className="fw-bold mb-1">Rs. {totalExpenses.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</h2>
                <p className="mb-0 small opacity-75">{allExpenses.length} all-time expenses recorded</p>
              </div>
            </div>"""
banner_replacement = """            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4 text-white">
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
            </div>"""
content = content.replace(banner_target, banner_replacement)

# 11. ViewMode conditional rendering injections (Back button logic)
back_logic_target = """        {viewMode !== 'recent' && viewMode !== 'employees' && ("""
back_logic_replacement = """        {viewMode !== 'recent' && viewMode !== 'employees' && viewMode !== 'incomes' && viewMode !== 'future_expenses' && ("""
content = content.replace(back_logic_target, back_logic_replacement)

back_logic2_target = """        {viewMode === 'employees' && ("""
back_logic2_replacement = """        {['employees', 'incomes', 'future_expenses'].includes(viewMode) && ("""
content = content.replace(back_logic2_target, back_logic2_replacement)


# 12. ViewMode new views (Incomes and Future Expenses)
views_target = """        {viewMode === 'employees' ? ("""
views_replacement = """        {viewMode === 'incomes' ? (
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

            {/* Income Modal */}
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
                        <div className="mb-3">
                          <label className="form-label text-muted small">Source/Title</label>
                          <input type="text" className="form-control" placeholder="e.g. Salary, Freelance" value={incomeForm.source} onChange={e => setIncomeForm({...incomeForm, source: e.target.value})} required />
                        </div>
                        <div className="mb-3">
                          <label className="form-label text-muted small">Amount (Rs.)</label>
                          <input type="number" className="form-control" placeholder="e.g. 50000" min="1" step="0.01" value={incomeForm.amount} onChange={e => setIncomeForm({...incomeForm, amount: e.target.value})} required />
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

            {/* Future Expense Modal */}
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
        ) : viewMode === 'employees' ? ("""
content = content.replace(views_target, views_replacement)

with open('d:\\The Manager\\To-do-app\\Frontend\\src\\pages\\Dashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Dashboard Updated")
