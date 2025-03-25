import type React from "react";
import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, FlatList } from "react-native";
import { addSeats, fetchSeats, deleteSeat } from "@/firebase/functions";
import { useNavigation } from "@react-navigation/native";
import useStore from "@/hooks/store";

interface Seat {
  id: string;
  seatId: string;
  isAllocated: boolean;
}

const AddSeatsPage: React.FC = () => {
  const [numberOfSeats, setNumberOfSeats] = useState("");
  const [loading, setLoading] = useState(false);
  const [seats, setSeats] = useState<Seat[]>([]);
  const navigation = useNavigation();

  const currentUser = useStore((state: any) => state.currentUser);
  const activeLibrary = useStore((state: any) => state.activeLibrary);

  useEffect(() => {
    loadSeats();
  }, []);

  const loadSeats = async () => {
    setLoading(true);
    try {
      const fetchedSeats = await fetchSeats({ currentUser: currentUser, libraryId: activeLibrary.id });
      setSeats(fetchedSeats);
    } catch (error) {
      console.error("Error fetching seats:", error);
      Alert.alert("Error", "Failed to fetch seats. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSeats = async () => {
    if (!numberOfSeats || Number.parseInt(numberOfSeats) <= 0) {
      Alert.alert("Error", "Please enter a valid number of seats.");
      return;
    }

    setLoading(true);
    try {
      const result = await addSeats({ numberOfSeats: Number.parseInt(numberOfSeats), currentUser, libraryId: activeLibrary.id });
      Alert.alert("Success", result);
      setNumberOfSeats("");
      await loadSeats(); // Reload seats after adding new ones
    } catch (error) {
      Alert.alert("Error: Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSeat = async (seatId: string) => {
    setLoading(true);
    try {
      const result = await deleteSeat(seatId);
      if (result.success) {
        Alert.alert("Success", result.message);
        await loadSeats(); // Reload seats after deletion
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to delete seat. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderSeat = ({ item }: { item: Seat }) => (
    <View style={styles.seatItem}>
      <Text style={styles.seatText}>{item.seatId}</Text>
      <Text style={[styles.statusText, item.isAllocated ? styles.allocatedStatus : styles.availableStatus]}>
        {item.isAllocated ? "Allocated" : "Available"}
      </Text>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteSeat(item.id)}
        disabled={loading}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Seats</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={numberOfSeats}
          onChangeText={setNumberOfSeats}
          placeholder="Enter number of seats"
          keyboardType="numeric"
        />
        <TouchableOpacity
          style={[styles.button, { opacity: loading ? 0.5 : 1 }]}
          onPress={handleAddSeats}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Add Seats</Text>}
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>Current Seats:</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
      ) : (
        <FlatList data={seats} renderItem={renderSeat} keyExtractor={(item) => item.id} style={styles.seatList} />
      )}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Back to Seat Allocation</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#333",
  },
  inputContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: "#fff",
    marginRight: 8,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
  },
  seatList: {
    flex: 1,
  },
  seatItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  seatText: {
    fontSize: 16,
    color: "#333",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  allocatedStatus: {
    color: "red",
  },
  availableStatus: {
    color: "green",
  },
  deleteButton: {
    backgroundColor: "#dc3545",
    padding: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  backButton: {
    backgroundColor: "#6c757d",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AddSeatsPage;