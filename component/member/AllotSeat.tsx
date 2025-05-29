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
import { fetchSeats, allotSeat, deallocateSeat, deleteSeat } from "@/firebase/functions";
import { getMembers, getMemberById } from "@/firebase/functions";
import useStore from "@/hooks/store";

interface Member {
  id: string;
  fullName: string;
  allocatedSeatId?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  joiningDate?: any; // Firestore Timestamp or Date
}

type RoomType = "AC" | "Non-AC" | "Dormitory";

interface Seat {
  id: string;
  seatId: string;
  isAllocated: boolean;
  allocatedTo?: string;
  memberId?: string;
  memberName?: string;
  memberExpiryDate?: Date;
  roomType: RoomType;
  roomNumber: string;
  rent: number;
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
  const [selectedMemberDetails, setSelectedMemberDetails] = useState<Member | null>(null);
  const [loadingMemberDetails, setLoadingMemberDetails] = useState(false);

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

  // const isMemberExpired = useCallback((expiryDate: any) => {
  //   if (!expiryDate) return true;
  //   const milliseconds = expiryDate.seconds * 1000 + Math.floor(expiryDate.nanoseconds / 1e6);
  //   return new Date(milliseconds) < new Date();
  // }, []);

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
          !prevMembers.some((existingMember) => existingMember.id === newMember.id) 
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
}, [lastVisibleDoc, hasMoreMembers, loading, currentUser, activeLibrary.id, ]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    loadMembers();
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

  const handleDeleteSeat = async (seatId: string) => {
    Alert.alert(
      "Delete Seat",
      "Are you sure you want to delete this seat? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const result = await deleteSeat(seatId);
              if (result.success) {
                Alert.alert("Success", result.message);
                await loadData();
              } else {
                Alert.alert("Error", result.message);
              }
            } catch (error) {
              Alert.alert("Error", "Failed to delete seat");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const fetchMemberDetails = async (memberId: string) => {
    setLoadingMemberDetails(true);
    try {
      console.log("Fetching member details for ID:", memberId);
      const memberDetails = await getMemberById({ id: memberId });
      console.log("Member details fetched:", memberDetails);
      setSelectedMemberDetails(memberDetails);
    } catch (error: any) {
      console.error("Error fetching member details:", error);
      Alert.alert(
        "Error",
        `Failed to load member details: ${error.message || "Unknown error"}`
      );
    } finally {
      setLoadingMemberDetails(false);
    }
  };

  const handleSeatPress = async (seat: Seat) => {
    setSelectedSeat(seat.id);
    setSelectedSeatData(seat);
    if (seat.isAllocated && seat.allocatedTo) {
      console.log("Fetching details for allocated seat:", seat);
      await fetchMemberDetails(seat.allocatedTo);
    }
  };

  // Group seats by room number
  const groupedSeats = React.useMemo(() => {
    const groups: { [key: string]: Seat[] } = {};
    filteredSeats.forEach(seat => {
      if (!groups[seat.roomNumber]) {
        groups[seat.roomNumber] = [];
      }
      groups[seat.roomNumber].push(seat);
    });
    return groups;
  }, [filteredSeats]);

  const renderRoomGroup = ({ item: roomNumber }: { item: string }) => (
    <View style={styles.roomGroup}>
      <View style={styles.roomHeader}>
        <MaterialIcons 
          name={selectedRoomType === "AC" ? "ac-unit" : selectedRoomType === "Non-AC" ? "hotel" : "people"} 
          size={24} 
          color="#02c39a" 
        />
        <Text style={styles.roomNumber}>Room {roomNumber}</Text>
        <Text style={styles.roomType}>{selectedRoomType}</Text>
      </View>
      <View style={styles.seatsContainer}>
        {groupedSeats[roomNumber].map((seat) => (
          <TouchableOpacity
            key={seat.id}
            style={[
              styles.seatItem,
              selectedSeat === seat.id && styles.selectedSeatItem,
              seat.isAllocated && styles.allocatedSeatItem,
            ]}
            onPress={() => handleSeatPress(seat)}
          >
            <MaterialIcons
              name={seat.isAllocated ? "person" : "event-seat"}
              size={24}
              color={seat.isAllocated ? "#ff4444" : "#02c39a"}
            />
            <View style={styles.seatInfo}>
              <Text style={styles.seatId}>{seat.seatId}</Text>
              <Text style={styles.rentText}>₹{seat.rent || 'Not set'}</Text>
            </View>
            <View style={styles.seatStatus}>
              {seat.isAllocated ? (
                <>
                  <Text style={styles.allocatedText}>Occupied</Text>
                  <Text style={styles.memberName} numberOfLines={1}>{seat.memberName}</Text>
                </>
              ) : (
                <Text style={styles.availableText}>Available</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteSeat(seat.id)}
            >
              <MaterialIcons name="delete" size={24} color="#ff4444" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    </View>
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
        <Text style={styles.allocatedText}>Already allocated</Text>
      ) : (
        <Text style={styles.availableText}>Available</Text>
      )}
    </TouchableOpacity>
  );

  const formatDate = (date: any) => {
    if (!date) return 'Not set';
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    if (date.seconds) {
      return new Date(date.seconds * 1000).toLocaleDateString();
    }
    return 'Invalid date';
  };

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
        data={Object.keys(groupedSeats)}
        renderItem={renderRoomGroup}
        keyExtractor={(item) => item}
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
        onRequestClose={() => {
          setSelectedSeatData(null);
          setSelectedMemberDetails(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Room Details</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setSelectedSeatData(null);
                  setSelectedMemberDetails(null);
                }}
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
                  {loadingMemberDetails ? (
                    <ActivityIndicator size="large" color="#02c39a" />
                  ) : selectedMemberDetails ? (
                    <View style={styles.memberDetailsCard}>
                      <Text style={styles.memberDetailsTitle}>Member Information</Text>
                      <View style={styles.memberDetailRow}>
                        <Text style={styles.memberDetailLabel}>Name:</Text>
                        <Text style={styles.memberDetailValue}>{selectedMemberDetails.fullName}</Text>
                      </View>
                      {selectedMemberDetails.phoneNumber && (
                        <View style={styles.memberDetailRow}>
                          <Text style={styles.memberDetailLabel}>Phone:</Text>
                          <Text style={styles.memberDetailValue}>{selectedMemberDetails.phoneNumber}</Text>
                        </View>
                      )}
                      {selectedMemberDetails.email && (
                        <View style={styles.memberDetailRow}>
                          <Text style={styles.memberDetailLabel}>Email:</Text>
                          <Text style={styles.memberDetailValue}>{selectedMemberDetails.email}</Text>
                        </View>
                      )}
                      {selectedMemberDetails.address && (
                        <View style={styles.memberDetailRow}>
                          <Text style={styles.memberDetailLabel}>Address:</Text>
                          <Text style={styles.memberDetailValue}>{selectedMemberDetails.address}</Text>
                        </View>
                      )}
                    
                      {selectedMemberDetails.joiningDate && (
                        <View style={styles.memberDetailRow}>
                          <Text style={styles.memberDetailLabel}>Joining Date:</Text>
                          <Text style={styles.memberDetailValue}>
                            {formatDate(selectedMemberDetails.joiningDate)}
                          </Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.errorText}>Failed to load member details</Text>
                  )}
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
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
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
  roomGroup: {
    marginBottom: 24,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  roomHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  roomNumber: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  roomType: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  seatsContainer: {
    padding: 12,
  },
  seatItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
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
  rentText: {
    fontSize: 14,
    color: "#666",
  },
  seatStatus: {
    alignItems: "flex-end",
    marginRight: 8,
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
    fontSize: 12,
    color: "#666",
    maxWidth: 120,
  },
  deleteButton: {
    padding: 8,
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
  memberDetailsCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  memberDetailsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  memberDetailRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  memberDetailLabel: {
    flex: 1,
    fontSize: 14,
    color: "#666",
  },
  memberDetailValue: {
    flex: 2,
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  errorText: {
    color: "#ff4444",
    textAlign: "center",
    marginVertical: 16,
  },
});

export default AllocateSeatsPage;