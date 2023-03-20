import { useState, useEffect } from "react";
import { deleteExpense, getExpense, saveExpense } from "../../db/expense";
import { TextInput, Label, Button } from 'flowbite-react';
import { classifyServiceByItemName } from "../../Service/ItemClassificationService";
import { SelectUser } from "../User/SelectUser";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { ConfirmDeleteExpense } from "./ConfirmDeleteExpense";

export const EditExpense = () => {
  const [expense, setExpense] = useState(
    {
      "expenseDate": "",
      "itemName": "",
      "quantity": 1,
      "unitPrice": 0,
      "expenserName": "",
      "expenserId": "",
      "service": "",
      "id": "",
      "amount": 0
    }
  )

  const { expenseId } = useParams()
  const location = useLocation()
  const [loc, setLoc] = useState({ pageNumber: 0, pageSize: 10 })
  const [choosenDate, setChoosenDate] = useState(new Date().toISOString().substring(0, 10))

  useEffect(() => {
    // const datepickerEl = document?.getElementById("datepickerId")
    // new Datepicker(datepickerEl, {
    //   autohide: true
    // })
    console.log("Edit expense - Parent location")
    console.log(location)
    setLoc({
      pageNumber: location.state.pageNumber,
      pageSize: location.state.pageSize
    })
    getExpense(expenseId)
      .then(data => {
        reloadStateOfInitialExpense(data)
      }).catch((err) => {
        console.log("Unexpected error happen during fetch expense from remote server")
        const now = new Date()
        reloadStateOfInitialExpense({
          "expenseDate": now.toISOString(),
          "itemName": "",
          "quantity": 1,
          "unitPrice": 5000,
          "expenserName": "Liễu Lê",
          "expenserId": "5114683375",
          "service": "FOOD",
          "id": expenseId,
          "amount": 0
        })
      })
  }, [expenseId, location]);

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
    const updatedExpenseDate = e.target.value + expense.expenseDate.substring(10)
    console.log("Date %s was choosen. Expense date changed to %s", e.target.value, updatedExpenseDate)
    setChoosenDate(e.target.value)
    setExpense({
      ...expense,
      expenseDate: updatedExpenseDate
    })
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
    console.info("Saving expense")
    console.log(expense)
    saveExpense(expense)
      .then(resp => {
        console.log("Save expense %s successully", expense.id)
        console.log(resp)
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


  return (
    <div>
      <div class="flex py-2 px-2">
        <Button disabled={false} onClick={handleSaveExpense} >Save</Button>
        <ConfirmDeleteExpense abortDeletion={abortExpenseDeletion} confirmDeletion={confirmExpenseDeletion} />
        <Link to=".." state={{ pageNumber: loc.pageNumber, pageSize: loc.pageSize }} relative="path">Back</Link>
      </div>
      <form class="flex flex-wrap mx-1">
        <div class="w-full px-1 mb-6">
          <div class="flex flex-wrap -mx-3 mb-6">
            <div class="w-full px-3 mb-6 md:mb-0">
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
          </div>
          <div class="flex flex-wrap -mx-3 mb-6">
            <div class="w-full md:w-1/2 px-3 mb-6 md:mb-0">
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
                type="number"
                onChange={onAmountChange}
              />
            </div>
            <div class="w-full md:w-1/2 px-3 mb-6 md:mb-0">
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

          <div class="flex flex-wrap -mx-3 mb-6">
            <div class="w-full md:w-1/2 px-3 mb-6 md:mb-0">
              <div className="mb-2 block">
                <Label
                  htmlFor="amount"
                  value="Amount"
                />
              </div>
              <TextInput
                id="amount"
                placeholder="0"
                required={true}
                value={expense.amount}
                readOnly={true}
              />
            </div>
            <div class="w-full md:w-1/2 px-3 mb-6 md:mb-0">
              <div className="mb-2 block">
                <Label
                  htmlFor="service"
                  value="Service"
                />
              </div>
              <TextInput
                id="service"
                placeholder="FOOD"
                required={true}
                value={expense.service}
                readOnly={true}
              />
            </div>

          </div>
          <div class="flex flex-wrap -mx-3 mb-6">
            <div class="w-full md:w-1/2 px-3 mb-6 md:mb-0">
              <div className="mb-2 block">
                <Label
                  htmlFor="expenserName"
                  value="Expenser"
                />
              </div>
              <SelectUser initialUser={{ id: expense.expenserId, name: expense.expenserName }}
                handleUserChange={onExpenserChange} />
            </div>
            <div class="w-full md:w-1/2 px-3 mb-6 md:mb-0">
              <div className="mb-2 block">
                <Label
                  htmlFor="expenseDate"
                  value="Expense Date"
                />
              </div>
              <TextInput
                id="expenseDate"
                placeholder="2023-01-01"
                required={true}
                value={choosenDate}
                readOnly={false}
                type="date"
                onChange={handleExpenseDateChange}
                rightIcon={() => {
                  return (
                    <svg aria-hidden="true" class="w-5 h-5 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path></svg>
                  )
                }}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
