import { useState, useEffect } from "react";
import { Modal, TextInput, Label, Button } from 'flowbite-react';
import { classifyServiceByItemName } from "../../Service/ItemClassificationService"
import { HiOutlineCash } from "react-icons/hi";
import { Link } from "react-router-dom";


export const defaultEmptyItem = {
  "id": "",
  "itemName": "",
  "unitPrice": 0,
  "quantity": 0,
  "amount": 0,
  "service": ""
}

export const EditItem = ({ eItem, onSave, displayName, className }) => {
  const [item, setItem] = useState(defaultEmptyItem)
  const [unitPrice, setUnitPrice] = useState({ amount: 0, formattedAmount: '' })
  const [quantity, setQuantity] = useState(0)
  const [servicedItem, setServicedItem] = useState({ itemName: '', service: '' })


  useEffect(() => {
    setItem(eItem)
    if (eItem.unitPrice === 0) {
      setUnitPrice({ amount: 0, formattedAmount: '' })
      return
    }
    let uP = formatMoneyAmount(String(eItem.unitPrice))
    setUnitPrice(uP)
    setQuantity(eItem.quantity)
    setServicedItem({ itemName: eItem.itemName, service: eItem.service })
  }, [eItem]);

  const [isShown, setShow] = useState(false)
  const onClick = () => {
    setShow(true)
  }
  const onClose = () => {
    setShow(false)
  }

  const changeItemName = (e) => {
    let nServiceName = e.target.value
    let sN = {
      ...servicedItem,
      itemName: nServiceName
    }
    setServicedItem(sN)
  }

  const onItemNameBlur = () => {

    let nItemName = servicedItem.itemName
    if (nItemName === null || nItemName === undefined || nItemName === "") {
      return;
    }
    if (nItemName === item.itemName) {
      setServicedItem({ itemName: item.itemName, service: item.service })
      return
    }
    console.log("Classify the service by service name %s", nItemName)
    classifyServiceByItemName(nItemName)
      .then((srv) => {
        var nexItem = {
          ...servicedItem,
          service: srv
        }
        setServicedItem(nexItem)
      })
  }

  const saveItem = (e) => {
    try {
      var nextItem = {
        ...item,
        itemName: servicedItem.itemName,
        service: servicedItem.service,
        quantity: quantity,
        unitPrice: unitPrice.amount,
        amount: quantity * unitPrice.amount
      }
      setItem(nextItem)
      onSave(nextItem)
    } catch (e) {
      console.error(e)
    } finally {
      setItem(defaultEmptyItem)
      setShow(false)
    }
  }

  const cancelEditItem = (e) => {
    setItem(defaultEmptyItem)
    setShow(false)
  }

  // ============= UNIT PRICE =================//
  const formatMoneyAmount = (value) => {
    const numStr = value.replace(/[^0-9.]/g, ''); // Remove non-numeric characters
    const [integerPart, decimalPart] = numStr.split('.');
    const formattedIntegerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const formattedValue = decimalPart ? `${formattedIntegerPart}.${decimalPart}` : formattedIntegerPart;
    return { amount: Number(numStr), formattedAmount: formattedValue };
  };

  const handleUnitPriceChange = (e) => {
    let v = e.target.value
    let am = formatMoneyAmount(v)
    setUnitPrice(am)
  }
  //============== QUANTITY =====================/
  const increase = (delta) => {
    let nQ = quantity + delta
    setQuantity(nQ)
  }

  return (
    <div>
      <Link onClick={onClick} className={className}>
        {displayName}
      </Link>
      <Modal
        show={isShown}
        size="md"
        popup={true}
        onClose={onClose}
      >
        <Modal.Header />
        <Modal.Body>
          <div className="space-y-6 px-6 pb-4 sm:pb-6 lg:px-8 xl:pb-8">
            <div>
              <TextInput
                id="itemName"
                placeholder="Item name"
                required={true}
                value={servicedItem.itemName}
                onChange={changeItemName}
                onBlur={onItemNameBlur}
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
                value={unitPrice.formattedAmount}
                onChange={handleUnitPriceChange}
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
                  onClick={() => increase(-1)}
                >
                  <svg class="w-3 h-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 2">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 1h16" />
                  </svg>
                </button>
                <input
                  type="text"
                  id="quantity-input"
                  data-input-counter aria-describedby="helper-text-explanation"
                  class="bg-gray-50 border-x-0 border-gray-300 h-11 text-center text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="999"
                  required
                  value={quantity}
                />
                <button
                  type="button"
                  id="increment-button"
                  data-input-counter-increment="quantity-input"
                  class="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-e-lg p-3 h-11 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
                  onClick={() => increase(1)}
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
              <span className="w-full">{(unitPrice.amount * quantity).toLocaleString('us-US', { style: 'currency', currency: 'VND' })}</span>

            </div>
            <div className="flex flex-row w-full align-middle">
              <div className="flex items-center w-2/5">
                <Label
                  htmlFor="service"
                  value="Service"
                />
              </div>
              <span className="w-full">{servicedItem.service}</span>
            </div>
            <div className="w-full flex justify-center">
              <Button onClick={saveItem} className="mx-2">
                Save
              </Button>
              <Button onClick={cancelEditItem} className="mx-2">
                Cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}
