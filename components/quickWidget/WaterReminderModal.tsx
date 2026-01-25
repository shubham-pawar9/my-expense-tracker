'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
    TextField,
} from '@mui/material'
import { requestNotificationPermission, startWaterReminder } from '../utils/waterReminder'

export default function WaterReminderModal({
    open,
    onClose,
}: {
    open: boolean
    onClose: () => void
}) {
    const [enabled, setEnabled] = useState(false)
    const [interval, setInterval] = useState(60)
    const [startTime, setStartTime] = useState('08:00')
    const [endTime, setEndTime] = useState('22:00')

    const handleSave = async () => {
        const reminder = {
            enabled,
            interval,
            startTime,
            endTime,
        }

        localStorage.setItem('waterReminder', JSON.stringify(reminder))

        if (enabled) {
            await requestNotificationPermission()
            startWaterReminder(reminder)
        }

        onClose()
    }

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle>💧 Water Reminder</DialogTitle>

            <DialogContent>
                <Stack spacing={3} mt={1}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={enabled}
                                onChange={(e) => setEnabled(e.target.checked)}
                            />
                        }
                        label="Enable Reminder"
                    />

                    <FormControl fullWidth disabled={!enabled}>
                        <InputLabel>Interval</InputLabel>
                        <Select
                            value={interval}
                            label="Interval"
                            onChange={(e) =>
                                setInterval(Number(e.target.value))
                            }
                        >
                            <MenuItem value={30}>Every 30 minutes</MenuItem>
                            <MenuItem value={60}>Every 1 hour</MenuItem>
                            <MenuItem value={120}>Every 2 hours</MenuItem>
                            <MenuItem value={1440}>Once a day</MenuItem>
                        </Select>
                    </FormControl>

                    <Stack direction="row" spacing={2}>
                        <TextField
                            type="time"
                            label="Start"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            disabled={!enabled}
                        />
                        <TextField
                            type="time"
                            label="End"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            disabled={!enabled}
                        />
                    </Stack>
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={handleSave}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    )
}
