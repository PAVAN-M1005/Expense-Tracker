import { useState } from 'react'

function PinLock({ pinHash, onUnlock }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    if (!/^\d{4,6}$/.test(pin)) return setError('Enter your 4–6 digit PIN.')

    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin))
    const value = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('')

    if (value === pinHash) {
      setError('')
      setPin('')
      onUnlock()
    } else {
      setPin('')
      setError('Incorrect PIN.')
    }
  }

  return (
    <div className="lock-screen">
      <form className="lock-card" onSubmit={submit}>
        <div className="lock-icon">🔐</div>
        <h1>Expense Tracker Locked</h1>
        <p>Enter your PIN to continue.</p>
        <input autoFocus inputMode="numeric" type="password" maxLength="6" value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g,''))} placeholder="PIN" />
        {error && <div className="form-error">{error}</div>}
        <button className="primary-button" type="submit">Unlock</button>
      </form>
    </div>
  )
}

export default PinLock
