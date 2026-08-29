import { useState } from 'react'

import {
  addRecurringExpense,
  deleteRecurringExpense,
  getRecurringExpenses,
  toggleRecurringExpense
} from '../api'

import {
  todayString
} from '../utils'


function normalizeRecurring(item) {
  return {
    ...item,

    amount:
      Number(item.amount),

    startDate:
      item.start_date ??
      item.startDate,

    nextDueDate:
      item.next_due_date ??
      item.nextDueDate,

    paymentMethod:
      item.payment_method ??
      item.paymentMethod ??
      '',

    active:
      item.active !== false
  }
}


function RecurringExpenses({
  recurringExpenses,
  setRecurringExpenses,
  expenses,
  setExpenses,
  categories
}) {

  const [amount, setAmount] =
    useState('')

  const [category, setCategory] =
    useState('')

  const [description, setDescription] =
    useState('')

  const [startDate, setStartDate] =
    useState('')

  const [frequency, setFrequency] =
    useState('monthly')

  const [saving, setSaving] =
    useState(false)


  /*
    -----------------------------------------
    ADD RECURRING EXPENSE
    -----------------------------------------
  */

  const handleAddRecurring = async (
    event
  ) => {

    event.preventDefault()

    if (
      !amount ||
      Number(amount) <= 0
    ) {
      alert(
        'Please enter a valid amount'
      )
      return
    }

    if (!category) {
      alert(
        'Please select a category'
      )
      return
    }

    if (
      !description.trim()
    ) {
      alert(
        'Please enter a description'
      )
      return
    }

    if (!startDate) {
      alert(
        'Please select a start date'
      )
      return
    }

    try {

      setSaving(true)

      const response =
        await addRecurringExpense({
          amount:
            Number(amount),

          category,

          description:
            description.trim(),

          notes:
            '',

          paymentMethod:
            'UPI',

          startDate,

          frequency
        })


      const newRecurring =
        normalizeRecurring(
          response.recurringExpense
        )


      setRecurringExpenses(
        (previous) => [
          ...previous,
          newRecurring
        ]
      )


      setAmount('')
      setCategory('')
      setDescription('')
      setStartDate('')
      setFrequency('monthly')

      alert(
        'Recurring expense saved successfully.'
      )

    } catch (error) {

      alert(
        error.message ||
        'Failed to save recurring expense'
      )

    } finally {

      setSaving(false)

    }
  }


  /*
    -----------------------------------------
    ADD OCCURRENCE MANUALLY
    -----------------------------------------
  */

  const addNow = async (
    recurring
  ) => {

    const today =
      todayString()


    const alreadyExists =
      expenses.some(
        (expense) =>
          String(
            expense.recurringId
          ) ===
          String(
            recurring.id
          ) &&
          (
            expense.recurringDueDate ===
              today ||
            expense.recurringOccurrence ===
              today
          )
      )


    if (alreadyExists) {

      alert(
        'This recurring expense has already been added today.'
      )

      return
    }


    try {

      /*
        We are adding the expense through
        the backend, so it survives refresh.
      */

      const response =
        await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/expenses`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${localStorage.getItem('token')}`
            },

            body: JSON.stringify({
              amount:
                Number(
                  recurring.amount
                ),

              category:
                recurring.category,

              description:
                recurring.description,

              date:
                today,

              notes:
                'Manually added recurring expense',

              paymentMethod:
                recurring.paymentMethod ||
                'UPI'
            })
          }
        )


      const data =
        await response.json()


      if (!response.ok) {
        throw new Error(
          data.message ||
          'Failed to add expense'
        )
      }


      const newExpense = {
        ...data.expense,

        amount:
          Number(
            data.expense.amount
          ),

        paymentMethod:
          data.expense.payment_method ||
          'UPI',

        recurringId:
          recurring.id,

        recurringDueDate:
          today,

        recurringOccurrence:
          today
      }


      setExpenses(
        (previous) => [
          ...previous,
          newExpense
        ]
      )


      alert(
        'Expense added successfully.'
      )

    } catch (error) {

      alert(
        error.message ||
        'Failed to add expense'
      )
    }
  }


  /*
    -----------------------------------------
    PAUSE / RESUME
    -----------------------------------------
  */

  const toggleActive =
    async (recurring) => {

      try {

        const response =
          await toggleRecurringExpense(
            recurring.id
          )


        setRecurringExpenses(
          (previous) =>
            previous.map(
              (item) =>
                item.id ===
                  recurring.id
                  ? {
                      ...item,

                      active:
                        response
                          .recurringExpense
                          .active
                    }
                  : item
            )
        )

      } catch (error) {

        alert(
          error.message ||
          'Failed to update recurring expense'
        )
      }
    }


  /*
    -----------------------------------------
    DELETE RECURRING TEMPLATE
    -----------------------------------------
  */

  const deleteRecurring =
    async (id) => {

      const confirmed =
        window.confirm(
          'Delete this recurring expense template? Existing expenses will remain.'
        )

      if (!confirmed) {
        return
      }

      try {

        await deleteRecurringExpense(
          id
        )


        setRecurringExpenses(
          (previous) =>
            previous.filter(
              (item) =>
                item.id !== id
            )
        )

      } catch (error) {

        alert(
          error.message ||
          'Failed to delete recurring expense'
        )
      }
    }


  /*
    -----------------------------------------
    REFRESH RECURRING DATA
    -----------------------------------------
  */

  const refreshRecurring =
    async () => {

      try {

        const data =
          await getRecurringExpenses()

        setRecurringExpenses(
          data.map(
            normalizeRecurring
          )
        )

      } catch (error) {

        alert(
          error.message ||
          'Failed to refresh recurring expenses'
        )
      }
    }


  /*
    -----------------------------------------
    UI
    -----------------------------------------
  */

  return (
    <section className="card recurring-expenses">

      <div className="section-heading">

        <div>

          <h2>
            Recurring Expenses
          </h2>

          <p>
            Recurring expenses are generated
            automatically when their due date arrives.
          </p>

        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={refreshRecurring}
        >
          Refresh
        </button>

      </div>


      <form
        className="form-grid"
        onSubmit={
          handleAddRecurring
        }
      >

        <div className="field">

          <label>
            Amount
          </label>

          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) =>
              setAmount(
                e.target.value
              )
            }
          />

        </div>


        <div className="field">

          <label>
            Category
          </label>

          <select
            value={category}
            onChange={(e) =>
              setCategory(
                e.target.value
              )
            }
          >

            <option value="">
              Select category
            </option>

            {categories.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}

          </select>

        </div>


        <div className="field">

          <label>
            Description
          </label>

          <input
            placeholder="Example: Room rent"
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
          />

        </div>


        <div className="field">

          <label>
            Start Date
          </label>

          <input
            type="date"
            value={startDate}
            onChange={(e) =>
              setStartDate(
                e.target.value
              )
            }
          />

        </div>


        <div className="field">

          <label>
            Frequency
          </label>

          <select
            value={frequency}
            onChange={(e) =>
              setFrequency(
                e.target.value
              )
            }
          >

            <option value="monthly">
              Monthly
            </option>

            <option value="weekly">
              Weekly
            </option>

            <option value="yearly">
              Yearly
            </option>

          </select>

        </div>


        <div className="field field-full">

          <button
            className="primary-button"
            type="submit"
            disabled={saving}
          >
            {saving
              ? 'Saving...'
              : 'Add Recurring Expense'}
          </button>

        </div>

      </form>


      <div className="subsection">

        <h3>
          Saved Recurring Expenses
        </h3>


        {recurringExpenses.length === 0 ? (

          <div className="empty-state compact">

            <p>
              No recurring expenses added yet.
            </p>

          </div>

        ) : (

          <div className="recurring-grid">

            {recurringExpenses.map(
              (expense) => (

                <article
                  className="recurring-card"
                  key={expense.id}
                >

                  <div className="expense-top">

                    <div>

                      <h3>
                        {expense.description}
                      </h3>

                      <span
                        className={`status-pill ${
                          expense.active
                            ? 'active'
                            : 'paused'
                        }`}
                      >
                        {expense.active
                          ? 'Active'
                          : 'Paused'}
                      </span>

                    </div>

                    <strong>
                      ₹
                      {Number(
                        expense.amount
                      ).toFixed(2)}
                    </strong>

                  </div>


                  <p>
                    <b>
                      Category:
                    </b>{' '}
                    {expense.category}
                  </p>


                  <p>
                    <b>
                      Frequency:
                    </b>{' '}
                    {expense.frequency}
                  </p>


                  <p>
                    <b>
                      Next Due:
                    </b>{' '}
                    {expense.nextDueDate}
                  </p>


                  <div className="card-actions">

                    <button
                      className="success-button"
                      onClick={() =>
                        addNow(
                          expense
                        )
                      }
                    >
                      Add Now
                    </button>


                    <button
                      className="secondary-button"
                      onClick={() =>
                        toggleActive(
                          expense
                        )
                      }
                    >
                      {expense.active
                        ? 'Pause'
                        : 'Resume'}
                    </button>


                    <button
                      className="danger-button"
                      onClick={() =>
                        deleteRecurring(
                          expense.id
                        )
                      }
                    >
                      Delete
                    </button>

                  </div>

                </article>

              )
            )}

          </div>

        )}

      </div>

    </section>
  )
}


export default RecurringExpenses