const requestOptions = {
  method: 'GET'
}

export const listAllProducts = () => {
  console.info("Fetching all products")
  return fetch(`${process.env.REACT_APP_INVENTORY_ENDPOINT}/list/like?name=*`, requestOptions)
    .then(response => response.json())
}

export const listProductByGroup = (group, page, size) => {
  console.info("Fetching product by group")
  return fetch(`${process.env.REACT_APP_INVENTORY_ENDPOINT}/list/group?group=${group}&page=${page}&size=${size}`, requestOptions);
}