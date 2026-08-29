const pool = require('./db')

const getLocalDateString = (
  date = new Date()
) => {
  const year = date.getFullYear()

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

  return getLocalDateString(date)
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

  return getLocalDateString(date)
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


const processRecurringExpenses =
  async () => {

    const today =
      getLocalDateString()

    try {

      const dueResult =
        await pool.query(
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
            frequency
           FROM recurring_expenses
           WHERE active = TRUE
             AND next_due_date <= CURRENT_DATE
           ORDER BY
             next_due_date ASC`
        )


      for (
        const recurring of dueResult.rows
      ) {

        const client =
          await pool.connect()

        try {

          await client.query(
            'BEGIN'
          )


          const lockedResult =
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
               FOR UPDATE`,
              [
                recurring.id
              ]
            )


          if (
            lockedResult.rows.length ===
            0
          ) {

            await client.query(
              'ROLLBACK'
            )

            continue
          }


          const current =
            lockedResult.rows[0]


          if (
            current.active === false
          ) {

            await client.query(
              'ROLLBACK'
            )

            continue
          }


          let dueDate =
            current.next_due_date


          while (
            dueDate <= today
          ) {

            /*
              Prevent duplicates by checking
              whether this scheduled occurrence
              already exists.
            */

            const existingExpense =
              await client.query(
                `SELECT
                   id
                 FROM expenses
                 WHERE recurring_id = $1
                   AND recurring_due_date = $2
                 LIMIT 1`,
                [
                  current.id,
                  dueDate
                ]
              )


            if (
              existingExpense.rows.length ===
              0
            ) {

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
                  RETURNING id`,
                  [
                    current.user_id,
                    Number(
                      current.amount
                    ),
                    current.category,
                    current.description,

                    /*
                      IMPORTANT:
                      Use scheduled recurring
                      date, NOT today's date.
                    */
                    dueDate,

                    current.notes,
                    current.payment_method,
                    current.id,
                    dueDate
                  ]
                )


              const referenceKey =
                `recurring-${current.id}-${dueDate}`


              const existingNotification =
                await client.query(
                  `SELECT
                     id
                   FROM notifications
                   WHERE user_id = $1
                     AND reference_key = $2
                   LIMIT 1`,
                  [
                    current.user_id,
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
                    current.user_id,
                    'recurring',
                    'Recurring Expense Added',
                    `${current.description} of ₹${Number(
                      current.amount
                    ).toFixed(2)} was automatically added for ${dueDate}.`,
                    referenceKey
                  ]
                )

              }


              console.log(
                `Recurring expense added: ${current.description} - ${dueDate} (expense ${expenseResult.rows[0].id})`
              )

            } else {

              console.log(
                `Recurring occurrence already exists: ${current.description} - ${dueDate}`
              )

            }


            dueDate =
              getNextDate(
                dueDate,
                current.frequency
              )
          }


          await client.query(
            `UPDATE recurring_expenses
             SET
               next_due_date = $1,
               last_generated_date = $2,
               updated_at = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [
              dueDate,
              today,
              current.id
            ]
          )


          await client.query(
            'COMMIT'
          )

        } catch (error) {

          await client.query(
            'ROLLBACK'
          )

          console.error(
            `Failed processing recurring expense ${recurring.id}:`,
            error
          )

        } finally {

          client.release()

        }
      }

    } catch (error) {

      console.error(
        'Recurring processor error:',
        error
      )

    }
  }


module.exports =
  processRecurringExpenses