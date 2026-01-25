'use client'

import { useEffect } from 'react'
import { startWaterReminder } from '../utils/waterReminder'

export default function PwaBootstrap() {
    useEffect(() => {
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
        }

        // Restore water reminder
        const saved = localStorage.getItem('waterReminder')
        if (saved) {
            const reminder = JSON.parse(saved)
            if (reminder.enabled) {
                startWaterReminder(reminder)
            }
        }
    }, [])

    return null
}
