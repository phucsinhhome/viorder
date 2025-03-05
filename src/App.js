import { useEffect, useState } from "react";
import "./App.css";
import { Menu } from "./Components/Menu"
import { BrowserRouter as Router, Link, Route, Routes, Navigate, useParams } from "react-router-dom"
import { Button, Label, Modal, TextInput } from "flowbite-react";
import { formatHourMinute, formatISODate, formatISODateTime, toMinutes } from "./Service/Utils";
import { commitOrder, resolveInvoiceId } from "./db/order";
import { listStayingAndComingInvoices } from "./db/invoice";


export const DEFAULT_PAGE_SIZE = process.env.REACT_APP_DEFAULT_PAGE_SIZE

// export const currentUserFullname = () => {
//   let sufix = currentUser.last_name === null || currentUser.last_name === undefined || currentUser.last_name === "" ? "" : (" " + currentUser.last_name)
//   return currentUser.first_name + sufix
// }

export const OrderStatus = {
  sent: 'SENT'
}

const timeSlotConfig = [
  {
    name: 'Lunch',
    start: '10:00',
    end: '14:30'
  },
  {
    name: 'Dinner',
    start: '18:00',
    end: '20:30'
  }
]

export default function App() {

  const [orders, setOrders] = useState([])

  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [invoices, setInvoices] = useState([])
  const [selectedInvoice, setSelectedInvoice] = useState({})

  const [orderSubmitResult, setOrderSubmitResult] = useState({})
  const [guestName, setGuestName] = useState('')

  const [timeSlots, setTimeSlots] = useState()
  const [choosenTimeSlot, setChoosenTimeSlot] = useState('')
  const [readyTime, setReadyTime] = useState()

  const [showOrderSummary, setShowOrderSummary] = useState(false)

  const [activeGroup, setActiveGroup] = useState('food')
  const [resolverId, setResolverId] = useState('r1')

  // const updateResolver = (rId) => {
  //   console.info("Update the resolver id to %s", rId)
  //   // setResolverId(rId)
  // }
  const menus = [{ name: 'food', displayName: 'Food' },
  { name: 'baverage', displayName: 'Beverage' },
  { name: 'breakfast', displayName: 'Breakfast' },
  { name: 'other', displayName: 'Other' }]



  useEffect(() => {
    document.title = "PSO"
    // tele.ready();
    // tele.expand();
    // tele.disableVerticalSwipes();
    // console.info("TELEGRAM BOT API VERSION: %s", tele.version)

  }, []);

  useEffect(() => {

    if (showOrderSummary === true) {
      var orderTime = formatHourMinute(new Date())

      var slots = timeSlotConfig.map(ts => ({
        name: ts.name,
        slots: generateLunchTimeslots(orderTime, ts.start, ts.end)
      }))
      var hasSlot = slots.find(ts => ts.slots.length > 0)
      setTimeSlots({ hasSlot: hasSlot !== undefined, slots: slots })
      calculateReadyTime()
    }

    // eslint-disable-next-line
  }, [showOrderSummary]);

  useEffect(() => {

    if (orders?.prepareTime) {
      calculateReadyTime()
    }

    // eslint-disable-next-line
  }, [choosenTimeSlot]);

  const resolveMenuStyle = (menu) => {
    var st = "px-2 py-1 text-center text-amber-900 text-sm font-sans rounded-sm shadow-sm"
    if (menu === activeGroup) {
      st = st + ' bg-gray-400'
    } else {
      st = st + ' bg-gray-200'
    }
    return st
  }

  const cancelOrder = () => {
    setShowInvoiceModal(false)
  }

  const submitOrder = () => {

    if (selectedInvoice === null) {
      return
    }
    orders.forEach(order => submitOneOrder(order));
  }

  const submitOneOrder = (order) => {
    try {
      var cOrder = {
        ...order,
        invoiceId: selectedInvoice.id,
        status: OrderStatus.sent,
        guestName: guestName,
        expectedTime: formatISODateTime(readyTime)
      }
      commitOrder(cOrder)
        .then(rsp => {
          if (rsp.ok) {
            rsp.json()
              .then((data) => {
                indexOrder(data)
                console.info("Submit order %s successfully", cOrder.orderId)
                var successMsg = processMessageAnnotation(process.env.REACT_APP_ORDER_SUCCESS_MESSAGE)
                setOrderSubmitResult({
                  success: true,
                  message: successMsg
                })
              })
          } else {
            console.info("Failed to submit order %s", cOrder.orderId)
            var failedMsg = processMessageAnnotation(process.env.REACT_APP_ORDER_FAILED_MESSAGE)
            setOrderSubmitResult({
              success: false,
              message: failedMsg
            })
          }
        })
    } catch (e) {
      console.error(e)
    } finally {
      setShowInvoiceModal(false)
    }
  }

  const processMessageAnnotation = (template) => {
    return template.replace('GUEST_NAME', guestName)
  }

  const changeGuestName = (e) => {
    var gN = e.target.value
    setSelectedInvoice({})
    setGuestName(gN)
  }
  const handleInvSelection = (inv) => {
    setSelectedInvoice(inv)
    setGuestName(inv.guestName)
  }

  const comfirmOrderInvoice = () => {

    let rI = resolverId

    if (rI !== null && rI !== undefined) {
      resolveInvoiceId(rI)
        .then(rsp => {
          if (rsp.ok) {
            rsp.json()
              .then(data => {
                if (data !== null && data !== undefined && data !== '') {
                  console.info("Resolved invoice id %s", data.id)
                  setInvoices([data])
                  handleInvSelection(data)
                  setShowOrderSummary(true)
                } else {
                  console.info("No invoice resolved")
                  chooseInvoice()
                }
              }).catch(e => {
                console.info("Failed to resolve invoice")
                chooseInvoice()
              })
          }
        })
    }

  }

  const chooseInvoice = () => {
    let fromDate = formatISODate(new Date())
    listStayingAndComingInvoices(fromDate, 0, 7)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then(data => {
              console.info('Fetch invoices successfully')
              setInvoices(data.content)
              setShowInvoiceModal(true)
              setSelectedInvoice({})
            })
        }
      })
  }

  const changeTimeslot = (timeslot) => {
    if (choosenTimeSlot === timeslot) {
      setChoosenTimeSlot('')
      return
    }
    setChoosenTimeSlot(timeslot)
  }

  const closeOrderSummary = () => {
    setShowOrderSummary(false);
    if (orderSubmitResult.success === true) {
      setOrders({});
    }
    setOrderSubmitResult({})
  }

  const calculateReadyTime = () => {
    let readyTime = new Date()
    if (choosenTimeSlot) {
      const [hours, minutes] = choosenTimeSlot.split(":").map(Number)
      readyTime.setHours(hours)
      readyTime.setMinutes(minutes)
      readyTime.setSeconds(0)
      setReadyTime(readyTime)
      return
    }
    var prepareTime = toMinutes(orders.prepareTime)
    readyTime.setMinutes(readyTime.getMinutes() + prepareTime)
    readyTime.setSeconds(0)
    setReadyTime(readyTime)
  }

  function generateLunchTimeslots(orderTime, startTime, endTime) {
    const slotDuration = 30; // in minutes
    const preparationTime = toMinutes(orders.prepareTime); // in minutes

    // Helper function to convert time in HH:mm format to minutes
    function convertToMinutes(time) {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    }

    // Helper function to convert minutes to HH:mm format
    function convertToTime(minutes) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }

    const startMinutes = convertToMinutes(startTime);
    const endMinutes = convertToMinutes(endTime);
    const orderMinutes = convertToMinutes(orderTime) + preparationTime;

    const timeslots = [];
    for (let minutes = startMinutes; minutes <= endMinutes; minutes += slotDuration) {
      if (minutes >= orderMinutes) {
        timeslots.push(convertToTime(minutes));
      }
    }

    return timeslots;
  }

  const indexOrder = (order) => {
    // var iO = {
    //   origin: order,
    //   indexedItems: order.items ? order.items
    //     .reduce((map, item) => { map[item.id] = item; return map }, {}) : {},
    //   totalOrder: order.items ? order.items.map(p => p.quantity).reduce((p1, p2) => p1 + p2, 0) : 0
    // }
    // setOrder(iO)
    // setOrders([...orders, order])
    let od = orders?.find(o => o.orderId === order.orderId)
    if (od === undefined) {
      setOrders([...orders, order])
    } else {
      var idx = orders.indexOf(od)
      orders[idx] = order
      setOrders([...orders])
    }
  }

  return (
    <div className="flex flex-col relative h-[100dvh] min-h-0 bg-slate-50">
      <Router>
        <div className="mt-2 ml-2 pr-4 w-full flex flex-row items-center space-x-2">
          {
            menus.map(menu => <Link key={menu.name} to={"menu/" + menu.name + "/" + resolverId} className={resolveMenuStyle(menu.name)}>{menu.displayName}</Link>)
          }
        </div>
        <Routes>
          <Route path="/" element={<Navigate to={"menu/" + activeGroup + "/" + resolverId} />} />
          <Route path="menu/:group/:resolverId"
            element={<Menu
              changeResolverId={(id) => setResolverId(id)}
              changeActiveGroup={group => setActiveGroup(group)}
              changeOrder={(order) => indexOrder(order)}
              getOrder={(group) => orders.find(o => o.group === group)} />}
          />
        </Routes>
      </Router>
      <Button className="px-3 py-2 mt-2 mx-3 h-9" onClick={comfirmOrderInvoice} disabled={!orders || orders.length <= 0}>Order</Button>

      <Modal
        show={showInvoiceModal}
        onClose={cancelOrder}
        popup={true}
      >
        <Modal.Header>

        </Modal.Header>
        <Modal.Body>
          <div>
            {invoices && invoices.length > 0 ?
              <div>
                <div><span className="font italic">Please choose your name</span></div>
                <div className="flex flex-col space-y-1">
                  {invoices.map(inv =>
                    <div
                      key={inv.id}
                      className={selectedInvoice.id === inv.id
                        ? "flex flex-col py-1 px-2 border border-gray-100 shadow-sm rounded-md bg-green-200 dark:bg-slate-500"
                        : "flex flex-col py-1 px-2 border border-gray-100 shadow-sm rounded-md bg-white dark:bg-slate-500"
                      }
                      onClick={() => handleInvSelection(inv)}
                    >
                      <Label
                        className="font-bold text-xs text-left text-blue-600 hover:underline overflow-hidden"
                      >
                        {inv.guestName}
                      </Label>
                      <Label
                        className="font-mono text-sm text-left text-gray-500 overflow-hidden"
                      >
                        {inv.checkInDate}
                      </Label>
                    </div>
                  )}
                </div>
                <div className="block pt-2">
                  <span className="font italic">Could not find your name in above list</span>
                  <div className="w-full mb-1 md:mb-0">
                    <TextInput
                      id="guestName"
                      placeholder="John"
                      required={true}
                      value={guestName}
                      onChange={(e) => changeGuestName(e)}
                    />
                  </div>
                </div>
              </div>
              : <div className="flex flex-wrap -mx-3 mb-6">
                <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
                  <div className="mb-2 block">
                    <Label
                      htmlFor="guestName"
                      value="Please enter your name"
                    />
                  </div>
                  <TextInput
                    id="guestName"
                    placeholder="John"
                    required={true}
                    value={guestName}
                    onChange={(e) => changeGuestName(e)}
                  />
                </div>
              </div>
            }
          </div>
        </Modal.Body>
        <Modal.Footer className="flex justify-center gap-4">
          <Button onClick={() => { setShowInvoiceModal(false); setShowOrderSummary(true) }} disabled={selectedInvoice.id === undefined && guestName === ''}>Next</Button>
          <Button color="gray" onClick={cancelOrder}>Cancel</Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showOrderSummary}
        onClose={closeOrderSummary}
        popup={true}
      >
        <Modal.Header></Modal.Header>
        <Modal.Body>
          <div className="flex flex-col space-y-2 text-left">
            <span>Thank <b>{guestName}</b>.<br /><br />Please confirm following order detail:</span>
            {
              orders.find(item => item.group === 'breakfast')?.totalQuantity > 0 ?
                <div className="border border-gray-200 rounded-md shadow-md p-2">
                  <span className="font font-bold text-lg text-green-600 uppercase">Breakfast</span>
                  {
                    orders?.find(item => item.group === 'breakfast').items
                      .map(item => <li key={item.id}>{item.quantity + 'x ' + item.name}</li>)
                  }
                  <span className="font italic"><b>Breakfast Time:</b> from 07:00 to 09:30</span>
                </div> : <></>
            }
            {
              orders.find(item => item.group === 'baverage')?.totalQuantity > 0 ?
                <div className="border border-gray-200 rounded-md shadow-md p-2">
                  <span className="font font-bold text-lg text-green-600 uppercase">Beverage</span>
                  {
                    orders?.find(item => item.group === 'baverage').items
                      .map(item => <li key={item.id}>{item.quantity + 'x ' + item.name}</li>)
                  }
                  <span className="font italic">Fill free to take beer, coke from the fridge at the central area</span>
                </div> : <></>
            }
            {
              orders.find(item => item.group === 'other')?.totalQuantity > 0 ?
                <div className="border border-gray-200 rounded-md shadow-md p-2">
                  <span className="font font-bold text-lg text-green-600 uppercase">Other</span>
                  {
                    orders?.find(item => item.group === 'other').items
                      .map(item => <li key={item.id}>{item.quantity + 'x ' + item.name}</li>)
                  }
                  <span className="font italic">I will bring them to you shortly</span>
                </div> : <></>
            }
            {
              orders.find(item => item.group === 'food')?.totalQuantity > 0 ?
                <div className="border border-gray-200 rounded-md shadow-md p-2">
                  <span className="font font-bold text-lg text-green-600">LUNCH or DINNER</span>
                  {
                    orders?.find(item => item.group === 'food').items
                      .map(item => <li key={item.id}>{item.quantity + 'x ' + item.name}</li>)
                  }
                  <span className="font italic"><b>Time:</b> ~ <b>{readyTime ? formatHourMinute(readyTime) : ''}</b>.<br /> </span>
                  {
                    timeSlots?.hasSlot ?
                      <div className="pt-3">
                        <span>You can also specify the time options below:</span>
                        {
                          timeSlots?.slots.map(ts =>
                            <div className="flex flex-row space-x-1 font-mono text-sm pt-1 overflow-scroll">
                              {
                                ts.slots?.map(timeslot => <span onClick={() => changeTimeslot(timeslot)}
                                  className={timeslot === choosenTimeSlot ? 'border rounded-sm px-0.5 bg-slate-400' : 'border rounded-sm px-0.5'}>{timeslot}</span>)
                              }
                            </div>
                          )
                        }
                      </div> : <></>
                  }

                </div> : <></>
            }
          </div>
          <div className="pt-3">
            <span className={orderSubmitResult && orderSubmitResult.success ? "font-bold text-green-700" : "font-bold text-red-700"}>{orderSubmitResult.message}</span>
          </div>
        </Modal.Body>
        <Modal.Footer className="flex justify-center gap-4">
          <Button onClick={submitOrder} disabled={orderSubmitResult.success !== undefined}>Confirm</Button>
          <Button color="gray" onClick={closeOrderSummary} disabled={orderSubmitResult.success !== undefined}>Cancel</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
