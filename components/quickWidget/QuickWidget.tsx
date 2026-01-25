'use client'

import { useState } from 'react'
import {
    Box,
    IconButton,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
} from '@mui/material'

import NoteAddOutlinedIcon from '@mui/icons-material/NoteAddOutlined'
import AlarmOutlinedIcon from '@mui/icons-material/AlarmOutlined'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CloseIcon from '@mui/icons-material/Close'
import QuickNote from './QuickNote'
import WaterReminderModal from './WaterReminderModal'

export default function QuickWidget() {
    const [open, setOpen] = useState(false)
    const [openQuickNote, setOpenQuickNote] = useState(false)
    const [openWaterReminder, setOpenWaterReminder] = useState(false)

    return (
        <>
            {/* Floating Icon */}
            <Box
                sx={{
                    position: 'fixed',
                    right: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 1200,
                }}
            >
                <IconButton
                    onClick={() => setOpen(true)}
                    sx={{
                        width: 48,
                        height: 48,
                        bgcolor: 'primary.main',
                        color: '#fff',
                        opacity: 0.5,
                        '&:hover': {
                            opacity: 1,
                            bgcolor: 'primary.dark',
                        },
                        boxShadow: 3,
                    }}
                >
                    <AddCircleOutlineIcon />
                </IconButton>
            </Box>

            {/* Small Drawer */}
            <Drawer
                anchor="right"
                open={open}
                onClose={() => setOpen(false)}
                PaperProps={{
                    sx: {
                        width: 240,
                        borderTopLeftRadius: 12,
                        borderBottomLeftRadius: 12,
                    },
                }}
            >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <strong>Quick Actions</strong>
                    <IconButton size="small" onClick={() => setOpen(false)}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                <List>
                    <ListItemButton
                        onClick={() => {
                            setOpenQuickNote(true)
                            setOpen(false) // optional: close drawer
                        }}
                    >
                        <ListItemIcon>
                            <NoteAddOutlinedIcon />
                        </ListItemIcon>
                        <ListItemText primary="Quick Note" />
                    </ListItemButton>

                    <ListItemButton onClick={() => setOpenWaterReminder(true)}>
                        <ListItemIcon>
                            <AlarmOutlinedIcon />
                        </ListItemIcon>
                        <ListItemText primary="Water Reminder" />
                    </ListItemButton>
                </List>
            </Drawer>
            <WaterReminderModal
                open={openWaterReminder}
                onClose={() => setOpenWaterReminder(false)}
            />
            <Dialog
                open={openQuickNote}
                onClose={() => setOpenQuickNote(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        fontWeight: 600,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    Quick Note
                    <IconButton size="small" onClick={() => setOpenQuickNote(false)}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent>
                    <QuickNote />
                </DialogContent>
            </Dialog>

        </>
    )
}
