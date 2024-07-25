export const dateToISODate = (date) => {
    return new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString().substring(0, 10)
}

export const simpleDateToISODate = (date) => {
    return date.toISOString().substring(0, 10)
}

export const toVND = (amount) => {
    return amount.toLocaleString('us-US', { style: 'currency', currency: 'VND' })
}

export const lastDateOf = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
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

export const adjustMonths = (date, numOfMonths) => {
    return new Date(date.setMonth(date.getMonth() + numOfMonths))
}

export const beginOfMonth = (date) => {
    date.setDate(1)
    beginOfDay(date)
    return date
}