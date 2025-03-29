import { Stack } from "expo-router";


export default function AllotSeatsLayout() {
    return (
        <Stack >
            <Stack.Screen name="index" options={{ title: 'Allocate Room' }} />   
        </Stack>
    )
}