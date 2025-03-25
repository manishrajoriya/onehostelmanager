import { Stack } from "expo-router";

export default function MemberDataLayout() {
    return (
        <Stack >
            <Stack.Screen name="index" options={{ title: 'Add Member' }} />
        </Stack>
    )
}