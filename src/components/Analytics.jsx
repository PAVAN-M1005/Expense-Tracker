function Analytics({ expenses, budget, selectedMonth }) {
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const count = expenses.length
  const average = count ? total / count : 0
  const highest = count ? Math.max(...expenses.map((e) => Number(e.amount))) : 0
  const lowest = count ? Math.min(...expenses.map((e) => Number(e.amount))) : 0
  const budgetAmount = Number(budget) || 0
  const remaining = budgetAmount - total

  const categoryTotals = {}
  const paymentTotals = {}
  expenses.forEach((expense) => {
    categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + Number(expense.amount)
    const method = expense.paymentMethod || 'UPI'
    paymentTotals[method] = (paymentTotals[method] || 0) + Number(expense.amount)
  })

  const categoryEntries = Object.entries(categoryTotals).sort((a,b) => b[1] - a[1])
  const paymentEntries = Object.entries(paymentTotals).sort((a,b) => b[1] - a[1])
  const maxCategory = categoryEntries[0]?.[1] || 1

  const dailyTotals = {}
  expenses.forEach((e) => { dailyTotals[e.date] = (dailyTotals[e.date] || 0) + Number(e.amount) })
  const dailyEntries = Object.entries(dailyTotals).sort((a,b) => b[1] - a[1]).slice(0, 7)

  return (
    <section className="card analytics-section">
      <div className="section-heading">
        <div>
          <h2>Analytics</h2>
          <p>{selectedMonth ? `Analysis for ${selectedMonth}` : 'Select a month from Overview or use Calendar.'}</p>
        </div>
      </div>

      <div className="stats-grid">
        {[
          ['Total Expenses', `₹${total.toFixed(2)}`],
          ['Transactions', count],
          ['Average Expense', `₹${average.toFixed(2)}`],
          ['Highest Expense', `₹${highest.toFixed(2)}`],
          ['Lowest Expense', `₹${lowest.toFixed(2)}`],
          ['Top Category', categoryEntries[0]?.[0] || 'N/A']
        ].map(([label, value]) => (
          <div className="stat-card" key={label}><span>{label}</span><strong>{value}</strong></div>
        ))}
      </div>

      <div className="analytics-layout">
        <div className="analytics-panel">
          <h3>Spending by Category</h3>
          {categoryEntries.length === 0 ? <p className="muted">No spending data.</p> : categoryEntries.map(([category, amount]) => (
            <div className="bar-row" key={category}>
              <div className="bar-label"><span>{category}</span><b>₹{amount.toFixed(2)}</b></div>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${(amount / maxCategory) * 100}%` }} /></div>
              <small>{total ? ((amount / total) * 100).toFixed(1) : 0}%</small>
            </div>
          ))}
        </div>

        <div className="analytics-panel">
          <h3>Payment Method Breakdown</h3>
          {paymentEntries.length === 0 ? <p className="muted">No payment data.</p> : paymentEntries.map(([method, amount]) => (
            <div className="bar-row" key={method}>
              <div className="bar-label"><span>{method}</span><b>₹{amount.toFixed(2)}</b></div>
              <div className="bar-track"><div className="bar-fill alt" style={{ width: `${total ? (amount / total) * 100 : 0}%` }} /></div>
              <small>{total ? ((amount / total) * 100).toFixed(1) : 0}%</small>
            </div>
          ))}
        </div>
      </div>

      <div className="analytics-panel">
        <h3>Budget vs Actual</h3>
        <div className="budget-visual">
          <div className="budget-track">
            <div className={`budget-progress ${remaining < 0 ? 'over' : ''}`}
              style={{ width: `${budgetAmount ? Math.min((total / budgetAmount) * 100, 100) : 0}%` }} />
          </div>
          <div className="budget-numbers">
            <span>Spent: ₹{total.toFixed(2)}</span>
            <span>Budget: ₹{budgetAmount.toFixed(2)}</span>
            <strong className={remaining < 0 ? 'negative' : 'positive'}>
              {remaining >= 0 ? `Remaining ₹${remaining.toFixed(2)}` : `Over by ₹${Math.abs(remaining).toFixed(2)}`}
            </strong>
          </div>
        </div>
      </div>

      <div className="analytics-panel">
        <h3>Highest Spending Days</h3>
        {dailyEntries.length === 0 ? <p className="muted">No spending data.</p> : (
          <div className="daily-list">
            {dailyEntries.map(([date, amount]) => (
              <div className="daily-row" key={date}>
                <span>{date}</span><div className="mini-track"><div style={{ width: `${dailyEntries[0][1] ? (amount / dailyEntries[0][1]) * 100 : 0}%` }} /></div><b>₹{amount.toFixed(2)}</b>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default Analytics
