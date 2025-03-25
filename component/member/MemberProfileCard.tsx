import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  FlatList,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { getMembers, totalMemberCount, liveMemberCount, InactiveMemberCount } from "@/firebase/functions";
import type { MemberDetails } from "@/types/MemberProfile";
import MemberCard from "./MemberCard";
import { useRouter } from "expo-router";
import { DocumentData, QueryDocumentSnapshot } from "@firebase/firestore";
import useStore from "@/hooks/store";

const MemberProfileCards: React.FC = () => {
  const [members, setMembers] = useState<MemberDetails[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<MemberDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData, DocumentData>>();
  const [hasMore, setHasMore] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "live" | "expired" | "expiringSoon">("all");
  const [totalMembers, setTotalMembers] = useState(0); // Total members count
  const [liveMembersCount, setLiveMembersCount] = useState(0); // Live members count
  const [expiredMembersCount, setExpiredMembersCount] = useState(0); // Expired members count
  const [expiringSoonCount, setExpiringSoonCount] = useState(0); // Expiring soon count
  const router = useRouter();

  const currentUser = useStore((state: any) => state.currentUser);
  const activeLibrary = useStore((state: any) => state.activeLibrary);

 
  // Helper function to calculate days difference
  const getDaysDifference = (expiryDate: Date): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date to midnight
    const timeDiff = expiryDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)); // Convert time difference to days
  };

  // Fetch initial members and total counts
  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      // Fetch total counts
      const total = await totalMemberCount({ currentUser, libraryId: activeLibrary.id });
      const live = await liveMemberCount({ currentUser, libraryId: activeLibrary.id });
      const expired = await InactiveMemberCount({ currentUser, libraryId: activeLibrary.id });
      const expiringSoon = await calculateExpiringSoonCount();

      setTotalMembers(total);
      setLiveMembersCount(live);
      setExpiredMembersCount(expired);
      setExpiringSoonCount(expiringSoon);

      // Fetch initial members
      const { members: newMembers, lastVisibleDoc, hasMore: more } = await getMembers({pageSize: 10, lastVisible, currentUser, libraryId: activeLibrary.id});
      setMembers(newMembers);
      setFilteredMembers(newMembers);
      setLastVisible(lastVisibleDoc);
      setHasMore(more);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate expiring soon count
  const calculateExpiringSoonCount = async (): Promise<number> => {
    // Fetch all members (or use a Firestore query to count expiring soon members directly)
    const { members: allMembers } = await getMembers({pageSize: 10, lastVisible, currentUser, libraryId: activeLibrary.id});
    return allMembers.filter((member) => {
      const expiryDate = new Date(member.expiryDate);
      const daysDiff = getDaysDifference(expiryDate);
      return daysDiff >= 2 && daysDiff <= 3;
    }).length;
  };

  // Fetch more members when scrolling
  const fetchMoreMembers = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const { members: newMembers, lastVisibleDoc, hasMore: more } = await getMembers({pageSize: 10, lastVisible, currentUser, libraryId: activeLibrary.id});
      setMembers((prev) => [...prev, ...newMembers]);
      setFilteredMembers((prev) => [...prev, ...newMembers]);
      setLastVisible(lastVisibleDoc);
      setHasMore(more);
    } catch (error) {
      console.error("Error fetching more members:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Apply filters
  const applyFilter = (filter: "all" | "live" | "expired" | "expiringSoon") => {
    setActiveFilter(filter);
    switch (filter) {
      case "live":
        const liveMembers = members.filter((member) => {
          const expiryDate = new Date(member.expiryDate);
          return expiryDate > new Date();
        });
        setFilteredMembers(liveMembers);
        break;
      case "expired":
        const expiredMembers = members.filter((member) => {
          const expiryDate = new Date(member.expiryDate);
          return expiryDate <= new Date();
        });
        setFilteredMembers(expiredMembers);
        break;
      case "expiringSoon":
        const expiringSoonMembers = members.filter((member) => {
          const expiryDate = new Date(member.expiryDate);
          const daysDiff = getDaysDifference(expiryDate);
          return daysDiff >= 2 && daysDiff <= 3;
        });
        setFilteredMembers(expiringSoonMembers);
        break;
      default:
        setFilteredMembers(members);
        break;
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Handle member click
  const handleMemberClick = (id: string) => {
    router.push(`/memberdata?id=${id}`);
  };

  // Render member card
  const renderItem = ({ item }: { item: MemberDetails }) => (
    <MemberCard member={item} onPress={() => handleMemberClick(item.id)} />
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Filter Buttons in a ScrollView */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === "all" && styles.activeFilter]}
            onPress={() => applyFilter("all")}
          >
            <Text style={styles.filterText}>All ({totalMembers})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === "live" && styles.activeFilter]}
            onPress={() => applyFilter("live")}
          >
            <Text style={styles.filterText}>Live ({liveMembersCount})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === "expired" && styles.activeFilter]}
            onPress={() => applyFilter("expired")}
          >
            <Text style={styles.filterText}>Expired ({expiredMembersCount})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === "expiringSoon" && styles.activeFilter]}
            onPress={() => applyFilter("expiringSoon")}
          >
            <Text style={styles.filterText}>Expiring Soon ({expiringSoonCount})</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Loading Popup */}
      <Modal visible={isLoading || isLoadingMore} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#02c39a" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      </Modal>

      {/* Member List or No Members Found Message */}
      {filteredMembers.length === 0 && !isLoading ? (
        <View style={styles.noMembersContainer}>
          <Text style={styles.noMembersText}>No members found.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMembers}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          onEndReached={fetchMoreMembers}
          onEndReachedThreshold={0.5}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  filterContainer: {
    height: 60, // Fixed height for the filter container
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
  },
  filterScrollContent: {
    paddingHorizontal: 10,
    alignItems: "center",
  },
  filterButton: {
    padding: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 5,
  },
  activeFilter: {
    backgroundColor: "#02c39a",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  noMembersContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noMembersText: {
    fontSize: 18,
    textAlign: "center",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
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
});

export default MemberProfileCards;