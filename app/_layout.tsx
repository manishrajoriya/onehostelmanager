import { initializeRevenueCat } from "@/firebase/subscription";
import { Stack } from "expo-router";
import { useEffect } from "react";


export default function RootLayout() {

    useEffect(() => {
    initializeRevenueCat();
  }, []);
  

  return (
    <Stack screenOptions={{ headerShown: false, animation:'slide_from_right', statusBarStyle: 'dark', statusBarTranslucent: true,  }}>
      
      <Stack.Screen name="index" />

      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="memberdata" />
      <Stack.Screen name="memberProfileCard" />
      <Stack.Screen name="addMemberForm" />
      <Stack.Screen name="finance" />
      <Stack.Screen name="memberPaymemt" />
      <Stack.Screen name="onbording" />
      <Stack.Screen name="addLibrary" />
      <Stack.Screen name="editMember" />
      <Stack.Screen name="allotseats" />
    </Stack>
  )
}