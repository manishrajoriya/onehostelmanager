import React, { useState } from "react";
import { View, Text, Button, Alert } from "react-native";
import * as FileSystem from "expo-file-system";
import * as XLSX from "xlsx";
import * as Sharing from "expo-sharing";
import { getMembers } from "@/firebase/functions";
import useStore from "@/hooks/store";

const DownloadMembersPage = () => {
  const [isLoading, setIsLoading] = useState(false);

  const currentUser = useStore((state: any) => state.currentUser);
  const activeLibrary = useStore((state: any) => state.activeLibrary);

  const handleDownload = async () => {
    setIsLoading(true);

    try {
      // Fetch members data
      const { members } = await getMembers({
        pageSize: 100, // Adjust as needed
        lastVisible: undefined,
        currentUser: currentUser, // Replace with actual user
        libraryId: activeLibrary.id, // Replace with actual library ID
      });

      // Convert members data to Excel
      const worksheet = XLSX.utils.json_to_sheet(members);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Members");

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, {
        type: "base64",
        bookType: "xlsx",
      });

      // Save the file to the device
      const fileUri = FileSystem.documentDirectory + "members.xlsx";
      await FileSystem.writeAsStringAsync(fileUri, excelBuffer, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Notify the user
      Alert.alert(
        "Download Complete",
        `File saved to: ${fileUri}`,
        [
          {
            text: "OK",
            onPress: () => {
              // Share the file after download
              Sharing.shareAsync(fileUri, {
                mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // MIME type for .xlsx files
                dialogTitle: "Share Members Data",
                UTI: "com.microsoft.excel.xlsx", // Uniform Type Identifier for Excel files
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error downloading members:", error);
      Alert.alert("Error", "Failed to download members data.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Download Members Data</Text>
      <Button
        title={isLoading ? "Downloading..." : "Download Excel"}
        onPress={handleDownload}
        disabled={isLoading}
      />
    </View>
  );
};

export default DownloadMembersPage;