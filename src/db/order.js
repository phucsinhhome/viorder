

export const startOrder = (resolverId, startTime) => {
  console.info("Start an order")
  var opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_ORDER_ENDPOINT}/start?resolverId=${resolverId}&startTime=${startTime}`, opts);
}

export const addOrderItem = (orderId, item) => {
  console.info("Add item into order")
  var opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  }
  return fetch(`${process.env.REACT_APP_ORDER_ENDPOINT}/${orderId}/product/add`, opts);
}