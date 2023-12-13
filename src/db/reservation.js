const requestOptions = {
  method: 'GET'
}

export const updateReservation = (reservation) => {
  console.info("Call API to export reservation");
  const opts = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: new Blob([JSON.stringify(reservation)])
  }

  return fetch(`${process.env.REACT_APP_RESERVATION_SERVICE_ENDPOINT}/update`, opts);
}

export const listLatestReservations = (fromDate, toDate, pageNumber, pageSize) => {
  console.info("Fetching reservations from backend")
  return fetch(`${process.env.REACT_APP_RESERVATION_SERVICE_ENDPOINT}/list?fromDate=${fromDate}&toDate=${toDate}&page=${pageNumber}&size=${pageSize}`, requestOptions)
    .then(response => response.json())
}

export const listStayingAndComingReservations = (fromDate, pageNumber, pageSize) => {
  console.info("Fetching reservations from backend")

  var opts = {
    method: 'GET'
  }

  return fetch(`${process.env.REACT_APP_RESERVATION_SERVICE_ENDPOINT}/list/upcoming?fromDate=${fromDate}&page=${pageNumber}&size=${pageSize}`, opts)
    .then(response => response.json())
}

export function getReservation(reservationId) {
  console.info("Fetching reservation from backend")
  return fetch(`${process.env.REACT_APP_RESERVATION_SERVICE_ENDPOINT}/${reservationId}`, requestOptions)
    .then(response => response.json())
}