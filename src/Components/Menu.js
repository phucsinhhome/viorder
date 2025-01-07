import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Avatar, Button, Label, Modal, TextInput } from "flowbite-react";
import { DEFAULT_PAGE_SIZE } from "../App";
import { formatHourMinute, formatISODate, formatISODateTime, formatVND, toMinutes } from "../Service/Utils";
import { adjustOrderItem, commitOrder, fetchItems, resolveInvoiceId, startOrder } from "../db/order";
import { listStayingAndComingInvoices } from "../db/invoice";
import { GiAlarmClock } from "react-icons/gi";
import { GoChecklist } from "react-icons/go";
import { getProductGroup } from "../db/pgroup";

export const Menu = ({ argChangeResolverId, argChangeActiveGroup }) => {
  const OrderStatus = {
    sent: 'SENT'
  }
  const [menuItems, setMenuItems] = useState([])

  const [pagination, setPagination] = useState({
    pageNumber: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: 20
  })

  const [order, setOrder] = useState({})

  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [invoices, setInvoices] = useState([])
  const [selectedInvoice, setSelectedInvoice] = useState({})

  const [orderSubmitResult, setOrderSubmitResult] = useState({})
  const [guestName, setGuestName] = useState('')

  const [showProductDetailModal, setShowProductDetailModal] = useState(false)
  const [viewingProduct, setViewingProduct] = useState({})

  const [showOrderSummary, setShowOrderSummary] = useState(false)
  const [menu, setMenu] = useState()
  const [timeSlots, setTimeSlots] = useState()
  const [choosenTimeSlot, setChoosenTimeSlot] = useState('')
  const [readyTime, setReadyTime] = useState()

  const [menuAvailable, setMenuAvailable] = useState(false)
  const [menuMessage, setMenuMessage] = useState('')

  const { group, resolverId } = useParams()

  const handlePaginationClick = (page) => {
    console.log("Pagination nav bar click to page %s", page)

    var pNum = page < 0 ? 0 : page > pagination.totalPages - 1 ? pagination.totalPages - 1 : page;
    setPagination({
      ...pagination,
      pageNumber: pNum
    })
  }

  const fetchMenuItems = () => {
    console.info("Loading items for group %s", group)

    fetchItems(group, pagination.pageNumber, pagination.pageSize)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then(data => {
              var availables = data.content.filter(i => i.quantity > 0)
              setMenuItems(availables)
              if (data.totalPages !== pagination.totalPages) {
                setPagination({
                  ...pagination,
                  totalPages: data.totalPages
                })
              }
            })
        }
      })
  }

  const findResolverId = () => {
    return resolverId
  }

  const registerOrder = () => {
    var startTime = formatISODateTime(new Date())
    let rI = findResolverId()
    console.info("Register the order with resolverId = %s", rI)
    startOrder(rI, startTime)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then(data => {
              console.info('Started order %s', data.orderId)
              indexOrder(data)
              return data
            })
        }
      })
  }

  useEffect(() => {

    if (resolverId !== '' && resolverId !== undefined) {
      argChangeResolverId(resolverId)
    }
    argChangeActiveGroup(group)

    if (order.origin === undefined) {

      registerOrder()
    }
    // setPagination({
    //   ...pagination,
    //   pageNumber: 0
    // })
    fetchTheMenu();

    // eslint-disable-next-line
  }, [group]);

  useEffect(() => {

    if (menuAvailable) {
      fetchMenuItems();
    }

    // eslint-disable-next-line
  }, [pagination.pageNumber]);

  useEffect(() => {

    if (showOrderSummary === true) {
      var orderTime = formatHourMinute(new Date())

      setTimeSlots([{ name: 'Lunch', slots: generateLunchTimeslots(orderTime, '10:00', '14:30') },
      { name: 'Dinner', slots: generateLunchTimeslots(orderTime, '18:00', '20:30') }])
      calculateReadyTime()
    }

    // eslint-disable-next-line
  }, [showOrderSummary]);

  useEffect(() => {

    if (order && order.origin && order.origin.prepareTime) {
      calculateReadyTime()
    }

    // eslint-disable-next-line
  }, [choosenTimeSlot]);

  useEffect(() => {

    if (menu === undefined) {
      return
    }
    var now = new Date()
    var dateString = formatISODate(now)
    var availT = new Date(`${dateString}T${menu.availTime}Z`)
    var unavailT = new Date(`${dateString}T${menu.unavailTime}Z`)
    console.info("%s is available from %s to %s", menu.displayName, availT.toLocaleTimeString(), unavailT.toLocaleTimeString())
    if (now >= availT && now <= unavailT) {
      fetchMenuItems()
      setMenuAvailable(true)
      setMenuMessage(menu.description)
      return
    } else {
      setMenuItems([])
      setMenuMessage(`${menu.displayName} is availble for ordering from ${formatHourMinute(availT)}`)
      console.info("It's out of available time for menu %s", menu.displayName)
    }

    // eslint-disable-next-line
  }, [menu]);

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
    var prepareTime = toMinutes(order.origin.prepareTime)
    readyTime.setMinutes(readyTime.getMinutes() + prepareTime)
    readyTime.setSeconds(0)
    setReadyTime(readyTime)
  }

  function generateLunchTimeslots(orderTime, startTime, endTime) {
    const slotDuration = 30; // in minutes
    const preparationTime = toMinutes(order.origin.prepareTime); // in minutes

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

  const pageClass = (pageNum) => {
    var noHighlight = "px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
    var highlight = "px-3 py-2 leading-tight text-bold text-blue-600 border border-blue-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white"

    return pagination.pageNumber === pageNum ? highlight : noHighlight
  }

  //================ ORDER ==========================//
  const handleInvSelection = (inv) => {
    setSelectedInvoice(inv)
    setGuestName(inv.guestName)
  }

  const cancelOrder = () => {
    setShowInvoiceModal(false)
  }

  const submitOrder = () => {
    try {
      if (selectedInvoice === null) {
        return
      }

      var cOrder = {
        ...order.origin,
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

  const changeQuantity = (product, delta) => {

    if (delta <= 0) {
      var existedItem = order.indexedItems[product.id]
      if (existedItem !== undefined && existedItem.quantity <= 0) {
        return
      }
    }

    var item = {
      id: product.id,
      name: product.name,
      unitPrice: product.unitPrice,
      group: product.group,
      prepareTime: product.prepareTime,
      quantity: delta
    }
    adjustOrderItem(order.origin.orderId, item)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then(data => {
              indexOrder(data)
              console.info("Change item %s with quantity %s order successfully", item.id, item.quantity)
            })
        } else if (rsp.status === 400) {
          console.warn('The item %s does not exist', item.id)
        } else if (rsp.status === 304) {
          console.warn('The item %s ran out', item.id)
        }
      })
  }

  const indexOrder = (order) => {
    var iO = {
      origin: order,
      indexedItems: order.items ? order.items
        .reduce((map, item) => { map[item.id] = item; return map }, {}) : {},
      totalOrder: order.items ? order.items.map(p => p.quantity).reduce((p1, p2) => p1 + p2, 0) : 0
    }
    setOrder(iO)
  }

  const comfirmOrderInvoice = () => {

    let rI = findResolverId()

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

  const changeGuestName = (e) => {
    var gN = e.target.value
    setSelectedInvoice({})
    setGuestName(gN)
  }

  const viewProductDetail = (product) => {
    setViewingProduct(product)
    setShowProductDetailModal(true)
  }
  const closeProductDetailModal = () => {
    setShowProductDetailModal(false)
  }

  const fetchTheMenu = () => {
    getProductGroup(group)
      .then((rsp) => {
        if (rsp.ok) {
          rsp.json()
            .then(data => setMenu(data))
        } else {
          setMenu(undefined)
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
      setOrder({});
    }
    setOrderSubmitResult({})
  }

  return (
    <div className="h-full pt-3">
      <div className="mx-2 px-2 border bg-green-100 mb-2 text-center">
        {menu ? <span className="font italic text-sm text-amber-700 font-sans">{menuMessage}</span> : <></>}
      </div>
      <div className="max-h-fit overflow-hidden">
        <div className="flex flex-col space-y-1 px-2">
          {menuItems.map((product) => {
            return (
              <div
                className="flex flex-row items-center border border-gray-300 shadow-2xl rounded-md bg-white dark:bg-slate-500 relative"
                key={product.id}
              >
                <div className="pl-0.5 pr-1 py-2">
                  <Avatar img={product.featureImgUrl} alt="dish image" rounded className="w-12" />
                </div>
                <div className="flex flex-col px-0">
                  <div className="flex flex-row">
                    <Link
                      onClick={() => viewProductDetail(product)}
                      state={{ pageNumber: pagination.pageNumber, pageSize: pagination.pageSize }}
                      className="font-medium text-green-800 hover:underline dark:text-gray-200 overflow-hidden"
                    >
                      {product.name}
                    </Link>
                  </div>
                  <div className="flex flex-row text-sm space-x-3">
                    <div className="flex flex-row items-center space-x-0.5">
                      <GiAlarmClock />
                      <span className="font font-mono text-gray-500 text-[13px] w-9">{toMinutes(product.prepareTime) + "min"}</span>
                    </div>
                    <div className="flex flex-row items-center space-x-0.5">
                      <GoChecklist />
                      <div className="font font-mono text-gray-500 text-[13px] overflow-hidden whitespace-nowrap w-5/6">{product.description}</div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col w-28 px-1 absolute right-1">
                  <div className="text text-center w-full">
                    <span className="text-sm text-amber-800">{formatVND(product.unitPrice)}</span>
                  </div>
                  <div className="flex w-full items-center mb-2 text-center">
                    <button
                      type="button"
                      id="decrement-button"
                      data-input-counter-decrement="quantity-input"
                      className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-s-lg py-1 px-2 h-7 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
                      onClick={() => changeQuantity(product, -1)}
                    >
                      <svg className="w-3 h-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 2">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h16" />
                      </svg>
                    </button>
                    <input
                      type="number"
                      id="quantity-input"
                      data-input-counter aria-describedby="helper-text-explanation"
                      className="bg-gray-50 border-x-0 border-gray-300 h-7 w-full min-w-min text-center text-gray-900 block py-1"
                      placeholder="9"
                      required
                      value={order.indexedItems && order.indexedItems[product.id] ? order.indexedItems[product.id].quantity : 0}
                      readOnly
                    />
                    <button
                      type="button"
                      id="increment-button"
                      data-input-counter-increment="quantity-input"
                      className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-e-lg py-1 px-2 h-7 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
                      onClick={() => changeQuantity(product, 1)}
                    >
                      <svg className="w-3 h-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 1v16M1 9h16" />
                      </svg>
                    </button>
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      </div>
      {
        menuItems.length > 0 ?

          <div className="flex flex-row px-2 items-center justify-between">
            <nav className="flex items-center justify-between pt-2" aria-label="Table navigation">
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

            <Button className="px-3 py-2 mt-2 mx-3 h-9" onClick={comfirmOrderInvoice} disabled={order.totalOrder <= 0}>Order</Button>
          </div>
          : <></>
      }

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
          <div className="flex flex-col space-y-2 text-left px-4">
            <span>Thank <b>{guestName}</b>.<br /><br />Please confirm following order detail:</span>
            {
              order.origin ? order.origin.items.map(item => <li key={item.id}>{item.quantity + 'x ' + item.name}</li>) : <></>
            }
            <span className="font italic">Your order will be ready at around <b>{readyTime ? formatHourMinute(readyTime) : ''}</b>.<br /> Or you can specify the expected time as below:</span>
          </div>
          <div className="pt-3">
            {
              timeSlots?.map(ts => <div className="flex flex-row items-center pt-1">
                <span className="font font-sans font-semibold pr-2">{ts.name}: </span>
                <div className="flex flex-row space-x-1 font-mono text-sm">
                  {
                    ts.slots?.map(timeslot => <span onClick={() => changeTimeslot(timeslot)}
                      className={timeslot === choosenTimeSlot ? 'border rounded-sm px-0.5 bg-slate-400' : 'border rounded-sm px-0.5'}>{timeslot}</span>)
                  }
                </div>
              </div>)
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

      <Modal
        show={showProductDetailModal}
        onClose={closeProductDetailModal}
        popup={true}
      >
        <Modal.Header>

        </Modal.Header>
        <Modal.Body>
          <div className="flex flex-col">
            <div className="space-y-3">
              <div className="flex flex-col">
                <span className="font font-bold text-xl italic pb-4">{viewingProduct.name}</span>
                <span>{viewingProduct.description}</span>
              </div>
              <img
                src={viewingProduct.featureImgUrl}
                alt=""
                className="border rounded-md"
              />
              {
                viewingProduct.imageUrls ?
                  <div className="flex flex-col space-y-2">
                    {viewingProduct.imageUrls.map(imgUrl =>
                      <img
                        src={imgUrl}
                        alt=""
                        className="border rounded-md"
                      />
                    )}
                  </div>
                  : <></>
              }

            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="flex justify-center gap-4">
          <Button color="gray" onClick={closeProductDetailModal}>Close</Button>
        </Modal.Footer>
      </Modal>

    </div >
  );
}
