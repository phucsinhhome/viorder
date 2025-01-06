export const getProductGroup = (name) => {
  console.info("Fetch the product group by name %s", name)
  let opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_PRODUCT_GROUP_ENDPOINT}/name/${name}`, opts)
}