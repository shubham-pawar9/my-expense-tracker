let reminderTimer: any = null

export async function requestNotificationPermission() {
    if (!('Notification' in window)) return
    if (Notification.permission === 'granted') return

    await Notification.requestPermission()
}


export function startWaterReminder(reminder: any, testMode = false) {
    stopWaterReminder()
    if (!reminder.enabled) return
    if (Notification.permission !== 'granted') return

    const intervalMs = testMode ? 10000 : reminder.interval * 60 * 1000

    reminderTimer = setInterval(() => {
        if (!isWithinTime(reminder.startTime, reminder.endTime)) return

        // Play sound if app is visible
        if (document.visibilityState === 'visible') {
            const audio = new Audio('/sounds/water-reminder.mp3')
            audio.play().catch(() => { })
        }

        navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification('💧 Drink Water', {
                body: 'Time to hydrate yourself',
                icon: '/icons/icon-192.png',
                tag: 'water-reminder-' + Date.now(), // unique
                renotify: true,
            } as NotificationOptions)
        })
    }, intervalMs)
}

export function stopWaterReminder() {
    if (reminderTimer) {
        clearInterval(reminderTimer)
        reminderTimer = null
    }
}


function isWithinTime(start: string, end: string) {
    const now = new Date()
    const [sh, sm] = start.split(':').map(Number)
    const [eh, em] = end.split(':').map(Number)

    const startTime = new Date()
    startTime.setHours(sh, sm, 0)

    const endTime = new Date()
    endTime.setHours(eh, em, 0)

    return now >= startTime && now <= endTime
}
