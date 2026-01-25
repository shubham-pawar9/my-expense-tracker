'use client'

import { Box, Typography } from '@mui/material'
import Lottie from 'lottie-react'
import expenseAnim from '@/public/lottie/expense-loader.json'

export default function SplashScreen() {
    return (
        <Box
            sx={{
                position: 'fixed',
                inset: 0,
                bgcolor: '#fff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1300,
            }}
        >
            <Box sx={{ width: 200 }}>
                <Lottie animationData={expenseAnim} loop />
            </Box>

            <Typography
                mt={2}
                variant="h6"
                fontWeight={600}
                color="primary"
            >
                Expense Tracker
            </Typography>

            <Typography variant="body2" color="text.secondary">
                Tracking your money smartly
            </Typography>
        </Box>
    )
}
