import {
  useEffect,
  useMemo,
  useState
} from 'react'

import ExpenseForm from './components/ExpenseForm'
import ExpenseList from './components/ExpenseList'
import Analytics from './components/Analytics'
import RecurringExpenses from './components/RecurringExpenses'
import CalendarView from './components/CalendarView'
import Notifications from './components/Notifications'
import Settings from './components/Settings'
import PinLock from './components/PinLock'
import Auth from './components/Auth'

import {
  getExpenses,
  getBudgets,
  getRecurringExpenses,
  deleteBudget,
  saveBudget
} from './api'

import {
  DEFAULT_CATEGORIES,
  hashPin
} from './utils'

import './App.css'


function App() {

  const [user, setUser] = useState(() => {
    try {
      const saved =
        localStorage.getItem('user')

      return saved
        ? JSON.parse(saved)
        : null

    } catch {
      return null
    }
  })


  const [loading, setLoading] =
    useState(true)


  const [expenses, setExpenses] =
    useState([])


  const [budgets, setBudgets] =
    useState({})


  const [recurringExpenses, setRecurringExpenses] =
    useState([])


  const [categories, setCategories] =
    useState(
      () => {
        try {
          const saved =
            localStorage.getItem(
              'categories'
            )

          return saved
            ? JSON.parse(saved)
            : DEFAULT_CATEGORIES

        } catch {
          return DEFAULT_CATEGORIES
        }
      }
    )


  const [notifications, setNotifications] =
    useState([])


  const [notificationEnabled, setNotificationEnabled] =
    useState(
      () => {
        const saved =
          localStorage.getItem(
            'notificationEnabled'
          )

        return saved === null
          ? true
          : JSON.parse(saved)
      }
    )


  const [pinEnabled, setPinEnabled] =
    useState(
      () =>
        Boolean(
          localStorage.getItem(
            'pinHash'
          )
        )
    )


  const [pinHashValue, setPinHashValue] =
    useState(
      () =>
        localStorage.getItem(
          'pinHash'
        ) || ''
    )


  const [locked, setLocked] =
    useState(
      () =>
        Boolean(
          localStorage.getItem(
            'pinHash'
          )
        )
    )


  const [theme, setTheme] =
    useState(
      () =>
        localStorage.getItem(
          'theme'
        ) || 'system'
    )


  const [activeView, setActiveView] =
    useState('overview')


  const [
    selectedMonthPart,
    setSelectedMonthPart
  ] = useState('')


  const [
    selectedYearPart,
    setSelectedYearPart
  ] = useState('')


  const [
    filterCategory,
    setFilterCategory
  ] = useState('all')


  const [
    searchText,
    setSearchText
  ] = useState('')


  /*
    -----------------------------------------
    LOAD USER DATA FROM BACKEND
    -----------------------------------------
  */

  const loadUserData = async () => {
    try {

      setLoading(true)

      const [
        expenseData,
        budgetData,
        recurringData
      ] = await Promise.all([
        getExpenses(),
        getBudgets(),
        getRecurringExpenses()
      ])


      setExpenses(
        expenseData.map(
          (expense) => ({
            ...expense,
            amount:
              Number(
                expense.amount
              ),

            paymentMethod:
              expense.payment_method ||
              '',

            recurringId:
              expense.recurring_id ||
              null,

            recurringDueDate:
              expense.recurring_due_date ||
              null
          })
        )
      )


      const budgetObject = {}

      budgetData.forEach(
        (budget) => {
          budgetObject[
            budget.month
          ] =
            budget.amount
        }
      )

      setBudgets(
        budgetObject
      )


      setRecurringExpenses(
        recurringData.map(
          (item) => ({
            ...item,

            amount:
              Number(
                item.amount
              ),

            startDate:
              item.start_date,

            nextDueDate:
              item.next_due_date,

            paymentMethod:
              item.payment_method ||
              '',

            active:
              item.active !== false
          })
        )
      )

    } catch (error) {

      console.error(
        'Failed to load data:',
        error
      )

      /*
        If authentication has expired,
        clear the local session.
      */

      if (
        error.message
          .toLowerCase()
          .includes('token') ||
        error.message
          .toLowerCase()
          .includes('authentication')
      ) {
        handleLogout()
      }

    } finally {

      setLoading(false)

    }
  }


  /*
    -----------------------------------------
    LOGIN
    -----------------------------------------
  */

  const handleLogin = (
    loggedInUser
  ) => {

    setUser(
      loggedInUser
    )

  }


  /*
    -----------------------------------------
    LOAD DATA AFTER LOGIN
    -----------------------------------------
  */

  useEffect(() => {

    if (!user) {
      setLoading(false)
      return
    }

    loadUserData()

  }, [user])


  /*
    -----------------------------------------
    LOCAL SETTINGS
    -----------------------------------------
  */

  useEffect(() => {
    localStorage.setItem(
      'categories',
      JSON.stringify(
        categories
      )
    )
  }, [categories])


  useEffect(() => {
    localStorage.setItem(
      'notificationEnabled',
      JSON.stringify(
        notificationEnabled
      )
    )
  }, [
    notificationEnabled
  ])


  useEffect(() => {
    localStorage.setItem(
      'theme',
      theme
    )
  }, [theme])


  useEffect(() => {

    if (pinHashValue) {
      localStorage.setItem(
        'pinHash',
        pinHashValue
      )
    } else {
      localStorage.removeItem(
        'pinHash'
      )
    }

  }, [pinHashValue])


  useEffect(() => {

    document.documentElement.dataset.theme =
      theme

  }, [theme])


  /*
    -----------------------------------------
    MONTH / YEAR
    -----------------------------------------
  */

  const currentYear =
    new Date().getFullYear()


  const months = [
    ['01', 'Jan'],
    ['02', 'Feb'],
    ['03', 'Mar'],
    ['04', 'Apr'],
    ['05', 'May'],
    ['06', 'Jun'],
    ['07', 'Jul'],
    ['08', 'Aug'],
    ['09', 'Sep'],
    ['10', 'Oct'],
    ['11', 'Nov'],
    ['12', 'Dec']
  ]


  const yearOptions =
    Array.from(
      {
        length: 11
      },
      (_, i) =>
        currentYear - 5 + i
    )


  const selectedMonth =
    selectedYearPart &&
    selectedMonthPart
      ? `${selectedYearPart}-${selectedMonthPart}`
      : ''


  /*
    -----------------------------------------
    FILTER EXPENSES
    -----------------------------------------
  */

  const filteredExpenses =
    useMemo(
      () =>
        expenses.filter(
          (expense) => {

            const categoryOk =
              filterCategory ===
                'all' ||
              expense.category ===
                filterCategory


            const monthOk =
              !selectedMonth ||
              expense.date.startsWith(
                selectedMonth
              )


            const searchOk =
              `${expense.description} ${
                expense.notes || ''
              }`
                .toLowerCase()
                .includes(
                  searchText
                    .toLowerCase()
                )


            return (
              categoryOk &&
              monthOk &&
              searchOk
            )
          }
        ),

      [
        expenses,
        filterCategory,
        selectedMonth,
        searchText
      ]
    )


  const currentBudget =
    selectedMonth
      ? budgets[
          selectedMonth
        ] || ''
      : ''


  /*
    -----------------------------------------
    SAVE BUDGET TO BACKEND
    -----------------------------------------
  */

  const setCurrentBudget =
    async (value) => {

      if (!selectedMonth) {
        alert(
          'Please select a month first'
        )

        return
      }

      try {

        if (value === '') {

          await deleteBudget(
            selectedMonth
          )

          setBudgets(
            (previous) => {

              const copy = {
                ...previous
              }

              delete copy[
                selectedMonth
              ]

              return copy
            }
          )

          return
        }


        const response =
          await saveBudget(
            selectedMonth,
            Number(value)
          )


        setBudgets(
          (previous) => ({
            ...previous,
            [selectedMonth]:
              response.budget.amount
          })
        )

      } catch (error) {

        alert(
          error.message
        )

      }
    }


  const clearCurrentBudget =
    async () => {

      if (!selectedMonth) {
        return
      }

      try {

        await deleteBudget(
          selectedMonth
        )

        setBudgets(
          (previous) => {

            const copy = {
              ...previous
            }

            delete copy[
              selectedMonth
            ]

            return copy
          }
        )

      } catch (error) {

        alert(
          error.message
        )

      }
    }


  /*
    -----------------------------------------
    NAVIGATION
    -----------------------------------------
  */

  const handleViewChange =
    (view) => {

      setActiveView(view)

      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })

    }


  /*
    -----------------------------------------
    FILTER CLEAR
    -----------------------------------------
  */

  const clearFilters = () => {

    setSelectedMonthPart(
      ''
    )

    setSelectedYearPart(
      ''
    )

    setFilterCategory(
      'all'
    )

    setSearchText(
      ''
    )

  }


  /*
    -----------------------------------------
    NOTIFICATIONS
    -----------------------------------------
  */

  const dismissNotification =
    (id) => {

      setNotifications(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !== id
          )
      )

    }


  const clearNotifications =
    () => {
      setNotifications([])
    }


  /*
    -----------------------------------------
    LOGOUT
    -----------------------------------------
  */

  const handleLogout = () => {

    localStorage.removeItem(
      'token'
    )

    localStorage.removeItem(
      'user'
    )

    setUser(null)

    setExpenses([])

    setBudgets({})

    setRecurringExpenses([])

    setNotifications([])

    setActiveView(
      'overview'
    )

  }


  /*
    -----------------------------------------
    PIN LOCK
    -----------------------------------------
  */

  if (!user) {

    if (loading) {
      return (
        <div className="loading-screen">
          Loading...
        </div>
      )
    }

    return (
      <Auth
        onLogin={
          handleLogin
        }
      />
    )
  }


  if (locked) {

    return (
      <PinLock
        pinHash={
          pinHashValue
        }
        onUnlock={() =>
          setLocked(false)
        }
      />
    )
  }


  /*
    -----------------------------------------
    NAVIGATION ITEMS
    -----------------------------------------
  */

  const navItems = [
    ['overview', 'Overview'],
    ['add-expense', 'Add Expense'],
    ['analytics', 'Analytics'],
    ['calendar', 'Calendar'],
    ['recurring', 'Recurring'],
    [
      'notifications',
      `Notifications${
        notifications.length
          ? ` (${notifications.length})`
          : ''
      }`
    ],
    ['settings', 'Settings']
  ]


  return (
    <div className="app">

      <nav className="toolbar">

        <div className="toolbar-title">
          Expense Tracker
        </div>

        <div className="toolbar-links">

          {navItems.map(
            ([view, label]) => (

              <button
                key={view}
                className={
                  activeView ===
                  view
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  handleViewChange(
                    view
                  )
                }
              >
                {label}
              </button>

            )
          )}

          <button
            className="logout-button"
            onClick={
              handleLogout
            }
          >
            Logout
          </button>

        </div>

      </nav>


      <header className="app-header">

        <div className="account-summary">
          <div className="account-avatar">
            {user.name
              ? user.name
                  .split(' ')
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join('')
                  .toUpperCase()
              : 'U'}
          </div>

          <div className="account-summary-text">
            <span className="account-label">
              Account Details
            </span>

            <h1>
              My Expense Tracker
            </h1>

            <p>
              Track, manage and understand
              your spending.
            </p>

            <div className="account-meta">
              <span>
                <strong>Name:</strong>{' '}
                {user.name || 'User'}
              </span>

              <span>
                <strong>Email:</strong>{' '}
                {user.email || 'Not available'}
              </span>
            </div>
          </div>
        </div>

      </header>


      {activeView ===
        'overview' && (
        <>

          <section className="card filters">

            <div className="section-heading">

              <div>

                <h2>
                  Filters
                </h2>

                <p>
                  Filter your expenses
                  before viewing
                  the list.
                </p>

              </div>

            </div>


            <div className="filter-grid">

              <div className="field">

                <label>
                  Select Month
                </label>

                <div className="two-inputs">

                  <select
                    value={
                      selectedMonthPart
                    }
                    onChange={(e) =>
                      setSelectedMonthPart(
                        e.target.value
                      )
                    }
                  >

                    <option value="">
                      Month
                    </option>

                    {months.map(
                      ([
                        value,
                        label
                      ]) => (
                        <option
                          key={
                            value
                          }
                          value={
                            value
                          }
                        >
                          {label}
                        </option>
                      )
                    )}

                  </select>


                  <select
                    value={
                      selectedYearPart
                    }
                    onChange={(e) =>
                      setSelectedYearPart(
                        e.target.value
                      )
                    }
                  >

                    <option value="">
                      Year
                    </option>

                    {yearOptions.map(
                      (year) => (
                        <option
                          key={
                            year
                          }
                          value={
                            year
                          }
                        >
                          {year}
                        </option>
                      )
                    )}

                  </select>

                </div>

              </div>


              <div className="field">

                <label>
                  Search
                </label>

                <input
                  placeholder="Search description or notes..."
                  value={
                    searchText
                  }
                  onChange={(e) =>
                    setSearchText(
                      e.target.value
                    )
                  }
                />

              </div>

            </div>


            <button
              className="secondary-button"
              onClick={
                clearFilters
              }
            >
              Clear Filters
            </button>

          </section>


          <ExpenseList
            expenses={
              filteredExpenses
            }
            setExpenses={
              setExpenses
            }
            filterCategory={
              filterCategory
            }
            setFilterCategory={
              setFilterCategory
            }
            categories={
              categories
            }
          />

        </>
      )}


      {activeView ===
        'add-expense' && (
        <>

          <section className="card">

            <div className="section-heading">

              <div>

                <h2>
                  Monthly Budget
                </h2>

                <p>
                  Set a budget for
                  the selected month.
                </p>

              </div>

            </div>


            <div className="budget-input-row">

              <div className="field">

                <label>
                  Month & Year
                </label>

                <div className="two-inputs">

                  <select
                    value={
                      selectedMonthPart
                    }
                    onChange={(e) =>
                      setSelectedMonthPart(
                        e.target.value
                      )
                    }
                  >

                    <option value="">
                      Month
                    </option>

                    {months.map(
                      ([
                        value,
                        label
                      ]) => (
                        <option
                          key={
                            value
                          }
                          value={
                            value
                          }
                        >
                          {label}
                        </option>
                      )
                    )}

                  </select>


                  <select
                    value={
                      selectedYearPart
                    }
                    onChange={(e) =>
                      setSelectedYearPart(
                        e.target.value
                      )
                    }
                  >

                    <option value="">
                      Year
                    </option>

                    {yearOptions.map(
                      (year) => (
                        <option
                          key={
                            year
                          }
                          value={
                            year
                          }
                        >
                          {year}
                        </option>
                      )
                    )}

                  </select>

                </div>

              </div>


              <div className="field">

                <label>
                  Budget
                </label>

                <input
                  type="number"
                  min="0"
                  placeholder={
                    selectedMonth
                      ? 'Enter monthly budget'
                      : 'Select month first'
                  }
                  value={
                    currentBudget
                  }
                  disabled={
                    !selectedMonth
                  }
                  onChange={(e) =>
                    setCurrentBudget(
                      e.target.value
                    )
                  }
                />

              </div>


              {selectedMonth &&
                currentBudget !==
                  '' && (
                  <button
                    className="danger-button budget-clear"
                    onClick={
                      clearCurrentBudget
                    }
                  >
                    Clear Budget
                  </button>
                )}

            </div>

          </section>


          <ExpenseForm
            expenses={
              expenses
            }
            setExpenses={
              setExpenses
            }
            selectedMonth={
              selectedMonth
            }
            categories={
              categories
            }
          />

        </>
      )}


      {activeView ===
        'analytics' && (

        <Analytics
          expenses={
            filteredExpenses
          }
          budget={
            currentBudget
          }
          selectedMonth={
            selectedMonth
          }
        />

      )}


      {activeView ===
        'calendar' && (

        <CalendarView
          expenses={
            expenses
          }
          recurringExpenses={
            recurringExpenses
          }
        />

      )}


      {activeView ===
        'recurring' && (

        <RecurringExpenses
          recurringExpenses={
            recurringExpenses
          }
          setRecurringExpenses={
            setRecurringExpenses
          }
          expenses={
            expenses
          }
          setExpenses={
            setExpenses
          }
          categories={
            categories
          }
        />

      )}


      {activeView ===
        'notifications' && (

        <Notifications
          notifications={
            notifications
          }
          dismissNotification={
            dismissNotification
          }
          clearNotifications={
            clearNotifications
          }
        />

      )}


      {activeView ===
        'settings' && (

        <Settings
          categories={
            categories
          }
          setCategories={
            setCategories
          }
          notificationEnabled={
            notificationEnabled
          }
          setNotificationEnabled={
            setNotificationEnabled
          }
          pinEnabled={
            pinEnabled
          }
          setPinEnabled={
            setPinEnabled
          }
          setPinHash={
            setPinHashValue
          }
          expenses={
            expenses
          }
          setExpenses={
            setExpenses
          }
          budgets={
            budgets
          }
          setBudgets={
            setBudgets
          }
          recurringExpenses={
            recurringExpenses
          }
          setRecurringExpenses={
            setRecurringExpenses
          }
          theme={
            theme
          }
          setTheme={
            setTheme
          }
          onLogout={
            handleLogout
          }
        />

      )}

    </div>
  )
}

export default App