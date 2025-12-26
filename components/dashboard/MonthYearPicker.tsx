'use client'

import React from 'react'
import {
  Box,
  IconButton,
  Typography,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material'
import { format, addMonths, subMonths } from 'date-fns'
import { DateSelection } from '@/types'

interface MonthYearPickerProps {
  selectedDate: DateSelection
  onDateChange: (date: DateSelection) => void
}

export const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  selectedDate,
  onDateChange,
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const currentDate = new Date(selectedDate.year, selectedDate.month)

  const handlePrevMonth = () => {
    const newDate = subMonths(currentDate, 1)
    onDateChange({
      month: newDate.getMonth(),
      year: newDate.getFullYear(),
    })
  }

  const handleNextMonth = () => {
    const newDate = addMonths(currentDate, 1)
    onDateChange({
      month: newDate.getMonth(),
      year: newDate.getFullYear(),
    })
  }

  const handleCurrentMonth = () => {
    const now = new Date()
    onDateChange({
      month: now.getMonth(),
      year: now.getFullYear(),
    })
  }

  const isCurrentMonth = () => {
    const now = new Date()
    return selectedDate.month === now.getMonth() && selectedDate.year === now.getFullYear()
  }

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isMobile ? 1 : 2,
        p: isMobile ? 1.5 : 2,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 3,
        mb: 2,
      }}
    >
      <IconButton
        onClick={handlePrevMonth}
        sx={{
          color: 'white',
          bgcolor: 'rgba(255,255,255,0.15)',
          '&:hover': {
            bgcolor: 'rgba(255,255,255,0.25)',
          },
        }}
        size={isMobile ? 'small' : 'medium'}
      >
        <ChevronLeftIcon />
      </IconButton>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          minWidth: isMobile ? 140 : 180,
          justifyContent: 'center',
        }}
      >
        <CalendarIcon sx={{ color: 'white', fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
        <Typography
          variant={isMobile ? 'subtitle1' : 'h6'}
          sx={{
            color: 'white',
            fontWeight: 600,
            letterSpacing: '0.5px',
          }}
        >
          {format(currentDate, 'MMMM yyyy')}
        </Typography>
      </Box>

      <IconButton
        onClick={handleNextMonth}
        sx={{
          color: 'white',
          bgcolor: 'rgba(255,255,255,0.15)',
          '&:hover': {
            bgcolor: 'rgba(255,255,255,0.25)',
          },
        }}
        size={isMobile ? 'small' : 'medium'}
      >
        <ChevronRightIcon />
      </IconButton>

      {!isCurrentMonth() && (
        <IconButton
          onClick={handleCurrentMonth}
          sx={{
            color: 'white',
            bgcolor: 'rgba(255,255,255,0.2)',
            fontSize: '0.75rem',
            borderRadius: 2,
            px: 1.5,
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.3)',
            },
          }}
          size="small"
        >
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            Today
          </Typography>
        </IconButton>
      )}
    </Paper>
  )
}

