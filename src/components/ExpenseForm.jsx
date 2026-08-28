import { useEffect, useState } from 'react'
import { addExpense } from '../api'
import { PAYMENT_METHODS } from '../utils'

function ExpenseForm({
  expenses,
  setExpenses,
  selectedMonth,
  categories
}) {
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (selectedMonth && (!date || !date.startsWith(selectedMonth))) {
      setDate(`${selectedMonth}-01`)
    }
  }, [selectedMonth])

  const getLastDayOfMonth = () => {
    if (!selectedMonth) return undefined
    const [year, month] = selectedMonth.split('-').map(Number)
    const lastDay = new Date(year, month, 0).getDate()
    return `${selectedMonth}-${String(lastDay).padStart(2, '0')}`
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!selectedMonth) return alert('Please select a month first')
    if (!amount || Number(amount) <= 0) return alert('Amount must be greater than 0')
    if (!category) return alert('Please select a category')
    if (!description.trim()) return alert('Please enter a description')
    if (!date) return alert('Please select a date')
    if (!date.startsWith(selectedMonth)) return alert('Please select a date from the selected month')

    try {
      const response = await addExpense({
        amount: Number(amount),
        category,
        description: description.trim(),
        date,
        paymentMethod,
        notes: notes.trim()
      })

      const newExpense = {
        ...response.expense,
        amount: Number(response.expense.amount),
        paymentMethod: response.expense.payment_method || paymentMethod,
        recurringId: response.expense.recurring_id || null,
        recurringDueDate: response.expense.recurring_due_date || null
      }

      setExpenses((previous) => [...previous, newExpense])

      setAmount('')
      setCategory('')
      setDescription('')
      setPaymentMethod('UPI')
      setNotes('')
      setDate(`${selectedMonth}-01`)
    } catch (error) {
      alert(error.message || 'Failed to add expense')
    }
  }

  return (
    <section className="card form-card">
      <div className="section-heading">
        <div>
          <h2>Add Expense</h2>
          <p>Add a normal expense with payment details and notes.</p>
        </div>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <div className="field">
          <label>Amount</label>
          <input type="number" min="0.01" step="0.01" placeholder="Enter amount" value={amount}
            onChange={(e) => setAmount(e.target.value)} />
        </div>

        <div className="field">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Select category</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Description</label>
          <input type="text" placeholder="What did you spend on?" value={description}
            onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="field">
          <label>Date</label>
          <input type="date" value={date} min={selectedMonth ? `${selectedMonth}-01` : undefined}
            max={getLastDayOfMonth()} disabled={!selectedMonth}
            onChange={(e) => setDate(e.target.value)} />
        </div>

        <div className="field">
          <label>Payment Method</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            {PAYMENT_METHODS.map((method) => <option key={method}>{method}</option>)}
          </select>
        </div>

        <div className="field field-full">
          <label>Notes <span className="muted">(optional)</span></label>
          <textarea rows="3" placeholder="Add any extra details..." value={notes}
            onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="field field-full">
          <button className="primary-button" type="submit">Add Expense</button>
        </div>
      </form>
    </section>
  )
}

export default ExpenseForm
