const express = require('express')

const pool = require('../db')
const authenticateToken = require('../middleware/authMiddleware')

const router = express.Router()

router.use(authenticateToken)


// GET ALL BUDGETS

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        month,
        amount,
        created_at,
        updated_at
       FROM budgets
       WHERE user_id = $1
       ORDER BY month DESC`,
      [req.user.id]
    )

    res.json(result.rows)
  } catch (error) {
    console.error(
      'Get budgets error:',
      error
    )

    res.status(500).json({
      message: 'Failed to fetch budgets'
    })
  }
})


// GET BUDGET FOR ONE MONTH

router.get('/:month', async (req, res) => {
  try {
    const { month } = req.params

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        message:
          'Month must use YYYY-MM format'
      })
    }

    const result = await pool.query(
      `SELECT
        id,
        month,
        amount,
        created_at,
        updated_at
       FROM budgets
       WHERE user_id = $1
         AND month = $2`,
      [
        req.user.id,
        month
      ]
    )

    if (result.rows.length === 0) {
      return res.json({
        month,
        amount: 0
      })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error(
      'Get budget error:',
      error
    )

    res.status(500).json({
      message: 'Failed to fetch budget'
    })
  }
})


// CREATE OR UPDATE BUDGET

router.put('/:month', async (req, res) => {
  try {
    const { month } = req.params
    const { amount } = req.body

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        message:
          'Month must use YYYY-MM format'
      })
    }

    if (
      amount === undefined ||
      amount === null ||
      amount === ''
    ) {
      return res.status(400).json({
        message: 'Budget amount is required'
      })
    }

    const numericAmount = Number(amount)

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount < 0
    ) {
      return res.status(400).json({
        message:
          'Budget must be a valid non-negative number'
      })
    }

    const result = await pool.query(
      `INSERT INTO budgets (
        user_id,
        month,
        amount
      )
      VALUES ($1, $2, $3)

      ON CONFLICT (user_id, month)
      DO UPDATE SET
        amount = EXCLUDED.amount,
        updated_at = CURRENT_TIMESTAMP

      RETURNING
        id,
        month,
        amount,
        created_at,
        updated_at`,
      [
        req.user.id,
        month,
        numericAmount
      ]
    )

    res.json({
      message:
        'Budget saved successfully',
      budget: result.rows[0]
    })
  } catch (error) {
    console.error(
      'Save budget error:',
      error
    )

    res.status(500).json({
      message: 'Failed to save budget'
    })
  }
})


// DELETE BUDGET

router.delete('/:month', async (req, res) => {
  try {
    const { month } = req.params

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        message:
          'Month must use YYYY-MM format'
      })
    }

    const result = await pool.query(
      `DELETE FROM budgets
       WHERE user_id = $1
         AND month = $2
       RETURNING id, month`,
      [
        req.user.id,
        month
      ]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        message:
          'Budget not found'
      })
    }

    res.json({
      message:
        'Budget deleted successfully',

      budget: result.rows[0]
    })
  } catch (error) {
    console.error(
      'Delete budget error:',
      error
    )

    res.status(500).json({
      message:
        'Failed to delete budget'
    })
  }
})

module.exports = router