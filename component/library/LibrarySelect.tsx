import type React from "react"
import { View, StyleSheet } from "react-native"
import { Picker } from "@react-native-picker/picker"
import { useLibrarySelection } from "@/hooks/useLibrarySelect"

const LibrarySelectionScreen: React.FC = () => {
  const { libraries, loading, activeLibrary, handleLibrarySelect } = useLibrarySelection()

  return (
    <View style={styles.dropdownContainer}>
      <Picker
        selectedValue={activeLibrary?.id || null}
        onValueChange={(itemValue) => handleLibrarySelect(itemValue!)}
        enabled={!loading}
        style={styles.picker}
      >
        {libraries.map((lib: any) => (
          <Picker.Item key={lib.id} label={lib.name} value={lib.id} />
        ))}
      </Picker>
    </View>
  )
}

const styles = StyleSheet.create({
  dropdownContainer: {
    width: 40,
    backgroundColor: "transparent",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 40,
    color: "#fff",
  },
})

export default LibrarySelectionScreen

