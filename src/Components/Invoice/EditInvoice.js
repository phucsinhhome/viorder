import React, { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { exportInvoice, getInvoice, getPaymentMethods, updateInvoice } from "../../db/invoice";
import { defaultEmptyItem, EditItem } from "./EditItem";
import { Table, TextInput, Label, Datepicker, Modal, Button, Radio } from 'flowbite-react';
import { ExportInvoice } from "./ExportInvoice";
import { getPresignedLink } from "../../Service/FileService";
import { HiOutlineExclamationCircle, HiUserCircle } from "react-icons/hi";
import { getUsers } from "../../db/users";

const getInvDownloadLink = (key, cbF) => {
  getPresignedLink('invoices', key, 300, cbF)
}

export const EditInvoice = () => {
  const [invoice, setInvoice] = useState(
    {
      id: "new",
      guestName: "",
      issuer: "",
      issuerId: "",
      subTotal: 0,
      checkInDate: new Date(),
      checkOutDate: new Date(),
      prepaied: false,
      paymentMethod: "cash",
      reservationCode: "NO_LINKED_BOOKING",
      items: []
    }
  )

  const [invoiceUrl, setInvoiceUrl] = useState({ filename: "", presignedUrl: "", hidden: true })

  const { invoiceId } = useParams()
  const [openDelItemModal, setOpenDelItemModal] = useState(false)
  const [deletingItem, setDeletingItem] = useState(null)

  const [openUsersModal, setOpenUsersModal] = useState(false)
  const [selectedIssuer, setSelectedIssuer] = useState(null)
  const users = getUsers()

  const [openPaymentModal, setOpenPaymentModal] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null)
  const paymentMethods = getPaymentMethods()

  useEffect(() => {
    console.info("Editing invoice %s", invoiceId)
    if (invoiceId !== "new") {
      getInvoice(invoiceId)
        .then(data => {
          setInvoice(data)

        })
    }

  }, [invoiceId]);

  const onDataChange = (e) => {
    const inv = {
      ...invoice,
      [e.target.id]: e.target.value
    }
    setInvoice(inv)
  }

  const onCheckInDateChanged = (fieldName, value) => {
    const inv = {
      ...invoice,
      [fieldName]: new Date(new Date(value).getTime() + 24 * 60 * 60 * 1000).toISOString().substring(0, 10)
    }
    setInvoice(inv)
  }

  const handleSaveInvoice = () => {
    console.info("Saving invoice")
    console.log(invoice)

    var inv = {
      ...invoice
    }

    if (invoice.id === "new") {
      var newId = String(Date.now())
      inv = {
        ...inv,
        id: newId
      }
      console.info("Generated invoice id %s", newId)
    }

    updateInvoice(inv)
      .then((res) => {
        if (res.ok) {
          console.info("Invoice %s has been saved successfully", invoiceId);
          setInvoice(inv);
        } else {
          console.info("Failed to save invoice %s", invoiceId);
        }
        console.info(res)
      })
  }

  const createOrUpdateItem = (item) => {
    let items = []
    if (item.id === null || item.id === "") {
      let newItemId = invoiceId + (Date.now() % 10000000)
      console.log("Added an item into invoice. Id [%s] was generated", newItemId)
      items = [
        ...invoice.items,
        {
          id: newItemId,
          itemName: item.itemName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          amount: item.unitPrice * item.quantity
        }
      ]
    } else {
      console.log("Update item [%s] ", item.id)
      items = invoice.items.map((i) => i.id === item.id ? item : i)
    }

    let ta = items.map(({ amount }) => amount).reduce((a1, a2) => a1 + a2, 0)
    const inv = {
      ...invoice,
      items: items,
      subTotal: ta
    }
    setInvoice(inv)
  }

  const invoiceLink = useRef(null)

  useEffect(() => {
    invoiceLink.current.click()
  }, [invoiceUrl])

  const exportWithMethod = (method) => {
    console.log("Export invoice %s with method [%s]...", invoiceId, method.name)

    const inv = {
      ...invoice,
      paymentMethod: method.id
    }

    exportInvoice(inv)
      .then((res) => {
        if (res.ok) {
          console.info("Invoice %s has been exported successfully", invoiceId);
          setInvoice(inv);
          res.json().then((json) => {
            console.log(json)
            var withoutBucketPath = json.url.substring(json.url.indexOf('/'));
            console.info("Download invoice from url [%s]", withoutBucketPath);

            getInvDownloadLink(withoutBucketPath, (err, url) => {
              if (err) {
                return console.log(err)
              }
              var invObject = { filename: json.filename, presignedUrl: url }
              setInvoiceUrl(invObject)
            })
          });
        } else {
          console.info("Failed to export invoice %s", invoiceId);
        }
        console.info(res)
      })
  }

  //============ ITEM DELETION ====================//
  const askForDelItemConfirmation = (item) => {

    setDeletingItem(item);
    setOpenDelItemModal(true)
  }

  const cancelDelItem = () => {
    setOpenDelItemModal(false)
    setDeletingItem(null)
  }

  const confirmDelItem = () => {
    try {
      if (deletingItem === undefined || deletingItem === null) {
        return;
      }
      console.warn("Delete item {}...", deletingItem.id)

      let item = deletingItem
      console.info("Item %s is deleted", item.id)
      const nItems = invoice.items.filter((it) => it.id !== item.id)
      let ta = nItems.map(({ amount }) => amount).reduce((a1, a2) => a1 + a2, 0)
      let inv = {
        ...invoice,
        items: nItems,
        subTotal: ta
      }

      setInvoice(inv)
    } catch (e) {
      console.error(e)
    } finally {
      setOpenDelItemModal(false)
      setDeletingItem(null)
    }

  }

  //============ ISSUER CHANGE ====================//
  const selectIssuer = () => {
    setOpenUsersModal(true)
    setSelectedIssuer({ issuerId: invoice.issuerId, issuer: invoice.issuer })
  }
  const cancelSelectIssuer = () => {
    setOpenUsersModal(false)
    setSelectedIssuer(null)
  }
  const confirmSelectIssuer = () => {
    try {
      if (selectedIssuer === undefined || selectedIssuer === null || selectIssuer.issuerId === invoice.issuerId) {
        return;
      }
      console.warn("Change the issuer to {}...", selectedIssuer.issuerId)
      let nInv = {
        ...invoice,
        issuerId: selectedIssuer.issuerId,
        issuer: selectedIssuer.issuer
      }
      setInvoice(nInv)
    } catch (e) {
      console.error(e)
    } finally {
      setOpenUsersModal(false)
      setSelectedIssuer(null)
    }
  }
  const issuerChange = (e) => {
    let is = e.currentTarget
    console.info("Selected user", is.value)
    setSelectedIssuer({ issuerId: is.id, issuer: is.value })
  }

  //============ PAYMENT METHOD CHANGE ====================//
  const selectPaymentMethod = () => {
    let pM = paymentMethods.find((p) => p.id === invoice.paymentMethod)
    setSelectedPaymentMethod(pM)
    setOpenPaymentModal(true)
  }
  const cancelSelectPaymentMethod = () => {
    setOpenPaymentModal(false)
    setSelectedPaymentMethod(null)
  }
  const confirmSelectPaymentMethod = () => {
    try {
      if (selectedPaymentMethod === undefined || selectedPaymentMethod === null || selectedPaymentMethod.id === invoice.paymentMethod) {
        return;
      }
      console.warn("Change the payment method to {}...", selectedPaymentMethod.id)
      let nInv = {
        ...invoice,
        paymentMethod: selectedPaymentMethod.id
      }
      setInvoice(nInv)
    } catch (e) {
      console.error(e)
    } finally {
      setOpenPaymentModal(false)
      setSelectedPaymentMethod(null)
    }
  }
  const paymentMethodChange = (e) => {
    let is = e.currentTarget
    let pM = paymentMethods.find((p) => p.id === is.id)
    console.info("Selected payment method", is.value)
    setSelectedPaymentMethod(pM)
  }

  return (
    <div className="h-full">
      <div className="py-2 px-2 space-x-8">
        <Link onClick={handleSaveInvoice} className="px-1 font-sans font-bold text-amber-800">
          Save
        </Link>
        <Link to=".." relative="path" className="px-1 font-sans font-bold text-amber-800">Back</Link>
      </div>
      <form className="flex flex-wrap mx-1">
        <div className="w-full md:w-1/2 px-1 mb-1">
          <div className="flex flex-wrap -mx-3 mb-1">
            <div className="w-full md:w-1/2 px-3 mb-1 md:mb-0">
              <div className="flex justify-between w-full space-x-4 mb-1">
                <Label
                  htmlFor="guestName"
                  value="Guest:"
                />
                <Label
                  id="reservationCode"
                  placeholder="12345"
                  required={true}
                  value={invoice.reservationCode}
                  readOnly={true}
                  className="outline-none font-mono text-[10px] italic text-gray-400"
                />

                <div className="flex flex-row" onClick={selectIssuer}>
                  <HiUserCircle className="mx-1 h-5 w-5" />
                  <Label
                    id="issuerId"
                    placeholder="Min"
                    required={true}
                    value={invoice.issuer}
                    readOnly={false}
                    className="outline-none font-mono italic"
                  />
                </div>
              </div>
              <TextInput
                id="guestName"
                placeholder="John Smith"
                required={true}
                value={invoice.guestName}
                onChange={onDataChange}
              />
            </div>
          </div>
          <div className="flex flex-wrap -mx-3 mb-1">
            <div className="w-1/2 px-3 mb-1 md:mb-0">
              <div className="mb-1 block">
                <Label
                  htmlFor="checkInDate"
                  value="Check In:"
                />
              </div>
              <Datepicker value={invoice.checkInDate}
                onSelectedDateChanged={(date) => onCheckInDateChanged('checkInDate', date)}
                id="checkInDate"
                defaultChecked={true}
              />
            </div>
            <div className="w-1/2 px-3 mb-1 md:mb-0">
              <div className="mb-1 block">
                <Label
                  htmlFor="checkOutDate"
                  value="Check Out:"
                />
              </div>
              <Datepicker value={invoice.checkOutDate}
                onSelectedDateChanged={(date) => onCheckInDateChanged('checkOutDate', date)}
                id="checkOutDate"
                defaultChecked={true}
              />
            </div>
          </div>

          <div className="flex flex-wrap -mx-3 mb-1">
            <div className="w-full flex justify-between px-3 mb-1 md:mb-0">
              <Label
                id="paymentMethod"
                placeholder="Cash"
                required={true}
                value={String(invoice.paymentMethod).toUpperCase()}
                readOnly={true}
                onClick={selectPaymentMethod}
              />
              <Label
                id="totalAmount"
                placeholder="100000"
                required={true}
                value={invoice.subTotal.toLocaleString('us-US', { style: 'currency', currency: 'VND' })}
                readOnly={true}
                className="font-mono font-bold text-red-900"
              />
            </div>
          </div>
        </div>
      </form>
      {/** Second Column */}
      <div className="flex flex-row w-full md:w-1/2 px-1 mb-1 space-x-5 ml-2">
        <EditItem
          eItem={defaultEmptyItem}
          onSave={createOrUpdateItem}
          displayName="Add Item"
          className="font-sans font-bold text-amber-700 bg-gray-200 rounded-lg px-2 py-1"
        />
        <ExportInvoice fncCallback={exportWithMethod} />
        <Link to={invoiceUrl.presignedUrl} className="pl-5 font-thin text-sm" hidden={true} ref={invoiceLink} >{invoiceUrl.filename}</Link>
      </div>

      <div className="h-2/3 max-h-fit overflow-scroll">
        <Table hoverable>
          <Table.Head className="my-1">
            <Table.HeadCell className="sm:px-1 py-2">
              Item Name
            </Table.HeadCell>

            <Table.HeadCell className="py-2">
              <span className="sr-only">
                Delete
              </span>
            </Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y" >
            {invoice.items.map((exp) => {
              return (
                <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800 text-sm my-1 py-1" key={exp.id}>
                  <Table.Cell className="sm:px-1 py-1">
                    <div className="grid grid-cols-1 py-0 my-0">
                      <EditItem
                        eItem={exp}
                        onSave={createOrUpdateItem}
                        displayName={exp.itemName}
                        className="font text-sm text-blue-600 hover:underline dark:text-blue-500"
                      />
                      <div className="flex flex-row text-[10px] space-x-1">
                        <span className="w-6">{"x" + exp.quantity}</span>
                        <span className="w-24">{exp.amount.toLocaleString('us-US', { style: 'currency', currency: 'VND' })}</span>
                        <span className="font font-mono font-black">{exp.service}</span>
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell className="py-1">
                    <svg class="w-6 h-6 text-red-800 dark:text-white"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                      onClick={() => askForDelItemConfirmation(exp)}
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

      <Modal show={openDelItemModal} onClose={cancelDelItem}>
        <Modal.Header>Confirm</Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
            <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
              {deletingItem !== null && deletingItem !== undefined ? "Remove item" + deletingItem.itemName + " ?" : "No item selected"}
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer className="flex justify-center gap-4">
          <Button onClick={confirmDelItem}>Remove</Button>
          <Button color="gray" onClick={cancelDelItem}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={openUsersModal} onClose={cancelSelectIssuer}>
        <Modal.Header>Users</Modal.Header>
        <Modal.Body>
          <div className="justify-center">
            <fieldset className="flex max-w-md flex-col gap-4">
              <legend className="mb-4">Choose the issuer</legend>
              {
                users.map(user => {
                  return (
                    <div className="flex items-center gap-2">
                      <Radio
                        id={user.id}
                        name="users"
                        value={user.name}
                        defaultChecked={selectedIssuer === null ? false : user.id === selectedIssuer.issuerId}
                        onChange={issuerChange}
                      />
                      <Label htmlFor="united-state">{user.name}</Label>
                    </div>
                  )
                })
              }
            </fieldset>
          </div>
        </Modal.Body>
        <Modal.Footer className="flex justify-center gap-4">
          <Button onClick={confirmSelectIssuer}>OK</Button>
          <Button color="gray" onClick={cancelSelectIssuer}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={openPaymentModal} onClose={cancelSelectPaymentMethod}>
        <Modal.Header>Payment</Modal.Header>
        <Modal.Body>
          <div className="justify-center">
            <fieldset className="flex max-w-md flex-col gap-4">
              <legend className="mb-4">Choose payment method</legend>
              {
                paymentMethods.map(pM => {
                  return (
                    <div className="flex items-center gap-2">
                      <Radio
                        id={pM.id}
                        name="paymentMethods"
                        value={pM.name}
                        defaultChecked={selectedPaymentMethod === null ? false : pM.id === selectedPaymentMethod.id}
                        onChange={paymentMethodChange}
                      />
                      <Label htmlFor="united-state">{pM.name}</Label>
                    </div>
                  )
                })
              }
            </fieldset>
          </div>
        </Modal.Body>
        <Modal.Footer className="flex justify-center gap-4">
          <Button onClick={confirmSelectPaymentMethod}>OK</Button>
          <Button color="gray" onClick={cancelSelectPaymentMethod}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

    </div >
  );
}
