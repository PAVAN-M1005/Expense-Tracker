import { useState } from 'react'
import { loginUser, registerUser } from '../api'

function Auth({ onLogin }) {
  const [mode, setMode] = useState('login')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')

    if (mode === 'register' && !name.trim()) {
      setError('Please enter your name')
      return
    }

    if (!email.trim()) {
      setError('Please enter your email')
      return
    }

    if (!password) {
      setError('Please enter your password')
      return
    }

    if (mode === 'register' && password.length < 6) {
      setError(
        'Password must be at least 6 characters'
      )
      return
    }

    try {
      setLoading(true)

      const response =
        mode === 'login'
          ? await loginUser(
              email,
              password
            )
          : await registerUser(
              name,
              email,
              password
            )

      if (mode === 'register') {
        const loginResponse =
          await loginUser(
            email,
            password
          )

        localStorage.setItem(
          'token',
          loginResponse.token
        )

        localStorage.setItem(
          'user',
          JSON.stringify(loginResponse.user)
        )

        onLogin(loginResponse.user)

        return
      }

      localStorage.setItem(
        'token',
        response.token
      )

      localStorage.setItem(
        'user',
        JSON.stringify(response.user)
      )

      onLogin(response.user)

    } catch (error) {
      setError(
        error.message ||
          'Authentication failed'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-visual-card main-card">
          <div className="auth-badge">Smart budget</div>
          <h2>Track where every rupee goes.</h2>
          <p>
            See your spending clearly, automate recurring bills,
            and keep control of your monthly goals.
          </p>

          <div className="auth-metrics">
            <div>
              <strong>₹28.4K</strong>
              <span>Monthly spending</span>
            </div>
            <div>
              <strong>86%</strong>
              <span>Budget used</span>
            </div>
          </div>
        </div>

        <div className="auth-visual-card floating-card">
          <span className="dot green" />
          <span className="dot purple" />
          <span className="dot blue" />
          <div className="mini-chart">
            <span style={{ height: '30%' }} />
            <span style={{ height: '55%' }} />
            <span style={{ height: '70%' }} />
            <span style={{ height: '45%' }} />
            <span style={{ height: '90%' }} />
            <span style={{ height: '80%' }} />
          </div>
        </div>
      </div>

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">₹</div>

          <div>
            <h1>Expense Tracker</h1>
            <p>
              {mode === 'login'
                ? 'Sign in to manage your expenses'
                : 'Create your expense tracker account'}
            </p>
          </div>
        </div>

        {error && (
          <div className="auth-error">{error}</div>
        )}

        <div className="auth-divider auth-divider-single">
          <span>Continue with email</span>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="field">
              <label>Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
              />
            </div>
          )}

          <div className="field">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
            />
          </div>

          <div className="field">
            <label>Password</label>
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword((current) => !current)
                }
                aria-label="Toggle password visibility"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="auth-options">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() =>
                  setRememberMe((current) => !current)
                }
              />
              <span>Remember me</span>
            </label>

            <button
              type="button"
              className="text-button"
              onClick={() => {
                setEmail('demo@expense.app')
                setPassword('demo123')
              }}
            >
              Use demo login
            </button>
          </div>

          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={loading}
          >
            {loading
              ? 'Please wait...'
              : mode === 'login'
                ? 'Login'
                : 'Create Account'}
          </button>
        </form>

        <button
          type="button"
          className="auth-switch"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login')
            setError('')
            setShowPassword(false)
          }}
        >
          {mode === 'login'
            ? "Don't have an account? Register"
            : 'Already have an account? Login'}
        </button>
      </div>
    </div>
  )
}

export default Auth