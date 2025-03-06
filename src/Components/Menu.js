import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchProductItems } from "../db/inventory";
import { GiAlarmClock } from "react-icons/gi";
import { GoChecklist } from "react-icons/go";
import { getProductGroup } from "../db/pgroup";
import { Avatar, Button, Label, Modal, TextInput } from "flowbite-react";
import { formatHourMinute, formatISODate, formatISODateTime, formatVND, toMinutes } from "../Service/Utils";
import { commitOrder, resolveInvoiceId, adjustOrderItem, startOrder } from "../db/order";
import { listStayingAndComingInvoices } from "../db/invoice";

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

export const Menu = ({ changeActiveGroup, changeResolverId }) => {
  const [menuItems, setMenuItems] = useState([])

  const [pagination, setPagination] = useState({
    pageNumber: 0,
    pageSize: process.env.REACT_APP_DEFAULT_PAGE_SIZE,
    totalPages: 20
  })

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

  const [showProductDetailModal, setShowProductDetailModal] = useState(false)
  const [viewingProduct, setViewingProduct] = useState({})
  const [menu, setMenu] = useState()

  const [menuAvailable, setMenuAvailable] = useState(false)
  const [menuMessage, setMenuMessage] = useState('')

  const { group, resolverId } = useParams()

  const handlePaginationClick = (page) => {
    console.log(`Pagination nav bar click to page ${page}`)

    var pNum = page < 0 ? 0 : page > pagination.totalPages - 1 ? pagination.totalPages - 1 : page;
    setPagination({
      ...pagination,
      pageNumber: pNum
    })
  }

  const fetchMenuItems = () => {
    console.info(`Loading items for group ${group}`)

    fetchProductItems(group, pagination.pageNumber, pagination.pageSize)
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

  const activeOrder = () => {
    return orders.find(o => o.group === group)
  }

  const getOrder = (groupArg) => {
    return orders.find(o => o.group === groupArg)
  }

  const registerOrder = async (group) => {
    var startTime = formatISODateTime(new Date())
    let rI = findResolverId()
    console.info(`Register the order with resolverId = ${rI} and group = ${group}`)
    const rsp = await startOrder(rI, startTime);
    if (rsp.ok) {
      const data = await rsp.json();
      console.info(`Started order with id = ${data.orderId}`);
      const order = { ...data, totalQuantity: 0, group: group }
      indexOrder(order);
      return order;
    }
  }

  useEffect(() => {

    if (group === undefined) {
      return
    }
    if (resolverId !== '' && resolverId !== undefined) {
      changeResolverId(resolverId)
    }
    changeActiveGroup(group);
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

    if (menu === undefined) {
      return
    }
    if (menu.status === 'DISABLED') {
      setMenuMessage(`Menu ${menu.displayName} is ready at the moment`)
      setMenuItems([])
      setMenuAvailable(false)
      return
    }
    if (menu.status === 'UNAVAILABLE') {
      setMenuMessage(`Menu ${menu.displayName} is available at the moment`)
      setMenuItems([])
      setMenuAvailable(false)
      return
    }
    fetchMenuItems()
    setMenuAvailable(true)
    setMenuMessage(menu.description)

    // eslint-disable-next-line
  }, [menu]);

  const pageClass = (pageNum) => {
    var noHighlight = "px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
    var highlight = "px-3 py-2 leading-tight text-bold text-blue-600 border border-blue-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white"

    return pagination.pageNumber === pageNum ? highlight : noHighlight
  }

  //================ ORDER ==========================//

  const changeQuantity = async (product, delta) => {
    let od = activeOrder(product.group)
    if (od === undefined) {
      od = await registerOrder(product.group)
      console.info('Register order')
    }

    if (delta <= 0) {
      var existedItem = od.items.find(p => p.id === product.id)
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
    adjustOrderItem(od.orderId, item)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then(data => {
              indexOrder({
                ...data,
                group: product.group,
                totalQuantity: data.items.map(p => p.quantity).reduce((p1, p2) => p1 + p2, 0)
              })
              console.info("Change item %s with quantity %s order successfully", item.id, item.quantity)
            })
        } else if (rsp.status === 400) {
          console.warn('The item %s does not exist', item.id)
        } else if (rsp.status === 304) {
          console.warn('The item %s ran out', item.id)
        }
      })
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

  useEffect(() => {

    if (showOrderSummary === true) {
      var foodOrder = orders.find(o => o.group === 'food')
      if (foodOrder === undefined) {
        return
      }
      var orderTime = formatHourMinute(new Date())

      var slots = timeSlotConfig.map(ts => ({
        name: ts.name,
        slots: generateLunchTimeslots(orderTime, foodOrder.prepareTime, ts.start, ts.end)
      }))
      var hasSlot = slots.find(ts => ts.slots.length > 0)
      setTimeSlots({ hasSlot: hasSlot !== undefined, slots: slots })
      calculateReadyTime(foodOrder.prepareTime)
    }

    // eslint-disable-next-line
  }, [showOrderSummary]);

  useEffect(() => {

    const foodOrder = getOrder('food')
    if (foodOrder !== undefined) {
      calculateReadyTime(foodOrder.prepareTime)
    }

    // eslint-disable-next-line
  }, [choosenTimeSlot]);

  const cancelOrder = () => {
    setShowInvoiceModal(false)
  }

  const submitOrder = () => {

    if (selectedInvoice === null) {
      return
    }
    Promise.all(orders.map(order => submitOneOrder(order)))
      .then(results => {
        const anyFailureResult = results.find(r => r.success === false);
        if (anyFailureResult) {
          var failedMsg = processMessageAnnotation(process.env.REACT_APP_ORDER_FAILED_MESSAGE);
          console.info("Submit all orders failed")
          setOrderSubmitResult({
            success: false,
            message: failedMsg
          })
        } else {
          var successMsg = processMessageAnnotation(process.env.REACT_APP_ORDER_SUCCESS_MESSAGE);
          console.info("Submit all orders successfully")
          setOrderSubmitResult({
            success: true,
            message: successMsg
          })
        }
      })
  }

  const submitOneOrder = async (order) => {
    try {
      var cOrder = {
        ...order,
        invoiceId: selectedInvoice.id,
        status: OrderStatus.sent,
        guestName: guestName,
        expectedTime: readyTime?formatISODateTime(readyTime):'',
      }
      const rsp = await commitOrder(cOrder);
      if (rsp.ok) {
        const data = await rsp.json();
        indexOrder(data);
        console.info(`Submit order ${cOrder.orderId} successfully`);
        return { success: true, orderId: order.id };
      } else {
        console.info(`Failed to submit order ${cOrder.orderId}`);
        return { success: false, orderId: order.id };
      }
    } catch (e) {
      console.error(e);
      return { success: false, message: e.message };
    } finally {
      setShowInvoiceModal(false);
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
      setOrders([]);
    }
    setOrderSubmitResult({})
  }

  const calculateReadyTime = (prepareTime) => {
    let readyTime = new Date()
    if (choosenTimeSlot) {
      const [hours, minutes] = choosenTimeSlot.split(":").map(Number)
      readyTime.setHours(hours)
      readyTime.setMinutes(minutes)
      readyTime.setSeconds(0)
      setReadyTime(readyTime)
      return
    }
    var prepareTimeInMin = toMinutes(prepareTime)
    readyTime.setMinutes(readyTime.getMinutes() + prepareTimeInMin)
    readyTime.setSeconds(0)
    setReadyTime(readyTime)
  }

  function generateLunchTimeslots(orderTime, prepareTime, startTime, endTime) {
    const slotDuration = 30; // in minutes
    const preparationTime = toMinutes(prepareTime); // in minutes

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
    setOrders(prevOrders => {
      const orderIndex = prevOrders.findIndex(o => o.orderId === order.orderId);
      if (orderIndex !== -1) {
        // Replace existing order
        const newOrders = [...prevOrders];
        newOrders[orderIndex] = order;
        console.info(`Replace order ${order.orderId} at index ${orderIndex}`);
        return newOrders;
      } else {
        // Add new order
        console.info(`Add new order ${order.orderId}`);
        return [...prevOrders, order];
      }
    });
  }

  const summaryOrderStyle = (order) => {
    return order.status === OrderStatus.sent ?
      "border border-gray-200 rounded-md shadow-md p-2 bg-green-100" :
      "border border-gray-200 rounded-md shadow-md p-2"
  }

  return (
    <div className="w-full h-full pt-3 relative">
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
                      value={activeOrder()?.items.find(item => item.id === product.id)?.quantity || 0}
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
                  <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a 1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path></svg>
                </li>
              </ul>
            </nav>

            {/* <Button className="px-3 py-2 mt-2 mx-3 h-9" onClick={comfirmOrderInvoice} disabled={!order?.items || order?.items.map(o => o.quantity).reduce((i1, i2) => i1 + i2, 0) <= 0}>Order</Button> */}
          </div>
          : <></>
      }

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
              getOrder('breakfast')?.totalQuantity > 0 ?
                <div className={summaryOrderStyle(getOrder('breakfast'))}>
                  <span className="font font-bold text-lg text-green-600 uppercase">Breakfast</span>
                  {
                    getOrder('breakfast').items
                      .map(item => <li key={item.id}>{item.quantity + 'x ' + item.name}</li>)
                  }
                  <span className="font italic"><b>Breakfast Time:</b> from 07:00 to 09:30</span>
                </div> : <></>
            }
            {
              getOrder('baverage')?.totalQuantity > 0 ?
                <div className={summaryOrderStyle(getOrder('baverage'))}>
                  <span className="font font-bold text-lg text-green-600 uppercase">Beverage</span>
                  {
                    getOrder('baverage').items
                      .map(item => <li key={item.id}>{item.quantity + 'x ' + item.name}</li>)
                  }
                  <span className="font italic">Fill free to take beer, coke from the fridge at the central area</span>
                </div> : <></>
            }
            {
              getOrder('other')?.totalQuantity > 0 ?
                <div className={summaryOrderStyle(getOrder('other'))}>
                  <span className="font font-bold text-lg text-green-600 uppercase">Other</span>
                  {
                    getOrder('other').items
                      .map(item => <li key={item.id}>{item.quantity + 'x ' + item.name}</li>)
                  }
                  <span className="font italic">I will bring them to you shortly</span>
                </div> : <></>
            }
            {
              getOrder('food')?.totalQuantity > 0 ?
                <div className={summaryOrderStyle(getOrder('food'))}>
                  <span className="font font-bold text-lg text-green-600">LUNCH or DINNER</span>
                  {
                    getOrder('food').items
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


      <div className="flex flex-row justify-center">
        <Button className="w-2/3 px-3 py-2 mt-2 mx-3 h-9 absolute bottom-1"
          onClick={comfirmOrderInvoice} disabled={!orders || orders.length <= 0}>Order</Button>
      </div>
    </div >
  );
}
