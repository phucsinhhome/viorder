
export const listTourRequests = (tourId, fromDate, toDate) => {
  console.info(`Fetch tour requests for tour ${tourId} from ${fromDate} to ${toDate}`)
  var opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_TOUR_REQUEST_ENDPOINT}/list?tourId=${tourId}&fromDate=${fromDate}&toDate=${toDate}`, opts);
}

export const requestToJoin = (request, tryOut) => {
  var opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  }
  return fetch(`${process.env.REACT_APP_TOUR_REQUEST_ENDPOINT}/join?tryOut=${tryOut}`, opts);
}