import { useMemo, useState } from 'react'
import { formatDate, PAYMENT_METHODS } from '../utils'

function ExpenseList({
  expenses,
  setExpenses,
  filterCategory,
  setFilterCategory,
  categories
}) {
  const [sortBy, setSortBy] = useState('newest')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [editingId, setEditingId] = useState(null)

  const visibleExpenses = useMemo(() => {
    const filtered = expenses.filter((expense) => {
      const amount = Number(expense.amount)
      const minOk = minAmount === '' || amount >= Number(minAmount)
      const maxOk = maxAmount === '' || amount <= Number(maxAmount)
      const paymentOk = paymentFilter === 'all' || (expense.paymentMethod || 'UPI') === paymentFilter
      return minOk && maxOk && paymentOk
    })

    return [...filtered].sort((a, b) => {
      if (sortBy === 'oldest') return a.date.localeCompare(b.date)
      if (sortBy === 'highest') return Number(b.amount) - Number(a.amount)
      if (sortBy === 'lowest') return Number(a.amount) - Number(b.amount)
      if (sortBy === 'category') return a.category.localeCompare(b.category)
      return b.date.localeCompare(a.date)
    })
  }, [expenses, minAmount, maxAmount, paymentFilter, sortBy])

  const total = visibleExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0)

  const deleteExpense = (id) => {
    if (!window.confirm('Delete this expense?')) return
    setExpenses((previous) => previous.filter((expense) => expense.id !== id))
  }

  const updateExpense = (id, patch) => {
    setExpenses((previous) => previous.map((expense) =>
      expense.id === id ? { ...expense, ...patch } : expense
    ))
  }

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <h2>Expenses</h2>
          <p>{visibleExpenses.length} expense(s) match your filters.</p>
        </div>
        <strong className="total-label">Total: ₹{total.toFixed(2)}</strong>
      </div>

      <div className="advanced-filter-grid">
        <div className="field">
          <label>Category</label>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Payment Method</label>
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
            <option value="all">All Methods</option>
            {PAYMENT_METHODS.map((method) => <option key={method}>{method}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Min Amount</label>
          <input type="number" min="0" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
        </div>

        <div className="field">
          <label>Max Amount</label>
          <input type="number" min="0" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />
        </div>

        <div className="field">
          <label>Sort By</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Amount</option>
            <option value="lowest">Lowest Amount</option>
            <option value="category">Category</option>
          </select>
        </div>
      </div>

      <div className="expense-grid">
        {visibleExpenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💸</div>
            <h3>No expenses found</h3>
            <p>Try changing your filters or add a new expense.</p>
          </div>
        ) : visibleExpenses.map((expense) => (
          <article className="expense-card" key={expense.id}>
            {editingId === expense.id ? (
              <div className="edit-box">
                <div className="form-grid">
                  <div className="field">
                    <label>Amount</label>
                    <input type="number" value={expense.amount}
                      onChange={(e) => updateExpense(expense.id, { amount: Number(e.target.value) })} />
                  </div>
                  <div className="field">
                    <label>Category</label>
                    <select value={expense.category}
                      onChange={(e) => updateExpense(expense.id, { category: e.target.value })}>
                      {categories.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>Description</label>
                    <input value={expense.description}
                      onChange={(e) => updateExpense(expense.id, { description: e.target.value })} />
                  </div>
                  <div className="field">
                    <label>Date</label>
                    <input type="date" value={expense.date}
                      onChange={(e) => updateExpense(expense.id, { date: e.target.value })} />
                  </div>
                  <div className="field">
                    <label>Payment</label>
                    <select value={expense.paymentMethod || 'UPI'}
                      onChange={(e) => updateExpense(expense.id, { paymentMethod: e.target.value })}>
                      {PAYMENT_METHODS.map((method) => <option key={method}>{method}</option>)}
                    </select>
                  </div>
                  <div className="field field-full">
                    <label>Notes</label>
                    <textarea rows="2" value={expense.notes || ''}
                      onChange={(e) => updateExpense(expense.id, { notes: e.target.value })} />
                  </div>
                </div>
                <button className="primary-button small" onClick={() => setEditingId(null)}>Save Changes</button>
              </div>
            ) : (
              <>
                <div className="expense-top">
                  <span className="category-badge">{expense.category}</span>
                  <strong>₹{Number(expense.amount).toFixed(2)}</strong>
                </div>
                <h3>{expense.description}</h3>
                <p><b>Date:</b> {formatDate(expense.date)}</p>
                <p><b>Payment:</b> {expense.paymentMethod || 'UPI'}</p>
                {expense.notes && <p className="expense-note"><b>Notes:</b> {expense.notes}</p>}
                {expense.recurringId && <span className="recurring-tag">↻ Recurring</span>}
                <div className="card-actions">
                  <button className="danger-button" onClick={() => deleteExpense(expense.id)}>Delete</button>
                  <button className="secondary-button" onClick={() => setEditingId(expense.id)}>Edit</button>
                </div>
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

export default ExpenseList
