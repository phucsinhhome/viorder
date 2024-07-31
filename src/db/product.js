const requestOptions = {
  method: 'GET'
}

export const listAllProducts = () => {
  console.info("Fetching all products")
  return fetch(`${process.env.REACT_APP_INVENTORY_ENDPOINT}/list/like?name=*`, requestOptions)
    .then(response => response.json())
}