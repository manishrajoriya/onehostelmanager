import { Stack } from "expo-router";


export default function MemberPaymentLayout() {
    return (
        <Stack >
            <Stack.Screen name="index" options={{ title: 'Member Payment' }} />
        </Stack>
    )
}