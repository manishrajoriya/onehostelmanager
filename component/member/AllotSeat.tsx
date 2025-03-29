import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
  RefreshControl,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { fetchSeats, allotSeat, deallocateSeat } from "@/firebase/functions";
import { getMembers } from "@/firebase/functions";
import useStore from "@/hooks/store";

interface Member {
  id: string;
  fullName: string;
  expiryDate: Date;
  allocatedSeatId?: string;
}

type RoomType = "AC" | "Non-AC" | "Dormitory";

interface Seat {
  id: string;
  seatId: string;
  isAllocated: boolean;
  allocatedTo?: string;
  memberName?: string;
  memberExpiryDate?: Date;
  roomType: RoomType;
  roomNumber: string;
}

const AllocateSeatsPage: React.FC = () => {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSeatData, setSelectedSeatData] = useState<Seat | null>(null);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<any>(null);
  const [hasMoreMembers, setHasMoreMembers] = useState<boolean>(true);

  const currentUser = useStore((state: any) => state.currentUser);
  const activeLibrary = useStore((state: any) => state.activeLibrary);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([loadSeats(), loadMembers()]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = members.filter(
        (member) =>
          member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !member.allocatedSeatId
      );
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers(members.filter((member) => !member.allocatedSeatId));
    }
  }, [searchQuery, members]);

  const loadSeats = async () => {
    try {
      const fetchedSeats = await fetchSeats({
        currentUser: currentUser,
        libraryId: activeLibrary.id,
      });
      setSeats(fetchedSeats);
    } catch (error) {
      console.error("Error fetching seats:", error);
      Alert.alert("Error", "Failed to load seats");
    }
  };

  const isMemberExpired = useCallback((expiryDate: any) => {
    if (!expiryDate) return true;
    const milliseconds = expiryDate.seconds * 1000 + Math.floor(expiryDate.nanoseconds / 1e6);
    return new Date(milliseconds) < new Date();
  }, []);

  const loadMembers = useCallback(async () => {
    if (!hasMoreMembers || loading) return;

    setLoading(true);
  try {
    const {
      members: fetchedMembers,
      lastVisibleDoc: newLastVisibleDoc,
      hasMore,
    } = await getMembers({
      pageSize: 10,
      lastVisible: lastVisibleDoc,
      currentUser: currentUser,
      libraryId: activeLibrary.id,
    });

    setMembers((prevMembers) => {
      // Filter out duplicates and expired members
      const newMembers = fetchedMembers.filter(
        (newMember) => 
          !prevMembers.some((existingMember) => existingMember.id === newMember.id) &&
          !isMemberExpired(newMember.expiryDate)
      );
      return [...prevMembers, ...newMembers];
    });

    setLastVisibleDoc(newLastVisibleDoc);
    setHasMoreMembers(hasMore);
  } catch (error) {
    console.error("Error fetching members:", error);
    Alert.alert("Error", "Failed to load members");
  } finally {
    setLoading(false);
  }
}, [lastVisibleDoc, hasMoreMembers, loading, currentUser, activeLibrary.id, isMemberExpired]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

 

  const handleAllotSeat = async () => {
    if (!selectedSeat || !selectedMember) {
      Alert.alert("Error", "Please select a seat and a member.");
      return;
    }

    setLoading(true);
    try {
      await allotSeat(
        selectedSeat,
        selectedMember.id,
        selectedMember.fullName,
        selectedMember.expiryDate
      );
      Alert.alert("Success", "Seat allocated successfully");
      await loadData();
      setSelectedSeat(null);
      setSelectedMember(null);
      setSelectedSeatData(null);
    } catch (error) {
      Alert.alert("Error", "Failed to allocate seat");
    } finally {
      setLoading(false);
    }
  };

  const handleDeallocateSeat = async (seatId: string) => {
    setLoading(true);
    try {
      await deallocateSeat(seatId);
      Alert.alert("Success", "Seat deallocated successfully");
      await loadData();
      setSelectedSeatData(null);
    } catch (error) {
      Alert.alert("Error", "Failed to deallocate seat");
    } finally {
      setLoading(false);
    }
  };

  const renderSeat = ({ item }: { item: Seat }) => (
    <TouchableOpacity
      style={[
        styles.seatItem,
        selectedSeat === item.id && styles.selectedSeatItem,
        item.isAllocated && styles.allocatedSeatItem,
      ]}
      onPress={() => {
        setSelectedSeat(item.id);
        setSelectedSeatData(item);
      }}
    >
      <MaterialIcons
        name={item.isAllocated ? "person" : "event-seat"}
        size={24}
        color={item.isAllocated ? "#ff4444" : "#02c39a"}
      />
      <View style={styles.seatInfo}>
        <Text style={styles.seatId}>{item.seatId}</Text>
        <Text style={styles.roomInfo}>
          {item.roomNumber} ({item.roomType})
        </Text>
      </View>
      <View style={styles.seatStatus}>
        {item.isAllocated ? (
          <>
            <Text style={styles.allocatedText}>Allocated</Text>
            <Text style={styles.memberName}>{item.memberName}</Text>
          </>
        ) : (
          <Text style={styles.availableText}>Available</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderMember = ({ item }: { item: Member }) => (
    <TouchableOpacity
      style={[
        styles.memberItem,
        selectedMember?.id === item.id && styles.selectedMemberItem,
      ]}
      onPress={() => setSelectedMember(item)}
      disabled={item.allocatedSeatId !== undefined}
    >
      <Text style={styles.memberName}>{item.fullName}</Text>
      {item.allocatedSeatId ? (
        <Text style={styles.allocatedSeatText}>Already allocated</Text>
      ) : (
        <Text style={styles.availableSeatText}>Available</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Allocate Room</Text>

      <FlatList
        data={seats}
        renderItem={renderSeat}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={styles.seatsList}
      />

      {selectedSeatData && (
        <View style={styles.seatDetails}>
          <View style={styles.seatDetailsHeader}>
            <Text style={styles.seatDetailsTitle}>Bed Details</Text>
            <TouchableOpacity onPress={() => setSelectedSeatData(null)}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.seatDetailsContent}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Bed ID:</Text>
              <Text style={styles.detailValue}>{selectedSeatData.seatId}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Room:</Text>
              <Text style={styles.detailValue}>
                {selectedSeatData.roomNumber} ({selectedSeatData.roomType})
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text
                style={[
                  styles.detailValue,
                  selectedSeatData.isAllocated
                    ? styles.allocatedStatus
                    : styles.availableStatus,
                ]}
              >
                {selectedSeatData.isAllocated ? "Allocated" : "Available"}
              </Text>
            </View>

            {selectedSeatData.isAllocated ? (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Member:</Text>
                  <Text style={styles.detailValue}>
                    {selectedSeatData.memberName}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deallocateButton}
                  onPress={() => handleDeallocateSeat(selectedSeatData.id)}
                >
                  <Text style={styles.buttonText}>Deallocate Bed</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search members..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <FlatList
                  data={filteredMembers}
                  renderItem={renderMember}
                  keyExtractor={(item) => item.id}
                  style={styles.membersList}
                  ListEmptyComponent={
                    <Text style={styles.emptyListText}>No available members found</Text>
                  }
                />
                <TouchableOpacity
                  style={[
                    styles.allocateButton,
                    !selectedMember && styles.disabledButton,
                  ]}
                  onPress={handleAllotSeat}
                  disabled={!selectedMember || loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Allocate Bed</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
    textAlign: "center",
  },
  seatsList: {
    flex: 1,
  },
  seatItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectedSeatItem: {
    borderColor: "#02c39a",
    backgroundColor: "#e7f3ff",
  },
  allocatedSeatItem: {
    borderColor: "#ff4444",
  },
  seatInfo: {
    flex: 1,
    marginLeft: 12,
  },
  seatId: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  roomInfo: {
    fontSize: 14,
    color: "#666",
  },
  seatStatus: {
    alignItems: "flex-end",
  },
  allocatedText: {
    color: "#ff4444",
    fontWeight: "500",
  },
  availableText: {
    color: "#02c39a",
    fontWeight: "500",
  },
  memberName: {
    fontSize: 14,
    color: "#666",
  },
  seatDetails: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  seatDetailsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  seatDetailsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  seatDetailsContent: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailLabel: {
    fontSize: 16,
    color: "#666",
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  allocatedStatus: {
    color: "#ff4444",
  },
  availableStatus: {
    color: "#02c39a",
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  membersList: {
    maxHeight: 200,
    marginBottom: 8,
  },
  memberItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectedMemberItem: {
    backgroundColor: "#e7f3ff",
  },
 
  allocatedSeatText: {
    fontSize: 14,
    color: "#ff4444",
    fontStyle: "italic",
  },
  availableSeatText: {
    fontSize: 14,
    color: "#02c39a",
  },
  allocateButton: {
    backgroundColor: "#007bff",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  deallocateButton: {
    backgroundColor: "#ff4444",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyListText: {
    textAlign: "center",
    color: "#666",
    padding: 16,
  },
});

export default AllocateSeatsPage;