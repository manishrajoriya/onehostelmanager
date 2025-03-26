import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
// import { Member } from '../../types/MemberProfile';
import { getMembers } from '../../firebase/hostel';



interface StudentPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectStudent: (student: any) => void;
  excludedStudentIds?: string[];
}

export const StudentPicker: React.FC<StudentPickerProps> = ({
  visible,
  onClose,
  onSelectStudent,
  excludedStudentIds = []
}) => {
  const [students, setStudents] = useState<any>([]);
  const [filteredStudents, setFilteredStudents] = useState<any>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setIsLoading(true);
        const allStudents = await getMembers({
          pageSize: 100,
          currentUser: null,
          libraryId: '',
          filters: {},
          lastVisible: undefined
        });
        setStudents(allStudents.members);
        setFilteredStudents(allStudents.members);
      } catch (error) {
        console.error('Error loading students:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (visible) {
      loadStudents();
    }
  }, [visible]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = students.filter((student: any) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [searchQuery, students]);

  const renderStudentItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.studentItem}
      onPress={() => onSelectStudent(item)}
      disabled={excludedStudentIds.includes(item.id)}
    >
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{item.name}</Text>
        <Text style={styles.studentId}>{item.id}</Text>
      </View>
      {excludedStudentIds.includes(item.id) && (
        <MaterialIcons name="check-circle" size={24} color="#2ecc71" />
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Student</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#7f8c8d" />
          </TouchableOpacity>
        </View>
        
        <TextInput
          style={styles.searchInput}
          placeholder="Search students..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
          </View>
        ) : (
          <FlatList
            data={filteredStudents}
            renderItem={renderStudentItem}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No students found</Text>
              </View>
            }
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 5,
    padding: 12,
    margin: 15,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  studentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    color: '#2c3e50',
  },
  studentId: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
  },
});