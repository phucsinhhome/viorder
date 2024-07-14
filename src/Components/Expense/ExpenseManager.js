import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Table, TextInput, Label, Spinner } from "flowbite-react";
import listLatestExpenses, { deleteExpense, newExpId } from "../../db/expense";
import Moment from "react-moment";
import run from "../../Service/ExpenseExtractionService";
import { saveExpense } from "../../db/expense";
import { classifyServiceByItemName } from "../../Service/ItemClassificationService";


const intialExpense = () => {
  var today = new Date()
  return ({
    "expenseDate": today.toISOString(),
    "itemName": "",
    "quantity": 1,
    "unitPrice": 5000,
    "expenserName": "Min",
    "expenserId": "1351151927",
    "service": "FOOD",
    "id": null,
    "amount": 5000
  })
}
const DEFAULT_PAGE_SIZE = process.env.REACT_APP_DEFAULT_PAGE_SIZE

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

  const [expense, setExpense] = useState(intialExpense())
  const [genState, setGenState] = useState(undefined); // GENERATING -> GENERATED -> SAVING -> SAVED || GENERATION_ERROR

  const [pagination, setPagination] = useState({
    pageNumber: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    totalElements: 200,
    totalPages: 20
  })

  const [expenseMessage, setExpenseMessage] = useState("")
  const [genError, setGenError] = useState("")

  const inputRef = useRef(null)

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
    inputRef.current.focus()
    fetchData(location.state.pageNumber, location.state.pageSize)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const pageClass = (pageNum) => {
    var noHighlight = "px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
    var highlight = "px-3 py-2 leading-tight text-bold text-blue-600 border border-blue-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white"

    return pagination.pageNumber === pageNum ? highlight : noHighlight
  }

  const expMsgChange = (e) => {
    setExpenseMessage(e.target.value)
  }

  const extractExpense = () => {
    console.info("Extracting expense from message " + expenseMessage)
    if (expenseMessage.length < 5) {
      setGenState("GENERATION_ERROR")
      setGenError("Message must be longer than 5 characters")
      inputRef.current.focus()
      return
    }
    setGenState("GENERATING")
    run(expenseMessage)
      .then(data => {
        try {
          console.info("Complete extracting expense message");
          console.info(data);
          let jsonD = JSON.parse(data)

          let eE = jsonD.expenses[0]

          let pr = parseInt(eE.price);
          let qty = parseInt(eE.quantity);
          let uP = Math.floor(pr / qty); // Use Math.floor() if you prefer rounding down
          console.info("Price: " + pr + ", Quantity: " + qty + ", Unit Price: " + uP)
          var exp = {
            ...expense,
            id: null,
            itemName: eE.item,
            quantity: qty,
            unitPrice: uP,
            amount: pr
          }

          console.info("Classify the service...")
          classifyServiceByItemName(exp.itemName)
            .then(serv => {
              let exp1 = {
                ...exp,
                service: serv
              }
              setExpense(exp1)
            })

          setGenState("GENERATED")
        }
        catch (e) {
          console.error(e)
          setGenState("GENERATION_ERROR")
          setGenError("Cannot generate expense")
        }
        finally {
          inputRef.current.focus()
        }
      })
  }

  const hanldleSaveExpense = () => {
    setGenState("SAVING")
    try {
      let exp = {
        ...expense
      }
      if (expense.id === null || expense.id === "" || expense.id === "new") {
        exp.id = newExpId()
        setExpense(exp)
        console.log("Adding new expense. Id [%s] was generated", exp.id)
      }
      console.info("Saving expense")
      console.log(exp)
      saveExpense(exp)
        .then((resp) => {
          if (resp.ok) {
            console.log("Save expense %s successully", exp.id)
            console.log(resp)
            fetchData(0, DEFAULT_PAGE_SIZE)
          } else {
            console.log("Failed to save expense %s", exp.id)
            console.error(resp)
          }
        })
    }
    catch (e) {
      console.error(e)
    }
    finally {
      setGenState("SAVED")
    }
  }

  const handleDeleteExpense = (e) => {
    console.warn("Deleting expense [%s]..." + e.id)
    deleteExpense(e)
      .then((rsp) => {
        if (rsp !== null) {
          console.log("Delete expense %s successully", e.id)
          fetchData(location.state.pageNumber, location.state.pageSize)
        }
      })
  }

  return (
    <div className="h-screen">
      <div className="py-2 px-2">
        <Link to={"new"} state={{ pageNumber: pagination.pageNumber, pageSize: pagination.pageSize }} className="font-bold text-amber-800 pl-4">New Expense</Link>
      </div>
      <div>
        <form className="flex flex-wrap mx-1">
          <div className="w-full px-1 mb-0">
            <div className="flex flex-wrap -mx-3">
              <div className="w-full md:w-1/2 px-3 md:mb-0">
                <Label
                  htmlFor="expense_message"
                  value="Message contains the expense"
                />
              </div>
              <div className="flex flex-row w-full px-3 md:mb-0 space-x-2">
                <TextInput
                  id="expense_message"
                  placeholder="5kg sugar 450k"
                  required={true}
                  value={expenseMessage}
                  onChange={expMsgChange}
                  className="w-full"
                  ref={inputRef}
                />
                <div className="flex flex-col justify-center w-8">
                  <svg
                    className="w-7 h-7 text-blue-800 dark:text-white"
                    aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 22 20"
                    hidden={genState === "GENERATING"}
                    onClick={extractExpense}
                  >
                    <path
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      strokeWidth="2"
                      d="M11 16.5A2.493 2.493 0 0 1 6.51 18H6.5a2.468 2.468 0 0 1-2.4-3.154 2.98 2.98 0 0 1-.85-5.274 2.468 2.468 0 0 1 .921-3.182 2.477 2.477 0 0 1 1.875-3.344 2.5 2.5 0 0 1 3.41-1.856A2.5 2.5 0 0 1 11 3.5m0 13v-13m0 13a2.492 2.492 0 0 0 4.49 1.5h.01a2.467 2.467 0 0 0 2.403-3.154 2.98 2.98 0 0 0 .847-5.274 2.468 2.468 0 0 0-.921-3.182 2.479 2.479 0 0 0-1.875-3.344A2.5 2.5 0 0 0 13.5 1 2.5 2.5 0 0 0 11 3.5m-8 5a2.5 2.5 0 0 1 3.48-2.3m-.28 8.551a3 3 0 0 1-2.953-5.185M19 8.5a2.5 2.5 0 0 0-3.481-2.3m.28 8.551a3 3 0 0 0 2.954-5.185"
                    />
                  </svg>
                  <Spinner
                    aria-label="Default status example"
                    hidden={genState !== "GENERATING"}
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
        <div
          className="flex flex-row w-full text-sm space-x-2 px-2 mb-3 opacity-80"
        >
          <span
            className="text-brown-600 font-bold"
            hidden={genState === undefined || genState === "GENERATING"}
          >Gen:
          </span>
          <span
            className="font italic"
            hidden={genState === undefined || genState === "GENERATING" || genState === "GENERATION_ERROR"}
          >{expense.quantity + ", " + expense.itemName + ", " + expense.amount + ", " + expense.service}
          </span>
          <span
            className="font italic text-red-700"
            hidden={genState !== "GENERATION_ERROR"}
          >{genError}
          </span>
          <span
            onClick={hanldleSaveExpense}
            state={{ pageNumber: pagination.pageNumber, pageSize: pagination.pageSize }}
            className="text-brown-600 dark:text-white-500 font-bold"
            hidden={genState !== "GENERATED"}
          >
            Save
          </span>
          <span
            state={{ pageNumber: pagination.pageNumber, pageSize: pagination.pageSize }}
            className="text-green-600-600 dark:text-white-500 font-bold"
            hidden={genState !== "SAVED"}
          >
            Saved
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table hoverable={true}>
          <Table.Head>
            <Table.HeadCell className="sm:px-1">
              Date
            </Table.HeadCell>
            <Table.HeadCell className="sm:px-1">
              Item Name
            </Table.HeadCell>

            <Table.HeadCell>
              <span className="sr-only">
                Edit
              </span>
            </Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y">
            {expenses.map((exp) => {
              return (
                <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800 text-lg" key={exp.id}>
                  <Table.Cell className="sm:px-1">
                    <Moment format="DD.MM">{new Date(exp.expenseDate)}</Moment>
                  </Table.Cell>
                  <Table.Cell className="sm:px-1">
                    <div className="grid grid-cols-1">
                      <Link
                        to={exp.id}
                        state={{ pageNumber: pagination.pageNumber, pageSize: pagination.pageSize }}
                        className="font-medium text-blue-600 hover:underline dark:text-blue-500"
                      >
                        {exp.itemName}
                      </Link>
                      <div className="flex flex-row text-sm space-x-1">
                        <div className="w-24">
                          <span>{exp.amount.toLocaleString('us-US', { style: 'currency', currency: 'VND' })}</span>
                        </div>

                        <span className="font font-mono font-black">{exp.service}</span>
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    {/* <Link to={exp.id} state={{ pageNumber: pagination.pageNumber, pageSize: pagination.pageSize }} className="font-medium text-blue-600 hover:underline dark:text-blue-500">Edit</Link> */}
                    <span
                      onClick={() => handleDeleteExpense(exp)}
                      state={{ pageNumber: pagination.pageNumber, pageSize: pagination.pageSize }}
                      className="font-medium text-blue-600 hover:underline dark:text-blue-500"
                    >Del
                    </span>
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>
      </div>
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