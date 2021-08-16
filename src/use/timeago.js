const MONTH_NAMES = [
    'Janvier',
    'Fevrier',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Decembre',
]

function getFormattedDate(date, prefomattedDate = false, hideYear = false) {
    const day = date.getDate()
    const month = MONTH_NAMES[date.getMonth()]
    const year = date.getFullYear()
    const hours = date.getHours()
    let minutes = date.getMinutes()

    if (minutes < 10) {
        // Adding leading zero to minutes
        minutes = `0${minutes}`
    }

    if (prefomattedDate) {
        // Today at 10:20
        // Yesterday at 10:20
        return `${prefomattedDate} à ${hours}:${minutes}`
    }

    if (hideYear) {
        // 10. January at 10:20
        return `${day}. ${month} à ${hours}:${minutes}`
    }

    // 10. January 2017. at 10:20
    return `${day}. ${month} ${year}. à ${hours}:${minutes}`
}

export default function timeAgo(dateParam) {
    if (!dateParam) {
        return null
    }
    
    const date = typeof dateParam === 'object' ? dateParam : new Date(dateParam)
    const DAY_IN_MS = 86400000 // 24 * 60 * 60 * 1000
    const today = new Date()
    const yesterday = new Date(today - DAY_IN_MS)
    const seconds = Math.round((today - date) / 1000)
    const minutes = Math.round(seconds / 60)
    const isToday = today.toDateString() === date.toDateString()
    const isYesterday = yesterday.toDateString() === date.toDateString()
    const isThisYear = today.getFullYear() === date.getFullYear()

    if (seconds < 5) {
        return 'Maintenant'
    } else if (seconds < 60) {
        return `Il y a ${seconds} seconds`
    } else if (seconds < 90) {
        return 'Il y a 1 minute'
    } else if (minutes < 60) {
        return `Il y a ${minutes} minutes`
    } else if (isToday) {
        return getFormattedDate(date, 'Ajourd\'hui') // Today at 10:20
    } else if (isYesterday) {
        return getFormattedDate(date, 'Hier') // Yesterday at 10:20
    } else if (isThisYear) {
        return getFormattedDate(date, false, true) // 10. January at 10:20
    }

    return getFormattedDate(date) // 10. January 2017. at 10:20
}
