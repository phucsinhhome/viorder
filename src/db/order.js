

export const startOrder = (resolverId, startTime) => {
  console.info("Start an order")
  var opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_ORDER_ENDPOINT}/start?resolverId=${resolverId}&startTime=${startTime}`, opts)
    .then(response => response.json())
}

export const addOrderItem = (orderId, item) => {
  console.info("Add item into order")
  var opts = {
    method: 'POST',
    data: item
  }
  return fetch(`${process.env.REACT_APP_INVENTORY_ENDPOINT}/${orderId}/product/add`, opts);
}