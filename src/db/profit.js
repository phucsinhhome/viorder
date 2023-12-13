const requestOptions = {
  method: 'GET',

}

export const getProfitReportThisMonth = (fromDate, toDate, reportKey) => {
  console.info("Fetching report from backend")
  return fetch(`${process.env.REACT_APP_PROFIT_SERVICE_ENDPOINT}/report/${reportKey}?fromDate=${fromDate}&toDate=${toDate}`, requestOptions)
    .then(response => response.json())
}