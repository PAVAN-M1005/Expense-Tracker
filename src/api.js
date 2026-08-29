const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api'

const getToken = () => {
  return localStorage.getItem('token')
}

const request = async (
  endpoint,
  options = {}
) => {

  const token =
    getToken()

  const headers = {
    'Content-Type':
      'application/json',
    ...(options.headers || {})
  }

  if (token) {
    headers.Authorization =
      `Bearer ${token}`
  }

  const response =
    await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,
        headers
      }
    )

  const data =
    await response.json()

  if (!response.ok) {
    throw new Error(
      data.message ||
      'Request failed'
    )
  }

  return data
}


/*
  -----------------------------------------
  AUTH
  -----------------------------------------
*/

export const registerUser =
  async (
    name,
    email,
    password
  ) => {

    return request(
      '/auth/register',
      {
        method: 'POST',

        body: JSON.stringify({
          name,
          email,
          password
        })
      }
    )
  }


export const loginUser =
  async (
    email,
    password
  ) => {

    return request(
      '/auth/login',
      {
        method: 'POST',

        body: JSON.stringify({
          email,
          password
        })
      }
    )
  }


/*
  -----------------------------------------
  EXPENSES
  -----------------------------------------
*/

export const getExpenses =
  async () => {

    return request(
      '/expenses'
    )
  }


export const addExpense =
  async (
    expense
  ) => {

    return request(
      '/expenses',
      {
        method: 'POST',

        body: JSON.stringify(
          expense
        )
      }
    )
  }


export const updateExpense =
  async (
    id,
    expense
  ) => {

    return request(
      `/expenses/${id}`,
      {
        method: 'PUT',

        body: JSON.stringify(
          expense
        )
      }
    )
  }


export const deleteExpense =
  async (
    id
  ) => {

    return request(
      `/expenses/${id}`,
      {
        method: 'DELETE'
      }
    )
  }


/*
  -----------------------------------------
  BUDGETS
  -----------------------------------------
*/

export const getBudgets =
  async () => {

    return request(
      '/budgets'
    )
  }


export const getBudget =
  async (
    month
  ) => {

    return request(
      `/budgets/${month}`
    )
  }


export const saveBudget =
  async (
    month,
    amount
  ) => {

    return request(
      `/budgets/${month}`,
      {
        method: 'PUT',

        body: JSON.stringify({
          amount
        })
      }
    )
  }


export const deleteBudget =
  async (
    month
  ) => {

    return request(
      `/budgets/${month}`,
      {
        method: 'DELETE'
      }
    )
  }


/*
  -----------------------------------------
  RECURRING EXPENSES
  -----------------------------------------
*/

export const getRecurringExpenses =
  async () => {

    return request(
      '/recurring'
    )
  }


/*
  CREATE RECURRING EXPENSE
*/

export const addRecurringExpense =
  async (
    recurringExpense
  ) => {

    return request(
      '/recurring',
      {
        method: 'POST',

        body: JSON.stringify(
          recurringExpense
        )
      }
    )
  }


/*
  ADD NEXT SCHEDULED OCCURRENCE

  This is the important new function.

  The backend decides the date using
  next_due_date.

  It does NOT use today's date.
*/

export const addRecurringExpenseNow =
  async (
    id
  ) => {

    return request(
      `/recurring/${id}/add-now`,
      {
        method: 'POST'
      }
    )
  }


/*
  UPDATE RECURRING EXPENSE
*/

export const updateRecurringExpense =
  async (
    id,
    recurringExpense
  ) => {

    return request(
      `/recurring/${id}`,
      {
        method: 'PUT',

        body: JSON.stringify(
          recurringExpense
        )
      }
    )
  }


/*
  DELETE RECURRING EXPENSE
*/

export const deleteRecurringExpense =
  async (
    id
  ) => {

    return request(
      `/recurring/${id}`,
      {
        method: 'DELETE'
      }
    )
  }


/*
  PAUSE / RESUME
*/

export const toggleRecurringExpense =
  async (
    id
  ) => {

    return request(
      `/recurring/${id}/toggle`,
      {
        method: 'PATCH'
      }
    )
  }


/*
  -----------------------------------------
  LOGOUT
  -----------------------------------------
*/

export const logoutUser =
  () => {

    localStorage.removeItem(
      'token'
    )

    localStorage.removeItem(
      'user'
    )
  }