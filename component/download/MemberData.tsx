import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from "react-native";
import * as FileSystem from "expo-file-system";
import * as XLSX from "xlsx";
import * as Sharing from "expo-sharing";
import { getMembers } from "@/firebase/functions";
import useStore from "@/hooks/store";
import { Ionicons } from "@expo/vector-icons";


const DownloadMembersPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const currentUser = useStore((state: any) => state.currentUser);
  const activeLibrary = useStore((state: any) => state.activeLibrary);

  const handleDownload = async () => {
    if (!activeLibrary?.id) {
      Alert.alert("Error", "No active library selected.");
      return;
    }

    setIsLoading(true);

    try {
      const { members } = await getMembers({
        pageSize: 100,
        lastVisible: undefined,
        currentUser: currentUser,
        libraryId: activeLibrary.id,
      });

      if (!members || members.length === 0) {
        Alert.alert("Info", "No members found to download.");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(members);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Members");

      const excelBuffer = XLSX.write(workbook, {
        type: "base64",
        bookType: "xlsx",
      });

      const fileUri = FileSystem.documentDirectory + `members_${activeLibrary.name || activeLibrary.id}.xlsx`;
      await FileSystem.writeAsStringAsync(fileUri, excelBuffer, {
        encoding: FileSystem.EncodingType.Base64,
      });

      Alert.alert(
        "Download Complete",
        `Members data has been successfully exported.`,
        [
          {
            text: "Share",
            onPress: () => Sharing.shareAsync(fileUri, {
              mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              dialogTitle: "Share Members Data",
              UTI: "com.microsoft.excel.xlsx",
            }),
            style: "default"
          },
          {
            text: "OK",
            style: "cancel"
          }
        ]
      );
    } catch (error) {
      console.error("Error downloading members:", error);
      Alert.alert("Error", "Failed to export members data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons name="cloud-download-outline" size={48} color="#02c39a" />
        </View>
        
        <Text style={styles.title}>Export Members Data</Text>
        <Text style={styles.subtitle}>
          Download all members information as an Excel spreadsheet.
        </Text>
        
        <Text style={styles.infoText}>
          {activeLibrary?.name ? `Library: ${activeLibrary.name}` : "No active library selected"}
        </Text>
        
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleDownload}
          disabled={isLoading || !activeLibrary?.id}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>
              <Ionicons name="download" size={18} color="white" /> Export to Excel
            </Text>
          )}
        </TouchableOpacity>
        
        <Text style={styles.note}>
          Note: The exported file will contain all available member information.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    textAlign: "center",
    color: "#888",
    marginBottom: 24,
    fontStyle: "italic",
  },
  button: {
    backgroundColor: "#02c39a",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: "#cccccc",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  note: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default DownloadMembersPage;