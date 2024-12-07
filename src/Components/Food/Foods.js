import { useState, useEffect } from "react";
import { deleteInvoice, listAllFoods as listAllFoods } from "../../db/food";
import { Link, useLocation } from "react-router-dom";
import { Avatar, Button, Label, Modal, Table } from "flowbite-react";
import Moment from "react-moment";
import { DEFAULT_PAGE_SIZE } from "../../App";
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { formatISODate, formatISODateTime, formatVND } from "../../Service/Utils";
import { addOrderItem, commitOrder, getPotentialInvoices, startOrder } from "../../db/order";


export const Foods = () => {
  const [foods, setFoods] = useState([])

  const [fromDate, setFromDate] = useState(new Date());
  const [deltaDays, setDeltaDays] = useState(0)

  const [pagination, setPagination] = useState({
    pageNumber: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    totalElements: 200,
    totalPages: 20
  })

  const [showPotentialGuestModal, setShowPotentialGuestModal] = useState(false)
  const [order, setOrder] = useState({})
  const [potentialInvoices, setPotentialInvoices] = useState([])
  const [choosenGuest, setChoosenGuest] = useState({})

  const location = useLocation()

  const filterDay = (numDays) => {

    var newDate = Date.now() + numDays * 86400000
    var newDD = new Date(newDate)
    console.info("Change filter date to %s", newDD.toISOString())
    setFromDate(newDD)
    setDeltaDays(numDays)
    fetchFoods(newDD, pagination.pageNumber, pagination.pageSize)
  }

  const handlePaginationClick = (pageNumber) => {
    console.log("Pagination nav bar click to page %s", pageNumber)
    var pNum = pageNumber < 0 ? 0 : pageNumber > pagination.totalPages - 1 ? pagination.totalPages - 1 : pageNumber;
    var pSize = pagination.pageSize
    fetchFoods(fromDate, pNum, pSize)
  }

  const fetchFoods = (fromDate, pageNumber, pageSize) => {
    console.info("Loading foods")

    listAllFoods(pageNumber, pageSize)
      .then(data => {
        setFoods(data.content)
        setPagination({
          pageNumber: data.number,
          pageSize: data.size,
          totalElements: data.totalElements,
          totalPages: data.totalPages
        })
      })
  }

  const registerOrder = () => {
    var startTime = formatISODateTime(new Date())
    startOrder('R1', startTime)
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
    if (location == null || location.state == null) {
      console.warn("Invalid prop location!")
      return
    }
    fetchFoods(new Date(), location.state.pageNumber, location.state.pageSize);
    registerOrder();

    // eslint-disable-next-line
  }, [location]);

  const filterOpts = [
    {
      days: 0,
      label: 'Today'
    },
    {
      days: -1,
      label: 'Yesterday'
    },
    {
      days: -5,
      label: 'Last 5 days'
    },
    {
      days: -1 * new Date().getDate(),
      label: 'From 1st'
    }]
  const filterClass = (days) => {
    var classNamePattern = "font-bold text-amber-800 rounded px-2 py-0.5"
    return classNamePattern + " " + (deltaDays === days ? "bg-slate-400" : "bg-slate-200");
  }

  const pageClass = (pageNum) => {
    var noHighlight = "px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
    var highlight = "px-3 py-2 leading-tight text-bold text-blue-600 border border-blue-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white"

    return pagination.pageNumber === pageNum ? highlight : noHighlight
  }

  //================ ORDER ==========================//
  const handleInvSelection = (inv) => {
    setChoosenGuest(inv)
  }

  const cancelOrder = () => {
    setShowPotentialGuestModal(false)
  }

  const confirmOrder = () => {
    try {
      if (choosenGuest === null) {
        return
      }
      
      var cOrder = {
        ...order,
        invoiceId: choosenGuest.id,
        products: Object.values(order.products),
        status: 'CONFIRMED'
      }
      commitOrder(cOrder)
        .then(rsp => {
          if (rsp.ok) {
            rsp.json()
              .then(data => {
                console.info("Comfirm order %s successfully", cOrder.orderId)
              })
          }
        })

    } catch (e) {
      console.error(e)
    } finally {
      setShowPotentialGuestModal(false)
    }
  }

  const changeQuantity = (food, delta) => {

    var item = {
      ...food,
      quantity: delta
    }
    addOrderItem(order.orderId, item)
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
      ...order,
      products: order.products
        .reduce((map, p) => { map[p.id] = p; return map }, {})
    }
    setOrder(iO)
  }

  const comfirmOrderInvoice = () => {

    getPotentialInvoices(order.orderId)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then(data => {
              console.info('Fetch invoices successfully')
              console.log(data);

              setPotentialInvoices(data)
              setShowPotentialGuestModal(true)
              setChoosenGuest({})
            })
        }
      })
  }

  return (
    <div className="h-full pt-3">
      <div className="max-h-fit overflow-hidden">
        <div className="flex flex-col space-y-1">
          {foods.map((food) => {
            return (
              <div
                className="flex flex-row items-center border border-gray-300 shadow-2xl rounded-md bg-white dark:bg-slate-500 "
                key={food.id}
              >
                <div className="pl-0.5 pr-1">
                  <Avatar img={food.featureImgUrl} alt="dish image" rounded className="w-12" />
                </div>
                <div className="px-0 w-full">
                  <div className="grid grid-cols-1">
                    <div className="flex flex-row">
                      <Link
                        to={food.id}
                        state={{ pageNumber: pagination.pageNumber, pageSize: pagination.pageSize }}
                        className="font-medium text-blue-600 hover:underline dark:text-blue-500 overflow-hidden"
                      >
                        {food.name}
                      </Link>
                    </div>
                    <div className="flex flex-row text-sm space-x-1">
                      <span className="font font-mono text-gray-500 text-[10px]">{food.description}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col pl-0.2 pr-2">
                  <div>
                    <span className="w-full text text-center font-mono text-red-700 font-semibold">{formatVND(food.unitPrice)}</span>
                  </div>
                  <div className="relative flex items-center w-full mb-2">
                    <button
                      type="button"
                      id="decrement-button"
                      data-input-counter-decrement="quantity-input"
                      className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-s-lg py-1 px-2 h-7 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
                      onClick={() => changeQuantity(food, -1)}
                    >
                      <svg className="w-3 h-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 2">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h16" />
                      </svg>
                    </button>
                    <input
                      type="number"
                      id="quantity-input"
                      data-input-counter aria-describedby="helper-text-explanation"
                      className="bg-gray-50 border-x-0 border-gray-300 h-7 text-center text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-9 py-1 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="999"
                      required
                      value={order.products && order.products[food.id] ? order.products[food.id].quantity : 0}
                      readOnly
                    />
                    <button
                      type="button"
                      id="increment-button"
                      data-input-counter-increment="quantity-input"
                      className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-e-lg py-1 px-2 h-7 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
                      onClick={() => changeQuantity(food, 1)}
                    >
                      <svg className="w-3 h-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 1v16M1 9h16" />
                      </svg>
                    </button>
                  </div>
                  {/* <div className="flex flex-row space-x-3 pt-1 place-items-center">
                    
                    <svg
                      className="w-7 h-5 font-bold text-lime-600 bg-slate-200 dark:text-white rounded px-1"
                      aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14m-7 7V5" />
                    </svg>
                    <span>5</span>
                    <svg
                      className="w-7 h-5 font-bold text-lime-600 bg-slate-200 dark:text-white rounded px-1"
                      aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14m-7 7V5" />
                    </svg>
                  </div> */}
                </div>

              </div>
            )
          })}
        </div>
      </div>
      <div className="flex flex-row items-center justify-between">
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

        <Button className="px-3 py-2 mt-2 mx-3 h-9" onClick={comfirmOrderInvoice}>Order</Button>
      </div>
      <Modal
        show={showPotentialGuestModal}
        onClose={cancelOrder}
        popup={true}
      >
        <Modal.Header>Your Name</Modal.Header>
        <Modal.Body>
          <div className="flex flex-col space-y-2">
            {potentialInvoices.map(inv =>
              <div
                key={inv.id}
                // onSelect={handleInvSelection(inv)}
                className={choosenGuest.id === inv.id
                  ? "flex flex-col py-1 px-2  border border-gray-100 shadow-sm rounded-md bg-amber-600 dark:bg-slate-500"
                  : "flex flex-col py-1 px-2 border border-gray-100 shadow-sm rounded-md bg-white dark:bg-slate-500"
                }
                onClick={()=>handleInvSelection(inv)}
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
        </Modal.Body>
        <Modal.Footer className="flex justify-center gap-4">
          <Button onClick={confirmOrder}>Confirm</Button>
          <Button color="gray" onClick={cancelOrder}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>


    </div >
  );
}
