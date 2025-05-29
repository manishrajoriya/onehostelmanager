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
import { getMembers, totalMemberCount,  } from "@/firebase/functions";
import type { MemberDetails } from "@/types/MemberProfile";
import MemberCard from "./MemberCard";
import { useRouter } from "expo-router";
import { DocumentData, QueryDocumentSnapshot, collection, query, where, getDocs, orderBy, limit } from "@firebase/firestore";
import useStore from "@/hooks/store";
import { db } from "@/utils/firebaseConfig";

interface RentDetails {
  startDate: string;
  endDate: string;
  paidAmount: number;
  dueAmount: number;
  paymentDate: Date;
}

interface MemberWithRent extends MemberDetails {
  latestRent?: RentDetails;
}

const MemberProfileCards: React.FC = () => {
  const [members, setMembers] = useState<MemberWithRent[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<MemberWithRent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData, DocumentData>>();
  const [hasMore, setHasMore] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "activePaid" | "activePending" | "expired">("all");
  const [totalMembers, setTotalMembers] = useState(0);
  const [activePaidCount, setActivePaidCount] = useState(0);
  const [activePendingCount, setActivePendingCount] = useState(0);
  const [expiredCount, setExpiredCount] = useState(0);
  const router = useRouter();

  const currentUser = useStore((state: any) => state.currentUser);
  const activeLibrary = useStore((state: any) => state.activeLibrary);

  // Fetch latest rent for a member
  const fetchLatestRent = async (memberId: string): Promise<RentDetails | undefined> => {
    try {
      const rentRef = collection(db, `tenants/${memberId}/rentPayments`);
      const q = query(rentRef, orderBy("paymentDate", "desc"), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const rentDoc = querySnapshot.docs[0];
        return {
          startDate: rentDoc.data().startDate,
          endDate: rentDoc.data().endDate,
          paidAmount: rentDoc.data().paidAmount,
          dueAmount: rentDoc.data().dueAmount,
          paymentDate: rentDoc.data().paymentDate.toDate()
        };
      }
      return undefined;
    } catch (error) {
      console.error("Error fetching latest rent:", error);
      return undefined;
    }
  };

  // Calculate member counts based on rent status
  const calculateMemberCounts = async (): Promise<{
    activePaid: number;
    activePending: number;
    expired: number;
  }> => {
    try {
      const { members: allMembers } = await getMembers({
        pageSize: 1000,
        lastVisible: undefined,
        currentUser,
        libraryId: activeLibrary.id
      });

      const today = new Date();
      let activePaid = 0;
      let activePending = 0;
      let expired = 0;

      for (const member of allMembers) {
        const latestRent = await fetchLatestRent(member.id);
        
        if (!latestRent) {
          expired++; // No rent payment means expired
          continue;
        }

        const endDate = new Date(latestRent.endDate);
        const isActive = endDate > today;
        const isPaid = latestRent.dueAmount === 0;

        if (!isActive) {
          expired++;
        } else {
          if (isPaid) {
            activePaid++;
          } else {
            activePending++;
          }
        }
      }

      return { activePaid, activePending, expired };
    } catch (error) {
      console.error("Error calculating member counts:", error);
      return { activePaid: 0, activePending: 0, expired: 0 };
    }
  };

  // Update fetchInitialData to use new counts
  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const total = await totalMemberCount({ currentUser, libraryId: activeLibrary.id });
      const { activePaid, activePending, expired } = await calculateMemberCounts();

      setTotalMembers(total);
      setActivePaidCount(activePaid);
      setActivePendingCount(activePending);
      setExpiredCount(expired);

      // Fetch initial members
      const { members: newMembers, lastVisibleDoc, hasMore: more } = await getMembers({
        pageSize: 10,
        lastVisible,
        currentUser,
        libraryId: activeLibrary.id
      });

      // Fetch latest rent for each member
      const membersWithRent = await Promise.all(
        newMembers.map(async (member) => ({
          ...member,
          latestRent: await fetchLatestRent(member.id)
        }))
      );

      setMembers(membersWithRent);
      setFilteredMembers(membersWithRent);
      setLastVisible(lastVisibleDoc);
      setHasMore(more);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch more members when scrolling
  const fetchMoreMembers = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const { members: newMembers, lastVisibleDoc, hasMore: more } = await getMembers({
        pageSize: 10,
        lastVisible,
        currentUser,
        libraryId: activeLibrary.id
      });

      // Fetch latest rent for new members
      const membersWithRent = await Promise.all(
        newMembers.map(async (member) => ({
          ...member,
          latestRent: await fetchLatestRent(member.id)
        }))
      );

      setMembers((prev) => [...prev, ...membersWithRent]);
      setFilteredMembers((prev) => [...prev, ...membersWithRent]);
      setLastVisible(lastVisibleDoc);
      setHasMore(more);
    } catch (error) {
      console.error("Error fetching more members:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Update applyFilter to use new rent-based categories
  const applyFilter = (filter: "all" | "activePaid" | "activePending" | "expired") => {
    setActiveFilter(filter);
    const today = new Date();
    
    switch (filter) {
      case "activePaid":
        const activePaidMembers = members.filter((member) => {
          if (!member.latestRent) return false;
          const endDate = new Date(member.latestRent.endDate);
          return endDate > today && member.latestRent.dueAmount === 0;
        });
        setFilteredMembers(activePaidMembers);
        break;
      case "activePending":
        const activePendingMembers = members.filter((member) => {
          if (!member.latestRent) return false;
          const endDate = new Date(member.latestRent.endDate);
          return endDate > today && member.latestRent.dueAmount > 0;
        });
        setFilteredMembers(activePendingMembers);
        break;
      case "expired":
        const expiredMembers = members.filter((member) => {
          if (!member.latestRent) return true;
          const endDate = new Date(member.latestRent.endDate);
          return endDate <= today;
        });
        setFilteredMembers(expiredMembers);
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
  const renderItem = ({ item }: { item: MemberWithRent }) => (
    <MemberCard 
      member={item} 
      onPress={() => handleMemberClick(item.id)}
      rentDetails={item.latestRent}
    />
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
            style={[styles.filterButton, activeFilter === "activePaid" && styles.activeFilter]}
            onPress={() => applyFilter("activePaid")}
          >
            <Text style={styles.filterText}>Active & Paid ({activePaidCount})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === "activePending" && styles.activeFilter]}
            onPress={() => applyFilter("activePending")}
          >
            <Text style={styles.filterText}>Active & Pending ({activePendingCount})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === "expired" && styles.activeFilter]}
            onPress={() => applyFilter("expired")}
          >
            <Text style={styles.filterText}>Expired ({expiredCount})</Text>
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