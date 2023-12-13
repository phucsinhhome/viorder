import React, { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { getReservation, updateReservation } from "../../db/reservation";
import { EditItem } from "./EditItem";
import { Table, TextInput, Label, Datepicker } from 'flowbite-react';
import { SelectUser } from "../User/SelectUser";
import { ExportReservation } from "./ExportReservation";
import { getPresignedLink } from "../../Service/FileService";

const getInvDownloadLink = (key, cbF) => {
  getPresignedLink('reservations', key, 300, cbF)
}

export const EditReservation = () => {
  const [reservation, setReservation] = useState(
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

  const [reservationUrl, setReservationUrl] = useState({ filename: "", presignedUrl: "", hidden: true })

  const { reservationId } = useParams()

  useEffect(() => {
    console.info("Editing reservation %s", reservationId)
    if (reservationId !== "new") {
      getReservation(reservationId)
        .then(data => {
          setReservation(data)
          
        })
    }

  }, [reservationId]);

  const handleDeleteItem = (item) => {
    console.info("Item %s is deleted", item.id)
    const nItems = reservation.items.filter((it) => it.id !== item.id)
    let ta = nItems.map(({ amount }) => amount).reduce((a1, a2) => a1 + a2, 0)
    const inv = {
      ...reservation,
      items: nItems,
      subTotal: ta
    }

    setReservation(inv)
  }


  const onDataChange = (e) => {
    const inv = {
      ...reservation,
      [e.target.id]: e.target.value
    }
    setReservation(inv)
  }

  const onCheckInDateChanged = (fieldName, value) => {
    const inv = {
      ...reservation,
      [fieldName]: new Date(new Date(value).getTime() + 24 * 60 * 60 * 1000).toISOString().substring(0, 10)
    }
    setReservation(inv)
  }


  const onIssuerChange = (member) => {
    console.log("Selected issuer: %s", member.id)
    const inv = {
      ...reservation,
      issuerId: member.id,
      issuer: member.name
    }

    setReservation(inv)
  }

  const handleSaveReservation = () => {
    console.info("Saving reservation")
    console.log(reservation)

    var inv = {
      ...reservation
    }

    if (reservation.id === "new") {
      var newId = String(Date.now())
      inv = {
        ...inv,
        id: newId
      }
      console.info("Generated reservation id %s", newId)
    }

    updateReservation(inv)
      .then((res) => {
        if (res.ok) {
          console.info("Reservation %s has been saved successfully", reservationId);
          setReservation(inv);
        } else {
          console.info("Failed to save reservation %s", reservationId);
        }
        console.info(res)
      })
  }

  const createOrUpdateItem = (item) => {
    let items = []
    if (item.id === null || item.id === "") {
      let newItemId = reservationId + (Date.now() % 10000000)
      console.log("Added an item into reservation. Id [%s] was generated", newItemId)
      items = [
        ...reservation.items,
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
      items = reservation.items.map((i) => i.id === item.id ? item : i)
    }

    let ta = items.map(({ amount }) => amount).reduce((a1, a2) => a1 + a2, 0)
    const inv = {
      ...reservation,
      items: items,
      subTotal: ta
    }
    setReservation(inv)
  }

  const reservationLink = useRef(null)

  useEffect(() => {
    reservationLink.current.click()
  }, [reservationUrl])

  const exportWithMethod = (method) => {
    console.log("Export reservation %s with method [%s]...", reservationId, method.name)

    const inv = {
      ...reservation,
      paymentMethod: method.id
    }

    exportReservation(inv)
      .then((res) => {
        if (res.ok) {
          console.info("Reservation %s has been exported successfully", reservationId);
          setReservation(inv);
          res.json().then((json) => {
            console.log(json)
            var withoutBucketPath = json.url.substring(json.url.indexOf('/'));
            console.info("Download reservation from url [%s]", withoutBucketPath);

            getInvDownloadLink(withoutBucketPath, (err, url) => {
              if (err) {
                return console.log(err)
              }
              var invObject = { filename: json.filename, presignedUrl: url }
              setReservationUrl(invObject)
            })
          });
        } else {
          console.info("Failed to export reservation %s", reservationId);
        }
        console.info(res)
      })
  }


  return (
    <div className="bg-slate-50">
      <div className="py-2 px-2 space-x-8">
        <Link onClick={handleSaveReservation} className="px-1 font-sans font-bold text-amber-800">
          Save
        </Link>
        <Link to=".." relative="path" className="px-1 font-sans font-bold text-amber-800">Back</Link>
      </div>
      <form className="flex flex-wrap mx-1">
        <div className="w-full md:w-1/2 px-1 mb-6">
          <div className="flex flex-wrap -mx-3 mb-6">
            <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
              <div className="mb-2 block">
                <Label
                  htmlFor="guestName"
                  value="Guest Name:"
                />
              </div>
              <TextInput
                id="guestName"
                placeholder="John Smith"
                required={true}
                value={reservation.guestName}
                onChange={onDataChange}
              />
            </div>
            <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
              <div className="mb-2 block">
                <Label
                  htmlFor="reservationCode"
                  value="Code:"
                />
              </div>
              <Label
                id="reservationCode"
                placeholder="12345"
                required={true}
                value={reservation.reservationCode}
                readOnly={true}
                className="outline-none"
              />
            </div>
          </div>
          <div className="flex flex-wrap -mx-3 mb-6">
            <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
              <div className="mb-2 block">
                <Label
                  htmlFor="checkInDate"
                  value="Check In:"
                />
              </div>
              <Datepicker value={reservation.checkInDate}
                onSelectedDateChanged={(date) => onCheckInDateChanged('checkInDate', date)}
                id="checkInDate"
                defaultChecked={true}
              />
            </div>
            <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
              <div className="mb-2 block">
                <Label
                  htmlFor="checkOutDate"
                  value="Check Out:"
                />
              </div>
              <Datepicker value={reservation.checkOutDate}
                onSelectedDateChanged={(date) => onCheckInDateChanged('checkOutDate', date)}
                id="checkOutDate"
                defaultChecked={true}
              />
            </div>
          </div>

          <div className="flex flex-wrap -mx-3 mb-2">
            <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
              <div className="mb-2 block">
                <Label
                  htmlFor="issuer"
                  value="Issuer:"
                />
              </div>
              <SelectUser initialUser={{ id: reservation.issuerId, name: reservation.issuer }}
                handleUserChange={onIssuerChange} />
            </div>

          </div>
          <div className="flex flex-wrap -mx-3 mb-2">
            <div className="w-full md:w-1/3 px-3 mb-6 md:mb-0">
              <div className="mb-2 block">
                <Label
                  htmlFor="totalAmount"
                  value="Total Amount:"
                />
              </div>
              <Label
                id="totalAmount"
                placeholder="100000"
                required={true}
                value={reservation.subTotal.toLocaleString('us-US', { style: 'currency', currency: 'VND' })}
                readOnly={true}
              />
            </div>
            <div className="w-full md:w-1/3 px-3 mb-6 md:mb-0">
              <div className="mb-2 block">
                <Label
                  htmlFor="prepaied"
                  value="Prepaid:"
                />
              </div>
              <Label
                id="prepaied"
                placeholder="false"
                required={true}
                value={String(reservation.prepaied).toUpperCase()}
                readOnly={true}
              />
            </div>
            <div className="w-full md:w-1/3 px-3 mb-6 md:mb-0">
              <div className="mb-2 block">
                <Label
                  htmlFor="paymentMethod"
                  value="Payment Method:"
                />
              </div>
              <Label
                id="paymentMethod"
                placeholder="Cash"
                required={true}
                value={String(reservation.paymentMethod).toUpperCase()}
                readOnly={true}
              />
            </div>
          </div>
        </div>
        {/** Second Column */}
        <div className="w-full md:w-1/2 px-1 mb-6">
          <div className="py-2 px-2 flex bg-green-300 space-x-8">
            <EditItem eItem={{
              "id": "",
              "itemName": "",
              "unitPrice": 0,
              "quantity": 0,
              "amount": 0
            }} onSave={createOrUpdateItem} onDelete={handleDeleteItem} displayName="Add Item" />
            <ExportReservation fncCallback={exportWithMethod} />
            <Link to={reservationUrl.presignedUrl} className="pl-5 font-thin text-sm" hidden={true} ref={reservationLink} >{reservationUrl.filename}</Link>
          </div>
          <Table hoverable={true} className="w-full">
            <Table.Head>
              <Table.HeadCell>Item Name</Table.HeadCell>
              <Table.HeadCell>Amount</Table.HeadCell>
              <Table.HeadCell>Service</Table.HeadCell>
              <Table.HeadCell>
                <span className="sr-only">
                  Edit
                </span>
              </Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {reservation.items.map((item) => {
                return (
                  <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800" key={item.id}>
                    <Table.Cell>
                      {item.itemName}
                    </Table.Cell>
                    <Table.Cell>
                      {item.amount.toLocaleString('us-US', { style: 'currency', currency: 'VND' })}
                    </Table.Cell>
                    <Table.Cell>
                      {item.service}
                    </Table.Cell>
                    <Table.Cell>
                      {<EditItem eItem={item} onSave={createOrUpdateItem} onDelete={handleDeleteItem} displayName="Edit" />}
                    </Table.Cell>
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table>


        </div>
      </form>
    </div >
  );
}
