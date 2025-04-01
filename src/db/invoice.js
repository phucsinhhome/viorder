export const listStayingAndComingInvoices = (fromDate, page, size) => {
    console.info("Fetching invoices from backend")

    var opts = {
        method: 'GET'
    }

    return fetch(`${process.env.REACT_APP_INVOICE_SERVICE_ENDPOINT}/list/upcoming?fromDate=${fromDate}&includePrepaid=false&page=${page}&size=${size}`, opts)
}

export const getInvoice = (invoiceId) => {
    console.info("Get invoice by id")

    var opts = {
        method: 'GET'
    }

    return fetch(`${process.env.REACT_APP_INVOICE_SERVICE_ENDPOINT}/${invoiceId}`, opts)
}