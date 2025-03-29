import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { getMembers } from "@/firebase/functions";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import useStore from "@/hooks/store";
import * as XLSX from "xlsx";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import { formatDate } from "./AddMemberForm";
import {totalAmountCount, paidAmountCount, dueAmountCount} from "@/firebase/functions";

interface Member {
  id: string;
  fullName: string;
  dueAmount: number;
  totalAmount: number;
  paidAmount: number;
}

const PAGE_SIZE = 10;

export default function MemberPaymentList() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();

  const currentUser = useStore((state: any) => state.currentUser);
  const activeLibrary = useStore((state: any) => state.activeLibrary);

  // Calculate totals
  const [totalPaid, setTotalPaid] = useState<number>(0);
  const [totalDue, setTotalDue] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);


 


  useEffect(() => {
    fetchMembers();
    fetchAmount();
  }, []);

  const fetchAmount = async () => {
    const totalPaid = await paidAmountCount({ currentUser, libraryId: activeLibrary?.id || "" });
    const totalDue = await dueAmountCount({ currentUser, libraryId: activeLibrary?.id || "" });
    const totalAmount = await totalAmountCount({ currentUser, libraryId: activeLibrary?.id || "" });

    setTotalPaid(totalPaid);
    setTotalDue(totalDue);
    setTotalAmount(totalAmount);
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

      setMembers((prevMembers) => (loadMore ? [...prevMembers, ...result.members] : result.members));
      setLastVisible(result.lastVisibleDoc);
      setHasMore(result.hasMore);
    } catch (err) {
      setError("Failed to fetch members. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <View>
    <View style={styles.tableHeader}>
      <Text style={styles.headerText}>Full Name</Text>
      <Text style={styles.headerText}>Paid Amount</Text>
      <Text style={styles.headerText}>Due Amount</Text>
      <Text style={styles.headerText}>Total Amount</Text>
    </View>
    <View style={[styles.tableRow, styles.totalRow]}>
      <Text style={[styles.cellText, styles.totalText]}>Total</Text>
      <Text style={[styles.cellText, styles.totalText]}>{totalPaid}</Text>
      <Text style={[styles.cellText, styles.totalText, styles.dueAmount]}>{totalDue}</Text>
      <Text style={[styles.cellText, styles.totalText]}>{totalAmount}</Text>
    </View>
    </View>
  );

  const renderMemberItem = ({ item }: { item: Member }) => (
    <View style={styles.tableRow}>
      <Text style={styles.cellText}>{item.fullName}</Text>
      <Text style={styles.cellText}>{item.paidAmount}</Text>
      <Text style={[styles.cellText, styles.dueAmount]}>{item.dueAmount}</Text>
      <Text style={styles.cellText}>{item.totalAmount}</Text>
    </View>
  );

  const generateExcel = async () => {
    try {
      // Add totals row to the Excel data
      const excelData = [
        ...members.map((member) => ({
          "Full Name": member.fullName,
          "Paid Amount": member.paidAmount,
          "Due Amount": member.dueAmount,
          "Total Amount": member.totalAmount,
        })),
        {
          "Full Name": "TOTAL",
          "Paid Amount": totalPaid,
          "Due Amount": totalDue,
          "Total Amount": totalAmount,
        },
      ];

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Members");

      const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });

      const fileName = FileSystem.documentDirectory + `member_payment_summary ${new Date().toDateString()}.xlsx`;
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
        <Text style={styles.title}>Payment Summary</Text>
        <TouchableOpacity style={styles.downloadButton} onPress={generateExcel}>
          <Ionicons name="download-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={members}
        renderItem={renderMemberItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        onEndReached={() => hasMore && fetchMembers(true)}
        onEndReachedThreshold={0.1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
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
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#02c39a",
    borderRadius: 8,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalRow: {
    backgroundColor: "#e6f7f4",
    borderTopWidth: 2,
    borderTopColor: "#02c39a",
  },
  cellText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  totalText: {
    fontWeight: "bold",
    fontSize: 15,
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
  endMessage: {
    textAlign: "center",
    color: "#666",
    padding: 16,
  },
});