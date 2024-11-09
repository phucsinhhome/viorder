const requestOptions = {
  method: 'GET'
}

export const collectRes = (fromDate, toDate) => {
  console.info("Call API to collect reservations");
  const opts = {
    method: 'GET'
  }

  return fetch(`${process.env.REACT_APP_RESERVATION_EXTRACTOR_SERVICE_ENDPOINT}/reservation/collect?fromDate=${fromDate}&toDate=${toDate}&topic=${process.env.REACT_APP_RESERVATION_TOPIC}`, opts);
}