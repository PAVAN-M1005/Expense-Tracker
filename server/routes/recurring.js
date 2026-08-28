const express = require('express')

const pool = require('../db')
const authenticateToken = require('../middleware/authMiddleware')

const router = express.Router()

router.use(authenticateToken)

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        amount,
        category,
        description,
        notes,
        payment_method,
        TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date,
        TO_CHAR(next_due_date, 'YYYY-MM-DD') AS next_due_date,
        frequency,
        active,
        TO_CHAR(last_generated_date, 'YYYY-MM-DD') AS last_generated_date,
        created_at,
        updated_at
       FROM recurring_expenses
       WHERE user_id = $1
       ORDER BY next_due_date ASC, id ASC`,
      [req.user.id]
    )

    res.json(result.rows)
  } catch (error) {
    console.error('Get recurring error:', error)

    res.status(500).json({
      message: 'Failed to fetch recurring expenses'
    })
  }
})


router.post('/', async (req, res) => {
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

    const numericAmount = Number(amount)

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return res.status(400).json({
        message: 'Amount must be greater than 0'
      })
    }

    if (
      !['weekly', 'monthly', 'yearly'].includes(
        frequency
      )
    ) {
      return res.status(400).json({
        message: 'Invalid recurring frequency'
      })
    }

    const duplicate = await pool.query(
      `SELECT id
       FROM recurring_expenses
       WHERE user_id = $1
         AND amount = $2
         AND category = $3
         AND LOWER(description) = LOWER($4)
         AND start_date = $5
         AND frequency = $6`,
      [
        req.user.id,
        numericAmount,
        category.trim(),
        description.trim(),
        startDate,
        frequency
      ]
    )

    if (duplicate.rows.length > 0) {
      return res.status(409).json({
        message:
          'This recurring expense already exists'
      })
    }

    const result = await pool.query(
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
        TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date,
        TO_CHAR(next_due_date, 'YYYY-MM-DD') AS next_due_date,
        frequency,
        active,
        created_at,
        updated_at`,
      [
        req.user.id,
        numericAmount,
        category.trim(),
        description.trim(),
        notes ? notes.trim() : null,
        paymentMethod
          ? paymentMethod.trim()
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


router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (!Number.isInteger(id)) {
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

    const result = await pool.query(
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
         TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date,
         TO_CHAR(next_due_date, 'YYYY-MM-DD') AS next_due_date,
         frequency,
         active,
         TO_CHAR(last_generated_date, 'YYYY-MM-DD') AS last_generated_date,
         created_at,
         updated_at`,
      [
        Number(amount),
        category.trim(),
        description.trim(),
        notes ? notes.trim() : null,
        paymentMethod
          ? paymentMethod.trim()
          : null,
        startDate,
        nextDueDate,
        frequency,
        active !== false,
        id,
        req.user.id
      ]
    )

    if (result.rows.length === 0) {
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
})


router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        message:
          'Invalid recurring expense ID'
      })
    }

    const result = await pool.query(
      `DELETE FROM recurring_expenses
       WHERE id = $1
         AND user_id = $2
       RETURNING id`,
      [
        id,
        req.user.id
      ]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        message:
          'Recurring expense not found'
      })
    }

    res.json({
      message:
        'Recurring expense deleted successfully',
      id: result.rows[0].id
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
})


router.patch('/:id/toggle', async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        message:
          'Invalid recurring expense ID'
      })
    }

    const result = await pool.query(
      `UPDATE recurring_expenses
       SET
         active = NOT active,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
         AND user_id = $2
       RETURNING id, active`,
      [
        id,
        req.user.id
      ]
    )

    if (result.rows.length === 0) {
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
})


module.exports = router