'use client'

import React from 'react'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'
import { FourSquare } from 'react-loading-indicators'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
        }}
      >
        <FourSquare color="#1976d2" size="small" text="Loading..." textColor="#1976d2" />
      </Box>
    )
  }

  if (!user) {
    return null
  }

  return <Dashboard />
} 