'use client'

import { useState } from 'react'
import {
    Box,
    IconButton,
    TextField,
    Stack,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    Typography,
    List,
    ListItem,
    ListItemText,
    Badge,
} from '@mui/material'

import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined'
import { useSnackbar } from 'notistack'

const NOTE_COLORS = [
    '#FFF9C4', // yellow
    '#E3F2FD', // blue
    '#E8F5E9', // green
    '#FCE4EC', // pink
    '#F3E5F5', // purple
]

export default function QuickNote() {
    const { enqueueSnackbar } = useSnackbar()
    const [text, setText] = useState('')
    const [bgColor, setBgColor] = useState(NOTE_COLORS[0])
    const [image, setImage] = useState<string | null>(null)
    const [openList, setOpenList] = useState(false)
    const [notes, setNotes] = useState<any[]>([])
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
    const [noteCount, setNoteCount] = useState(0)

    const handleSelectNote = (note: any) => {
        setText(note.text || '')
        setImage(note.image || null)
        setBgColor(note.color)
        setActiveNoteId(note.id)
        setOpenList(false)
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setImage(URL.createObjectURL(file))
    }

    const loadNotes = () => {
        const saved = JSON.parse(
            localStorage.getItem('quick_notes') || '[]'
        )
        setNotes(saved)
        setNoteCount(saved.length)
    }


    const handleSave = () => {
        if (!text && !image) return

        const existing = JSON.parse(
            localStorage.getItem('quick_notes') || '[]'
        )

        let updatedNotes

        if (activeNoteId) {
            // ✏️ Update existing note
            updatedNotes = existing.map((note: any) =>
                note.id === activeNoteId
                    ? {
                        ...note,
                        text,
                        image,
                        color: bgColor,
                    }
                    : note
            )
        } else {
            // ➕ New note
            const newNote = {
                id: crypto.randomUUID(),
                text,
                image,
                color: bgColor,
                createdAt: Date.now(),
            }
            updatedNotes = [newNote, ...existing]
        }
        enqueueSnackbar('Note added 🎉', {
            variant: 'success',
        })
        localStorage.setItem('quick_notes', JSON.stringify(updatedNotes))
        setNoteCount(updatedNotes.length)
        // reset editor
        setText('')
        setImage(null)
        setActiveNoteId(null)
    }


    return (
        <Box
            sx={{
                width: 280,
                minHeight: 260,
                bgcolor: bgColor,
                borderRadius: 2,
                boxShadow: 4,
                p: 2,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Toolbar */}
            <Stack direction="row" spacing={1} mb={1}>
                <Tooltip title="Write note">
                    <IconButton size="small">
                        <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Add image">
                    <IconButton size="small" component="label">
                        <ImageOutlinedIcon fontSize="small" />
                        <input
                            hidden
                            accept="image/*"
                            type="file"
                            onChange={handleImageUpload}
                        />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Clear note">
                    <IconButton
                        size="small"
                        onClick={() => {
                            setText('')
                            setImage(null)
                        }}
                    >
                        <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                </Tooltip>

                <Tooltip title="All notes">
                    <IconButton
                        size="small"
                        onClick={() => {
                            loadNotes()
                            setOpenList(true)
                        }}
                    >
                        <Badge
                            badgeContent={noteCount}
                            color="primary"
                            overlap="circular"
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                        >
                            <ListAltOutlinedIcon fontSize="small" />
                        </Badge>
                    </IconButton>
                </Tooltip>
            </Stack>

            {/* Image Preview */}
            {image && (
                <Box
                    component="img"
                    src={image}
                    alt="note"
                    sx={{
                        width: '100%',
                        borderRadius: 1,
                        mb: 1,
                        objectFit: 'cover',
                    }}
                />
            )}

            {/* Text Area */}
            <TextField
                multiline
                placeholder="Write your note..."
                variant="standard"
                value={text}
                onChange={(e) => setText(e.target.value)}
                InputProps={{
                    disableUnderline: true,
                }}
                sx={{
                    flexGrow: 1,
                    fontSize: 14,
                }}
            />

            {/* Color Picker */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Stack direction="row" spacing={1} mt={2}>
                    {NOTE_COLORS.map((color) => (
                        <Box
                            key={color}
                            onClick={() => setBgColor(color)}
                            sx={{
                                width: 20,
                                height: 20,
                                bgcolor: color,
                                borderRadius: '50%',
                                cursor: 'pointer',
                                border:
                                    bgColor === color
                                        ? '2px solid #000'
                                        : '1px solid #ccc',
                            }}
                        />
                    ))}
                </Stack>
                <Box display="flex" justifyContent="flex-end" mt={2}>
                    <Tooltip title="Save note">
                        <IconButton
                            onClick={handleSave}
                            sx={{
                                bgcolor: 'rgba(0,0,0,0.1)',
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.2)' },
                            }}
                        >
                            <SaveOutlinedIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
            <Dialog
                open={openList}
                onClose={() => setOpenList(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Saved Notes</DialogTitle>

                <DialogContent dividers>
                    {notes.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            No notes yet
                        </Typography>
                    ) : (
                        <List>
                            {notes.map((note) => (
                                <ListItem
                                    key={note.id}
                                    onClick={() => handleSelectNote(note)}
                                    sx={{
                                        bgcolor: note.color,
                                        mb: 1,
                                        borderRadius: 1,
                                    }}
                                >
                                    <ListItemText
                                        primary={note.text || 'Image note'}
                                        secondary={new Date(note.createdAt).toLocaleString()}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    )
}
