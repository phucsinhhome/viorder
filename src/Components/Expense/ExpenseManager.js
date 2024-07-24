import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Table, TextInput, Label, Spinner, Modal, Button } from "flowbite-react";
import listLatestExpenses, { deleteExpense, newExpId } from "../../db/expense";
import Moment from "react-moment";
import run from "../../Service/ExpenseExtractionService";
import { saveExpense } from "../../db/expense";
import { classifyServiceByItemName, SERVICE_NAMES } from "../../Service/ItemClassificationService";
import { currentUser } from "../../App";
import { formatMoneyAmount } from "../Invoice/EditItem";
import { HiOutlineCash } from "react-icons/hi";

const defaultEmptExpense = {
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

const intialExpense = () => {
  var today = new Date()
  return ({
    "expenseDate": today.toISOString(),
    "itemName": "",
    "quantity": 1,
    "unitPrice": 5000,
    "expenserName": currentUser.first_name + " " + currentUser.last_name,
    "expenserId": currentUser.id,
    "service": "FOOD",
    "id": null,
    "amount": 5000
  })
}
const DEFAULT_PAGE_SIZE = process.env.REACT_APP_DEFAULT_PAGE_SIZE

const GEN_STATE = {
  GENERATION_ERROR: "GENERATION_ERROR",
  GENERATING: "GENERATING",
  GENERATED: "GENERATED",
  SAVING: "SAVING",
  SAVED: "SAVED"
}

export const ExpenseManager = () => {

  const [expenses, setExpenses] = useState([defaultEmptExpense])

  const [expense, setExpense] = useState(intialExpense())
  const [genState, setGenState] = useState(undefined); // GENERATING -> GENERATED -> SAVING -> SAVED || GENERATION_ERROR

  const [openDelExpenseModal, setOpenDelExpenseModal] = useState(false)
  const [deletingExpense, setDeletingExpense] = useState(null)

  const [openEditingExpenseModal, setOpenEditingExpenseModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(defaultEmptExpense)

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
        let sortedItems = data.content.sort((i1, i2) => new Date(i1.expenseDate).getTime() - new Date(i2.expenseDate).getTime())
        setExpenses(sortedItems)
        setPagination({
          pageNumber: data.number,
          pageSize: data.size,
          totalElements: data.totalElements,
          totalPages: data.totalPages
        })
        inputRef.current.focus()
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
      setGenState(GEN_STATE.GENERATION_ERROR)
      setGenError("Message must be longer than 5 characters")
      inputRef.current.focus()
      return
    }
    setGenState(GEN_STATE.GENERATING)
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
            amount: pr,
            service: eE.service
          }
          if (eE.service === undefined || eE.service === null || !SERVICE_NAMES.includes(eE.service)) {
            console.info("Re-classify the service...")
            classifyServiceByItemName(exp.itemName)
              .then(serv => {
                exp.service = serv
              })
          }
          setExpense(exp);
          setGenState(GEN_STATE.GENERATED)
        }
        catch (e) {
          console.error(e)
          setGenState(GEN_STATE.GENERATION_ERROR)
          setGenError("Cannot generate expense")
        }
        finally {
          // inputRef.current.focus()
        }
      })
  }

  const handleCreateExpense = () => {
    setGenState(GEN_STATE.SAVING)
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
            setExpenseMessage("")
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
      setGenState(GEN_STATE.SAVED)
    }
  }

  const handleDeleteExpense = (exp) => {
    console.warn("Deleting expense [%s]..." + exp.id)
    deleteExpense(exp)
      .then((rsp) => {
        if (rsp !== null) {
          console.log("Delete expense %s successully", exp.id)
          fetchData(location.state.pageNumber, location.state.pageSize)
        }
      })
  }

  //============ EXPENSE DELETION ====================//
  const askForDelExpenseConfirmation = (exp) => {
    setDeletingExpense(exp);
    setOpenDelExpenseModal(true)
  }

  const cancelDelExpense = () => {
    setOpenDelExpenseModal(false)
    setDeletingExpense(null)
  }

  const confirmDelExpense = () => {
    try {
      if (deletingExpense === undefined || deletingExpense === null) {
        return;
      }
      handleDeleteExpense(deletingExpense)
    } catch (e) {
      console.error(e)
    } finally {
      setOpenDelExpenseModal(false)
      setDeletingExpense(null)
    }

  }

  //================= EDIT EXPENSE ===================//
  const editExpense = (exp) => {
    let uP = formatMoneyAmount(String(exp.unitPrice))
    let eI = {
      ...exp,
      formattedUnitPrice: uP.formattedAmount,
      originItemName: exp.itemName
    }
    setEditingExpense(eI)
    setOpenEditingExpenseModal(true)
  }

  const cancelEditingExpense = () => {
    setEditingExpense(defaultEmptExpense)
    setOpenEditingExpenseModal(false)
  }

  const changeItemName = (e) => {
    let iName = e.target.value
    let eI = {
      ...editingExpense,
      itemName: iName
    }
    setEditingExpense(eI)
  }

  const blurItemName = () => {
    let nItemName = editingExpense.itemName
    if (nItemName === null || nItemName === undefined || nItemName === "" || nItemName === editingExpense.originItemName) {
      return;
    }
    console.log("Classify the service by expense name [%s]", nItemName)
    classifyServiceByItemName(nItemName)
      .then((srv) => {
        var nexItem = {
          ...editingExpense,
          service: srv
        }
        setEditingExpense(nexItem)
      })
  }

  const changeUnitPrice = (e) => {
    let v = e.target.value
    let uP = formatMoneyAmount(v)
    let eI = {
      ...editingExpense,
      amount: uP.amount * editingExpense.quantity,
      unitPrice: uP.amount,
      formattedUnitPrice: uP.formattedAmount
    }
    setEditingExpense(eI)
  }

  const changeQuantity = (delta) => {
    let nQ = editingExpense.quantity + delta
    let eI = {
      ...editingExpense,
      quantity: nQ,
      amount: editingExpense.unitPrice * nQ
    }
    setEditingExpense(eI)
  }

  const handleUpdateExpense = () => {
    try {
      let exp = {
        expenseDate: editingExpense.expenseDate,
        itemName: editingExpense.itemName,
        quantity: editingExpense.quantity,
        unitPrice: editingExpense.unitPrice,
        expenserName: editingExpense.expenserName,
        expenserId: editingExpense.expenserId,
        service: editingExpense.service,
        id: editingExpense.id,
        amount: editingExpense.amount
      }
      if (exp.id === null || exp.id === "" || exp.id === "new") {
        console.error("Editing expense must have a valid ID")
        return
      }
      console.info("Updating expense %s...", exp.id)
      saveExpense(exp)
        .then((resp) => {
          if (resp.ok) {
            console.log("Save expense %s successully", exp.id)
            fetchData(0, DEFAULT_PAGE_SIZE)
            setEditingExpense(defaultEmptExpense)
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
      setOpenEditingExpenseModal(false)
    }
  }

  return (
    <div className="h-full">
      <div className="mt-2 px-2">
        <Link
          to={"new"}
          state={{ pageNumber: pagination.pageNumber, pageSize: pagination.pageSize }}
          className="font-bold text-amber-800 pl-4"
        >New Expense
        </Link>
      </div>
      <div>
        <form className="flex flex-wrap mx-1">
          <div className="w-full px-1 mb-0">
            <div className="flex flex-wrap -mx-3">
              <div className="w-full md:w-1/2 px-3 md:mb-0 dark:text-white">
                <Label
                  htmlFor="expense_message"
                  value="Message contains the expense"
                  className="font dark:text-white"
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
          className="flex flex-row w-full text-sm space-x-2 px-2 mb-3 opacity-80 font text-gray-600 dark:text-white"
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
            onClick={handleCreateExpense}
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
      <div className="h-3/5 max-h-fit overflow-hidden">
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
                Delete
              </span>
            </Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y" >
            {expenses.map((exp) => {
              return (
                <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800 text-lg" key={exp.id}>
                  <Table.Cell className="sm:px-1">
                    <Moment format="DD.MM">{new Date(exp.expenseDate)}</Moment>
                  </Table.Cell>
                  <Table.Cell className="sm:px-1">
                    <div className="grid grid-cols-1">
                      <Label
                        onClick={() => editExpense(exp)}
                        state={{ pageNumber: pagination.pageNumber, pageSize: pagination.pageSize }}
                        className="font-medium text-blue-600 hover:underline dark:text-blue-500"
                        value={exp.itemName}
                      />
                      <div className="flex flex-row text-sm space-x-1">
                        <div className="w-24">
                          <span>{exp.amount.toLocaleString('us-US', { style: 'currency', currency: 'VND' })}</span>
                        </div>

                        <span className="font font-mono font-black">{exp.service}</span>
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <svg class="w-6 h-6 text-red-800 dark:text-white"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24" fill="none" viewBox="0 0 24 24"
                      onClick={() => askForDelExpenseConfirmation(exp)}
                    >
                      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z" />
                    </svg>

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


      <Modal show={openDelExpenseModal} onClose={cancelDelExpense}>
        <Modal.Header>Confirm</Modal.Header>
        <Modal.Body>
          <div>
            <span>{deletingExpense === null ? "" : "Are you sure to delete [" + deletingExpense.itemName + "]?"}</span>
          </div>
        </Modal.Body>
        <Modal.Footer className="flex justify-center gap-4">
          <Button onClick={confirmDelExpense}>Delete</Button>
          <Button color="gray" onClick={cancelDelExpense}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={openEditingExpenseModal}
        size="md"
        popup={true}
        onClose={cancelEditingExpense}
      >
        <Modal.Header />
        <Modal.Body>
          <div className="space-y-6 px-6 pb-4 sm:pb-6 lg:px-8 xl:pb-8">
            <div>
              <TextInput
                id="itemName"
                placeholder="Item name"
                required={true}
                value={editingExpense.itemName}
                onChange={changeItemName}
                onBlur={blurItemName}
              />
            </div>
            <div className="flex flex-row w-full align-middle">
              <div className="flex items-center w-2/5">
                <Label
                  htmlFor="unitPrice"
                  value="Unit Price"
                />
              </div>
              <TextInput
                id="unitPrice"
                placeholder="Enter amount here"
                type="currency"
                step={5000}
                required={true}
                value={editingExpense.formattedUnitPrice}
                onChange={changeUnitPrice}
                rightIcon={HiOutlineCash}
                className="w-full"
              />
            </div>
            <div className="flex flex-row w-full align-middle">
              <div className="flex items-center w-2/5">
                <Label
                  htmlFor="quantity"
                  value="Quantity"
                />
              </div>
              <div class="relative flex items-center w-full">
                <button
                  type="button"
                  id="decrement-button"
                  data-input-counter-decrement="quantity-input"
                  class="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-s-lg p-3 h-11 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
                  onClick={() => changeQuantity(-1)}
                >
                  <svg class="w-3 h-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 2">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 1h16" />
                  </svg>
                </button>
                <input
                  type="number"
                  id="quantity-input"
                  data-input-counter aria-describedby="helper-text-explanation"
                  class="bg-gray-50 border-x-0 border-gray-300 h-11 text-center text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="999"
                  required
                  value={editingExpense.quantity}
                  readOnly
                />
                <button
                  type="button"
                  id="increment-button"
                  data-input-counter-increment="quantity-input"
                  class="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-e-lg p-3 h-11 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
                  onClick={() => changeQuantity(1)}
                >
                  <svg class="w-3 h-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 1v16M1 9h16" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex flex-row w-full align-middle">
              <div className="flex items-center w-2/5">
                <Label
                  htmlFor="amount"
                  value="Amount"
                />
              </div>
              <span className="w-full">{editingExpense.amount.toLocaleString('us-US', { style: 'currency', currency: 'VND' })}</span>

            </div>
            <div className="flex flex-row w-full align-middle">
              <div className="flex items-center w-2/5">
                <Label
                  htmlFor="service"
                  value="Service"
                />
              </div>
              <span className="w-full">{editingExpense.service}</span>
            </div>
            <div className="w-full flex justify-center">
              <Button onClick={handleUpdateExpense} className="mx-2">
                Save
              </Button>
              <Button onClick={cancelEditingExpense} className="mx-2">
                Cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div >
  );
}
