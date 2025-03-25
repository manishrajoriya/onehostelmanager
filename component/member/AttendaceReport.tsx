import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialIcons } from "@expo/vector-icons"; // For icons
import { getAttendanceByDate } from "@/firebase/functions"; // Import your function here
import useStore from "@/hooks/store";

interface Member {
  id: string;
  fullName: string;
  isPresent: boolean;
}

interface Attendance {
  id: string;
  timestamp: string;
  members: Member[];
}

const AttendanceScreen: React.FC = () => {
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  const currentUser = useStore((state: any) => state.currentUser);
  const activeLibrary = useStore((state: any) => state.activeLibrary);

  const fetchAttendance = async (date: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAttendanceByDate({ date, currentUser, libraryId: activeLibrary.id });
      setAttendanceData(data);
    } catch (err) {
      setError("Failed to fetch attendance data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const formattedDate = formatDate(selectedDate);
    fetchAttendance(formattedDate);
  }, [selectedDate]);

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`; // Format: YYYY-MM-DD
  };

  const formatDisplayDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString(undefined, options); // Format: "Month Day, Year"
  };

  const onDateChange = (event: any, date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
    if (Platform.OS === "android") {
      setShowDatePicker(false); // Hide picker after selection on Android
    }
  };

  const renderMember = ({ item }: { item: Member }) => (
    <View style={styles.memberContainer}>
      <Text style={styles.memberName}>{item.fullName}</Text>
      <View style={styles.statusContainer}>
        {item.isPresent ? (
          <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
        ) : (
          <MaterialIcons name="cancel" size={20} color="#F44336" />
        )}
        <Text style={[styles.status, item.isPresent ? styles.present : styles.absent]}>
          {item.isPresent ? "Present" : "Absent"}
        </Text>
      </View>
    </View>
  );

  const renderAttendance = ({ item }: { item: Attendance }) => (
    <View style={styles.attendanceCard}>
      <Text style={styles.date}>
        {formatDisplayDate(new Date(item.timestamp))}
      </Text>
      <FlatList
        data={item.members}
        keyExtractor={(member) => member.id}
        renderItem={renderMember}
      />
    </View>
  );

  const memoizedAttendanceData = useMemo(() => attendanceData, [attendanceData]);

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance</Text>
        <Text style={styles.headerSubtitle}>View and manage attendance records</Text>
      </View>

      {/* Date Picker Section */}
      <TouchableOpacity
        style={styles.datePickerButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.datePickerButtonText}>
          {formatDisplayDate(selectedDate)}
        </Text>
        <MaterialIcons name="calendar-today" size={20} color="#6B46C1" />
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={onDateChange}
        />
      )}

      {/* Loading and Error States */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#6B46C1" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchAttendance(formatDate(selectedDate))}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={memoizedAttendanceData}
          keyExtractor={(item) => item.id}
          renderItem={renderAttendance}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="event-busy" size={50} color="#9E9E9E" />
              <Text style={styles.emptyText}>No attendance found for the selected date.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default AttendanceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6B46C1",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  datePickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F3E8FF", // Light purple background
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#6B46C1",
  },
  datePickerButtonText: {
    fontSize: 16,
    color: "#6B46C1",
    fontWeight: "500",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  errorText: {
    color: "#F44336",
    fontSize: 16,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: "#6B46C1",
    padding: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#9E9E9E",
    marginTop: 10,
  },
  attendanceCard: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  date: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#6B46C1",
  },
  memberContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  memberName: {
    fontSize: 14,
    color: "#333",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  status: {
    fontSize: 14,
    fontWeight: "500",
  },
  present: {
    color: "#4CAF50",
  },
  absent: {
    color: "#F44336",
  },
});