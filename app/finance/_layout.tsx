import { Stack } from "expo-router";


export default function FinanceLayout() {
    return (
        <Stack >
            <Stack.Screen name="index" options={{ title: 'Finance' }} />   
        </Stack>
    )
}