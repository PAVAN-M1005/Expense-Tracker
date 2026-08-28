import { useState } from 'react'

function ExpenseForm() {
    const [amount , setAmount] = useState('')
    const [category, setCategory] = useState('')
    const [description, setDescription] = useState('')
    const [date, setDate] = useState('')
    const [expenses , setExpenses] = useState([])

    const handleSubmit =(event) => {
        event.preventDefault() 

        if (amount === '') {
    alert('Please enter an amount')
    return
  }

  if (category === '') {
    alert('Please select a category')
    return
  }

  if (description === '') {
    alert('Please enter a description')
    return
  }

  if (date === '') {
    alert('Please select a date')
    return
  }

        const newExpense ={
            id: Date.now(),
            amount: amount,
            category: category,
            description: description,
            date: date
        }
        console.log(newExpense)
        setExpenses([...expenses, newExpense])

        setAmount('')
        setCategory('')
        setDescription('')
        setDate('')
    }

  return (
    <>
    <form onSubmit={handleSubmit}>
        <h2>Add Expense</h2>
        <div>
            <label>Amount</label>
            <input
  type="number"
  placeholder="Enter amount"
  value={amount}
  onChange={(event) => setAmount(event.target.value)}
/>
        </div>
        <div>
            <label>Category</label>
            <select
            value={category}
                onChange={(event) => setCategory(event.target.value)}>
                <option value="">Select category</option>
                <option value="food">Food</option>
                <option value="travel">Travel</option>
                <option value="shopping">Shopping</option>
                <option value="bills">Bills</option>
                <option value="education">Education</option>
                <option value="entertainment">Entertainment</option>
                <option value="health">Health</option>
                <option value="other">Other</option>
                
            </select>
        </div>
        <div>
            <label>Description</label>
            <input 
                type="text" 
                placeholder="What did you spend on?" 
                value={description}
                onChange={(event) => setDescription(event.target.value)}
            />
        </div>
        <div>
            <label>Date</label>
            <input type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)} 
            />
        </div>

        <button type="submit">Add Expense</button>
    </form>

    <h2>Expenses</h2>

{expenses.map((expense) => (
  <div key={expense.id}>
    <p>Amount: ₹{expense.amount}</p>
    <p>Category: {expense.category}</p>
    <p>Description: {expense.description}</p>
    <p>Date: {expense.date}</p>
  </div>
))}
</>

)
}

export default ExpenseForm