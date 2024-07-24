export const dateToISODate = (date) => {
    return new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString().substring(0, 10)
}