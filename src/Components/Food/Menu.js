import { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Avatar, Button, Label, Modal, TextInput } from "flowbite-react";
import { DEFAULT_PAGE_SIZE } from "../../App";
import { formatISODateTime, formatVND } from "../../Service/Utils";
import { adjustOrderItem, commitOrder, fetchItems, getPotentialInvoices, resolveInvoiceId, startOrder } from "../../db/order";


export const Menu = () => {
  const OrderStatus = {
    sent: 'SENT'
  }
  const [menuItems, setMenuItems] = useState([])

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

  const [showOrderSentModal, setShowOrderSentModal] = useState(false)
  const [orderSentMessage, setOrderSentMessage] = useState('')
  const [guestName, setGuestName] = useState('')

  const [showProductDetailModal, setShowProductDetailModal] = useState(false)
  const [viewingProduct, setViewingProduct] = useState({})

  const { group, resolverId } = useParams()
  const location = useLocation()

  const handlePaginationClick = (pageNumber) => {
    console.log("Pagination nav bar click to page %s", pageNumber)
    var pNum = pageNumber < 0 ? 0 : pageNumber > pagination.totalPages - 1 ? pagination.totalPages - 1 : pageNumber;
    var pSize = pagination.pageSize
    fetchMenuItems(pNum, pSize)
  }

  const fetchMenuItems = (pageNumber, pageSize) => {
    console.info("Loading foods")

    fetchItems(group, pageNumber, pageSize)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then(data => {
              var availables = data.content.filter(i => i.quantity > 0)
              setMenuItems(availables)
              setPagination({
                pageNumber: data.number,
                pageSize: data.size,
                totalElements: data.totalElements,
                totalPages: data.totalPages
              })
            })
        }
      })
  }

  const registerOrder = () => {
    var startTime = formatISODateTime(new Date())
    startOrder(resolverId, startTime)
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
    fetchMenuItems(location.state.pageNumber, location.state.pageSize);
    registerOrder();

    // eslint-disable-next-line
  }, [location]);


  const pageClass = (pageNum) => {
    var noHighlight = "px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
    var highlight = "px-3 py-2 leading-tight text-bold text-blue-600 border border-blue-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white"

    return pagination.pageNumber === pageNum ? highlight : noHighlight
  }

  //================ ORDER ==========================//
  const handleInvSelection = (inv) => {
    setChoosenGuest(inv)
    setGuestName(inv.guestName)
  }

  const cancelOrder = () => {
    setShowPotentialGuestModal(false)
  }

  const submitOrder = () => {
    try {
      if (choosenGuest === null) {
        return
      }

      var cOrder = {
        ...order.origin,
        invoiceId: choosenGuest.id,
        status: OrderStatus.sent,
        guestName: guestName
      }
      commitOrder(cOrder)
        .then(rsp => {
          if (rsp.ok) {
            rsp.json()
              .then((data) => {
                indexOrder(data)
                console.info("Submit order %s successfully", cOrder.orderId)
                var successMsg = processMessageAnnotation(process.env.REACT_APP_ORDER_SUCCESS_MESSAGE)
                setOrderSentMessage(successMsg)
                setShowOrderSentModal(true)
              })
          } else {
            console.info("Failed to submit order %s", cOrder.orderId)
            var failedMsg = processMessageAnnotation(process.env.REACT_APP_ORDER_FAILED_MESSAGE)
            setOrderSentMessage(failedMsg)
            setShowOrderSentModal(true)
          }
        })
    } catch (e) {
      console.error(e)
    } finally {
      setShowPotentialGuestModal(false)
    }
  }

  const processMessageAnnotation = (template) => {
    console.info(template)
    var result = template.replace('GUEST_NAME', guestName)
    console.info(result)
    return result
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

    if (resolverId !== null && resolverId !== undefined) {
      resolveInvoiceId(resolverId)
        .then(rsp => {
          if (rsp.ok) {
            rsp.text()
              .then(data => {
                if (data !== null && data !== undefined && data !== '') {
                  console.info("Resolved invoice id %s", data)
                  setPotentialInvoices([data])
                  setShowPotentialGuestModal(true)
                  setChoosenGuest({})
                } else {
                  console.info("No invoice resolved")
                  getPotentialInvoices(order.origin.orderId)
                    .then(rsp => {
                      if (rsp.ok) {
                        rsp.json()
                          .then(data => {
                            console.info('Fetch invoices successfully')
                            setPotentialInvoices(data)
                            setShowPotentialGuestModal(true)
                            setChoosenGuest({})
                          })
                      } else {
                        showCommonErrorMessage()
                      }
                    })
                }
              })
          } else {
            showCommonErrorMessage()
          }
        })
    }

  }

  const showCommonErrorMessage = (msg) => {
    var errorMessage = msg ? msg : process.env.REACT_APP_ORDER_COMMON_ERROR_MESSAGE
    setOrderSentMessage(errorMessage)
    setShowOrderSentModal(true)
  }

  const finishOrder = () => {
    setShowOrderSentModal(false)
    if (order.origin.status === OrderStatus.sent) {
      setOrder({})
    }
  }

  const changeGuestName = (e) => {
    var gN = e.target.value
    setChoosenGuest({})
    setGuestName(gN)
  }

  const viewProductDetail = (product) => {
    setViewingProduct(product)
    setShowProductDetailModal(true)
  }
  const closeProductDetailModal = () => {
    setShowProductDetailModal(false)
  }

  return (
    <div className="h-full pt-3">
      <div className="max-h-fit overflow-hidden">
        <div className="flex flex-col space-y-1">
          {menuItems.map((product) => {
            return (
              <div
                className="flex flex-row items-center border border-gray-300 shadow-2xl rounded-md bg-white dark:bg-slate-500 "
                key={product.id}
              >
                <div className="pl-0.5 pr-1">
                  <Avatar img={product.featureImgUrl} alt="dish image" rounded className="w-12" />
                </div>
                <div className="px-0 w-full">
                  <div className="grid grid-cols-1">
                    <div className="flex flex-row">
                      <Link
                        onClick={() => viewProductDetail(product)}
                        state={{ pageNumber: pagination.pageNumber, pageSize: pagination.pageSize }}
                        className="font-medium text-blue-600 hover:underline dark:text-blue-500 overflow-hidden"
                      >
                        {product.name}
                      </Link>
                    </div>
                    <div className="flex flex-row text-sm space-x-1">
                      <span className="font font-mono text-gray-500 text-[10px]">{product.description}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col pl-0.2 pr-2">
                  <div>
                    <span className="w-full text text-center font-mono text-red-700 font-semibold">{formatVND(product.unitPrice)}</span>
                  </div>
                  <div className="relative flex items-center w-full mb-2">
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
                      className="bg-gray-50 border-x-0 border-gray-300 h-7 text-center text-gray-900 focus:ring-blue-500 focus:border-blue-500 block w-9 py-1 pr-0 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
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

        <Button className="px-3 py-2 mt-2 mx-3 h-9" onClick={comfirmOrderInvoice} disabled={order.totalOrder <= 0}>Order</Button>
      </div>

      <Modal
        show={showPotentialGuestModal}
        onClose={cancelOrder}
        popup={true}
      >
        <Modal.Header>

        </Modal.Header>
        <Modal.Body>
          <div className="flex flex-col">
            {potentialInvoices && potentialInvoices.length > 0 ?
              <div>
                <div><span className="font italic">Please choose your name</span></div>
                <div className="flex flex-col space-y-2">
                  {potentialInvoices.map(inv =>
                    <div
                      key={inv.id}
                      className={choosenGuest.id === inv.id
                        ? "flex flex-col py-1 px-2  border border-gray-100 shadow-sm rounded-md bg-amber-600 dark:bg-slate-500"
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
                <div className="pt-4"><span className="font italic">Could not find your name in above list</span>
                  <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
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
          <Button onClick={submitOrder} disabled={choosenGuest.id === undefined && guestName === ''}>Confirm</Button>
          <Button color="gray" onClick={cancelOrder}>Cancel</Button>
        </Modal.Footer>
      </Modal>


      <Modal
        show={showOrderSentModal}
        onClose={finishOrder}
        popup={true}
      >
        <Modal.Header>Order Sent</Modal.Header>
        <Modal.Body>
          <div className="flex flex-col space-y-2 text-center py-2">
            {orderSentMessage}
          </div>
        </Modal.Body>
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
            <div>
              <div className="flex flex-col">
                <span className="font italic pb-4">Product detail:</span>
                <span>{viewingProduct.description}</span>
              </div>
              {
                viewingProduct.imageUrls ?
                  <div className="flex flex-col space-y-2">
                    {viewingProduct.imageUrls.map(imgUrl =>
                      <img
                        src={imgUrl}
                        alt=""
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
