import React, { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { exportInvoice, getInvoice, listPaymentMethods as paymentMethods, updateInvoice } from "../../db/invoice";
import { defaultEmptyItem, formatMoneyAmount } from "./EditItem";
import { Table, TextInput, Label, Datepicker, Modal, Button } from 'flowbite-react';
import { getPresignedLink } from "../../Service/FileService";
import { HiOutlineCash } from "react-icons/hi";
import { classifyServiceByItemName } from "../../Service/ItemClassificationService";
import { dateToISODate, formatShortDate, formatVND } from "../../Service/Utils";
import { currentUser, currentUserFullname, initialUser } from "../../App";
import { getUsers as issuers } from "../../db/users";

const getInvDownloadLink = (key, cbF) => {
  getPresignedLink('invoices', key, 300, cbF)
}

export const EditInvoice = () => {
  const [invoice, setInvoice] = useState(
    {
      id: "new",
      guestName: "",
      issuer: currentUserFullname(),
      issuerId: currentUser.id,
      subTotal: 0,
      checkInDate: dateToISODate(new Date()),
      checkOutDate: dateToISODate(new Date()),
      prepaied: false,
      paymentMethod: null,
      reservationCode: null,
      items: []
    }
  )

  const [invoiceUrl, setInvoiceUrl] = useState({ filename: "", presignedUrl: "", hidden: true })
  const { invoiceId } = useParams()

  const [openGuestNameModal, setOpenGuestNameModal] = useState(false)
  const [editingGuestName, setEditingGuestName] = useState(null)

  const [openEditDateModal, setOpenEditDateModal] = useState(false)
  const [editingDate, setEditingDate] = useState({ dateField: null, value: new Date() })

  const [openDelItemModal, setOpenDelItemModal] = useState(false)
  const [deletingItem, setDeletingItem] = useState(null)

  const [openUsersModal, setOpenUsersModal] = useState(false)
  const [selectedIssuer, setSelectedIssuer] = useState(issuers[0])

  const [openPaymentModal, setOpenPaymentModal] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(paymentMethods[0])

  const [openEditingItemModal, setOpenEditingItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState(defaultEmptyItem)

  const [openViewInvModal, setOpenViewInvModal] = useState(false)

  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    console.info("Editing invoice %s", invoiceId)
    if (invoiceId !== "new") {
      getInvoice(invoiceId)
        .then(data => {
          if (data.paymentMethod !== null && data.paymentMethod !== undefined && data.paymentMethod !== "") {
            const pM = paymentMethods.find(m => m.id === data.paymentMethod)
            setSelectedPaymentMethod(pM)
          }
          if (data.issuerId !== null && data.issuerId !== undefined && data.issuerId !== "") {
            const issuer = issuers.find(usr => usr.id === data.issuerId)
            setSelectedIssuer(issuer)
          }
          setInvoice(data)
        })
    } else {
      setOpenGuestNameModal(true)
    }
  }, [invoiceId])


  const handleSaveInvoice = () => {
    console.info("Prepare to save invoice")
    if (invoice === null) {
      return
    }
    if (invoice.guestName === null || invoice.guestName === undefined || invoice.guestName === "") {
      editGuestName()
      return
    }

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
          setDirty(false)
        } else {
          console.info("Failed to save invoice %s", invoiceId);
        }
        console.info(res)
      })
  }

  const createOrUpdateItem = () => {
    try {
      let item = {
        id: editingItem.id,
        itemName: editingItem.itemName,
        service: editingItem.service,
        unitPrice: editingItem.unitPrice,
        quantity: editingItem.quantity,
        amount: editingItem.amount
      }
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
    } catch (e) {
      console.error(e)
    }
    finally {
      setOpenEditingItemModal(false)
    }
  }

  const invoiceLink = useRef(null)

  useEffect(() => {
    invoiceLink.current.click()
  }, [invoiceUrl])

  const exportable = (initialUser === null || initialUser) === undefined ? true : false


  const exportInv = () => {
    console.log("Export invoice %s with method [%s]...", invoiceId)

    const inv = {
      ...invoice
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
      setDirty(true)
      setOpenDelItemModal(false)
      setDeletingItem(null)
    }

  }
  //============ GUEST NAME ====================//
  const editGuestName = () => {
    setEditingGuestName(invoice.guestName)
    setOpenGuestNameModal(true)
  }

  const changeGuestName = (e) => {
    let nGN = e.target.value
    setEditingGuestName(nGN)
    setOpenGuestNameModal(true)
  }

  const cancelEditGuestName = () => {
    setEditingGuestName("")
    setOpenGuestNameModal(false)
  }

  const confirmEditGuestName = () => {
    let nInv = {
      ...invoice,
      guestName: editingGuestName
    }
    setInvoice(nInv)
    setOpenGuestNameModal(false)
    setDirty(true)
  }
  //============ CHECK IN-OUT ====================//
  const editDate = (e) => {
    let dId = e.target.id
    setEditingDate({ dateField: dId, value: invoice[dId] })
    setOpenEditDateModal(true)
  }

  const changeEditingDate = (date) => {
    const nInv = {
      ...invoice,
      [editingDate.dateField]: dateToISODate(date)
    }
    setInvoice(nInv)
    setEditingDate({ dateField: null, value: new Date() })
    setOpenEditDateModal(false)
    setDirty(true)
  }


  const cancelEditDate = () => {
    setEditingDate({ dateField: null, value: new Date() })
    setOpenEditDateModal(false)
  }

  //============ ISSUER CHANGE ====================//
  const selectIssuer = () => {
    setOpenUsersModal(true)
  }
  const cancelSelectIssuer = () => {
    setOpenUsersModal(false)
  }
  const changeIssuer = (user) => {
    try {
      console.warn("Change the issuer to {}...", user.id)
      setSelectedIssuer(user)
      let nInv = {
        ...invoice,
        issuerId: user.issuerId,
        issuer: user.issuer
      }
      setInvoice(nInv)
    } catch (e) {
      console.error(e)
    } finally {
      setOpenUsersModal(false)
      setDirty(true)
    }
  }

  //============ PAYMENT METHOD CHANGE ====================//
  const selectPaymentMethod = () => {
    setOpenPaymentModal(true)
  }
  const cancelSelectPaymentMethod = () => {
    setOpenPaymentModal(false)
  }

  const changePaymentMethod = (e) => {

    try {
      let is = e.currentTarget
      let pM = paymentMethods.find((p) => p.id === is.id)
      setSelectedPaymentMethod(pM)
      let issuer = issuers.find(iss => iss.id === pM.defaultIssuerId)
      setSelectedIssuer(issuer)

      let nInv = {
        ...invoice,
        paymentMethod: pM.id,
        issuerId: issuer.id,
        issuer: issuer.name
      }
      setInvoice(nInv)
    } catch (e) {
      console.error(e)
    } finally {
      setOpenPaymentModal(false)
      setDirty(true)
    }
  }

  //================= EDIT ITEM ===================//
  const editItem = (item) => {
    let uP = formatMoneyAmount(String(item.unitPrice))
    let eI = {
      ...item,
      formattedUnitPrice: uP.formattedAmount
    }
    setEditingItem(eI)
    setOpenEditingItemModal(true)
  }

  const cancelEditingItem = () => {
    setEditingItem(defaultEmptyItem)
    setOpenEditingItemModal(false)
  }

  //================= ITEM NAME ===================//
  const changeItemName = (e) => {
    let iName = e.target.value
    let eI = {
      ...editingItem,
      itemName: iName
    }
    setEditingItem(eI)
    setDirty(true)
  }

  const blurItemName = () => {
    let nItemName = editingItem.itemName
    if (nItemName === null || nItemName === undefined || nItemName === "") {
      return;
    }
    console.log("Classify the service by service name %s", nItemName)
    classifyServiceByItemName(nItemName)
      .then((srv) => {
        var nexItem = {
          ...editingItem,
          service: srv
        }
        setEditingItem(nexItem)
        setDirty(true)
      })
  }

  //================= UNIT PRICE ===================//
  const changeUnitPrice = (e) => {
    let v = e.target.value
    let uP = formatMoneyAmount(v)
    let eI = {
      ...editingItem,
      amount: uP.amount * editingItem.quantity,
      unitPrice: uP.amount,
      formattedUnitPrice: uP.formattedAmount
    }
    setEditingItem(eI)
    setDirty(true)
  }

  //================= QUANTITY ===================//
  const changeQuantity = (delta) => {
    let nQ = editingItem.quantity + delta
    let eI = {
      ...editingItem,
      quantity: nQ,
      amount: editingItem.unitPrice * nQ
    }
    setEditingItem(eI)
    setDirty(true)
  }

  //================= VIEW INVOICE ===================//
  const showViewInv = () => {
    if (dirty) {
      handleSaveInvoice()
    }
    setOpenViewInvModal(true)
  }
  const closeViewInv = () => {
    setOpenViewInvModal(false)
  }

  return (
    <>
      <div className="h-full pt-3">
        <form className="flex flex-wrap mx-1">
          <div className="w-full md:w-1/2 px-1 mb-1">
            <div className="flex flex-wrap -mx-3 mb-1">
              <div className="w-full md:w-1/2 px-3 mb-1 md:mb-0">
                <div className="flex justify-between w-full space-x-4 mb-1">
                  <Label
                    id="reservationCode"
                    value={"Code: " + (invoice.reservationCode === null ? "" : invoice.reservationCode)}
                    className="outline-none font-mono text-[10px] italic text-gray-700"
                  />
                </div>
                <div className="flex flex-row w-full items-center">
                  <div className="flex flex-row items-center w-2/3">
                    <Label
                      id="guestName"
                      required={true}
                      value={invoice.guestName.toUpperCase()}
                      className="text-lg pr-2 font font-bold font-sans"
                    />
                    <svg
                      className="w-[16px] h-[16px] text-gray-800 dark:text-white"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                      onClick={editGuestName}
                    >
                      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" strokeWidth="2" d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4.5m2.409-9.91a2.017 2.017 0 0 1 0 2.853l-6.844 6.844L8 14l.713-3.565 6.844-6.844a2.015 2.015 0 0 1 2.852 0Z" />
                    </svg>
                  </div>
                  <div className="flex flex-row w-1/3 justify-end" >
                    {selectedIssuer.imgSrc}
                    <Label
                      id="issuerId"
                      placeholder="Min"
                      required={true}
                      value={invoice.issuer}
                      readOnly={false}
                      className="outline-none font-mono italic pr-2"
                    />
                    <svg
                      className="w-[16px] h-[16px] text-gray-800 dark:text-white"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                      onClick={selectIssuer}
                    >
                      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" strokeWidth="2" d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4.5m2.409-9.91a2.017 2.017 0 0 1 0 2.853l-6.844 6.844L8 14l.713-3.565 6.844-6.844a2.015 2.015 0 0 1 2.852 0Z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap -mx-3 mb-1">
              <div className="w-1/2 px-3 mb-1 md:mb-0 flex flex-row items-center">
                <Label
                  value={String(invoice.checkInDate)}
                  className="pr-2"
                />
                <svg
                  className="w-[16px] h-[16px] text-gray-800 dark:text-white"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                  id="checkInDate"
                  onClick={editDate}
                >
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" strokeWidth="2" d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4.5m2.409-9.91a2.017 2.017 0 0 1 0 2.853l-6.844 6.844L8 14l.713-3.565 6.844-6.844a2.015 2.015 0 0 1 2.852 0Z" />
                </svg>
              </div>
              <div className="w-1/2 px-3 mb-1 md:mb-0 flex flex-row items-center">
                <Label
                  value={String(invoice.checkOutDate)}
                  className="pr-2"
                />
                <svg
                  className="w-[16px] h-[16px] text-gray-800 dark:text-white"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                  id="checkOutDate"
                  onClick={editDate}
                >
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" strokeWidth="2" d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4.5m2.409-9.91a2.017 2.017 0 0 1 0 2.853l-6.844 6.844L8 14l.713-3.565 6.844-6.844a2.015 2.015 0 0 1 2.852 0Z" />
                </svg>
              </div>
            </div>

            <div className="flex flex-wrap -mx-3 mb-3">
              <div className="w-1/2 px-3 flex flex-row items-center">
                <div>{selectedPaymentMethod.src}</div>
                <Label
                  id="paymentMethod"
                  value={selectedPaymentMethod.name}
                  className="pr-2"
                />
                <svg
                  className="w-[16px] h-[16px] text-gray-800 dark:text-white"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                  id="checkOutDate"
                  onClick={selectPaymentMethod}
                >
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" strokeWidth="2" d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4.5m2.409-9.91a2.017 2.017 0 0 1 0 2.853l-6.844 6.844L8 14l.713-3.565 6.844-6.844a2.015 2.015 0 0 1 2.852 0Z" />
                </svg>
              </div>
              <div className="w-1/2 px-3 flex flex-row items-center">
                <Label
                  id="totalAmount"
                  placeholder="100000"
                  required={true}
                  value={formatVND(invoice.subTotal)}
                  readOnly={true}
                  className="font-mono font-bold text-red-900"
                />
              </div>
            </div>
          </div>
        </form>
        {/** Second Column */}
        <div className="flex flex-row items-center w-full md:w-1/2 px-1 mb-1 space-x-5 ml-2">
          <div
            className="flex flex-row items-center font-sans font-bold text-amber-800 px-2 py-1 w-1/4 hover:bg-slate-200"
            onClick={() => editItem(defaultEmptyItem)}
          >
            <svg
              className="w-5 h-5 text-amber-800 dark:text-white"
              aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" strokeWidth="2" d="M5 12h14m-7 7V5" />
            </svg>
            <span>Item</span>
          </div>
          <div
            className="flex flex-row items-center font-sans font-bold text-amber-800 px-2 py-1 w-1/4 hover:bg-slate-200"
            onClick={showViewInv}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-[18px] h-[18px] dark:text-white"
            >
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              <path fill-rule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z" clipRule="evenodd" />
            </svg>
            <span>View</span>
          </div>
          {
            exportable ? <div
              className="flex flex-row items-center font-sans font-bold text-amber-700 px-2 py-1"
              onClick={exportInv}
            >
              <svg
                className="w-[18px] h-[18px] text-amber-700 dark:text-white"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path fill-rule="evenodd" d="M9 7V2.221a2 2 0 0 0-.5.365L4.586 6.5a2 2 0 0 0-.365.5H9Zm2 0V2h7a2 2 0 0 1 2 2v9.293l-2-2a1 1 0 0 0-1.414 1.414l.293.293h-6.586a1 1 0 1 0 0 2h6.586l-.293.293A1 1 0 0 0 18 16.707l2-2V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9h5a2 2 0 0 0 2-2Z" clipRule="evenodd" />
              </svg>
              <span>Export</span>
            </div> : null
          }
          <div
            className="flex flex-row items-center text-amber-800 px-2 py-1 w-1/4 hover:bg-slate-200"
            onClick={handleSaveInvoice}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5  dark:text-white"
            >
              <path d="M12 1.5a.75.75 0 0 1 .75.75V7.5h-1.5V2.25A.75.75 0 0 1 12 1.5ZM11.25 7.5v5.69l-1.72-1.72a.75.75 0 0 0-1.06 1.06l3 3a.75.75 0 0 0 1.06 0l3-3a.75.75 0 1 0-1.06-1.06l-1.72 1.72V7.5h3.75a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3h3.75Z" />
            </svg>
            <span className="font-sans font-bold">
              Save
            </span>
          </div>
          <div className="flex flex-row items-center  px-2 py-1 w-1/4 hover:bg-slate-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 text-amber-800 dark:text-white"
            >
              <path fill-rule="evenodd" d="M16.5 3.75a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5h-6a1.5 1.5 0 0 1-1.5-1.5V15a.75.75 0 0 0-1.5 0v3.75a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V5.25a3 3 0 0 0-3-3h-6a3 3 0 0 0-3 3V9A.75.75 0 1 0 9 9V5.25a1.5 1.5 0 0 1 1.5-1.5h6ZM5.78 8.47a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 0 0 0 1.06l3 3a.75.75 0 0 0 1.06-1.06l-1.72-1.72H15a.75.75 0 0 0 0-1.5H4.06l1.72-1.72a.75.75 0 0 0 0-1.06Z" clipRule="evenodd" />
            </svg>
            <Link to=".." relative="path" className="px-1 font-sans font-bold text-amber-800">Back</Link>
          </div>
          <Link
            to={invoiceUrl.presignedUrl}
            className="pl-5 font-thin text-sm"
            hidden={true}
            ref={invoiceLink}
          >
            {invoiceUrl.filename}
          </Link>
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
                        <div
                          className="font text-sm text-blue-600 hover:underline dark:text-blue-500"
                          onClick={() => editItem(exp)}
                        >
                          {exp.itemName}
                        </div>
                        <div className="flex flex-row text-[10px] space-x-1">
                          <span className="w-6">{"x" + exp.quantity}</span>
                          <span className="w-24">{formatVND(exp.amount)}</span>
                          <span className="font font-mono font-black">{exp.service}</span>
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell className="py-1">
                      <svg className="w-6 h-6 text-red-800 dark:text-white"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        fill="none"
                        viewBox="0 0 24 24"
                        onClick={() => askForDelItemConfirmation(exp)}
                      >
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" strokeWidth="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z" />
                      </svg>

                    </Table.Cell>
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table>
        </div>

        <Modal show={openGuestNameModal} onClose={cancelEditGuestName}>
          <Modal.Header>Guest name</Modal.Header>
          <Modal.Body>
            <div className="text-center">
              <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                <TextInput
                  value={editingGuestName}
                  onChange={changeGuestName}
                />
              </p>
            </div>
          </Modal.Body>
          <Modal.Footer className="flex justify-center gap-4">
            <Button onClick={confirmEditGuestName}>Done</Button>
            <Button color="gray" onClick={cancelEditGuestName}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal
          show={openEditDateModal}
          onClose={cancelEditDate}
          popup
        >
          <Modal.Header />
          <Modal.Body>
            <div className="text-center">
              <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                <Datepicker
                  onSelectedDateChanged={(date) => changeEditingDate(date)}
                  id="checkInDate"
                  defaultChecked={true}
                  inline
                />
              </p>
            </div>
          </Modal.Body>
          <Modal.Footer className="flex justify-center gap-4">
          </Modal.Footer>
        </Modal>

        <Modal show={openDelItemModal} onClose={cancelDelItem}>
          <Modal.Body>
            <div>
              <span>{deletingItem === null || deletingItem === undefined ? "" : "Are you sure to remove [" + deletingItem.itemName + "]?"}</span>
            </div>
          </Modal.Body>
          <Modal.Footer className="flex justify-center gap-4">
            <Button onClick={confirmDelItem}>Remove</Button>
            <Button color="gray" onClick={cancelDelItem}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal
          show={openUsersModal}
          onClose={cancelSelectIssuer}
          popup
          dismissible
        >
          <Modal.Header></Modal.Header>
          <Modal.Body>
            <div className="flex flex-row items-center gap-2 space-x-2 w-full ">
              {
                issuers.map(user => {
                  return (
                    <div
                      id={user.id}
                      className="flex flex-col border-spacing-1 shadow-sm hover:shadow-lg rounded-lg items-center "
                      onClick={() => changeIssuer(user)}
                    >
                      {user.imgSrc}
                      <span className="text text-center">{user.name}</span>
                    </div>
                  )
                })
              }
            </div>
          </Modal.Body>
          <Modal.Footer className="flex justify-center gap-4">
            <Button color="gray" onClick={cancelSelectIssuer}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={openPaymentModal} onClose={cancelSelectPaymentMethod}>
          <Modal.Header>Payment</Modal.Header>
          <Modal.Body>
            <div className="flex flex-row items-center w-full space-x-2">
              {
                paymentMethods.map(pM => {
                  return (
                    <div
                      className="block w-1/5"
                    >
                      <img
                        src={pM.srcLargeImg}
                        alt=""
                        id={pM.id}
                        onClick={changePaymentMethod}
                      />
                    </div>
                  )
                })
              }
            </div>
          </Modal.Body>
          <Modal.Footer className="flex justify-center gap-4">
            <Button color="gray" onClick={cancelSelectPaymentMethod}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal
          show={openEditingItemModal}
          size="md"
          popup={true}
          onClose={cancelEditingItem}
        >
          <Modal.Header />
          <Modal.Body>
            <div className="space-y-6 px-6 pb-4 sm:pb-6 lg:px-8 xl:pb-8">
              <div>
                <TextInput
                  id="itemName"
                  placeholder="Item name"
                  required={true}
                  value={editingItem.itemName}
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
                  value={editingItem.formattedUnitPrice}
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
                <div className="relative flex items-center w-full">
                  <button
                    type="button"
                    id="decrement-button"
                    data-input-counter-decrement="quantity-input"
                    className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-s-lg p-3 h-11 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
                    onClick={() => changeQuantity(-1)}
                  >
                    <svg className="w-3 h-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 2">
                      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" strokeWidth="2" d="M1 1h16" />
                    </svg>
                  </button>
                  <input
                    type="number"
                    id="quantity-input"
                    data-input-counter aria-describedby="helper-text-explanation"
                    className="bg-gray-50 border-x-0 border-gray-300 h-11 text-center text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="999"
                    required
                    value={editingItem.quantity}
                    readOnly
                  />
                  <button
                    type="button"
                    id="increment-button"
                    data-input-counter-increment="quantity-input"
                    className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-e-lg p-3 h-11 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
                    onClick={() => changeQuantity(1)}
                  >
                    <svg className="w-3 h-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" strokeWidth="2" d="M9 1v16M1 9h16" />
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
                <span className="w-full">{formatVND(editingItem.amount)}</span>

              </div>
              <div className="flex flex-row w-full align-middle">
                <div className="flex items-center w-2/5">
                  <Label
                    htmlFor="service"
                    value="Service"
                  />
                </div>
                <span className="w-full">{editingItem.service}</span>
              </div>
              <div className="w-full flex justify-center">
                <Button onClick={createOrUpdateItem} className="mx-2">
                  Save
                </Button>
                <Button onClick={cancelEditingItem} className="mx-2">
                  Cancel
                </Button>
              </div>
            </div>
          </Modal.Body>
        </Modal>



      </div >

      <Modal
        show={openViewInvModal}
        popup
        onClose={closeViewInv}
      >
        <Modal.Header />
        <Modal.Body>
          <div className="space-y-6 px-0 pb-4 sm:pb-6 lg:px-8 xl:pb-8">
            <div className="flex flex-row pt-2">
              <div className="block w-1/5">
                <img src="/ps_logo_96.jpg" className="w-25 border border-1 rounded-2xl" alt=""></img>
              </div>
              <div className="flex flex-col w-4/5 ">
                <span className="text-right font-serif font-bold text-amber-800 capitalize">phuc sinh home</span>
                <span className="text-right font-mono text-[9px] font italic text-gray-500">Phuoc Xuan Hamlet, An Khanh Commune, Chau Thanh, Ben Tre</span>
                <span className="text-right font-mono text-[9px] font text-gray-800">+84 328 944 788</span>
              </div>
            </div>
            <div className="flex flex-row w-full">
              <div className="flex flex-col w-3/5">
                <span className="font uppercase font-serif text-sm font-bold">{invoice.guestName}</span>
                <span className="font text-gray-400 text-[8px]">{"No: " + (invoice.reservationCode === null ? "" : invoice.reservationCode)}</span>
              </div>
              <div className="flex w-2/5">
                <span className="text-right text-[12px] from-neutral-400 w-full">{formatShortDate(new Date(invoice.checkOutDate))}</span>
              </div>
            </div>
            <div className="w-full">
              <Table hoverable>
                <Table.Head className="my-1">
                  <Table.HeadCell className="py-2 pl-0">
                    Item Name
                  </Table.HeadCell>
                  <Table.HeadCell className="py-2 text-right px-1">
                    Amount
                  </Table.HeadCell>
                </Table.Head>
                <Table.Body className="divide-y" >
                  {invoice.items.map((exp) => {
                    return (
                      <Table.Row
                        className="bg-white dark:border-gray-700 dark:bg-gray-800 text-sm my-1 py-0 w-full"
                        key={exp.id}
                      >
                        <Table.Cell className="py-0 pl-0 pr-1">
                          <div className="grid grid-cols-1 py-0 my-0">
                            <div
                              className="font text-sm text-blue-600 font-sans font-semibold hover:underline dark:text-blue-500"
                            >
                              {exp.itemName}
                            </div>
                            <div className="flex flex-row text-[9px] space-x-1">
                              <span className="w-6">{"x" + exp.quantity}</span>
                              <span className="w-24">{formatVND(exp.unitPrice)}</span>
                            </div>
                          </div>
                        </Table.Cell>
                        <Table.Cell className="flex py-0 px-1">
                          <span className="text-right w-full">{formatVND(exp.amount)}</span>
                        </Table.Cell>
                      </Table.Row>
                    )
                  })}
                  <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800 text-sm my-1 py-0">
                    <Table.Cell className="py-0 text-center">
                      SUBTOTAL
                    </Table.Cell>
                    <Table.Cell className="flex py-0 px-1">
                      <span className="w-full text-right">{formatVND(invoice.subTotal)}</span>
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800 text-sm my-1 py-0">
                    <Table.Cell className="py-0 text-center">
                      {"FEE (" + selectedPaymentMethod.feeRate * 100 + "%)"}
                    </Table.Cell>
                    <Table.Cell className="flex py-0 px-1">
                      <span className="w-full text-right">{formatVND(invoice.subTotal * selectedPaymentMethod.feeRate)}</span>
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800 text-sm my-1 py-0">
                    <Table.Cell className="py-0 text-center">
                      GRAND TOTAL
                    </Table.Cell>
                    <Table.Cell className="flex py-0 px-1">
                      <span className="w-full text-right text-red-800 font-bold">{formatVND(invoice.subTotal + invoice.subTotal * selectedPaymentMethod.feeRate)}</span>
                    </Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table>
            </div>
            <div className="flex flex-col justify-items-center w-full">
              <span className="text-center">Payment Info</span>
              <div className="flex justify-center w-full">
                <img
                  src={selectedPaymentMethod.paymentInfo}
                  alt=""
                  className="border rounded-lg w-4/5 max-w-fit"
                />
              </div>
              <span className="text-center font italic font-serif">Thank you so much !</span>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}
