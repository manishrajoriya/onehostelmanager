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
  ScrollView,
  Modal,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
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
  const [filteredSeats, setFilteredSeats] = useState<Seat[]>([]);
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
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | "All">("All");

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

  useEffect(() => {
    if (selectedRoomType === "All") {
      setFilteredSeats(seats);
    } else {
      setFilteredSeats(seats.filter(seat => seat.roomType === selectedRoomType));
    }
  }, [seats, selectedRoomType]);

  const loadSeats = async () => {
    try {
      const fetchedSeats = await fetchSeats({
        currentUser: currentUser,
        libraryId: activeLibrary.id,
      });
      setSeats(fetchedSeats);
      setFilteredSeats(fetchedSeats);
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

    if (!selectedSeatData) {
      Alert.alert("Error", "Invalid seat selection. Please try again.");
      return;
    }

    setLoading(true);
    try {
      const result = await allotSeat(
        selectedSeat,
        selectedMember.id,
        selectedMember.fullName,
        selectedMember.expiryDate
      );

      if (result.success) {
        Alert.alert(
          "Success",
          result.message,
          [
            {
              text: "OK",
              onPress: async () => {
                await loadData();
                setSelectedSeat(null);
                setSelectedMember(null);
                setSelectedSeatData(null);
              }
            }
          ]
        );
      } else {
        Alert.alert("Error", result.message || "Failed to allocate seat");
      }
    } catch (error: any) {
      console.error("Allocation error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to allocate seat. Please try again."
      );
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
     

      <View style={styles.filterSection}>
        <Text style={styles.sectionTitle}>Filter Rooms</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {["All", "AC", "Non-AC", "Dormitory"].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterButton,
                selectedRoomType === type && styles.selectedFilterButton,
              ]}
              onPress={() => setSelectedRoomType(type as RoomType | "All")}
            >
              <MaterialIcons
                name={type === "AC" ? "ac-unit" : type === "Non-AC" ? "hotel" : "people"}
                size={20}
                color={selectedRoomType === type ? "#fff" : "#02c39a"}
              />
              <Text
                style={[
                  styles.filterButtonText,
                  selectedRoomType === type && styles.selectedFilterButtonText,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredSeats}
        renderItem={renderSeat}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={styles.seatsList}
        contentContainerStyle={styles.seatsListContent}
      />

      <Modal
        visible={!!selectedSeatData}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedSeatData(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Room Details</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setSelectedSeatData(null)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.detailCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Room Number:</Text>
                  <Text style={styles.detailValue}>{selectedSeatData?.roomNumber}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Room Type:</Text>
                  <Text style={styles.detailValue}>{selectedSeatData?.roomType}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Bed ID:</Text>
                  <Text style={styles.detailValue}>{selectedSeatData?.seatId}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      selectedSeatData?.isAllocated
                        ? styles.allocatedStatus
                        : styles.availableStatus,
                    ]}
                  >
                    {selectedSeatData?.isAllocated ? "Allocated" : "Available"}
                  </Text>
                </View>
              </View>

              {selectedSeatData?.isAllocated ? (
                <View style={styles.actionSection}>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberLabel}>Current Member:</Text>
                    <Text style={styles.memberName}>{selectedSeatData.memberName}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deallocateButton}
                    onPress={() => handleDeallocateSeat(selectedSeatData.id)}
                  >
                    <MaterialIcons name="person-remove" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Deallocate Bed</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.actionSection}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search members..."
                    placeholderTextColor="#999"
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
                      <>
                        <MaterialIcons name="person-add" size={20} color="#fff" />
                        <Text style={styles.buttonText}>Allocate Bed</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  refreshButton: {
    padding: 8,
  },
  filterSection: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  filterScroll: {
    paddingRight: 16,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 8,
  },
  selectedFilterButton: {
    backgroundColor: "#02c39a",
    borderColor: "#02c39a",
  },
  filterButtonText: {
    color: "#666",
    fontSize: 14,
    marginLeft: 4,
  },
  selectedFilterButtonText: {
    color: "#fff",
  },
  seatsList: {
    flex: 1,
  },
  seatsListContent: {
    padding: 16,
  },
  seatItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedSeatItem: {
    borderColor: "#02c39a",
    backgroundColor: "#e7f3ff",
  },
  allocatedSeatItem: {
    borderColor: "#ff4444",
  },
  allocatedSeatText: {
    color: "#ff4444",
    fontWeight: "500",
  },
  availableSeatText: {
    color: "#02c39a",
    fontWeight: "500",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    gap: 16,
  },
  detailCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
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
  actionSection: {
    gap: 16,
  },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  membersList: {
    maxHeight: 200,
  },
  memberItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectedMemberItem: {
    backgroundColor: "#e7f3ff",
  },
  memberName: {
    fontSize: 16,
    color: "#333",
  },
  allocateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#02c39a",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  deallocateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ff4444",
    padding: 16,
    borderRadius: 12,
    gap: 8,
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
  memberInfo: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
  },
  memberLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
});

export default AllocateSeatsPage;