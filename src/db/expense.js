const requestOptions = {
  method: 'GET'
}

const listLatestExpenses = (pageNumber, pageSize) => {
  console.info("Fetching recent expenses")
  return fetch(`${process.env.REACT_APP_EXPENSE_SERVICE_ENDPOINT}/api/expense/list/recent?page=${pageNumber}&size=${pageSize}`, requestOptions)
    .then(response => response.json())
}

export default listLatestExpenses;

export function getExpense(expenseId) {
  console.info("Fetching expense from backend")
  return fetch(`${process.env.REACT_APP_EXPENSE_SERVICE_ENDPOINT}/api/expense/${expenseId}`, requestOptions)
    .then(response => response.json())
}

export function saveExpense(expense) {
  console.info("Save expense %s", expense.id)
  return fetch(`${process.env.REACT_APP_EXPENSE_SERVICE_ENDPOINT}/api/expense/update`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense)
    })
    .then(response => response.json())
}