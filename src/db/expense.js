const requestOptions = {
  method: 'GET'
}

const listLatestExpenses = (pageNumber, pageSize) => {
  console.info("Fetching recent expenses")
  return fetch(`${process.env.REACT_APP_EXPENSE_SERVICE_ENDPOINT}/list/recent?page=${pageNumber}&size=${pageSize}`, requestOptions)
    .then(response => response.json())
}

export default listLatestExpenses;

export function getExpense(expenseId) {
  console.info("Fetching expense [%s] from backend with", expenseId)
  return fetch(`${process.env.REACT_APP_EXPENSE_SERVICE_ENDPOINT}/${expenseId}`, requestOptions)
    .then(response => response.json())
}

export function saveExpense(expense) {
  console.info("Saving expense %s...", expense.id)
  var opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expense)
  }

  return fetch(`${process.env.REACT_APP_EXPENSE_SERVICE_ENDPOINT}/update`, opts)
}

export const deleteExpense = (expense) => {
  console.info("Delete expense %s", expense.id)
  return fetch(`${process.env.REACT_APP_EXPENSE_SERVICE_ENDPOINT}/delete`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense)
    })
    .then(response => response.json())
}