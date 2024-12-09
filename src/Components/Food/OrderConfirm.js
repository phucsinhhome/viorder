import { useState, useEffect } from "react";
import { deleteInvoice, listAllFoods as listAllFoods } from "../../db/food";
import { Link, useLocation, useParams } from "react-router-dom";
import { Avatar, Button, Label, Modal, Table } from "flowbite-react";
import Moment from "react-moment";
import { DEFAULT_PAGE_SIZE } from "../../App";
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { formatISODate, formatISODateTime, formatVND } from "../../Service/Utils";
import { addOrderItem, commitOrder, confirmOrder, fetchOrder, getPotentialInvoices, rejectOrder, startOrder } from "../../db/order";


export const OrderConfirm = () => {

  const [order, setOrder] = useState({})
  const [message, setMessage] = useState('No item')

  const { orderId, staffId } = useParams()
  const readOrder = () => {
    console.info("Loading the order")

    fetchOrder(orderId)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then(data => {
              setOrder(data)
            })
        }
      })
  }

  useEffect(() => {
    readOrder();

    // eslint-disable-next-line
  }, [orderId]);

  //================ ORDER ==========================//


  const sendToPreparation = () => {

    confirmOrder(orderId, staffId)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then(data => {
              console.info("Send oder to preparation %s successfully", data.orderId)
              setOrder({})
              setMessage("Confirmed successfully")
            })
        }
      })
  }

  const stopPreparation = () => {

    rejectOrder(orderId, staffId)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then(data => {
              console.info("Order %s has been rejected", data.orderId)
              setOrder({})
              setMessage("Order has been rejected")
            })
        }
      })
  }


  return (
    <div className="h-full pt-3">
      <div className="max-h-fit overflow-hidden">
        <div className="flex flex-col space-y-1">
          {order.products ? order.products.map((item) => {
            return (
              <div
                className="flex flex-row items-center border border-gray-300 shadow-2xl rounded-md bg-white dark:bg-slate-500 "
                key={item.id}
              >
                <div className="pl-0.5 pr-1">
                  <Avatar img={item.featureImgUrl} alt="dish image" rounded className="w-12" />
                </div>
                <div className="px-0 w-full">
                  <div className="grid grid-cols-1">
                    <div className="flex flex-row">
                      <Link
                        to={item.id}
                        className="font-medium text-blue-600 hover:underline dark:text-blue-500 overflow-hidden"
                      >
                        {item.name}
                      </Link>
                    </div>
                    <div className="flex flex-row text-sm space-x-1">
                      <span className="font font-mono text-gray-500 text-[10px]">{item.description}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col pl-0.2 pr-2">
                  <div>
                    <span className="w-full text text-center font-mono text-red-700 font-semibold">{formatVND(item.unitPrice)}</span>
                  </div>
                  <div className="relative flex items-center w-full mb-2">
                    <button
                      type="button"
                      id="decrement-button"
                      data-input-counter-decrement="quantity-input"
                      className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-s-lg py-1 px-2 h-7 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
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
                      value={item.quantity}
                      readOnly
                    />
                    <button
                      type="button"
                      id="increment-button"
                      data-input-counter-increment="quantity-input"
                      className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-e-lg py-1 px-2 h-7 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
                    >
                      <svg className="w-3 h-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 1v16M1 9h16" />
                      </svg>
                    </button>
                  </div>
                </div>

              </div>
            )
          }) : <>{message}</>}
        </div>
      </div>
      <div className="flex flex-row items-center justify-between">
        <Button className="px-3 py-2 mt-2 mx-3 h-9" onClick={stopPreparation} disabled={order.products === undefined}>Reject</Button>
        <Button className="px-3 py-2 mt-2 mx-3 h-9" onClick={sendToPreparation} disabled={order.products === undefined}>Confirm</Button>
      </div>
    </div >
  );
}
