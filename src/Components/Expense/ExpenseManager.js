import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Table } from "flowbite-react";
import listLatestExpenses from "../../db/expense";


export const ExpenseManager = () => {
  const [expenses, setExpenses] = useState([
    {
      "expenseDate": null,
      "itemName": null,
      "quantity": 1,
      "unitPrice": 0,
      "expenserName": null,
      "expenserId": null,
      "service": null,
      "id": null,
      "amount": 0
    }
  ])

  const [pagination, setPagination] = useState({
    pageNumber: 0,
    pageSize: 10,
    totalElements: 200,
    totalPages: 20
  })

  const handlePaginationClick = (pageNumber) => {
    console.log("Pagination nav bar click to page %s", pageNumber)
    fetchData(pageNumber < 0 ? 0 : pageNumber > pagination.totalPages - 1 ? pagination.totalPages - 1 : pageNumber, pagination.pageSize)
  }

  const location = useLocation()

  const fetchData = (pageNumber, pageSize) => {
    listLatestExpenses(pageNumber, pageSize)
      .then(data => {
        setExpenses(data.content)
        setPagination({
          pageNumber: data.number,
          pageSize: data.size,
          totalElements: data.totalElements,
          totalPages: data.totalPages
        })
      })
  }

  useEffect(() => {
    console.log(location)
    fetchData(location.state.pageNumber, location.state.pageSize)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const pageClass = (pageNum) => {
    var noHighlight = "px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
    var highlight = "px-3 py-2 leading-tight text-bold text-blue-600 border border-blue-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white"

    return pagination.pageNumber === pageNum ? highlight : noHighlight
  }

  return (
    <div>
      <div className="py-2 px-2">
        <Link to={"new"} state={{ pageNumber: pagination.pageNumber, pageSize: pagination.pageSize }} className="font-bold text-amber-800 pl-4">New Expense</Link>
      </div>
      <Table hoverable={true}>
        <Table.Head>
          <Table.HeadCell >
            Date
          </Table.HeadCell>
          <Table.HeadCell>
            Item Name
          </Table.HeadCell>
          <Table.HeadCell >
            Amount
          </Table.HeadCell>
          <Table.HeadCell >
            Group
          </Table.HeadCell>
          <Table.HeadCell >
            <span className="sr-only">
              Edit
            </span>
          </Table.HeadCell>
        </Table.Head>
        <Table.Body className="divide-y">
          {expenses.map((exp) => {
            return (
              <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800" key={exp.id}>
                <Table.Cell >
                  {exp.expenseDate != null ? new Date(exp.expenseDate).toLocaleDateString() : "NA"}
                </Table.Cell>
                <Table.Cell>
                  <Link to={exp.id} state={{ pageNumber: pagination.pageNumber, pageSize: pagination.pageSize }} className="font-medium text-blue-600 hover:underline dark:text-blue-500">{exp.itemName}</Link>
                </Table.Cell>
                <Table.Cell>
                  {exp.amount.toLocaleString('us-US', { style: 'currency', currency: 'VND' })}
                </Table.Cell>
                <Table.Cell>
                  {exp.service}
                </Table.Cell>
                <Table.Cell>
                  <Link to={exp.id} state={{ pageNumber: pagination.pageNumber, pageSize: pagination.pageSize }} className="font-medium text-blue-600 hover:underline dark:text-blue-500">Edit</Link>
                </Table.Cell>
              </Table.Row>
            )
          })}
        </Table.Body>
      </Table>
      <nav className="flex items-center justify-between pt-4" aria-label="Table navigation">
        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">Showing <span className="font-semibold text-gray-900 dark:text-white">{pagination.pageSize * pagination.pageNumber + 1}-{pagination.pageSize * pagination.pageNumber + pagination.pageSize}</span> of <span className="font-semibold text-gray-900 dark:text-white">{pagination.totalElements}</span></span>
        <ul className="inline-flex items-center -space-x-px">
          <li onClick={() => handlePaginationClick(pagination.pageNumber - 1)} className="block px-3 py-2 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
            <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
          </li>
          <li onClick={() => handlePaginationClick(0)} className={pageClass(0)}>
            1
          </li>
          <li hidden={pagination.pageNumber + 1 <= 1 || pagination.pageNumber + 1 >= pagination.totalPages} aria-current="page" className={pageClass(pagination.pageNumber)}>
            {pagination.pageNumber + 1}
          </li>
          <li hidden={pagination.totalPages <= 1} onClick={() => handlePaginationClick(pagination.totalPages - 1)} className={pageClass(pagination.totalPages - 1)}>
            {pagination.totalPages}
          </li>
          <li onClick={() => handlePaginationClick(pagination.pageNumber + 1)} className="block px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
            <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path></svg>
          </li>
        </ul>
      </nav>
    </div >
  );
}
