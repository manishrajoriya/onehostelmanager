import type React from "react"
import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
  Animated,
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { fetchSeats, allotSeat, deallocateSeat } from "@/firebase/functions"
import { getMembers } from "@/firebase/functions"
import useStore from "@/hooks/store"

interface Member {
  id: string
  fullName: string
  expiryDate: Date
  allocatedSeatId?: string
}

interface Seat {
  id: string
  seatId: string
  isAllocated: boolean
  allocatedTo?: string
  memberName?: string
  memberExpiryDate?: Date
}

const AllocateSeatsPage: React.FC = () => {
  const [seats, setSeats] = useState<Seat[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [animation] = useState(new Animated.Value(0))
  const [lastVisibleDoc, setLastVisibleDoc] = useState<any>(null)
  const [hasMoreMembers, setHasMoreMembers] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedSeatData, setSelectedSeatData] = useState<Seat | null>(null)

  const currentUser = useStore((state: any) => state.currentUser)
  const activeLibrary = useStore((state: any) => state.activeLibrary)

  useEffect(() => {
    loadSeats()
    loadMembers()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = members.filter(
        (member) => member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) && !member.allocatedSeatId,
      )
      setFilteredMembers(filtered)
    } else {
      setFilteredMembers(members.filter((member) => !member.allocatedSeatId))
    }
  }, [searchQuery, members])

  const loadSeats = async () => {
    setLoading(true)
    try {
      const fetchedSeats = await fetchSeats({ currentUser: currentUser, libraryId: activeLibrary.id })
      setSeats(fetchedSeats)
    } catch (error) {
      console.error("Error fetching seats:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadMembers = useCallback(async () => {
    if (!hasMoreMembers || loading) return

    setLoading(true)
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
      })

      setMembers((prevMembers) => {
        const newMembers = fetchedMembers.filter(
          (newMember) => !prevMembers.some((existingMember) => existingMember.id === newMember.id),
        ).filter((member) => member.expiryDate > new Date())
        return [...prevMembers, ...newMembers]
      })

      setLastVisibleDoc(newLastVisibleDoc)
      setHasMoreMembers(hasMore)
    } catch (error) {
      console.error("Error fetching members:", error)
    } finally {
      setLoading(false)
    }
  }, [lastVisibleDoc, hasMoreMembers, loading, currentUser, activeLibrary.id])

  const isMemberExpired = useCallback((expiryDate: any) => {
  // Convert Firestore timestamp to JavaScript Date
  const milliseconds = expiryDate.seconds * 1000 + Math.floor(expiryDate.nanoseconds / 1e6);
  const expiryDateTime = new Date(milliseconds);

  // Compare with the current time
  return expiryDateTime < new Date();
  }, [])

  const handleAllotSeat = async () => {
    if (!selectedSeat || !selectedMember) {
      Alert.alert("Error", "Please select a room and a member.")
      return
    }

    const seatToAllocate = seats.find((seat) => seat.id === selectedSeat)
    if (seatToAllocate && seatToAllocate.isAllocated) {
      Alert.alert("Error", "This room is already allocated. Please choose another room.")
      return
    }

    if (isMemberExpired(selectedMember.expiryDate)) {
      Alert.alert("Error", "Cannot allocate room to an expired member.")
      return
    }

    setLoading(true)
    try {
      const result = await allotSeat(
        selectedSeat,
        selectedMember.id,
        selectedMember.fullName,
        selectedMember.expiryDate,
      )
      Alert.alert("Success", result)

      await loadSeats()

      setMembers((prevMembers) =>
        prevMembers.map((member) =>
          member.id === selectedMember.id ? { ...member, allocatedSeatId: selectedSeat } : member,
        ),
      )

      setSelectedSeat(null)
      setSelectedMember(null)
      setSelectedSeatData(null)
      triggerAnimation()
    } catch (error) {
      Alert.alert("Error: Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleDeallocateSeat = async (seatId: string) => {
    setLoading(true)
    try {
      const result = await deallocateSeat(seatId)
      Alert.alert("Success", result)
      await loadSeats()

      setMembers((prevMembers) =>
        prevMembers.map((member) =>
          member.allocatedSeatId === seatId ? { ...member, allocatedSeatId: undefined } : member,
        ),
      )

      setSelectedSeatData(null)
    } catch (error) {
      Alert.alert("Error: Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const triggerAnimation = () => {
    Animated.sequence([
      Animated.timing(animation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const animatedStyle = {
    transform: [
      {
        scale: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.2],
        }),
      },
    ],
  }

  const renderSeat = useCallback(
    ({ item }: { item: Seat }) => (
      <Animated.View style={[styles.seatItem, animatedStyle]}>
        <TouchableOpacity
          style={[styles.seatContent, selectedSeat === item.id && styles.selectedSeatItem]}
          onPress={() => {
            setSelectedSeat(item.id)
            setSelectedSeatData(item)
          }}
        >
          <MaterialIcons
            name={item.isAllocated ? "room-service" : "room"}
            size={24}
            color={item.isAllocated ? (isMemberExpired(item.memberExpiryDate!) ? "orange" : "red") : "green"}
          />
          <Text style={styles.seatText}>{item.seatId}</Text>
          {item.isAllocated ? (
            <View style={styles.allocatedInfo}>
              <Text style={styles.allocatedText}>Allocated</Text>
              <Text style={styles.memberNameText}>{item.memberName}</Text>
              <Text
                style={[
                  styles.statusText,
                  isMemberExpired(item.memberExpiryDate!) ? styles.expiredStatus : styles.liveStatus,
                ]}
              >
                {isMemberExpired(item.memberExpiryDate!) ? "Expired" : "Live"}
              </Text>
            </View>
          ) : (
            <Text style={styles.availableText}>Available</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    ),
    [selectedSeat, isMemberExpired],
  )

  const renderMember = useCallback(
    ({ item }: { item: Member }) => {
      const isExpired = isMemberExpired(item.expiryDate)
      return (
        <TouchableOpacity
          style={[
            styles.memberItem,
            selectedMember?.id === item.id && styles.selectedMemberItem,
            isExpired && styles.expiredMemberItem,
          ]}
          onPress={() => setSelectedMember(item)}
          disabled={item.allocatedSeatId !== undefined || isExpired}
        >
          <Text style={[styles.memberText, isExpired && styles.expiredMemberText]}>{item.fullName}</Text>
          <Text style={[styles.statusText, isExpired ? styles.expiredStatus : styles.liveStatus]}>
            {isExpired ? "Expired" : "Live"}
          </Text>
          {item.allocatedSeatId && <Text style={styles.allocatedSeatText}>Room: {item.allocatedSeatId}</Text>}
        </TouchableOpacity>
      )
    },
    [selectedMember, isMemberExpired],
  )

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Allocate Room</Text>

      {loading ? (
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#02c39a" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      ) : (
        <>
          <FlatList data={seats} renderItem={renderSeat} keyExtractor={(item) => item.id} style={styles.seatList} />

          {selectedSeatData && (
            <View style={styles.seatInfoCard}>
              <View style={styles.seatInfoHeader}>
                <Text style={styles.seatInfoTitle}>Room Information</Text>
                <TouchableOpacity onPress={() => setSelectedSeatData(null)}>
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <View style={styles.seatInfoContent}>
                <View style={styles.seatInfoRow}>
                  <Text style={styles.seatInfoLabel}>Room ID:</Text>
                  <Text style={styles.seatInfoValue}>{selectedSeatData.seatId}</Text>
                </View>
                <View style={styles.seatInfoRow}>
                  <Text style={styles.seatInfoLabel}>Status:</Text>
                  <Text
                    style={[
                      styles.seatInfoValue,
                      {
                        color: selectedSeatData.isAllocated
                          ? isMemberExpired(selectedSeatData.memberExpiryDate!)
                            ? "orange"
                            : "red"
                          : "#02c39a",
                      },
                    ]}
                  >
                    {selectedSeatData.isAllocated ? "Allocated" : "Available"}
                  </Text>
                </View>
                {selectedSeatData.isAllocated && (
                  <>
                    <View style={styles.seatInfoRow}>
                      <Text style={styles.seatInfoLabel}>Allocated To:</Text>
                      <Text style={styles.seatInfoValue}>{selectedSeatData.memberName}</Text>
                    </View>
                    <View style={styles.seatInfoRow}>
                      <Text style={styles.seatInfoLabel}>Member Status:</Text>
                      <Text
                        style={[
                          styles.seatInfoValue,
                          isMemberExpired(selectedSeatData.memberExpiryDate!)
                            ? styles.expiredStatus
                            : styles.liveStatus,
                        ]}
                      >
                        {isMemberExpired(selectedSeatData.memberExpiryDate!) ? "Expired" : "Live"}
                      </Text>
                    </View>
                  </>
                )}
                {selectedSeatData.isAllocated ? (
                  <TouchableOpacity
                    style={[
                      styles.button,
                      { backgroundColor: isMemberExpired(selectedSeatData.memberExpiryDate!) ? "orange" : "red" },
                    ]}
                    onPress={() => handleDeallocateSeat(selectedSeatData.id)}
                  >
                    <Text style={styles.buttonText}>
                      {isMemberExpired(selectedSeatData.memberExpiryDate!)
                        ? "Deallocate Expired Room"
                        : "Deallocate Room"}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search members by name..."
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                    <View style={styles.memberListContainer}>
                      <FlatList
                        data={filteredMembers}
                        renderItem={renderMember}
                        keyExtractor={(item) => item.id}
                        style={styles.memberList}
                        onEndReached={loadMembers}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={() =>
                          loading ? <ActivityIndicator size="small" color="#02c39a" style={styles.loader} /> : null
                        }
                      />
                    </View>
                    <TouchableOpacity
                      style={[styles.button, { opacity: !selectedMember ? 0.5 : 1 }]}
                      onPress={handleAllotSeat}
                      disabled={!selectedMember}
                    >
                      <Text style={styles.buttonText}>Allocate Room</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          )}
        </>
      )}
    </View>
  )
}

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
  seatList: {
    flex: 1,
  },
  seatItem: {
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: "#fff",
    elevation: 2,
  },
  seatContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  selectedSeatItem: {
    backgroundColor: "#e0f7fa",
  },
  seatText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#333",
  },
  allocatedInfo: {
    marginLeft: "auto",
    alignItems: "flex-end",
  },
  allocatedText: {
    fontSize: 14,
    color: "red",
  },
  memberNameText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  availableText: {
    marginLeft: "auto",
    fontSize: 14,
    color: "green",
  },
  seatInfoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    margin: 16,
    elevation: 4,
  },
  seatInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  seatInfoTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  seatInfoContent: {
    gap: 12,
  },
  seatInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  seatInfoLabel: {
    fontSize: 16,
    color: "#666",
  },
  seatInfoValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  searchInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: "#fff",
  },
  memberListContainer: {
    maxHeight: 200,
  },
  memberList: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  memberItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectedMemberItem: {
    backgroundColor: "#e0f7fa",
  },
  memberText: {
    fontSize: 14,
    color: "#333",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  liveStatus: {
    color: "green",
  },
  expiredStatus: {
    color: "orange",
  },
  button: {
    backgroundColor: "#007bff",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loader: {
    marginTop: 10,
    fontSize: 16,
    color: "#02c39a",
  },
  allocatedSeatText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  expiredMemberItem: {
    opacity: 0.5,
  },
  expiredMemberText: {
    color: "#999",
  },
   modalBackground: {
    flex: 1,
    marginTop: 10,
    fontSize: 16,
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    width: 200,
    height: 150,
    elevation: 5,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#02c39a",
  },
})

export default AllocateSeatsPage

