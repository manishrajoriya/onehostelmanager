import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { addRoom, fetchRoomsByType, Room, RoomUpdate, assignStudentToRoom, removeStudentFromRoom } from '../../firebase/hostel';
import { StudentPicker } from '@/component/room/StudentPicker';
// import { Student } from '../../types/Student';
import { DocumentData, QueryDocumentSnapshot } from '@firebase/firestore';

type RoomType = 'AC' | 'Non-AC' | 'Dormitory';

export default function RoomManagementScreen() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedType, setSelectedType] = useState<RoomType>('AC');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isStudentModalVisible, setIsStudentModalVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // New room form state
  const [newRoom, setNewRoom] = useState<Omit<Room, 'id' | 'createdAt' | 'updatedAt'>>({
    roomNumber: '',
    capacity: 2,
    occupiedBeds: 0,
    roomType: 'AC',
    students: []
  });

  // Load rooms with pagination
const loadRooms = useCallback(async (type: RoomType, loadMore = false) => {
  try {
    if (!loadMore) {
      setIsLoading(true);
      setRooms([]);
      setLastVisible(null);
      setHasMore(true);
    }

    const { rooms: fetchedRooms, lastVisible: newLastVisible } = await fetchRoomsByType(type);
    console.log(fetchedRooms);
    setRooms(prev => {
      // Filter out duplicates when loading more
      const newRooms = loadMore 
        ? fetchedRooms.filter(newRoom => 
            !prev.some(existingRoom => existingRoom.id === newRoom.id)
          )
        : fetchedRooms;
      
      return loadMore ? [...prev, ...newRooms] : newRooms;
    });
    
    setLastVisible(newLastVisible);
    setHasMore(fetchedRooms.length > 0);
  } catch (error) {
    console.error('Failed to load rooms:', error);
    Alert.alert('Error', 'Failed to load rooms. Please try again.');
  } finally {
    setIsLoading(false);
    setRefreshing(false);
  }
}, [lastVisible]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadRooms(selectedType);
  }, [selectedType]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      loadRooms(selectedType, true);
    }
  }, [isLoading, hasMore, selectedType]);

  // Initial load and when room type changes
  useEffect(() => {
    loadRooms(selectedType);
  }, [selectedType]);

  // Add new room
  const handleAddRoom = async () => {
    try {
      setIsLoading(true);
      await addRoom(newRoom);
      setIsModalVisible(false);
      setNewRoom({
        roomNumber: '',
        capacity: 2,
        occupiedBeds: 0,
        roomType: 'AC',
        students: []
      });
      loadRooms(newRoom.roomType);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add room');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle student assignment
  const handleAssignStudent = async (student: any) => {
    if (!selectedRoom) return;
    
    try {
      setIsLoading(true);
      await assignStudentToRoom(selectedRoom.id!, student.id);
      setIsStudentModalVisible(false);
      loadRooms(selectedRoom.roomType);
      Alert.alert('Success', `${student.name} assigned to room ${selectedRoom.roomNumber}`);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to assign student');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle student removal
  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedRoom) return;
    
    try {
      setIsLoading(true);
      await removeStudentFromRoom(selectedRoom.id!, studentId);
      loadRooms(selectedRoom.roomType);
      Alert.alert('Success', 'Student removed from room');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to remove student');
    } finally {
      setIsLoading(false);
    }
  };

  // Render room type selector
  const renderTypeSelector = () => (
    <View style={styles.typeSelector}>
      {(['AC', 'Non-AC', 'Dormitory'] as RoomType[]).map(type => (
        <TouchableOpacity
          key={type}
          style={[
            styles.typeButton,
            selectedType === type && styles.selectedTypeButton
          ]}
          onPress={() => setSelectedType(type)}
        >
          <Text style={[
            styles.typeText,
            selectedType === type && styles.selectedTypeText
          ]}>
            {type}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render room item
 const renderRoomItem = ({ item }: { item: Room }) => {
  console.log('Rendering room:', item); // Add this for debugging
  return (
    <View style={styles.roomCard}>
      <View style={styles.roomHeader}>
        <Text style={styles.roomNumber}>Room {item.roomNumber}</Text>
        <View style={styles.roomStatus}>
          <View style={[
            styles.statusIndicator,
            item.occupiedBeds >= item.capacity ? styles.statusFull : styles.statusAvailable
          ]} />
          <Text style={styles.statusText}>
            {item.occupiedBeds}/{item.capacity} beds
          </Text>
        </View>
      </View>
      
      <View style={styles.roomDetails}>
        <Text style={styles.roomType}>{item.roomType} Room</Text>
        
        {item.students && item.students.length > 0 ? (
          <View style={styles.studentsContainer}>
            <Text style={styles.studentsTitle}>Students:</Text>
            {item.students.map(studentId => (
              <View key={studentId} style={styles.studentItem}>
                <Text style={styles.studentText}>{studentId}</Text>
                <TouchableOpacity 
                  onPress={() => handleRemoveStudent(studentId)}
                  style={styles.removeButton}
                >
                  <MaterialIcons name="person-remove" size={18} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noStudentsText}>No students assigned</Text>
        )}
      </View>
      
      <View style={styles.roomActions}>
        <TouchableOpacity 
          style={[
            styles.actionButton,
            item.occupiedBeds >= item.capacity && styles.disabledButton
          ]}
          onPress={() => {
            setSelectedRoom(item);
            setIsStudentModalVisible(true);
          }}
          disabled={item.occupiedBeds >= item.capacity}
        >
          <MaterialIcons 
            name="person-add" 
            size={20} 
            color={item.occupiedBeds >= item.capacity ? '#95a5a6' : '#2ecc71'} 
          />
          <Text style={[
            styles.actionText,
            { color: item.occupiedBeds >= item.capacity ? '#95a5a6' : '#2ecc71' }
          ]}>
            Add Student
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="meeting-room" size={48} color="#bdc3c7" />
      <Text style={styles.emptyTitle}>No Rooms Found</Text>
      <Text style={styles.emptySubtitle}>Add a new room to get started</Text>
    </View>
  );

  // Render footer for loading more
  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#3498db" />
      </View>
    );
  };

  return (
    <View style={styles.safeContainer}>
    <View style={styles.container}>
      <Text style={styles.header}>Hostel Room Management</Text>
      
      {renderTypeSelector()}
      
      <View style={styles.listContainer}>
        {isLoading && rooms.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
          </View>
        ) : (
          <FlatList
            data={rooms}
            renderItem={renderRoomItem}
            keyExtractor={(item) => item.id!}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={renderFooter}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#3498db']}
                tintColor="#3498db"
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
          />
        )}
      </View>
      
      {/* Add Room Floating Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setIsModalVisible(true)}
      >
        <MaterialIcons name="add" size={28} color="white" />
      </TouchableOpacity>
      
      {/* Add Room Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Room</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <MaterialIcons name="close" size={24} color="#7f8c8d" />
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.inputLabel}>Room Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 101A"
              value={newRoom.roomNumber}
              onChangeText={(text) => setNewRoom({...newRoom, roomNumber: text})}
            />
            
            <Text style={styles.inputLabel}>Capacity</Text>
            <TextInput
              style={styles.input}
              placeholder="Number of beds"
              keyboardType="numeric"
              value={newRoom.capacity.toString()}
              onChangeText={(text) => setNewRoom({...newRoom, capacity: parseInt(text) || 0})}
            />
            
            <Text style={styles.inputLabel}>Room Type</Text>
            <View style={styles.modalTypeSelector}>
              {(['AC', 'Non-AC', 'Dormitory'] as RoomType[]).map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.modalTypeButton,
                    newRoom.roomType === type && styles.selectedModalTypeButton
                  ]}
                  onPress={() => setNewRoom({...newRoom, roomType: type})}
                >
                  <Text style={newRoom.roomType === type ? styles.selectedModalTypeText : styles.modalTypeText}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddRoom}
              disabled={isLoading || !newRoom.roomNumber || newRoom.capacity <= 0}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitButtonText}>Add Room</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Student Assignment Modal */}
      <StudentPicker
        visible={isStudentModalVisible}
        onClose={() => setIsStudentModalVisible(false)}
        onSelectStudent={handleAssignStudent}
        excludedStudentIds={selectedRoom?.students || []}
      />
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: Platform.OS === 'ios' ? 50 : 100,
  },

  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: Platform.OS === 'ios' ? 50 : 100,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  typeButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
    marginHorizontal: 5,
  },
  selectedTypeButton: {
    backgroundColor: '#3498db',
  },
  typeText: {
    color: '#495057',
    fontWeight: '500',
  },
  selectedTypeText: {
    color: 'white',
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  roomCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  roomNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  roomStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  statusAvailable: {
    backgroundColor: '#2ecc71',
  },
  statusFull: {
    backgroundColor: '#e74c3c',
  },
  statusText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  roomDetails: {
    marginTop: 5,
  },
  roomType: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
    marginBottom: 10,
  },
  studentsContainer: {
    marginTop: 5,
  },
  studentsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 5,
  },
  studentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  studentText: {
    fontSize: 14,
    color: '#6c757d',
  },
  removeButton: {
    padding: 5,
  },
  roomActions: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 5,
  },
  actionText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '500',
  },
  noStudentsText: {
    fontSize: 12,
    color: '#95a5a6',
    fontStyle: 'italic',
    marginTop: 5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#6c757d',
    marginTop: 15,
    fontWeight: '500',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#adb5bd',
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingVertical: 20,
  },
  addButton: {
    position: 'absolute',
    right: 25,
    bottom: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalContent: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 5,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  modalTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTypeButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ced4da',
    alignItems: 'center',
  },
  selectedModalTypeButton: {
    borderColor: '#3498db',
    backgroundColor: '#e7f5ff',
  },
  modalTypeText: {
    color: '#495057',
  },
  selectedModalTypeText: {
    color: '#3498db',
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    marginRight: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ced4da',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#495057',
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    padding: 15,
    marginLeft: 10,
    borderRadius: 5,
    backgroundColor: '#3498db',
    alignItems: 'center',
    opacity: 1,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});