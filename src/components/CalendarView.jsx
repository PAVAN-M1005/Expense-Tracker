import { useMemo, useState } from 'react'
import { formatDate, monthKey, pad } from '../utils'

function CalendarView({ expenses, recurringExpenses }) {
  const [current, setCurrent] = useState(() => new Date())

  const year = current.getFullYear()
  const month = current.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const key = `${year}-${pad(month + 1)}`

  const byDate = useMemo(() => {
    const map = {}
    expenses.filter((e) => monthKey(e.date) === key).forEach((expense) => {
      if (!map[expense.date]) map[expense.date] = []
      map[expense.date].push(expense)
    })
    return map
  }, [expenses, key])

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) cells.push(day)

  const previousMonth = () => setCurrent(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrent(new Date(year, month + 1, 1))

  const recurringDates = recurringExpenses
    .filter((r) => r.active && monthKey(r.nextDueDate) === key)
    .map((r) => r.nextDueDate)

  return (
    <section className="card calendar-section">
      <div className="calendar-header">
        <div>
          <h2>Calendar View</h2>
          <p>See exactly when your spending happened.</p>
        </div>
        <div className="calendar-controls">
          <button className="secondary-button" onClick={previousMonth}>←</button>
          <strong>{current.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}</strong>
          <button className="secondary-button" onClick={nextMonth}>→</button>
        </div>
      </div>

      <div className="calendar-weekdays">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day) => <div key={day}>{day}</div>)}
      </div>

      <div className="calendar-grid">
        {cells.map((day, index) => {
          if (!day) return <div className="calendar-cell empty" key={`empty-${index}`} />
          const date = `${year}-${pad(month + 1)}-${pad(day)}`
          const dayExpenses = byDate[date] || []
          const total = dayExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
          const recurring = recurringDates.includes(date)

          return (
            <div className={`calendar-cell ${dayExpenses.length ? 'has-expenses' : ''}`} key={date}>
              <div className="calendar-day-number">{day}</div>
              {dayExpenses.length > 0 && (
                <>
                  <div className="calendar-total">₹{total.toFixed(0)}</div>
                  <div className="calendar-items">
                    {dayExpenses.slice(0, 2).map((expense) => (
                      <span key={expense.id} title={`${expense.description} - ₹${expense.amount}`}>
                        {expense.description}
                      </span>
                    ))}
                    {dayExpenses.length > 2 && <small>+{dayExpenses.length - 2} more</small>}
                  </div>
                </>
              )}
              {recurring && <span className="calendar-recurring">↻ Due</span>}
            </div>
          )
        })}
      </div>

      <div className="calendar-summary">
        <strong>Month total: ₹{expenses.filter((e) => monthKey(e.date) === key).reduce((s,e) => s + Number(e.amount), 0).toFixed(2)}</strong>
        <span>Recurring due dates are marked with ↻.</span>
      </div>
    </section>
  )
}

export default CalendarView
