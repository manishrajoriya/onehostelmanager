import { Stack } from "expo-router";


export default function MemberProfileLayout() {
    return (
        <Stack >
            <Stack.Screen name="index" options={{ title: 'Member Profile' }} />   
        </Stack>
    )
}