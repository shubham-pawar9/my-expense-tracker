'use client'

import React, { useState } from 'react'
import { Box, Container, Typography, Paper } from '@mui/material'
import { LoginForm } from '@/components/auth/LoginForm'
import { SignupForm } from '@/components/auth/SignupForm'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import SplashScreen from '@/components/splashScreen/SplashScreen'

export default function Home() {
  const [isLogin, setIsLogin] = useState(true)
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <SplashScreen />
        </Box>
      </Container>
    )
  }

  if (user) {
    return null
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Paper
            elevation={0}
            sx={{
              textAlign: 'center',
              py: 4,
              mb: 4,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            <Typography variant="h2" component="h1" gutterBottom>
              Expense Tracker
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Take control of your finances with smart expense tracking
            </Typography>
          </Paper>

          {isLogin ? (
            <LoginForm onSwitchToSignup={() => setIsLogin(false)} />
          ) : (
            <SignupForm onSwitchToLogin={() => setIsLogin(true)} />
          )}
        </Box>
      </Container>
    </Box>
  )
} 