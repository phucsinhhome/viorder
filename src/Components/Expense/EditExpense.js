import { useState, useEffect } from "react";
import { deleteExpense, getExpense, saveExpense } from "../../db/expense";
import { TextInput, Label, Datepicker } from 'flowbite-react';
import { classifyServiceByItemName } from "../../Service/ItemClassificationService";
import { SelectUser } from "../User/SelectUser";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { ConfirmDeleteExpense } from "./ConfirmDeleteExpense";
import run from "../../Service/ExpenseExtractionService";

const intialExpense = () => {
  var today = new Date()
  return ({
    "expenseDate": today.toISOString(),
    "itemName": "",
    "quantity": 1,
    "unitPrice": 5000,
    "expenserName": "Liễu Lê",
    "expenserId": "5114683375",
    "service": "FOOD",
    "id": null,
    "amount": 5000
  })
}

export const EditExpense = () => {
  const [expense, setExpense] = useState(intialExpense())

  const { expenseId } = useParams()
  const location = useLocation()
  const [loc, setLoc] = useState({ pageNumber: 0, pageSize: 10 })
  const [choosenDate, setChoosenDate] = useState(new Date().toISOString().substring(0, 10))
  const [expenseMessage, setExpenseMessage] = useState("")

  useEffect(() => {
    console.log("Edit expense - Parent location")
    console.log(location)
    if (location === null || location.state === null) {
      return
    }
    var newLocation = {
      pageNumber: location.state.pageNumber,
      pageSize: location.state.pageSize
    }
    setLoc(newLocation)
  }, [location])

  useEffect(() => {
    console.info("Expense change to %s", expenseId)
    if (expenseId === "new") {
      console.info("Create new expense...")
      reloadStateOfInitialExpense(intialExpense())
      return;
    }
    getExpense(expenseId)
      .then(data => {
        reloadStateOfInitialExpense(data)
      }).catch((err) => {
        console.log("Unexpected error happen during fetch expense from remote server")
        reloadStateOfInitialExpense(intialExpense)
      })
  }, [expenseId]);

  const reloadStateOfInitialExpense = (exp) => {
    console.log(exp)
    let dd = exp.expenseDate.substring(0, 10)
    console.log("Expense date part: " + dd)
    setChoosenDate(dd)
    setExpense(exp)
  }


  const onDataChange = (e) => {
    const exp = {
      ...expense,
      [e.target.id]: e.target.value
    }
    setExpense(exp)
  }
  const onAmountChange = (e) => {
    const exp = {
      ...expense,
      [e.target.id]: e.target.value
    }

    const exp2 = {
      ...exp,
      amount: exp.unitPrice * exp.quantity
    }
    setExpense(exp2)
  }

  const handleExpenseDateChange = (e) => {
    console.log(e)
    var choosenDate = new Date(e)
    var currentDateTime = new Date(expense.expenseDate)
    var selectedDateTime = new Date(choosenDate.getTime() + 24 * 60 * 60 * 1000)

    currentDateTime.setDate(choosenDate.getDate())
    currentDateTime.setMonth(choosenDate.getMonth())
    currentDateTime.setFullYear(choosenDate.getFullYear())

    console.log("Expense date changed to %s", selectedDateTime)

    var expDate = selectedDateTime.toISOString().substring(0, 10)
    console.info("choosen date: %s", expDate)
    setChoosenDate(expDate)

    var exp = {
      ...expense,
      expenseDate: currentDateTime
    }
    setExpense(exp)
  }

  const onItemNameLeave = (e) => {
    console.log("Item name input completed with value %s", expense.itemName)
    classifyServiceByItemName(expense.itemName)
      .then(serv => {
        const exp = {
          ...expense,
          service: serv
        }
        setExpense(exp)
      })
  }

  const onExpenserChange = (member) => {
    console.log("Selected expenser: %s", member.id)
    const exp = {
      ...expense,
      expenserId: member.id,
      expenserName: member.name
    }

    setExpense(exp)
  }

  const handleSaveExpense = () => {
    var exp = {
      ...expense
    }
    if (expense.id === null || expense.id === "" || expense.id === "new") {
      let newExpId = '' + (Date.now() % 10000000)
      exp.id = newExpId
      console.log("Adding new expense. Id [%s] was generated", exp.id)
    }
    console.info("Saving expense")
    console.log(expense)
    saveExpense(exp)
      .then((resp) => {
        if (resp.ok) {
          console.log("Save expense %s successully", exp.id)
          console.log(resp)
        } else {
          console.log("Failed to save expense %s", exp.id)
          console.error(resp)
        }
      })
  }

  const navigate = useNavigate();
  const abortExpenseDeletion = (e) => {
    console.log("Abort to delete expense")
  }

  const confirmExpenseDeletion = (e) => {
    console.log("Confirm to delete expense")
    deleteExpense(expense)
      .then(data => {
        navigate("..", {
          state: { pageNumber: loc.pageNumber, pageSize: loc.pageSize },
          relative: "path"
        })
      })
  }

  const expMsgChange = (e) => {
    setExpenseMessage(e.target.value)
  }

  const extractExpense = () => {
    console.info("Extracting expense from message " + expenseMessage)
    run(expenseMessage)
      .then(data => {
        console.info("Complete extracting expense message");
        console.info(data);
        let jsonD = JSON.parse(data)

        let pr = parseInt(jsonD.price);
        let qty = parseInt(jsonD.quantity);
        let uP = Math.floor(pr / qty); // Use Math.floor() if you prefer rounding down
        console.info("Price: " + pr + ", Quantity: " + qty + ", Unit Price: " + uP)
        var exp = {
          ...expense,
          itemName: jsonD.item,
          quantity: qty,
          unitPrice: uP,
          amount: pr
        }
        setExpense(exp)
      })
  }

  return (
    <div>
      <div className="flex py-2 px-2 space-x-4">
        <Link onClick={handleSaveExpense} className="px-1 font-sans font-bold text-amber-800">
          Save
        </Link>
        <ConfirmDeleteExpense abortDeletion={abortExpenseDeletion} confirmDeletion={confirmExpenseDeletion} />
        <Link to=".." state={{ pageNumber: loc.pageNumber, pageSize: loc.pageSize }} relative="path"
          className="px-1 font-sans font-bold text-amber-800"
        >Back</Link>
      </div>
      <div>

        <form>
          <div class="grid gap-6 mb-6 md:grid-cols-2">
            <div>
              <label for="expense_message" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your expense message</label>
              <input type="text" value={expenseMessage} onChange={expMsgChange} id="expense_message" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="5kg sugar 450k" required />
            </div>
            <div>
              <label for="generate_exp" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white invisible">G</label>
              <Link onClick={extractExpense} className=" py-2 px-1 font-sans font-bold text-amber-800">
                Generate
              </Link>
            </div>
          </div>
        </form>

      </div>
      <form className="flex flex-wrap mx-1">
        <div className="w-full px-1 mb-6">
          <div className="flex flex-wrap -mx-3 mb-6">
            <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
              <div className="mb-2 block">
                <Label
                  htmlFor="itemName"
                  value="Item Name"
                />
              </div>
              <TextInput
                id="itemName"
                placeholder="Nước giặt"
                required={true}
                value={expense.itemName}
                onChange={onDataChange}
                onBlur={onItemNameLeave}
              />
            </div>
            <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
              <div className="mb-2 block">
                <Label
                  htmlFor="expenseDate"
                  value="Expense Date"
                />
              </div>
              <Datepicker
                autoHide={true}
                value={choosenDate}
                onSelectedDateChanged={handleExpenseDateChange} />
            </div>
            <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
              <div className="mb-2 block">
                <Label
                  htmlFor="unitPrice"
                  value="Unit Price"
                />
              </div>
              <TextInput
                id="unitPrice"
                placeholder="5000"
                required={true}
                value={expense.unitPrice}
                readOnly={false}
                type="currency"
                onChange={onAmountChange}
              />
            </div>
            <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
              <div className="mb-2 block">
                <Label
                  htmlFor="quantity"
                  value="Quantity"
                />
              </div>
              <TextInput
                id="quantity"
                placeholder="1"
                required={true}
                value={expense.quantity}
                readOnly={false}
                type="number"
                onChange={onAmountChange}
              />
            </div>
          </div>

          <div className="flex-wrap -mx-3 mb-6 space-y-2">
            <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0 flex flex-nowrap space-x-1">
              <Label
                htmlFor="amount"
                value="Amount:"
              />
              <Label
                id="amount"
                placeholder="0"
                required={true}
                value={expense.amount.toLocaleString('us-US', { style: 'currency', currency: 'VND' })}
                readOnly={true}
              />
            </div>
            <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0 flex flex-nowrap space-x-1">
              <Label
                htmlFor="expenserName"
                value="Expenser:"
              />
              <Label value={expense.expenserName}></Label>
              <SelectUser initialUser={{ id: expense.expenserId, name: expense.expenserName }}
                handleUserChange={onExpenserChange} />
            </div>
            <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0 space-x-1">
              <Label
                htmlFor="service"
                value="Service:"
              />
              <Label
                id="service"
                placeholder="FOOD"
                required={true}
                value={expense.service}
                readOnly={true}
              />
            </div>

          </div>
        </div>
      </form>
    </div>
  );
}
