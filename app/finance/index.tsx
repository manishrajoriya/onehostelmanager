import { View, Text } from 'react-native'
import React from 'react'
import Finance from '@/component/Finance'
import { useAuth } from '@/hooks/authContext'
import useStore from '@/hooks/store'


const index = () => {

  return (
    <Finance />
  )
}

export default index