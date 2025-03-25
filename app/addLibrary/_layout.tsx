import { Stack } from "expo-router";


export default function addLibraryLayout() {
    return (
        <Stack >
            <Stack.Screen name="index" options={{headerTitle: 'Add Library'}} />   
        </Stack>
    )
}