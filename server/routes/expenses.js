const express = require('express')

const pool = require('../db')
const authenticateToken = require('../middleware/authMiddleware')

const router = express.Router()

router.use(authenticateToken)


// GET ALL EXPENSES

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        amount,
        category,
        description,
        TO_CHAR(date, 'YYYY-MM-DD') AS date,
        notes,
        payment_method,
        created_at,
        updated_at
       FROM expenses
       WHERE user_id = $1
       ORDER BY date DESC, id DESC`,
      [req.user.id]
    )

    res.json(result.rows)
  } catch (error) {
    console.error(
      'Get expenses error:',
      error
    )

    res.status(500).json({
      message: 'Failed to fetch expenses'
    })
  }
})


// ADD EXPENSE

router.post('/', async (req, res) => {
  try {
    const {
      amount,
      category,
      description,
      date,
      notes,
      paymentMethod
    } = req.body

    if (
      amount === undefined ||
      category === undefined ||
      description === undefined ||
      date === undefined
    ) {
      return res.status(400).json({
        message:
          'Amount, category, description and date are required'
      })
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({
        message:
          'Amount must be greater than 0'
      })
    }

    if (!String(category).trim()) {
      return res.status(400).json({
        message: 'Category is required'
      })
    }

    if (!String(description).trim()) {
      return res.status(400).json({
        message:
          'Description is required'
      })
    }

    if (!date) {
      return res.status(400).json({
        message: 'Date is required'
      })
    }

    const result = await pool.query(
      `INSERT INTO expenses (
        user_id,
        amount,
        category,
        description,
        date,
        notes,
        payment_method
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id,
        amount,
        category,
        description,
        TO_CHAR(date, 'YYYY-MM-DD') AS date,
        notes,
        payment_method,
        created_at,
        updated_at`,
      [
        req.user.id,
        Number(amount),
        String(category).trim(),
        String(description).trim(),
        date,
        notes
          ? String(notes).trim()
          : null,
        paymentMethod
          ? String(paymentMethod).trim()
          : null
      ]
    )

    res.status(201).json({
      message:
        'Expense added successfully',

      expense: result.rows[0]
    })
  } catch (error) {
    console.error(
      'Add expense error:',
      error
    )

    res.status(500).json({
      message: 'Failed to add expense'
    })
  }
})


// UPDATE EXPENSE

router.put('/:id', async (req, res) => {
  try {
    const expenseId =
      Number(req.params.id)

    if (
      !Number.isInteger(expenseId)
    ) {
      return res.status(400).json({
        message:
          'Invalid expense ID'
      })
    }

    const {
      amount,
      category,
      description,
      date,
      notes,
      paymentMethod
    } = req.body

    if (
      amount === undefined ||
      category === undefined ||
      description === undefined ||
      date === undefined
    ) {
      return res.status(400).json({
        message:
          'Amount, category, description and date are required'
      })
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({
        message:
          'Amount must be greater than 0'
      })
    }

    if (!String(category).trim()) {
      return res.status(400).json({
        message: 'Category is required'
      })
    }

    if (!String(description).trim()) {
      return res.status(400).json({
        message:
          'Description is required'
      })
    }

    if (!date) {
      return res.status(400).json({
        message: 'Date is required'
      })
    }

    const result = await pool.query(
      `UPDATE expenses
       SET
         amount = $1,
         category = $2,
         description = $3,
         date = $4,
         notes = $5,
         payment_method = $6,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
         AND user_id = $8
       RETURNING
         id,
         amount,
         category,
         description,
         TO_CHAR(date, 'YYYY-MM-DD') AS date,
         notes,
         payment_method,
         created_at,
         updated_at`,
      [
        Number(amount),
        String(category).trim(),
        String(description).trim(),
        date,
        notes
          ? String(notes).trim()
          : null,
        paymentMethod
          ? String(paymentMethod).trim()
          : null,
        expenseId,
        req.user.id
      ]
    )

    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        message:
          'Expense not found'
      })
    }

    res.json({
      message:
        'Expense updated successfully',

      expense: result.rows[0]
    })
  } catch (error) {
    console.error(
      'Update expense error:',
      error
    )

    res.status(500).json({
      message:
        'Failed to update expense'
    })
  }
})


// DELETE EXPENSE

router.delete('/:id', async (req, res) => {
  try {
    const expenseId =
      Number(req.params.id)

    if (
      !Number.isInteger(expenseId)
    ) {
      return res.status(400).json({
        message:
          'Invalid expense ID'
      })
    }

    const result = await pool.query(
      `DELETE FROM expenses
       WHERE id = $1
         AND user_id = $2
       RETURNING id`,
      [
        expenseId,
        req.user.id
      ]
    )

    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        message:
          'Expense not found'
      })
    }

    res.json({
      message:
        'Expense deleted successfully',

      id: result.rows[0].id
    })
  } catch (error) {
    console.error(
      'Delete expense error:',
      error
    )

    res.status(500).json({
      message:
        'Failed to delete expense'
    })
  }
})

module.exports = router