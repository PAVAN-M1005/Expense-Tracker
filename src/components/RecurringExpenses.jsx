import { useState } from 'react'
import { addFrequency, todayString } from '../utils'

function RecurringExpenses({
  recurringExpenses,
  setRecurringExpenses,
  expenses,
  setExpenses,
  categories
}) {
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [frequency, setFrequency] = useState('monthly')

  const handleAddRecurring = (event) => {
    event.preventDefault()
    if (!amount || Number(amount) <= 0) return alert('Please enter a valid amount')
    if (!category) return alert('Please select a category')
    if (!description.trim()) return alert('Please enter a description')
    if (!startDate) return alert('Please select a start date')

    const recurringExpense = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      amount: Number(amount),
      category,
      description: description.trim(),
      startDate,
      frequency,
      nextDueDate: startDate,
      active: true
    }

    setRecurringExpenses((previous) => [...previous, recurringExpense])
    setAmount('')
    setCategory('')
    setDescription('')
    setStartDate('')
    setFrequency('monthly')
  }

  const addOccurrence = (recurring, occurrenceDate) => {
    const exists = expenses.some(
      (expense) =>
        expense.recurringId === recurring.id &&
        expense.recurringOccurrence === occurrenceDate
    )

    if (exists) {
      alert('This recurring expense has already been added for this date.')
      return false
    }

    const newExpense = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      amount: recurring.amount,
      category: recurring.category,
      description: recurring.description,
      date: occurrenceDate,
      paymentMethod: 'UPI',
      notes: 'Automatically generated recurring expense',
      recurringId: recurring.id,
      recurringOccurrence: occurrenceDate
    }

    setExpenses((previous) => [...previous, newExpense])
    return true
  }

  const addNow = (recurring) => {
    const today = todayString()
    const added = addOccurrence(recurring, today)
    if (added) alert('Expense added for today.')
  }

  const toggleActive = (id) => {
    setRecurringExpenses((previous) => previous.map((item) =>
      item.id === id ? { ...item, active: !item.active } : item
    ))
  }

  const deleteRecurring = (id) => {
    if (!window.confirm('Delete this recurring expense template? Existing expenses will remain.')) return
    setRecurringExpenses((previous) => previous.filter((item) => item.id !== id))
  }

  const advanceDueDate = (recurring) => {
    let next = recurring.nextDueDate
    const today = todayString()
    while (next <= today) next = addFrequency(next, recurring.frequency)
    return next
  }

  const resetToDueDate = (recurring) => {
    setRecurringExpenses((previous) => previous.map((item) =>
      item.id === recurring.id ? { ...item, nextDueDate: recurring.startDate, active: true } : item
    ))
  }

  return (
    <section className="card recurring-expenses">
      <div className="section-heading">
        <div>
          <h2>Recurring Expenses</h2>
          <p>Recurring expenses are generated automatically when their due date arrives.</p>
        </div>
      </div>

      <form className="form-grid" onSubmit={handleAddRecurring}>
        <div className="field">
          <label>Amount</label>
          <input type="number" min="0.01" step="0.01" placeholder="Enter amount" value={amount}
            onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="field">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Select category</option>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Description</label>
          <input placeholder="Example: Room rent" value={description}
            onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="field">
          <label>Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Frequency</label>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div className="field field-full">
          <button className="primary-button" type="submit">Add Recurring Expense</button>
        </div>
      </form>

      <div className="subsection">
        <h3>Saved Recurring Expenses</h3>
        {recurringExpenses.length === 0 ? (
          <div className="empty-state compact"><p>No recurring expenses added yet.</p></div>
        ) : (
          <div className="recurring-grid">
            {recurringExpenses.map((expense) => {
              const nextDate = advanceDueDate(expense)
              return (
                <article className="recurring-card" key={expense.id}>
                  <div className="expense-top">
                    <div>
                      <h3>{expense.description}</h3>
                      <span className={`status-pill ${expense.active ? 'active' : 'paused'}`}>
                        {expense.active ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <strong>₹{Number(expense.amount).toFixed(2)}</strong>
                  </div>
                  <p><b>Category:</b> {expense.category}</p>
                  <p><b>Frequency:</b> {expense.frequency}</p>
                  <p><b>Next Due:</b> {nextDate}</p>
                  <div className="card-actions">
                    <button className="success-button" onClick={() => addNow(expense)}>Add Now</button>
                    <button className="secondary-button" onClick={() => toggleActive(expense.id)}>
                      {expense.active ? 'Pause' : 'Resume'}
                    </button>
                    <button className="danger-button" onClick={() => deleteRecurring(expense.id)}>Delete</button>
                  </div>
                  <button className="text-button" onClick={() => resetToDueDate(expense)}>
                    Reset schedule
                  </button>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default RecurringExpenses
