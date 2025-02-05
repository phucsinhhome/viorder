export const fetchProductItems = (group, page, size) => {
  console.info("Fetch all the available items of group %s", group)
  var opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_INVENTORY_ENDPOINT}/group-items?group=${group}&page=${page}&size=${size}`, opts);
}