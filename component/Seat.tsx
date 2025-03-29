import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { addSeats } from '@/firebase/functions';
import useStore from '@/hooks/store';

type RoomType = "AC" | "Non-AC" | "Dormitory";

const AddSeatsPage = () => {
  const [numberOfSeats, setNumberOfSeats] = useState('');
  const [roomType, setRoomType] = useState<RoomType>("AC");
  const [roomNumber, setRoomNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const currentUser = useStore((state: any) => state.currentUser)
  const activeLibrary = useStore((state: any) => state.activeLibrary)

  const handleAddSeats = async () => {
    try {
      if (!currentUser) {
        Alert.alert('Error', 'User not authenticated.');
        return;
      }

      if (!numberOfSeats || !roomNumber) {
        Alert.alert('Error', 'Please fill all fields.');
        return;
      }

      setIsLoading(true);
      await addSeats({
        currentUser,
        numberOfSeats: parseInt(numberOfSeats, 10),
        libraryId: activeLibrary.id,
        roomType,
        roomNumber,
      });

      Alert.alert('Success', `${numberOfSeats} seats added to ${roomType} room ${roomNumber}`);
      setNumberOfSeats('');
      setRoomNumber('');
    } catch (error) {
      Alert.alert('Error', error as string);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Rooms</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Room Number with floor:</Text>
        <TextInput
          value={roomNumber}
          onChangeText={setRoomNumber}
          placeholder="e.g. 10A"
          keyboardType="default"
          style={styles.input}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Number of Beds:</Text>
        <TextInput
          value={numberOfSeats}
          onChangeText={setNumberOfSeats}
          placeholder="Enter number of beds"
          keyboardType="numeric"
          style={styles.input}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Room Type:</Text>
        <View style={styles.buttonGroup}>
          {['AC', 'Non-AC', 'Dormitory'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.roomTypeButton,
                roomType === type && styles.selectedRoomTypeButton
              ]}
              onPress={() => setRoomType(type as RoomType)}
            >
              <Text style={roomType === type ? styles.selectedButtonText : styles.buttonText}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#02c39a" style={styles.loader} />
      ) : (
        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={handleAddSeats}
          disabled={isLoading}
        >
          <Text style={styles.submitButtonText}>Add Room</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flex: 1,
  },
  title: {
    fontSize: 24,
    marginBottom: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 6,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  roomTypeButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    alignItems: 'center',
  },
  selectedRoomTypeButton: {
    backgroundColor: '#02c39a',
  },
  buttonText: {
    color: '#333',
  },
  selectedButtonText: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#02c39a',
    padding: 15,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 20,
  },
});

export default AddSeatsPage;