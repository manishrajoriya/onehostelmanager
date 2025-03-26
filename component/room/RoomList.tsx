import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { addRooms, getRooms } from '@/firebase/hostel';
import useStore from '@/hooks/store';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';

interface Room {
  id: string;
  roomNumber: string;
  capacity: string;
  roomType: string;
  createdAt: Date;
  updatedAt: Date;
}

const RoomsScreen = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    roomNumber: '',
    capacity: '',
    roomType: '',
  });

  const currentUser = useStore((state: any) => state.currentUser);
  const activeLibrary = useStore((state: any) => state.activeLibrary);

  useEffect(() => {
    fetchRooms();
  }, [activeLibrary]);

  const fetchRooms = async () => {
    if (!currentUser || !activeLibrary) return;
    
    setLoading(true);
    try {
      const roomsData = await getRooms({ currentUser, libraryId: activeLibrary.id });
      setRooms(roomsData);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch rooms');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!currentUser || !activeLibrary) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (!formData.roomNumber || !formData.capacity) {
      Alert.alert('Error', 'Room number and capacity are required');
      return;
    }

    try {
      setLoading(true);
      await addRooms({ currentUser, libraryId: activeLibrary.id, roomsData: formData });
      Alert.alert('Success', 'Room added successfully');
      setFormData({
        roomNumber: '',
        capacity: '',
        roomType: '',
      });
      setModalVisible(false);
      fetchRooms();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add room');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderRoomItem = ({ item }: { item: Room }) => (
    <View style={styles.roomItem}>
      <View style={styles.roomHeader}>
        <Text style={styles.roomNumber}>Room #{item.roomNumber}</Text>
        <View style={styles.roomTypeBadge}>
          <Text style={styles.roomTypeText}>{item.roomType}</Text>
        </View>
      </View>
      <View style={styles.roomDetails}>
        <View style={styles.detailRow}>
          <MaterialIcons name="people" size={16} color="#555" />
          <Text style={styles.detailText}>Capacity: {item.capacity}</Text>
        </View>
        <View style={styles.detailRow}>
          <AntDesign name="calendar" size={14} color="#555" />
          <Text style={styles.detailText}>Added: {new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Room Management</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <AntDesign name="plus" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Rooms List */}
      {loading && rooms.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      ) : rooms.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="meeting-room" size={50} color="#ccc" />
          <Text style={styles.emptyText}>No rooms added yet</Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.emptyButtonText}>Add Your First Room</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={rooms}
          renderItem={renderRoomItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={fetchRooms}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Room Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Room</Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <AntDesign name="close" size={24} color="#666" />
              </Pressable>
            </View>
            
            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Room Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="101"
                  value={formData.roomNumber}
                  onChangeText={(text) => handleInputChange('roomNumber', text)}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Capacity</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2"
                  value={formData.capacity}
                  onChangeText={(text) => handleInputChange('capacity', text)}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Room Type</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Single, Double, etc."
                  value={formData.roomType}
                  onChangeText={(text) => handleInputChange('roomType', text)}
                />
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Add Room</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007bff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 20,
  },
  roomItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roomNumber: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#333',
  },
  roomTypeBadge: {
    backgroundColor: '#e3f2fd',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  roomTypeText: {
    color: '#1976d2',
    fontSize: 12,
    fontWeight: '600',
  },
  roomDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    marginLeft: 8,
    color: '#555',
    fontSize: 14,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f1f1',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#007bff',
    marginLeft: 8,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default RoomsScreen;