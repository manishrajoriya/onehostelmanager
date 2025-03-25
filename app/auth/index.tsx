import { View, Text } from 'react-native'
import React from 'react'
import  LoginScreen  from '@/component/AuthScreen'
import { useRouter } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'

const index = () => {
  const router = useRouter()

  return (
    <SafeAreaProvider>
      <LoginScreen />
    </SafeAreaProvider>
    
  )
}

export default index