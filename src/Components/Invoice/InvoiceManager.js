import { useState, useEffect } from "react";
import UpdateButton from "../Button/Button";
import listLatestInvoices from "../../db/invoice";
import { Link } from "react-router-dom";
import { Table } from "flowbite-react";


export function InvoiceManager() {
  const [invoices, setInvoices] = useState([
    {
      "id": "000000000000000000",
      "guestName": "",
      "issuer": "",
      "issuerId": "",
      "subTotal": 0
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

  useEffect(() => {
    fetchData(pagination.pageNumber, pagination.pageSize)
  }, [pagination]);

  const fetchData = (pageNumber, pageSize) => {
    listLatestInvoices(pageNumber, pageSize)
      .then(data => {
        setInvoices(data.content)
        setPagination({
          pageNumber: data.number,
          pageSize: data.size,
          totalElements: data.totalElements,
          totalPages: data.totalPages
        })
      })
  }


  return (
    <div>
      <div class="py-2 px-2">
        <UpdateButton title="+ Add" disable={false} onClick={() => {
        }} />
      </div>
      <Table hoverable={true}>
        <Table.Head>
          <Table.HeadCell>
            Guest Name
          </Table.HeadCell>
          <Table.HeadCell>
            Issuer
          </Table.HeadCell>
          <Table.HeadCell>
            Grand Amount
          </Table.HeadCell>
          <Table.HeadCell>
            <span className="sr-only">
              Edit
            </span>
          </Table.HeadCell>
        </Table.Head>
        <Table.Body className="divide-y">
          {invoices.map((inv) => {
            return (
              <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
                <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                  {inv.guestName}
                </Table.Cell>
                <Table.Cell>
                  {inv.issuer}
                </Table.Cell>
                <Table.Cell>
                  {inv.subTotal.toLocaleString('us-US', { style: 'currency', currency: 'VND' })}
                </Table.Cell>
                <Table.Cell>
                  <Link to={inv.id} className="font-medium text-blue-600 hover:underline dark:text-blue-500">Edit</Link>
                </Table.Cell>
              </Table.Row>
            )
          })}
        </Table.Body>
      </Table>
      <nav class="flex items-center justify-between pt-4" aria-label="Table navigation">
        <span class="text-sm font-normal text-gray-500 dark:text-gray-400">Showing <span class="font-semibold text-gray-900 dark:text-white">{pagination.pageSize * pagination.pageNumber + 1}-{pagination.pageSize * pagination.pageNumber + pagination.pageSize}</span> of <span class="font-semibold text-gray-900 dark:text-white">{pagination.totalElements}</span></span>
        <ul class="inline-flex items-center -space-x-px">
          <li onClick={() => handlePaginationClick(pagination.pageNumber - 1)} class="block px-3 py-2 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">

            <span class="sr-only">Previous</span>
            <svg class="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>

          </li>
          <li onClick={() => handlePaginationClick(0)} class="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
            1
          </li>
          <li onClick={() => handlePaginationClick(1)} class="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
            2
          </li>
          <li hidden={pagination.pageNumber <= 1} aria-current="page" class="z-10 px-3 py-2 leading-tight text-blue-600 border border-blue-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white">
            {pagination.pageNumber + 1}
          </li>
          <li hidden={pagination.pageNumber > 1} class="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
            ...
          </li>
          <li onClick={() => handlePaginationClick(pagination.totalPages - 1)} class="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
            {pagination.totalPages}
          </li>
          <li onClick={() => handlePaginationClick(pagination.pageNumber + 1)} class="block px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
            <span class="sr-only">Next</span>
            <svg class="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path></svg>
          </li>
        </ul>
      </nav>
    </div >
  );
}
