export const dateToISODate = (date) => {
    return new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString().substring(0, 10)
}

export const formatVND = (amount) => {
    return amount.toLocaleString('us-US', { style: 'currency', currency: 'VND' })
}

export const lastDateOf = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export const lastDateOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export const beginOfDay = (date) => {
    date.setHours(7, 0, 0, 0)
    return date
}

export const endOfDay = (date) => {
    date.setHours(23)
    date.setMinutes(59)
    date.setSeconds(59)
    return date
}

export const addDays = (date, numOfDays) => {
    return new Date(date.getTime() + numOfDays * 86400000)
}

export const adjustMonths = (date, numOfMonths) => {
    return new Date(date.setMonth(date.getMonth() + numOfMonths))
}

export const beginOfMonth = (date) => {
    date.setDate(1)
    beginOfDay(date)
    return date
}

const dateShortOptions = { year: 'numeric', month: 'short', day: 'numeric' }
export const formatShortDate = (date) => {
    // Format: Jul 30, 2024
    return date.toLocaleDateString("en-US", dateShortOptions)
}

export const formatISODate = (date) => {
    // Format: 2024-07-30
    return date.toISOString().substring(0, 10)
}

const date2DigitOptions = { year: 'numeric', month: '2-digit', day: 'numeric' }
export const format2DigitDate = (date) => {
    // Format: 07/30/2024
    return date.toLocaleDateString("en-US", date2DigitOptions)
}

const dateMonthOptions = { month: 'short', day: 'numeric' }
export const formatDateMonthDate = (date) => {
    // Format: Jul 30
    return date.toLocaleDateString("en-US", dateMonthOptions)
}