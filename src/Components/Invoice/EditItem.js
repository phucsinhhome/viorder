import { useState, useEffect } from "react";
import { Modal, TextInput, Label, Checkbox, Button } from 'flowbite-react';
import { classifyServiceByItemName } from "../../Service/ItemClassificationService"
import { HiOutlineCash, HiOutlinePlus } from "react-icons/hi";
import { Link } from "react-router-dom";


export const defaultEmptyItem = {
  "id": "",
  "itemName": "",
  "unitPrice": 0,
  "quantity": 0,
  "amount": 0
}

export const EditItem = ({ eItem, onSave, onDelete, displayName }) => {
  const [item, setItem] = useState(defaultEmptyItem)
  const [rememberUnitPrice, setRememberUnitPrice] = useState(true)
  const [unitPrice, setUnitPrice] = useState({ amount: 0, formattedAmount: '' })


  useEffect(() => {
    setItem(eItem)
    if (eItem.unitPrice === 0) {
      setUnitPrice({ amount: 0, formattedAmount: '' })
      return
    }
    let uP = formatMoneyAmount(String(eItem.unitPrice))
    setUnitPrice(uP)
  }, [eItem]);

  const [isShown, setShow] = useState(false)
  const onClick = () => {
    setShow(true)
  }
  const onClose = () => {
    setShow(false)
  }

  const onValueChange = (e) => {
    console.info("Value change" + e.target.value + " fieldid" + e.target.id)

    const nexItem = {
      ...item,
      [e.target.id]: e.target.value,
    }
    const nexxItem = {
      ...nexItem,
      amount: nexItem.quantity * nexItem.unitPrice
    }
    setItem(nexxItem)
  }

  const onItemNameBlur = (e) => {
    console.log("Classify the service by service name %s", e.target.value)
    classifyServiceByItemName(e.target.value)
      .then((srv) => {
        var nexItem = {
          ...item,
          service: srv
        }
        setItem(nexItem)
      })
  }

  const onRemberForLaterUseChange = (e) => {
    console.info("Remember changed to %s", e.target.checked)
    setRememberUnitPrice(e.target.checked)
  }

  const saveItem = (e) => {
    setShow(false)
    var nextItem = {
      ...item,
      amount: item.quantity * item.unitPrice
    }
    setItem(nextItem)
    onSave(item)
  }

  const deleteItem = (e) => {
    setShow(false)
    setItem({
      ...item,
      amount: item.quantity * item.unitPrice
    })
    onDelete(item)
  }

  // Function to format the input value as money amount
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

  return (
    <div>
      <Link onClick={onClick} className="font-sans font-bold text-amber-700 bg-gray-200 rounded-lg px-2 py-1">
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
                value={item.itemName}
                onChange={onValueChange}
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
            <div>
              <div className="mb-2 block">
                <Label
                  htmlFor="quantity"
                  value="Quantity"
                />
              </div>
              <div className="flex">
                <TextInput
                  id="quantity"
                  type="number"
                  placeholder="1"
                  required={true}
                  value={item.quantity}
                  onChange={onValueChange}
                /><Button className="ml-3 bg-slate-200 text-black">+</Button>
                <Button className="ml-3 bg-slate-200 text-black">-</Button>
              </div>
            </div>
            <div>
              <div className="mb-2 block">
                <Label
                  htmlFor="amount"
                  value="Amount"
                />
              </div>
              <TextInput
                id="amount"
                placeholder="1"
                required={true}
                value={item.amount.toLocaleString('us-US', { style: 'currency', currency: 'VND' })}
                readOnly={true}
              />
            </div>
            <div>
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
                value={item.service}
                readOnly={true}
              />
            </div>
            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="remember" checked={rememberUnitPrice} onChange={onRemberForLaterUseChange} />
                <Label htmlFor="remember">
                  Remember the unit price for later use
                </Label>
              </div>
            </div>
            <div className="w-full flex">
              <Button onClick={saveItem} className="mx-2">
                Save
              </Button>
              <Button onClick={deleteItem} className="mx-2">
                Delete
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}
