import { View, Text } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'


const tabsLayout = () => {
  return (
    <Stack screenOptions={{animation:'slide_from_right'}}>
     <Stack.Screen name="index" options={{ headerShown: false }}/>
    </Stack>
  )
}

export default tabsLayout