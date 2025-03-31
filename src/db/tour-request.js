
export const listTourRequests = (fromDate, toDate, page, size) => {
  console.info(`Fetch tour requests from ${fromDate} to ${toDate}`)
  var opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_TOUR_REQUEST_ENDPOINT}/list?fromDate=${fromDate}&toDate=${toDate}&page=${page}&size=${size}`, opts);
}