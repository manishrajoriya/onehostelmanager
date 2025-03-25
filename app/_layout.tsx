import { Stack } from "expo-router";


export default function RootLayout() {

  return (
    <Stack screenOptions={{ headerShown: false, animation:'slide_from_right', statusBarStyle: 'dark', }}>
      
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
    </Stack>
  )
}