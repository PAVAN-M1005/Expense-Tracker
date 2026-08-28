import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import ExpenseForm from './components/ExpenseForm'
import './App.css'

function App() {
  return (
    <div>
      <h1>My Expense Tracker</h1>
      <p>Track your expenses easily.</p>
      <ExpenseForm />
    </div>
      
  )
}

export default App