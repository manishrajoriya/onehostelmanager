import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, ScrollView, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { getMembers } from "@/firebase/functions";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import useStore from "@/hooks/store";
import * as XLSX from "xlsx";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/utils/firebaseConfig";

interface RentPayment {
  id: string;
  startDate: string;
  endDate: string;
  paidAmount: number;
  dueAmount: number;
  paymentDate: Date;
}

interface Member {
  id: string;
  fullName: string;
  rentHistory: RentPayment[];
}

const PAGE_SIZE = 10;
const screenWidth = Dimensions.get("window").width;

export default function MemberPaymentList() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const router = useRouter();

  const currentUser = useStore((state: any) => state.currentUser);
  const activeLibrary = useStore((state: any) => state.activeLibrary);

  // Calculate totals
  const [totalPaid, setTotalPaid] = useState<number>(0);
  const [totalDue, setTotalDue] = useState<number>(0);
  const [totalRent, setTotalRent] = useState<number>(0);

  useEffect(() => {
    fetchMembers();
  }, []);

  const calculateTotals = (members: Member[]) => {
    let paid = 0;
    let due = 0;
    let total = 0;

    members.forEach(member => {
      member.rentHistory.forEach(rent => {
        paid += rent.paidAmount;
        due += rent.dueAmount;
        total += rent.paidAmount + rent.dueAmount;
      });
    });

    setTotalPaid(paid);
    setTotalDue(due);
    setTotalRent(total);
  };

  const fetchRentHistory = async (memberId: string) => {
    try {
      const rentRef = collection(db, `tenants/${memberId}/rentPayments`);
      const q = query(rentRef, orderBy("paymentDate", "desc"));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        startDate: doc.data().startDate,
        endDate: doc.data().endDate,
        paidAmount: doc.data().paidAmount,
        dueAmount: doc.data().dueAmount,
        paymentDate: doc.data().paymentDate.toDate()
      }));
    } catch (error) {
      console.error("Error fetching rent history:", error);
      return [];
    }
  };

  const fetchMembers = async (loadMore = false) => {
    if (!loadMore) setLoading(true);
    setError(null);

    try {
      const result = await getMembers({
        pageSize: PAGE_SIZE,
        lastVisible: loadMore ? lastVisible : undefined,
        currentUser: currentUser,
        libraryId: activeLibrary?.id || "",
      });

      const membersWithRentHistory = await Promise.all(
        result.members.map(async (member) => ({
          ...member,
          rentHistory: await fetchRentHistory(member.id)
        }))
      );

      setMembers((prevMembers) => (loadMore ? [...prevMembers, ...membersWithRentHistory] : membersWithRentHistory));
      setLastVisible(result.lastVisibleDoc);
      setHasMore(result.hasMore);
      
      calculateTotals(loadMore ? [...members, ...membersWithRentHistory] : membersWithRentHistory);
    } catch (err) {
      setError("Failed to fetch members. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderSummaryCards = () => (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryCard}>
        <MaterialIcons name="payments" size={24} color="#02c39a" />
        <Text style={styles.summaryValue}>₹{totalPaid}</Text>
        <Text style={styles.summaryLabel}>Total Paid</Text>
      </View>
      <View style={styles.summaryCard}>
        <MaterialIcons name="pending-actions" size={24} color="#e53e3e" />
        <Text style={[styles.summaryValue, styles.dueAmount]}>₹{totalDue}</Text>
        <Text style={styles.summaryLabel}>Total Due</Text>
      </View>
      <View style={styles.summaryCard}>
        <MaterialIcons name="account-balance" size={24} color="#4a90e2" />
        <Text style={styles.summaryValue}>₹{totalRent}</Text>
        <Text style={styles.summaryLabel}>Total Rent</Text>
      </View>
    </View>
  );

  const renderPaymentDistribution = () => {
    const paidPercentage = (totalPaid / totalRent) * 100;
    const duePercentage = (totalDue / totalRent) * 100;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Payment Distribution</Text>
        <View style={styles.distributionContainer}>
          <View style={styles.distributionBar}>
            <View 
              style={[
                styles.distributionSegment, 
                styles.paidSegment, 
                { width: `${paidPercentage}%` }
              ]} 
            />
            <View 
              style={[
                styles.distributionSegment, 
                styles.dueSegment, 
                { width: `${duePercentage}%` }
              ]} 
            />
          </View>
          <View style={styles.distributionLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.paidColor]} />
              <Text style={styles.legendText}>Paid: ₹{totalPaid}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.dueColor]} />
              <Text style={styles.legendText}>Due: ₹{totalDue}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderPaymentTrend = () => {
    if (!selectedMember || selectedMember.rentHistory.length === 0) return null;

    const maxAmount = Math.max(...selectedMember.rentHistory.map(rent => rent.paidAmount));
    const history = [...selectedMember.rentHistory].reverse();

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Payment Trend</Text>
        <View style={styles.trendContainer}>
          <View style={styles.trendBars}>
            {history.map((rent, index) => {
              const height = (rent.paidAmount / maxAmount) * 150;
              return (
                <View key={rent.id} style={styles.trendBarContainer}>
                  <View style={[styles.trendBar, { height }]} />
                  <Text style={styles.trendLabel}>
                    {new Date(rent.paymentDate).toLocaleDateString('en-US', { month: 'short' })}
                  </Text>
                </View>
              );
            })}
          </View>
          <View style={styles.trendYAxis}>
            <Text style={styles.trendYLabel}>₹{maxAmount}</Text>
            <Text style={styles.trendYLabel}>₹{Math.round(maxAmount / 2)}</Text>
            <Text style={styles.trendYLabel}>₹0</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderMemberItem = ({ item }: { item: Member }) => (
    <TouchableOpacity 
      style={[
        styles.memberCard,
        selectedMember?.id === item.id && styles.selectedMemberCard
      ]}
      onPress={() => setSelectedMember(item)}
    >
      <View style={styles.memberHeader}>
        <Text style={styles.memberName}>{item.fullName}</Text>
        <MaterialIcons 
          name={selectedMember?.id === item.id ? "expand-less" : "expand-more"} 
          size={24} 
          color="#666" 
        />
      </View>
      
      {selectedMember?.id === item.id && (
        <View style={styles.memberDetails}>
          {renderPaymentTrend()}
          <View style={styles.rentHistoryContainer}>
            <Text style={styles.rentHistoryTitle}>Rent History</Text>
            {item.rentHistory.map((rent, index) => (
              <View key={rent.id} style={styles.rentHistoryItem}>
                <View style={styles.rentHistoryHeader}>
                  <Text style={styles.rentPeriod}>{`${rent.startDate} - ${rent.endDate}`}</Text>
                  <Text style={styles.paymentDate}>
                    {rent.paymentDate.toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.rentHistoryAmounts}>
                  <View style={styles.amountItem}>
                    <Text style={styles.amountLabel}>Paid</Text>
                    <Text style={styles.amountValue}>₹{rent.paidAmount}</Text>
                  </View>
                  <View style={styles.amountItem}>
                    <Text style={styles.amountLabel}>Due</Text>
                    <Text style={[styles.amountValue, styles.dueAmount]}>₹{rent.dueAmount}</Text>
                  </View>
                  <View style={styles.amountItem}>
                    <Text style={styles.amountLabel}>Total</Text>
                    <Text style={styles.amountValue}>₹{rent.paidAmount + rent.dueAmount}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  const generateExcel = async () => {
    try {
      const excelData = members.flatMap(member => 
        member.rentHistory.length === 0 
          ? [{
              "Full Name": member.fullName,
              "Rent Period": "No Rent History",
              "Payment Date": "-",
              "Paid Amount": 0,
              "Due Amount": 0,
              "Total Amount": 0,
            }]
          : member.rentHistory.map(rent => ({
              "Full Name": member.fullName,
              "Rent Period": `${rent.startDate} - ${rent.endDate}`,
              "Payment Date": rent.paymentDate.toLocaleDateString(),
              "Paid Amount": rent.paidAmount,
              "Due Amount": rent.dueAmount,
              "Total Amount": rent.paidAmount + rent.dueAmount,
            }))
      );

      excelData.push({
        "Full Name": "TOTAL",
        "Rent Period": "-",
        "Payment Date": "-",
        "Paid Amount": totalPaid,
        "Due Amount": totalDue,
        "Total Amount": totalRent,
      });

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Rent History");

      const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });

      const fileName = FileSystem.documentDirectory + `rent_history_${new Date().toDateString()}.xlsx`;
      await FileSystem.writeAsStringAsync(fileName, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(fileName, {
        UTI: ".xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      Alert.alert("Success", "Excel file has been generated and shared.");
    } catch (error) {
      console.error("Error generating Excel:", error);
      Alert.alert("Error", "Failed to generate Excel file. Please try again.");
    }
  };

  if (loading && members.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#02c39a" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchMembers()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rent Payment History</Text>
        <TouchableOpacity style={styles.downloadButton} onPress={generateExcel}>
          <Ionicons name="download-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView>
        {renderSummaryCards()}
        {renderPaymentDistribution()}
        
        <FlatList
          data={members}
          renderItem={renderMemberItem}
          keyExtractor={(item) => item.id}
          onEndReached={() => hasMore && fetchMembers(true)}
          onEndReachedThreshold={0.1}
          scrollEnabled={false}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  downloadButton: {
    backgroundColor: "#02c39a",
    padding: 8,
    borderRadius: 8,
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
  },
  chartContainer: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  distributionContainer: {
    marginTop: 8,
  },
  distributionBar: {
    height: 24,
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    flexDirection: "row",
    overflow: "hidden",
  },
  distributionSegment: {
    height: "100%",
  },
  paidSegment: {
    backgroundColor: "#02c39a",
  },
  dueSegment: {
    backgroundColor: "#e53e3e",
  },
  distributionLegend: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  paidColor: {
    backgroundColor: "#02c39a",
  },
  dueColor: {
    backgroundColor: "#e53e3e",
  },
  legendText: {
    fontSize: 12,
    color: "#666",
  },
  trendContainer: {
    flexDirection: "row",
    height: 200,
    marginTop: 16,
  },
  trendBars: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    paddingBottom: 24,
  },
  trendBarContainer: {
    alignItems: "center",
    flex: 1,
  },
  trendBar: {
    width: 20,
    backgroundColor: "#02c39a",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  trendLabel: {
    fontSize: 10,
    color: "#666",
    marginTop: 4,
    transform: [{ rotate: "-45deg" }],
  },
  trendYAxis: {
    width: 40,
    justifyContent: "space-between",
    paddingRight: 8,
  },
  trendYLabel: {
    fontSize: 10,
    color: "#666",
    textAlign: "right",
  },
  memberCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedMemberCard: {
    borderColor: "#02c39a",
    borderWidth: 2,
  },
  memberHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  memberDetails: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  rentHistoryContainer: {
    marginTop: 16,
  },
  rentHistoryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  rentHistoryItem: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  rentHistoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  rentPeriod: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  paymentDate: {
    fontSize: 12,
    color: "#666",
  },
  rentHistoryAmounts: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  amountItem: {
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  dueAmount: {
    color: "#e53e3e",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#e53e3e",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#02c39a",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});