import React, { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { getReservation } from "../../db/reservation";
import { Table, TextInput, Label } from 'flowbite-react';

export const EditReservation = () => {
  const [reservation, setReservation] = useState(
    {
      "code": "new",
      "guestName": "",
      "country": "",
      "channel": "",
      "numOfGuest": 0,
      canceled: false,
      checkInDate: "",
      checkOutDate: "",
      rooms: [],
      guestIds: [],
      guestPhotos: []
    }
  )

  const [reservationUrl] = useState({ filename: "", presignedUrl: "", hidden: true })

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

  const onDataChange = (e) => {
    const inv = {
      ...reservation,
      [e.target.id]: e.target.value
    }
    setReservation(inv)
  }

  const reservationLink = useRef(null)

  useEffect(() => {
    reservationLink.current.click()
  }, [reservationUrl])

  return (
    <div className="bg-slate-50">
      <div className="py-2 px-2 space-x-8">
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
                readOnly={true}
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
                value={reservation.code}
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
              <TextInput
                id="checkInDate"
                placeholder="YYYY-MM-DD"
                required={false}
                value={reservation.checkInDate}
                readOnly={true}
              />
            </div>
            <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
              <div className="mb-2 block">
                <Label
                  htmlFor="checkOutDate"
                  value="Check Out:"
                />
              </div>
              <TextInput
                id="checkOutDate"
                placeholder="YYYY-MM-DD"
                required={false}
                value={reservation.checkOutDate}
                readOnly={true}
              />
            </div>
          </div>

          <div className="flex flex-wrap -mx-3 mb-2">
            <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
              <div className="mb-2 block">
                <Label
                  htmlFor="channel"
                  value="Channel:"
                />
              </div>
              <TextInput
                id="channel"
                placeholder="Booking"
                required={false}
                value={reservation.channel}
                readOnly={true}
              />
            </div>

            <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
              <div className="mb-2 block">
                <Label
                  htmlFor="canceled"
                  value="Status:"
                />
              </div>
              <TextInput
                id="canceled"
                placeholder=""
                required={false}
                value={reservation.canceled === true ? "CANCELED" : "OK"}
                readOnly={true}
              />
            </div>
          </div>
        </div>
        {/** Second Column */}
        <div className="w-full md:w-1/2 px-1 mb-6">
          <div className="py-2 px-2 flex bg-green-300 space-x-8">
            <Link to={reservationUrl.presignedUrl} className="pl-5 font-thin text-sm" hidden={true} ref={reservationLink} >{reservationUrl.filename}</Link>
          </div>
          <Table hoverable={true} className="w-full">
            <Table.Head>
              <Table.HeadCell>Name</Table.HeadCell>
              <Table.HeadCell>Amount</Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {reservation.rooms.map((room) => {
                return (
                  <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800" key={room.id}>
                    <Table.Cell>
                      {room.internalRoomName}
                    </Table.Cell>
                    <Table.Cell>
                      {room.totalPrice.toLocaleString('us-US', { style: 'currency', currency: 'VND' })}
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
