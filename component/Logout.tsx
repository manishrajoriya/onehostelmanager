import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from "react-native";
import { auth } from "../utils/firebaseConfig"; // Import Firebase auth
import { signOut } from "firebase/auth";
import { useRouter } from "expo-router";
import useStore from "@/hooks/store";

const LogoutScreen = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Global state management
  const currentUser = useStore((state: any) => state.currentUser);
  const clearCurrentUser = useStore((state: any) => state.clearCurrentUser);
  const clearActiveLibrary = useStore((state: any) => state.clearActiveLibrary);

  // Handle logout logic
  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth); // Sign out from Firebase
      clearCurrentUser(); // Clear global user state
      clearActiveLibrary(); // Clear active library state
      router.replace("/auth"); // Navigate to the login screen
    } catch (error) {
      console.error("Logout failed:", error);
      Alert.alert("Logout Failed", "An error occurred while logging out. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Heading */}
      <Text style={styles.heading}>Logout</Text>

      {/* User Info */}
      {currentUser && (
        <Text style={styles.userInfo} accessibilityLabel={`Logged in as ${currentUser.email}`}>
          Logged in as: {currentUser.email}
        </Text>
      )}

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        disabled={loading}
        accessibilityLabel="Logout button"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Logout</Text>
        )}
      </TouchableOpacity>
     
      <View style={styles.contactContainer}>
        <Text style={styles.contactText}>
          Ask for new features or bug reports at: OneLibrary001@gmail.com or +91 9468737084
        </Text>
      </View>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  userInfo: {
    fontSize: 16,
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
  },
  logoutButton: {
    backgroundColor: "red",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    elevation: 3, // Add shadow for Android
    shadowColor: "#000", // Add shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  contactContainer: {
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  contactText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
});

export default LogoutScreen;