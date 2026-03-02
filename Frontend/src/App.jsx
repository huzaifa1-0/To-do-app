import { useState } from 'react'
import { TrendingUp, Calendar, DollarSign } from 'lucide-react'
import 'bootstrap/dist/css/bootstrap.min.css'

const sampleExpenses = [
  { id: 1, description: 'Office Supplies', amount: 150.00, category: 'Office', date: '2026-03-02' },
  { id: 2, description: 'Client Lunch', amount: 85.50, category: 'Meals', date: '2026-03-02' },
  { id: 3, description: 'Software Subscription', amount: 299.99, category: 'Technology', date: '2026-03-01' },
  { id: 4, description: 'Taxi Fare', amount: 45.00, category: 'Transport', date: '2026-03-01' },
  { id: 5, description: 'Hotel Accommodation', amount: 450.00, category: 'Travel', date: '2026-02-28' },
  { id: 6, description: 'Team Building Event', amount: 800.00, category: 'Events', date: '2026-02-28' },
  { id: 7, description: 'Printer Ink', amount: 120.00, category: 'Office', date: '2026-02-27' },
  { id: 8, description: 'Business Dinner', amount: 210.75, category: 'Meals', date: '2026-02-27' },
  { id: 9, description: 'Cloud Storage', amount: 99.99, category: 'Technology', date: '2026-02-26' },
  { id: 10, description: 'Fuel', amount: 75.00, category: 'Transport', date: '2026-02-26' },
  { id: 11, description: 'Conference Tickets', amount: 1200.00, category: 'Events', date: '2026-02-25' },
  { id: 12, description: 'Flight Tickets', amount: 850.00, category: 'Travel', date: '2026-02-25' },
]

const categories = ['All', 'Office', 'Meals', 'Technology', 'Transport', 'Travel', 'Events']

function App() {
  const [showAllExpenses, setShowAllExpenses] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [viewMode, setViewMode] = useState('recent') // 'recent', 'categories', 'category-expenses'

  const totalExpenses = sampleExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  const recentExpenses = sampleExpenses.slice(0, 5)

  // Get unique categories with their total amounts
  const categoryTotals = sampleExpenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = { count: 0, total: 0 }
    }
    acc[expense.category].count += 1
    acc[expense.category].total += expense.amount
    return acc
  }, {})

  const categoriesWithTotals = Object.entries(categoryTotals).map(([name, data]) => ({
    name,
    count: data.count,
    total: data.total
  }))

  const filteredExpenses = selectedCategory
    ? sampleExpenses.filter(expense => expense.category === selectedCategory)
    : []

  const expensesToShow = viewMode === 'category-expenses' ? filteredExpenses : recentExpenses

  return (
    <div className="bg-light min-vh-100">
      <header className="bg-dark text-white py-3">
        <div className="container d-flex justify-content-center align-items-center gap-2">
          <div className="d-flex align-items-center gap-2">
            <div className="bg-white text-dark rounded-circle d-flex justify-content-center align-items-center fw-bold" 
                 style={{ width: '40px', height: '40px', fontSize: '18px' }}>
              TM
            </div>
            <h1 className="mb-0">The Manager</h1>
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

        <div className="card shadow mb-4">
          <div className="card-body d-flex align-items-center gap-4">
            <TrendingUp size={40} className="text-success" />
            <div>
              <h4 className="mb-1">Total Expenses</h4>
              <h2 className="fw-bold text-primary">Rs. {totalExpenses.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</h2>
              <p className="text-muted mb-0">{sampleExpenses.length} expenses recorded</p>
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
            {categoriesWithTotals.map(category => (
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
            ))}
          </div>
        ) : (
          <div className="row g-4">
            {expensesToShow.length === 0 ? (
              <p className="text-muted">No expenses found for this category.</p>
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
                        {new Date(expense.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
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

export default App