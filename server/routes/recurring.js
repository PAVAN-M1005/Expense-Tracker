const express = require('express')

const pool = require('../db')
const authenticateToken =
  require('../middleware/authMiddleware')

const router = express.Router()

router.use(authenticateToken)


/*
  -----------------------------------------
  DATE HELPERS
  -----------------------------------------
*/

const getLocalDateString = (
  date = new Date()
) => {
  const year =
    date.getFullYear()

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0')

  const day = String(
    date.getDate()
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}


const addDays = (
  dateString,
  days
) => {
  const [year, month, day] =
    dateString
      .split('-')
      .map(Number)

  const date = new Date(
    year,
    month - 1,
    day
  )

  date.setDate(
    date.getDate() + days
  )

  return getLocalDateString(
    date
  )
}


const addMonths = (
  dateString,
  months
) => {
  const [year, month, day] =
    dateString
      .split('-')
      .map(Number)

  const date = new Date(
    year,
    month - 1,
    day
  )

  const originalDay =
    date.getDate()

  date.setDate(1)

  date.setMonth(
    date.getMonth() + months
  )

  const lastDay =
    new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0
    ).getDate()

  date.setDate(
    Math.min(
      originalDay,
      lastDay
    )
  )

  return getLocalDateString(
    date
  )
}


const getNextDate = (
  dateString,
  frequency
) => {

  if (
    frequency === 'weekly'
  ) {
    return addDays(
      dateString,
      7
    )
  }

  if (
    frequency === 'yearly'
  ) {
    return addMonths(
      dateString,
      12
    )
  }

  return addMonths(
    dateString,
    1
  )
}


/*
  -----------------------------------------
  GET ALL RECURRING EXPENSES
  -----------------------------------------
*/

router.get('/', async (
  req,
  res
) => {

  try {

    const result =
      await pool.query(
        `SELECT
          id,
          amount,
          category,
          description,
          notes,
          payment_method,
          TO_CHAR(
            start_date,
            'YYYY-MM-DD'
          ) AS start_date,
          TO_CHAR(
            next_due_date,
            'YYYY-MM-DD'
          ) AS next_due_date,
          frequency,
          active,
          TO_CHAR(
            last_generated_date,
            'YYYY-MM-DD'
          ) AS last_generated_date,
          created_at,
          updated_at
         FROM recurring_expenses
         WHERE user_id = $1
         ORDER BY
           next_due_date ASC,
           id ASC`,
        [req.user.id]
      )

    res.json(
      result.rows
    )

  } catch (error) {

    console.error(
      'Get recurring error:',
      error
    )

    res.status(500).json({
      message:
        'Failed to fetch recurring expenses'
    })

  }
})


/*
  -----------------------------------------
  CREATE RECURRING EXPENSE
  -----------------------------------------
*/

router.post('/', async (
  req,
  res
) => {

  try {

    const {
      amount,
      category,
      description,
      notes,
      paymentMethod,
      startDate,
      frequency
    } = req.body


    if (
      amount === undefined ||
      !category ||
      !description ||
      !startDate ||
      !frequency
    ) {

      return res.status(400).json({
        message:
          'Amount, category, description, startDate and frequency are required'
      })

    }


    const numericAmount =
      Number(amount)


    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {

      return res.status(400).json({
        message:
          'Amount must be greater than 0'
      })

    }


    if (
      ![
        'weekly',
        'monthly',
        'yearly'
      ].includes(
        frequency
      )
    ) {

      return res.status(400).json({
        message:
          'Invalid recurring frequency'
      })

    }


    const cleanCategory =
      String(category).trim()

    const cleanDescription =
      String(description).trim()


    const duplicate =
      await pool.query(
        `SELECT id
         FROM recurring_expenses
         WHERE user_id = $1
           AND amount = $2
           AND category = $3
           AND LOWER(description) =
               LOWER($4)
           AND start_date = $5
           AND frequency = $6`,
        [
          req.user.id,
          numericAmount,
          cleanCategory,
          cleanDescription,
          startDate,
          frequency
        ]
      )


    if (
      duplicate.rows.length > 0
    ) {

      return res.status(409).json({
        message:
          'This recurring expense already exists'
      })

    }


    const result =
      await pool.query(
        `INSERT INTO recurring_expenses (
          user_id,
          amount,
          category,
          description,
          notes,
          payment_method,
          start_date,
          next_due_date,
          frequency,
          active
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $7,
          $8,
          TRUE
        )
        RETURNING
          id,
          amount,
          category,
          description,
          notes,
          payment_method,
          TO_CHAR(
            start_date,
            'YYYY-MM-DD'
          ) AS start_date,
          TO_CHAR(
            next_due_date,
            'YYYY-MM-DD'
          ) AS next_due_date,
          frequency,
          active,
          created_at,
          updated_at`,
        [
          req.user.id,
          numericAmount,
          cleanCategory,
          cleanDescription,
          notes
            ? String(notes).trim()
            : null,
          paymentMethod
            ? String(
                paymentMethod
              ).trim()
            : null,
          startDate,
          frequency
        ]
      )


    res.status(201).json({
      message:
        'Recurring expense created successfully',

      recurringExpense:
        result.rows[0]
    })

  } catch (error) {

    console.error(
      'Create recurring error:',
      error
    )

    res.status(500).json({
      message:
        'Failed to create recurring expense'
    })

  }
})


/*
  -----------------------------------------
  ADD NEXT DUE OCCURRENCE
  -----------------------------------------
*/

router.post(
  '/:id/add-now',
  async (req, res) => {

    const client =
      await pool.connect()

    try {

      const id =
        Number(req.params.id)


      if (
        !Number.isInteger(id)
      ) {

        return res.status(400).json({
          message:
            'Invalid recurring expense ID'
        })

      }


      await client.query(
        'BEGIN'
      )


      const recurringResult =
        await client.query(
          `SELECT
            id,
            user_id,
            amount,
            category,
            description,
            notes,
            payment_method,
            TO_CHAR(
              next_due_date,
              'YYYY-MM-DD'
            ) AS next_due_date,
            frequency,
            active
           FROM recurring_expenses
           WHERE id = $1
             AND user_id = $2
           FOR UPDATE`,
          [
            id,
            req.user.id
          ]
        )


      if (
        recurringResult.rows.length ===
        0
      ) {

        await client.query(
          'ROLLBACK'
        )

        return res.status(404).json({
          message:
            'Recurring expense not found'
        })

      }


      const recurring =
        recurringResult.rows[0]


      if (
        !recurring.active
      ) {

        await client.query(
          'ROLLBACK'
        )

        return res.status(400).json({
          message:
            'This recurring expense is paused'
        })

      }


      const dueDate =
        recurring.next_due_date


      /*
        Check whether the scheduled
        occurrence already exists.

        If the user deleted it, this
        query returns no rows and it
        can be recreated.
      */

      const existingExpense =
        await client.query(
          `SELECT
            id
           FROM expenses
           WHERE user_id = $1
             AND recurring_id = $2
             AND recurring_due_date = $3
           LIMIT 1`,
          [
            req.user.id,
            recurring.id,
            dueDate
          ]
        )


      if (
        existingExpense.rows.length >
        0
      ) {

        await client.query(
          'ROLLBACK'
        )

        return res.status(409).json({
          message:
            'This recurring expense has already been added for its current due date.'
        })

      }


      const expenseResult =
        await client.query(
          `INSERT INTO expenses (
            user_id,
            amount,
            category,
            description,
            date,
            notes,
            payment_method,
            recurring_id,
            recurring_due_date
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9
          )
          RETURNING
            id,
            amount,
            category,
            description,
            TO_CHAR(
              date,
              'YYYY-MM-DD'
            ) AS date,
            notes,
            payment_method,
            recurring_id,
            TO_CHAR(
              recurring_due_date,
              'YYYY-MM-DD'
            ) AS recurring_due_date,
            created_at,
            updated_at`,
          [
            req.user.id,
            Number(
              recurring.amount
            ),
            recurring.category,
            recurring.description,
            dueDate,
            recurring.notes,
            recurring.payment_method,
            recurring.id,
            dueDate
          ]
        )


      const nextDueDate =
        getNextDate(
          dueDate,
          recurring.frequency
        )


      await client.query(
        `UPDATE recurring_expenses
         SET
           next_due_date = $1,
           last_generated_date = CURRENT_DATE,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
           AND user_id = $3`,
        [
          nextDueDate,
          recurring.id,
          req.user.id
        ]
      )


      const referenceKey =
        `recurring-${recurring.id}-${dueDate}`


      const existingNotification =
        await client.query(
          `SELECT id
           FROM notifications
           WHERE user_id = $1
             AND reference_key = $2
           LIMIT 1`,
          [
            req.user.id,
            referenceKey
          ]
        )


      if (
        existingNotification.rows.length ===
        0
      ) {

        await client.query(
          `INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            reference_key,
            read
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            FALSE
          )`,
          [
            req.user.id,
            'recurring',
            'Recurring Expense Added',
            `${recurring.description} of ₹${Number(
              recurring.amount
            ).toFixed(
              2
            )} was added for ${dueDate}.`,
            referenceKey
          ]
        )

      }


      await client.query(
        'COMMIT'
      )


      res.status(201).json({

        message:
          'Recurring expense added successfully',

        expense:
          expenseResult.rows[0],

        recurringExpense: {
          ...recurring,
          next_due_date:
            nextDueDate
        }

      })

    } catch (error) {

      await client.query(
        'ROLLBACK'
      )

      console.error(
        'Add recurring occurrence error:',
        error
      )

      res.status(500).json({
        message:
          'Failed to add recurring expense'
      })

    } finally {

      client.release()

    }
  }
)


/*
  -----------------------------------------
  UPDATE RECURRING EXPENSE
  -----------------------------------------
*/

router.put(
  '/:id',
  async (req, res) => {

    try {

      const id =
        Number(req.params.id)


      if (
        !Number.isInteger(id)
      ) {

        return res.status(400).json({
          message:
            'Invalid recurring expense ID'
        })

      }


      const {
        amount,
        category,
        description,
        notes,
        paymentMethod,
        startDate,
        nextDueDate,
        frequency,
        active
      } = req.body


      if (
        amount === undefined ||
        !category ||
        !description ||
        !startDate ||
        !nextDueDate ||
        !frequency
      ) {

        return res.status(400).json({
          message:
            'Required recurring expense fields are missing'
        })

      }


      const result =
        await pool.query(
          `UPDATE recurring_expenses
           SET
             amount = $1,
             category = $2,
             description = $3,
             notes = $4,
             payment_method = $5,
             start_date = $6,
             next_due_date = $7,
             frequency = $8,
             active = $9,
             updated_at = CURRENT_TIMESTAMP
           WHERE id = $10
             AND user_id = $11
           RETURNING
             id,
             amount,
             category,
             description,
             notes,
             payment_method,
             TO_CHAR(
               start_date,
               'YYYY-MM-DD'
             ) AS start_date,
             TO_CHAR(
               next_due_date,
               'YYYY-MM-DD'
             ) AS next_due_date,
             frequency,
             active,
             TO_CHAR(
               last_generated_date,
               'YYYY-MM-DD'
             ) AS last_generated_date,
             created_at,
             updated_at`,
          [
            Number(amount),
            String(category).trim(),
            String(description).trim(),
            notes
              ? String(notes).trim()
              : null,
            paymentMethod
              ? String(paymentMethod).trim()
              : null,
            startDate,
            nextDueDate,
            frequency,
            active !== false,
            id,
            req.user.id
          ]
        )


      if (
        result.rows.length ===
        0
      ) {

        return res.status(404).json({
          message:
            'Recurring expense not found'
        })

      }


      res.json({
        message:
          'Recurring expense updated successfully',

        recurringExpense:
          result.rows[0]
      })

    } catch (error) {

      console.error(
        'Update recurring error:',
        error
      )

      res.status(500).json({
        message:
          'Failed to update recurring expense'
      })

    }
  }
)


/*
  -----------------------------------------
  DELETE RECURRING EXPENSE
  -----------------------------------------
*/

router.delete(
  '/:id',
  async (req, res) => {

    try {

      const id =
        Number(req.params.id)


      if (
        !Number.isInteger(id)
      ) {

        return res.status(400).json({
          message:
            'Invalid recurring expense ID'
        })

      }


      const result =
        await pool.query(
          `DELETE FROM recurring_expenses
           WHERE id = $1
             AND user_id = $2
           RETURNING id`,
          [
            id,
            req.user.id
          ]
        )


      if (
        result.rows.length ===
        0
      ) {

        return res.status(404).json({
          message:
            'Recurring expense not found'
        })

      }


      res.json({
        message:
          'Recurring expense deleted successfully',

        id:
          result.rows[0].id
      })

    } catch (error) {

      console.error(
        'Delete recurring error:',
        error
      )

      res.status(500).json({
        message:
          'Failed to delete recurring expense'
      })

    }
  }
)


/*
  -----------------------------------------
  PAUSE / RESUME
  -----------------------------------------
*/

router.patch(
  '/:id/toggle',
  async (req, res) => {

    try {

      const id =
        Number(req.params.id)


      if (
        !Number.isInteger(id)
      ) {

        return res.status(400).json({
          message:
            'Invalid recurring expense ID'
        })

      }


      const result =
        await pool.query(
          `UPDATE recurring_expenses
           SET
             active = NOT active,
             updated_at = CURRENT_TIMESTAMP
           WHERE id = $1
             AND user_id = $2
           RETURNING
             id,
             active`,
          [
            id,
            req.user.id
          ]
        )


      if (
        result.rows.length ===
        0
      ) {

        return res.status(404).json({
          message:
            'Recurring expense not found'
        })

      }


      res.json({
        message:
          'Recurring expense status updated',

        recurringExpense:
          result.rows[0]
      })

    } catch (error) {

      console.error(
        'Toggle recurring error:',
        error
      )

      res.status(500).json({
        message:
          'Failed to update recurring expense status'
      })

    }
  }
)


module.exports =
  router