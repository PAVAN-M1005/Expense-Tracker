import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { DEFAULT_CATEGORIES, downloadBlob } from '../utils'

function Settings({
  categories,
  setCategories,
  notificationEnabled,
  setNotificationEnabled,
  pinEnabled,
  setPinEnabled,
  setPinHash,
  expenses,
  setExpenses,
  budgets,
  setBudgets,
  recurringExpenses,
  setRecurringExpenses,
  theme,
  setTheme
}) {
  const [newCategory, setNewCategory] = useState('')
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const fileInputRef = useRef(null)

  const addCategory = () => {
    const value = newCategory.trim().toLowerCase()
    if (!value) return
    if (categories.includes(value)) return alert('Category already exists.')
    setCategories((prev) => [...prev, value])
    setNewCategory('')
  }

  const removeCategory = (category) => {
    if (DEFAULT_CATEGORIES.includes(category)) return alert('Default categories cannot be removed.')
    if (!window.confirm(`Delete category "${category}"? Existing expenses keep their category.`)) return
    setCategories((prev) => prev.filter((item) => item !== category))
  }

  const enablePin = async () => {
    if (!/^\d{4,6}$/.test(pin)) return alert('PIN must contain 4 to 6 digits.')
    if (pin !== pinConfirm) return alert('PINs do not match.')
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin))
    setPinHash(Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join(''))
    setPinEnabled(true)
    setPin('')
    setPinConfirm('')
    alert('App PIN enabled.')
  }

  const disablePin = () => {
    if (!window.confirm('Disable app lock?')) return
    setPinEnabled(false)
    setPinHash('')
  }

  const exportJSON = () => {
    const data = { expenses, budgets, recurringExpenses, categories }
    downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `expense-backup-${Date.now()}.json`)
  }

  const exportCSV = () => {
    const rows = expenses.map((e) => ({
      amount: e.amount,
      category: e.category,
      description: e.description,
      date: e.date,
      paymentMethod: e.paymentMethod || '',
      notes: e.notes || '',
      recurringId: e.recurringId || ''
    }))
    const sheet = XLSX.utils.json_to_sheet(rows)
    const csv = XLSX.utils.sheet_to_csv(sheet)
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `expenses-${Date.now()}.csv`)
  }

  const exportExcel = () => {
    const workbook = XLSX.utils.book_new()
    const sheet = XLSX.utils.json_to_sheet(expenses)
    XLSX.utils.book_append_sheet(workbook, sheet, 'Expenses')
    const budgetSheet = XLSX.utils.json_to_sheet(
      Object.entries(budgets).map(([month, amount]) => ({ month, budget: amount }))
    )
    XLSX.utils.book_append_sheet(workbook, budgetSheet, 'Budgets')
    XLSX.writeFile(workbook, `expense-backup-${Date.now()}.xlsx`)
  }

  const importJSON = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (!Array.isArray(data.expenses)) throw new Error('Invalid backup')
        setExpenses(data.expenses)
        setBudgets(data.budgets || {})
        setRecurringExpenses(data.recurringExpenses || [])
        setCategories(data.categories?.length ? data.categories : DEFAULT_CATEGORIES)
        alert('Backup imported successfully.')
      } catch {
        alert('Invalid JSON backup file.')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const resetAll = () => {
    if (!window.confirm('This will permanently delete all app data. Continue?')) return
    setExpenses([])
    setBudgets({})
    setRecurringExpenses([])
    setCategories(DEFAULT_CATEGORIES)
    localStorage.clear()
    window.location.reload()
  }

  return (
    <section className="card settings-section">
      <div className="section-heading">
        <div><h2>Settings</h2><p>Manage the app, categories, notifications, lock and backups.</p></div>
      </div>

      <div className="settings-grid">
        <div className="settings-panel">
          <h3>Appearance</h3>
          <label className="setting-row">
            <span>Theme</span>
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </div>

        <div className="settings-panel">
          <h3>Notifications</h3>
          <label className="toggle-row">
            <input type="checkbox" checked={notificationEnabled} onChange={(e) => setNotificationEnabled(e.target.checked)} />
            <span>Enable in-app and browser notifications</span>
          </label>
        </div>

        <div className="settings-panel">
          <h3>App Lock</h3>
          {!pinEnabled ? (
            <>
              <input inputMode="numeric" maxLength="6" placeholder="4–6 digit PIN" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g,''))} />
              <input inputMode="numeric" maxLength="6" placeholder="Confirm PIN" value={pinConfirm} onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g,''))} />
              <button className="primary-button" onClick={enablePin}>Enable PIN</button>
            </>
          ) : (
            <button className="danger-button" onClick={disablePin}>Disable App Lock</button>
          )}
          <p className="muted">This is a local convenience lock. It is not a replacement for device security.</p>
        </div>

        <div className="settings-panel">
          <h3>Custom Categories</h3>
          <div className="inline-add">
            <input placeholder="New category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
            <button className="primary-button" onClick={addCategory}>Add</button>
          </div>
          <div className="tag-list">
            {categories.map((category) => (
              <span className="category-tag" key={category}>
                {category}
                {!DEFAULT_CATEGORIES.includes(category) && <button onClick={() => removeCategory(category)}>×</button>}
              </span>
            ))}
          </div>
        </div>

        <div className="settings-panel">
          <h3>Backup & Export</h3>
          <div className="button-wrap">
            <button className="secondary-button" onClick={exportJSON}>Export JSON Backup</button>
            <button className="secondary-button" onClick={exportCSV}>Export CSV</button>
            <button className="secondary-button" onClick={exportExcel}>Export Excel</button>
            <button className="secondary-button" onClick={() => fileInputRef.current?.click()}>Import JSON Backup</button>
            <input ref={fileInputRef} hidden type="file" accept=".json" onChange={importJSON} />
          </div>
        </div>

        <div className="settings-panel danger-panel">
          <h3>Danger Zone</h3>
          <p>Delete all expenses, budgets, recurring rules and settings.</p>
          <button className="danger-button" onClick={resetAll}>Reset Application</button>
        </div>
      </div>
    </section>
  )
}

export default Settings
