export const DEFAULT_CATEGORIES = [
  'food',
  'travel',
  'shopping',
  'bills',
  'education',
  'entertainment',
  'health',
  'other'
]

export const PAYMENT_METHODS = [
  'Cash',
  'UPI',
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'Other'
]

export const pad = (n) => String(n).padStart(2, '0')

export const formatDate = (date) => {
  if (!date) return '-'
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

export const monthKey = (date) => date ? date.slice(0, 7) : ''

export const todayString = () => new Date().toISOString().slice(0, 10)

export const addFrequency = (dateString, frequency) => {
  const [y, m, d] = dateString.split('-').map(Number)
  const date = new Date(y, m - 1, d)

  if (frequency === 'weekly') {
    date.setDate(date.getDate() + 7)
  } else if (frequency === 'yearly') {
    date.setFullYear(date.getFullYear() + 1)
  } else {
    date.setMonth(date.getMonth() + 1)
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export const hashPin = async (pin) => {
  const data = new TextEncoder().encode(pin)
  const buffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
