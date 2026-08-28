import { useEffect, useMemo, useState } from 'react'
import ExpenseForm from './components/ExpenseForm'
import ExpenseList from './components/ExpenseList'
import Analytics from './components/Analytics'
import RecurringExpenses from './components/RecurringExpenses'
import CalendarView from './components/CalendarView'
import Notifications from './components/Notifications'
import Settings from './components/Settings'
import PinLock from './components/PinLock'
import { DEFAULT_CATEGORIES, addFrequency, hashPin, todayString } from './utils'

const load = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

function App() {
  const [expenses, setExpenses] = useState(() => load('expenses', []))
  const [budgets, setBudgets] = useState(() => load('budgets', {}))
  const [recurringExpenses, setRecurringExpenses] = useState(() => load('recurringExpenses', []))
  const [categories, setCategories] = useState(() => load('categories', DEFAULT_CATEGORIES))
  const [notifications, setNotifications] = useState(() => load('notifications', []))
  const [notificationEnabled, setNotificationEnabled] = useState(() => load('notificationEnabled', true))
  const [pinEnabled, setPinEnabled] = useState(() => Boolean(localStorage.getItem('pinHash')))
  const [pinHashValue, setPinHashValue] = useState(() => localStorage.getItem('pinHash') || '')
  const [locked, setLocked] = useState(() => Boolean(localStorage.getItem('pinHash')))
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system')
  const [activeView, setActiveView] = useState('overview')

  const [selectedMonthPart, setSelectedMonthPart] = useState('')
  const [selectedYearPart, setSelectedYearPart] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [searchText, setSearchText] = useState('')

  const currentYear = new Date().getFullYear()
  const months = [
    ['01','Jan'],['02','Feb'],['03','Mar'],['04','Apr'],['05','May'],['06','Jun'],
    ['07','Jul'],['08','Aug'],['09','Sep'],['10','Oct'],['11','Nov'],['12','Dec']
  ]
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i)

  const selectedMonth = selectedYearPart && selectedMonthPart
    ? `${selectedYearPart}-${selectedMonthPart}`
    : ''

  const filteredExpenses = useMemo(() => expenses.filter((expense) => {
    const categoryOk = filterCategory === 'all' || expense.category === filterCategory
    const monthOk = !selectedMonth || expense.date.startsWith(selectedMonth)
    const searchOk = `${expense.description} ${expense.notes || ''}`.toLowerCase().includes(searchText.toLowerCase())
    return categoryOk && monthOk && searchOk
  }), [expenses, filterCategory, selectedMonth, searchText])

  const currentBudget = selectedMonth ? budgets[selectedMonth] || '' : ''

  useEffect(() => localStorage.setItem('expenses', JSON.stringify(expenses)), [expenses])
  useEffect(() => localStorage.setItem('budgets', JSON.stringify(budgets)), [budgets])
  useEffect(() => localStorage.setItem('recurringExpenses', JSON.stringify(recurringExpenses)), [recurringExpenses])
  useEffect(() => localStorage.setItem('categories', JSON.stringify(categories)), [categories])
  useEffect(() => localStorage.setItem('notifications', JSON.stringify(notifications)), [notifications])
  useEffect(() => localStorage.setItem('notificationEnabled', JSON.stringify(notificationEnabled)), [notificationEnabled])
  useEffect(() => localStorage.setItem('theme', theme), [theme])

  useEffect(() => {
    if (pinHashValue) localStorage.setItem('pinHash', pinHashValue)
    else localStorage.removeItem('pinHash')
  }, [pinHashValue])

  useEffect(() => {
    if (pinEnabled && pinHashValue && !localStorage.getItem('pinHash')) {
      localStorage.setItem('pinHash', pinHashValue)
    }
  }, [pinEnabled, pinHashValue])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  // Automatically generate every due occurrence, including missed occurrences,
  // but never duplicate an occurrence. If a generated expense is deleted,
  // the same occurrence can be generated again because the check is based
  // on recurringId + occurrence date rather than a permanent "already added" flag.
  useEffect(() => {
    const today = todayString()
    let nextRecurring = recurringExpenses.map((item) => ({ ...item }))
    const generated = []

    nextRecurring.forEach((recurring) => {
      if (!recurring.active || !recurring.nextDueDate) return

      let due = recurring.nextDueDate
      while (due <= today) {
        const alreadyExists = expenses.some(
          (expense) =>
            expense.recurringId === recurring.id &&
            expense.recurringOccurrence === due
        )

        if (!alreadyExists) {
          generated.push({
            id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
            amount: Number(recurring.amount),
            category: recurring.category,
            description: recurring.description,
            date: due,
            paymentMethod: 'UPI',
            notes: 'Automatically generated recurring expense',
            recurringId: recurring.id,
            recurringOccurrence: due
          })
        }

        due = addFrequency(due, recurring.frequency)
      }

      recurring.nextDueDate = due
    })

    if (generated.length) {
      setExpenses((previous) => {
        const existingKeys = new Set(
          previous.map((e) => `${e.recurringId || ''}|${e.recurringOccurrence || ''}`)
        )
        const unique = generated.filter((e) => !existingKeys.has(`${e.recurringId}|${e.recurringOccurrence}`))
        return unique.length ? [...previous, ...unique] : previous
      })

      if (notificationEnabled) {
        const newAlerts = generated.map((expense) => ({
          id: `generated-${expense.recurringId}-${expense.recurringOccurrence}`,
          type: 'recurring',
          title: 'Recurring expense added',
          message: `${expense.description} of ₹${Number(expense.amount).toFixed(2)} was automatically added for ${expense.date}.`
        }))
        setNotifications((previous) => {
          const ids = new Set(previous.map((n) => n.id))
          return [...previous, ...newAlerts.filter((n) => !ids.has(n.id))]
        })
      }
    }

    if (JSON.stringify(nextRecurring) !== JSON.stringify(recurringExpenses)) {
      setRecurringExpenses(nextRecurring)
    }
  }, [recurringExpenses, expenses, notificationEnabled])

  // Budget alerts.
  useEffect(() => {
    if (!notificationEnabled || !selectedMonth || !currentBudget) return
    const total = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
    const budget = Number(currentBudget)
    if (!budget) return

    let alert = null
    if (total > budget) {
      alert = {
        id: `budget-exceeded-${selectedMonth}`,
        type: 'danger',
        title: 'Budget exceeded',
        message: `You exceeded your ${selectedMonth} budget by ₹${(total - budget).toFixed(2)}.`
      }
    } else if (total >= budget * 0.9) {
      alert = {
        id: `budget-warning-${selectedMonth}`,
        type: 'warning',
        title: 'Budget warning',
        message: `You have used ${((total / budget) * 100).toFixed(0)}% of your ${selectedMonth} budget.`
      }
    }

    if (alert) {
      setNotifications((previous) => previous.some((n) => n.id === alert.id) ? previous : [...previous, alert])
    }
  }, [notificationEnabled, selectedMonth, currentBudget, filteredExpenses])

  useEffect(() => {
    if (
      notificationEnabled &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      Notification.requestPermission().catch(() => {})
    }
  }, [notificationEnabled])

  useEffect(() => {
    if (!notificationEnabled || !('Notification' in window) || Notification.permission !== 'granted') return
    const recurringToday = recurringExpenses.filter(
      (r) => r.active && r.nextDueDate === todayString()
    )
    recurringToday.forEach((r) => {
      new Notification('Recurring expense due', {
        body: `${r.description} of ₹${Number(r.amount).toFixed(2)} is due today.`
      })
    })
  }, [recurringExpenses, notificationEnabled])

  const setCurrentBudget = (value) => {
    if (!selectedMonth) return alert('Please select a month first')
    setBudgets((prev) => ({ ...prev, [selectedMonth]: value }))
  }

  const clearCurrentBudget = () => {
    if (!selectedMonth) return
    setBudgets((prev) => {
      const copy = { ...prev }
      delete copy[selectedMonth]
      return copy
    })
  }

  const handleViewChange = (view) => {
    setActiveView(view)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearFilters = () => {
    setSelectedMonthPart('')
    setSelectedYearPart('')
    setFilterCategory('all')
    setSearchText('')
  }

  const dismissNotification = (id) => {
    setNotifications((previous) => previous.filter((n) => n.id !== id))
  }

  const clearNotifications = () => setNotifications([])

  if (locked) {
    return <PinLock pinHash={pinHashValue} onUnlock={() => setLocked(false)} />
  }

  const navItems = [
    ['overview','Overview'],
    ['add-expense','Add Expense'],
    ['analytics','Analytics'],
    ['calendar','Calendar'],
    ['recurring','Recurring'],
    ['notifications', `Notifications${notifications.length ? ` (${notifications.length})` : ''}`],
    ['settings','Settings']
  ]

  return (
    <div className="app">
      <nav className="toolbar">
        <div className="toolbar-title">Expense Tracker</div>
        <div className="toolbar-links">
          {navItems.map(([view, label]) => (
            <button key={view} className={activeView === view ? 'active' : ''} onClick={() => handleViewChange(view)}>
              {label}
            </button>
          ))}
        </div>
      </nav>

      <header className="app-header">
        <h1>My Expense Tracker</h1>
        <p>Track, manage and understand your spending.</p>
      </header>

      {activeView === 'overview' && (
        <>
          <section className="card filters">
            <div className="section-heading"><div><h2>Filters</h2><p>Filter your expenses before viewing the list.</p></div></div>
            <div className="filter-grid">
              <div className="field">
                <label>Select Month</label>
                <div className="two-inputs">
                  <select value={selectedMonthPart} onChange={(e) => setSelectedMonthPart(e.target.value)}>
                    <option value="">Month</option>
                    {months.map(([value,label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <select value={selectedYearPart} onChange={(e) => setSelectedYearPart(e.target.value)}>
                    <option value="">Year</option>
                    {yearOptions.map((y) => <option key={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Search</label>
                <input placeholder="Search description or notes..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
              </div>
            </div>
            <button className="secondary-button" onClick={clearFilters}>Clear Filters</button>
          </section>

          <ExpenseList
            expenses={filteredExpenses}
            setExpenses={setExpenses}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            categories={categories}
          />
        </>
      )}

      {activeView === 'add-expense' && (
        <>
          <section className="card">
            <div className="section-heading"><div><h2>Monthly Budget</h2><p>Set a budget for the selected month.</p></div></div>
            <div className="budget-input-row">
              <div className="field">
                <label>Month & Year</label>
                <div className="two-inputs">
                  <select value={selectedMonthPart} onChange={(e) => setSelectedMonthPart(e.target.value)}>
                    <option value="">Month</option>
                    {months.map(([value,label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <select value={selectedYearPart} onChange={(e) => setSelectedYearPart(e.target.value)}>
                    <option value="">Year</option>
                    {yearOptions.map((y) => <option key={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Budget</label>
                <input type="number" min="0" placeholder={selectedMonth ? 'Enter monthly budget' : 'Select month first'}
                  value={currentBudget} disabled={!selectedMonth} onChange={(e) => setCurrentBudget(e.target.value)} />
              </div>
              {selectedMonth && currentBudget !== '' && <button className="danger-button budget-clear" onClick={clearCurrentBudget}>Clear Budget</button>}
            </div>
          </section>
          <ExpenseForm expenses={expenses} setExpenses={setExpenses} selectedMonth={selectedMonth} categories={categories} />
        </>
      )}

      {activeView === 'analytics' && (
        <Analytics expenses={filteredExpenses} budget={currentBudget} selectedMonth={selectedMonth} />
      )}

      {activeView === 'calendar' && (
        <CalendarView expenses={expenses} recurringExpenses={recurringExpenses} />
      )}

      {activeView === 'recurring' && (
        <RecurringExpenses
          recurringExpenses={recurringExpenses}
          setRecurringExpenses={setRecurringExpenses}
          expenses={expenses}
          setExpenses={setExpenses}
          categories={categories}
        />
      )}

      {activeView === 'notifications' && (
        <Notifications notifications={notifications} dismissNotification={dismissNotification} clearNotifications={clearNotifications} />
      )}

      {activeView === 'settings' && (
        <Settings
          categories={categories}
          setCategories={setCategories}
          notificationEnabled={notificationEnabled}
          setNotificationEnabled={setNotificationEnabled}
          pinEnabled={pinEnabled}
          setPinEnabled={setPinEnabled}
          setPinHash={setPinHashValue}
          expenses={expenses}
          setExpenses={setExpenses}
          budgets={budgets}
          setBudgets={setBudgets}
          recurringExpenses={recurringExpenses}
          setRecurringExpenses={setRecurringExpenses}
          theme={theme}
          setTheme={setTheme}
        />
      )}
    </div>
  )
}

export default App
