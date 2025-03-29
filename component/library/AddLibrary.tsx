import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  Modal,
  Alert,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { addLibrary, deleteLibrary, getLibraries, updateLibrary } from "@/firebase/functions";
import { Ionicons } from "@expo/vector-icons";
import { useLibrarySelection } from "@/hooks/useLibrarySelect"; // Import the hook
import useStore from "@/hooks/store";

type FormData = {
  name: string;
  address: string;
  description: string;
};

const LibraryForm = ({ onSubmit, onCancel, defaultValues, loading }: any) => {
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues,
  });

  return (
    <View style={styles.formContainer}>
      <Text style={styles.title}>{defaultValues ? "Edit Hostel" : "Add New Hostel"}</Text>

      <View style={styles.inputGroup}>
        <Ionicons name="book-outline" size={20} color="#666" />
        <Controller
          control={control}
          rules={{ required: "Name is required" }}
          render={({ field }) => (
            <TextInput
              style={styles.input}
              placeholder="Library Name"
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
          name="name"
        />
      </View>
      {errors.name && <Text style={styles.error}>{errors.name.message}</Text>}

      <View style={styles.inputGroup}>
        <Ionicons name="location-outline" size={20} color="#666" />
        <Controller
          control={control}
          rules={{ required: "Address is required" }}
          render={({ field }) => (
            <TextInput
              style={styles.input}
              placeholder="Address"
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
          name="address"
        />
      </View>
      {errors.address && <Text style={styles.error}>{errors.address.message}</Text>}

      <View style={styles.inputGroup}>
        <Ionicons name="document-text-outline" size={20} color="#666" />
        <Controller
          control={control}
          rules={{ required: "Description is required" }}
          render={({ field }) => (
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              multiline
              numberOfLines={3}
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
          name="description"
        />
      </View>
      {errors.description && <Text style={styles.error}>{errors.description.message}</Text>}

      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.submitButton]}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{defaultValues ? "Update" : "Create"}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const LibraryItem = ({ item, isActive, onSelect, onEdit, onDelete }: any) => (
  <TouchableOpacity
    style={[styles.libraryCard, isActive && styles.activeLibraryCard]}
    onPress={() => onSelect(item.id)}
  >
    <View style={styles.libraryInfo}>
      <Text style={styles.libraryName}>{item.name}</Text>
      <Text style={styles.libraryAddress}>{item.address}</Text>
      <Text style={styles.libraryDescription}>{item.description}</Text>
    </View>

    <View style={styles.actionButtons}>
      {isActive && <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />}
      <TouchableOpacity onPress={() => onEdit(item)}>
        <Ionicons name="create-outline" size={24} color="#4CAF50" />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => onDelete(item)}>
        <Ionicons name="trash-outline" size={24} color="#f44336" />
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

const AddLibraryScreen = () => {
  const [selectedLibrary, setSelectedLibrary] = useState<any>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentUser = useStore((state: any) => state.currentUser);
  // Use the hook for library selection
  const { libraries, loading: librariesLoading, activeLibrary, handleLibrarySelect, refreshLibraries } = useLibrarySelection();

  const handleAdd = async (data: FormData) => {
    setLoading(true);
    try {
      await addLibrary({ data, currentUser });
      await refreshLibraries(); // Refresh the list of libraries
      setShowFormModal(false);
    } catch (error) {
      Alert.alert("Error", "Failed to create hostel");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: FormData) => {
    if (!selectedLibrary) return;
    setLoading(true);
    try {
      await updateLibrary({ id: selectedLibrary.id, data });
      await refreshLibraries(); // Refresh the list of libraries
      setShowFormModal(false);
    } catch (error) {
      Alert.alert("Error", "Failed to update hostel");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (library: any) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete ${library.name}? All members will be removed from this Hostel `,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", onPress: () => performDelete(library.id) },
      ]
    );
  };

  const performDelete = async (id: string) => {
    setLoading(true);
    try {
      await deleteLibrary({ id });
      await refreshLibraries(); // Refresh the list of libraries
    } catch (error) {
      Alert.alert("Error", "Failed to delete hostel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={libraries}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setSelectedLibrary(null);
              setShowFormModal(true);
            }}
          >
            <Ionicons name="add-circle" size={24} color="white" />
            <Text style={styles.addButtonText}>Add New Hostel</Text>
          </TouchableOpacity>
        }
        renderItem={({ item }) => (
          <LibraryItem
            item={item}
            isActive={activeLibrary?.id === item.id}
            onSelect={handleLibrarySelect}
            onEdit={(library: any) => {
              setSelectedLibrary(library);
              setShowFormModal(true);
            }}
            onDelete={confirmDelete}
          />
        )}
        contentContainerStyle={styles.listContent}
      />

      <Modal visible={showFormModal} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.formWrapper}>
            <LibraryForm
              onSubmit={selectedLibrary ? handleUpdate : handleAdd}
              onCancel={() => setShowFormModal(false)}
              defaultValues={selectedLibrary}
              loading={loading}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContent: {
    padding: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#02c39a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  libraryCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 2,
  },
  activeLibraryCard: {
    borderColor: '#02c39a',
    borderWidth: 2,
  },
  libraryInfo: {
    flex: 1,
  },
  libraryName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  libraryAddress: {
    color: '#666',
    marginBottom: 4,
  },
  libraryDescription: {
    color: '#888',
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  formWrapper: {
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
  },
  error: {
    color: 'red',
    marginBottom: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  submitButton: {
    backgroundColor: '#02c39a',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default AddLibraryScreen;