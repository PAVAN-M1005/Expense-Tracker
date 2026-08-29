import { useState } from 'react'

import {
  addRecurringExpense,
  addRecurringExpenseNow,
  deleteRecurringExpense,
  getRecurringExpenses,
  toggleRecurringExpense
} from '../api'


const normalizeRecurring = (
  item
) => ({
  ...item,

  amount:
    Number(item.amount),

  startDate:
    item.start_date ??
    item.startDate,

  nextDueDate:
    item.next_due_date ??
    item.nextDueDate,

  lastGeneratedDate:
    item.last_generated_date ??
    item.lastGeneratedDate ??
    null,

  paymentMethod:
    item.payment_method ??
    item.paymentMethod ??
    '',

  active:
    item.active !== false
})


const normalizeExpense = (
  expense
) => ({
  ...expense,

  amount:
    Number(expense.amount),

  paymentMethod:
    expense.payment_method ??
    expense.paymentMethod ??
    '',

  recurringId:
    expense.recurring_id ??
    expense.recurringId ??
    null,

  recurringDueDate:
    expense.recurring_due_date ??
    expense.recurringDueDate ??
    null
})


function RecurringExpenses({
  recurringExpenses,
  setRecurringExpenses,
  expenses,
  setExpenses,
  categories
}) {

  const [
    amount,
    setAmount
  ] = useState('')

  const [
    category,
    setCategory
  ] = useState('')

  const [
    description,
    setDescription
  ] = useState('')

  const [
    startDate,
    setStartDate
  ] = useState('')

  const [
    frequency,
    setFrequency
  ] = useState('monthly')

  const [
    saving,
    setSaving
  ] = useState(false)

  const [
    processingId,
    setProcessingId
  ] = useState(null)


  /*
    -----------------------------------------
    CREATE RECURRING EXPENSE
    -----------------------------------------
  */

  const handleAddRecurring =
    async (event) => {

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
    ADD NEXT SCHEDULED OCCURRENCE
    -----------------------------------------
  */

  const addNow = async (
    recurring
  ) => {

    try {

      setProcessingId(
        recurring.id
      )


      /*
        Backend decides the date.

        It uses:
        recurring.next_due_date

        NOT today's date.
      */

      const response =
        await addRecurringExpenseNow(
          recurring.id
        )


      const newExpense =
        normalizeExpense(
          response.expense
        )


      setExpenses(
        (previous) => {

          const exists =
            previous.some(
              (item) =>
                String(item.id) ===
                String(newExpense.id)
            )

          if (exists) {
            return previous
          }

          return [
            ...previous,
            newExpense
          ]
        }
      )


      /*
        Backend has already moved
        next_due_date forward.
      */

      setRecurringExpenses(
        (previous) =>
          previous.map(
            (item) => {

              if (
                String(item.id) !==
                String(recurring.id)
              ) {
                return item
              }


              return {
                ...item,

                nextDueDate:
                  response
                    .recurringExpense
                    .next_due_date,

                lastGeneratedDate:
                  response
                    .recurringExpense
                    .last_generated_date
              }
            }
          )
      )


      alert(
        `Expense added for ${newExpense.date}.`
      )

    } catch (error) {

      alert(
        error.message ||
        'Failed to add recurring expense'
      )

    } finally {

      setProcessingId(
        null
      )

    }
  }


  /*
    -----------------------------------------
    PAUSE / RESUME
    -----------------------------------------
  */

  const toggleActive =
    async (
      recurring
    ) => {

      try {

        const response =
          await toggleRecurringExpense(
            recurring.id
          )


        setRecurringExpenses(
          (previous) =>
            previous.map(
              (item) =>
                String(item.id) ===
                String(recurring.id)
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
                String(item.id) !==
                String(id)
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


  return (
    <section className="card recurring-expenses">

      <div className="section-heading">

        <div>

          <h2>
            Recurring Expenses
          </h2>

          <p>
            Each recurring expense uses its
            scheduled due date when an occurrence
            is added.
          </p>

        </div>


        <button
          type="button"
          className="secondary-button"
          onClick={
            refreshRecurring
          }
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


                  {expense.lastGeneratedDate && (
                    <p>
                      <b>
                        Last Added:
                      </b>{' '}
                      {expense.lastGeneratedDate}
                    </p>
                  )}


                  <div className="card-actions">

                    <button
                      className="success-button"
                      disabled={
                        processingId ===
                        expense.id
                      }
                      onClick={() =>
                        addNow(
                          expense
                        )
                      }
                    >
                      {processingId ===
                      expense.id
                        ? 'Adding...'
                        : 'Add Now'}
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