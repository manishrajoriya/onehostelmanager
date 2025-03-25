import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage"; // For local storage
import { getMembers, saveAttendance } from "@/firebase/functions"; // Import Firebase functions
import type { MemberDetails } from "@/types/MemberProfile"; // Replace with your member type
import useStore from "@/hooks/store";

const AttendancePage: React.FC = () => {
  const [members, setMembers] = useState<MemberDetails[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<MemberDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(new Date()); // Use Date object for date picker
  const [showDatePicker, setShowDatePicker] = useState(false); // Control date picker visibility
  const [activeFilter, setActiveFilter] = useState<"all" | "present" | "absent">("all");
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, boolean>>({});

 
  const currentUser = useStore((state: any) => state.currentUser);
  const activeLibrary = useStore((state: any) => state.activeLibrary);
  // Fetch members from Firebase
  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const { members: fetchedMembers } = await getMembers({libraryId: activeLibrary.id, currentUser, pageSize: 10, lastVisible: undefined});
      // filter expired members
      const filtered = fetchedMembers.filter((member) => member.expiryDate > new Date());
      setMembers(filtered);
      setFilteredMembers(filtered);

      // Initialize attendance status from local storage
      const formattedDate = attendanceDate.toISOString().split("T")[0];
      const savedAttendance = await AsyncStorage.getItem(`attendance_${formattedDate}`);
      if (savedAttendance) {
        setAttendanceStatus(JSON.parse(savedAttendance));
      } else {
        const initialStatus: Record<string, boolean> = {};
        fetchedMembers.forEach((member) => {
          initialStatus[member.id] = false; // Default to absent
        });
        setAttendanceStatus(initialStatus);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = members.filter((member) =>
      member.fullName.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredMembers(filtered);
  };

  // Mark member as present
  const markPresent = async (id: string) => {
    const newStatus = { ...attendanceStatus, [id]: true };
    setAttendanceStatus(newStatus);
    await saveAttendanceLocally(newStatus);
  };

  // Mark member as absent
  const markAbsent = async (id: string) => {
    const newStatus = { ...attendanceStatus, [id]: false };
    setAttendanceStatus(newStatus);
    await saveAttendanceLocally(newStatus);
  };

  // Save attendance status locally
  const saveAttendanceLocally = async (status: Record<string, boolean>) => {
    const formattedDate = attendanceDate.toISOString().split("T")[0];
    await AsyncStorage.setItem(`attendance_${formattedDate}`, JSON.stringify(status));
  };

  // Apply filter
  const applyFilter = (filter: "all" | "present" | "absent") => {
    setActiveFilter(filter);
    switch (filter) {
      case "present":
        setFilteredMembers(members.filter((member) => attendanceStatus[member.id]));
        break;
      case "absent":
        setFilteredMembers(members.filter((member) => !attendanceStatus[member.id]));
        break;
      default:
        setFilteredMembers(members);
        break;
    }
  };

  // Handle date change from date picker
  const onDateChange = async (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setAttendanceDate(selectedDate);
      if (Platform.OS === "android") {
        setShowDatePicker(false); // Hide picker on Android after selection
      }
      // Fetch attendance for the new date
      await fetchMembers();
    }
  };

  // Save attendance to Firebase
  const handleSaveAttendance = async () => {
    const formattedDate = attendanceDate.toISOString().split("T")[0]; // Format date as YYYY-MM-DD
    const attendanceData = {
      date: formattedDate,
      members: members.map((member) => ({
        id: member.id,
        fullName: member.fullName,
        isPresent: attendanceStatus[member.id] || false, // Default to false if undefined
      })),
    };

    try {
      await saveAttendance({ currentUser, attendanceData, libraryId: activeLibrary.id });
      Alert.alert("Success", "Attendance saved successfully!");
    } catch (error) {
      console.error("Error saving attendance:", error);
      Alert.alert("Error", "Failed to save attendance. Please try again.");
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [attendanceDate]);

  // Render member item
  const renderItem = ({ item }: { item: MemberDetails }) => (
    <View style={styles.memberItem}>
      <Text style={styles.memberName}>{item.fullName}</Text>
      <View style={styles.attendanceButtonsContainer}>
        <TouchableOpacity
          style={[
            styles.attendanceButton,
            attendanceStatus[item.id] && styles.activeButton,
          ]}
          onPress={() => markPresent(item.id)}
        >
          <Text style={styles.attendanceButtonText}>Present</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.attendanceButton,
            attendanceStatus[item.id] === false && styles.activeButton,
          ]}
          onPress={() => markAbsent(item.id)}
        >
          <Text style={styles.attendanceButtonText}>Absent</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Date Picker Section */}
      <View style={styles.datePickerContainer}>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.datePickerButtonText}>
            {attendanceDate.toDateString()}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={attendanceDate}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={onDateChange}
          />
        )}
      </View>

      {/* Search Bar */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search members..."
        value={searchQuery}
        onChangeText={handleSearch}
      />

      {/* Filters */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === "all" && styles.activeFilter,
          ]}
          onPress={() => applyFilter("all")}
        >
          <Text style={styles.filterText}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === "present" && styles.activeFilter,
          ]}
          onPress={() => applyFilter("present")}
        >
          <Text style={styles.filterText}>Present</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === "absent" && styles.activeFilter,
          ]}
          onPress={() => applyFilter("absent")}
        >
          <Text style={styles.filterText}>Absent</Text>
        </TouchableOpacity>
      </View>

      {/* Member List */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#6B46C1" />
      ) : (
        <FlatList
          data={filteredMembers}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.noMembersText}>No members found.</Text>
          }
        />
      )}

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSaveAttendance}>
        <Text style={styles.saveButtonText}>Save Attendance</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  datePickerContainer: {
    marginBottom: 16,
  },
  datePickerButton: {
    backgroundColor: "#6B46C1",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  datePickerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  searchBar: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  filterButton: {
    padding: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
  },
  activeFilter: {
    backgroundColor: "#6B46C1",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  memberItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 2,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  attendanceButtonsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  attendanceButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
  },
  activeButton: {
    backgroundColor: "#6B46C1",
  },
  attendanceButtonText: {
    color: "#333",
    fontWeight: "500",
  },
  noMembersText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    color: "#666",
  },
  saveButton: {
    backgroundColor: "#6B46C1",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default AttendancePage;