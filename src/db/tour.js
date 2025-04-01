
export const listTours = (page, size) => {
  console.info(`Fetch tours from backend`)
  var opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_TOUR_ENDPOINT}/list?page=${page}&size=${size}`, opts);
}

export const getTour = (tourId) => {
  console.info(`Get tour by id ${tourId}`)
  var opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_TOUR_ENDPOINT}/${tourId}`, opts);
}