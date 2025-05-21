import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, SafeAreaView, TextInput } from "react-native";
import { auth, db, storage } from "../utils/firebaseConfig"; // Import Firebase auth, db and storage
import { signOut, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { writeBatch, doc, collection, getDocs, query, where } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { useRouter } from "expo-router";
import useStore from "@/hooks/store";

const LogoutScreen = () => {
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showReauth, setShowReauth] = useState(false);
  const [password, setPassword] = useState("");
  const router = useRouter();

  // Global state management
  const currentUser = useStore((state: any) => state.currentUser);
  const clearCurrentUser = useStore((state: any) => state.clearCurrentUser);
  const clearActiveLibrary = useStore((state: any) => state.clearActiveLibrary);

  // Handle logout logic
  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      clearCurrentUser();
      clearActiveLibrary();
      router.replace("/auth");
    } catch (error: any) {
      // Improved console error logging
      console.group('Logout Error');
      console.log('%cError Details:', 'color: #ff6b6b; font-weight: bold');
      console.log('Code:', error.code);
      console.log('Message:', error.message);
      console.log('Stack:', error.stack);
      console.groupEnd();

      let errorMessage = "An error occurred while logging out. Please try again.";
      let errorTitle = "Logout Failed";
      
      switch (error.code) {
        case "auth/network-request-failed":
          errorMessage = "Network error. Please check your internet connection and try again.";
          errorTitle = "Network Error";
          break;
        case "auth/no-current-user":
          errorMessage = "No user is currently signed in.";
          errorTitle = "No User Found";
          break;
        default:
          if (error.message) {
            errorMessage = error.message;
          }
      }

      Alert.alert(errorTitle, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => setShowReauth(true)
        }
      ]
    );
  };

  const handleReauthAndDelete = async () => {
    if (!password) {
      Alert.alert("Error", "Please enter your password");
      return;
    }

    setDeleteLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error("No user found. Please try logging in again.");
      }

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // Delete all user data from Firestore
      const batch = writeBatch(db);
      
      // Delete user document
      const userRef = doc(db, "users", user.uid);
      batch.delete(userRef);

      // Delete libraries
      const librariesQuery = query(collection(db, "libraries"), where("admin", "==", user.uid));
      const librariesSnapshot = await getDocs(librariesQuery);
      librariesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete members
      const membersQuery = query(collection(db, "members"), where("admin", "==", user.uid));
      const membersSnapshot = await getDocs(membersQuery);
      membersSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete plans
      const plansQuery = query(collection(db, "plans"), where("admin", "==", user.uid));
      const plansSnapshot = await getDocs(plansQuery);
      plansSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete attendance records
      const attendanceQuery = query(collection(db, "attendance"), where("admin", "==", user.uid));
      const attendanceSnapshot = await getDocs(attendanceQuery);
      attendanceSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete finance records
      const financeQuery = query(collection(db, "finance"), where("userId", "==", user.uid));
      const financeSnapshot = await getDocs(financeQuery);
      financeSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete rooms
      const roomsQuery = query(collection(db, "rooms"), where("admin", "==", user.uid));
      const roomsSnapshot = await getDocs(roomsQuery);
      roomsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Commit all deletions
      await batch.commit();

      // Delete user storage files
      const storageRef = ref(storage, `upload/${user.uid}`);
      try {
        await deleteObject(storageRef);
      } catch (error) {
        console.log("No storage files to delete or error deleting storage:", error);
      }

      // Finally delete the user account
      await deleteUser(user);
      clearCurrentUser();
      clearActiveLibrary();
      router.replace("/auth");
    } catch (error: any) {
      // Improved console error logging
      console.group('Account Deletion Error');
      console.log('%cError Details:', 'color: #ff6b6b; font-weight: bold');
      console.log('Code:', error.code);
      console.log('Message:', error.message);
      console.log('Stack:', error.stack);
      console.groupEnd();

      let errorMessage = "An error occurred while deleting your account. Please try again.";
      let errorTitle = "Deletion Failed";
      
      switch (error.code) {
        case "auth/wrong-password":
          errorMessage = "Incorrect password. Please try again.";
          errorTitle = "Invalid Password";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many failed attempts. Please try again later.";
          errorTitle = "Too Many Attempts";
          break;
        case "auth/network-request-failed":
          errorMessage = "Network error. Please check your internet connection and try again.";
          errorTitle = "Network Error";
          break;
        case "auth/user-token-expired":
          errorMessage = "Your session has expired. Please log in again and try deleting your account.";
          errorTitle = "Session Expired";
          break;
        case "auth/requires-recent-login":
          errorMessage = "Your session is too old. Please log out and log in again before deleting your account.";
          errorTitle = "Session Too Old";
          break;
        case "auth/user-not-found":
          errorMessage = "User account not found. Please try logging in again.";
          errorTitle = "Account Not Found";
          break;
        case "auth/invalid-credential":
          errorMessage = "Invalid credentials. Please check your password and try again.";
          errorTitle = "Invalid Credentials";
          break;
        default:
          if (error.message) {
            errorMessage = error.message;
          }
      }

      Alert.alert(
        errorTitle,
        errorMessage,
        [
          {
            text: "OK",
            onPress: () => {
              if (error.code === "auth/user-token-expired" || 
                  error.code === "auth/requires-recent-login" ||
                  error.code === "auth/user-not-found") {
                handleLogout();
              }
            }
          }
        ]
      );
    } finally {
      setDeleteLoading(false);
      setShowReauth(false);
      setPassword("");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          {/* Heading */}
          <Text style={styles.heading}>Account Settings</Text>

          {/* User Info */}
          {currentUser && (
            <View style={styles.userInfoContainer}>
              <Text style={styles.userInfoLabel}>Currently logged in as:</Text>
              <Text style={styles.userInfo} accessibilityLabel={`Logged in as ${currentUser.email}`}>
                {currentUser.email}
              </Text>
            </View>
          )}

          {/* Logout Button */}
          <View style={styles.buttonsContainer}>
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
          </View>
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          {/* Contact Information */}
          <View style={styles.contactContainer}>
            <Text style={styles.contactTitle}>Need Help?</Text>
            <Text style={styles.contactText}>
              Contact us for support, feature requests, or bug reports:
            </Text>
            <Text style={styles.contactDetails}>
              Email: OneLibrary001@gmail.com
            </Text>
            <Text style={styles.contactDetails}>
              Phone: +91 9468737084
            </Text>
          </View>

          {/* Delete Account Button */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
            disabled={deleteLoading}
            accessibilityLabel="Delete account button"
          >
            {deleteLoading ? (
              <ActivityIndicator color="#c0392b" />
            ) : (
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            )}
          </TouchableOpacity>

          {/* Re-authentication Modal */}
          {showReauth && (
            <View style={styles.modalOverlay}>
              <View style={styles.reauthContainer}>
                <View style={styles.reauthHeader}>
                  <Text style={styles.reauthTitle}>Confirm Account Deletion</Text>
                  <Text style={styles.reauthSubtitle}>
                    For security reasons, please verify your identity
                  </Text>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Enter your password</Text>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="••••••••"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    placeholderTextColor="#999"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.reauthButtons}>
                  <TouchableOpacity
                    style={[styles.reauthButton, styles.cancelButton]}
                    onPress={() => {
                      setShowReauth(false);
                      setPassword("");
                    }}
                  >
                    <Text style={styles.reauthButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.reauthButton, styles.confirmButton]}
                    onPress={handleReauthAndDelete}
                    disabled={deleteLoading || !password}
                  >
                    {deleteLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.reauthButtonText}>Delete Account</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
    padding: 20,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#333",
  },
  userInfoContainer: {
    marginBottom: 40,
    alignItems: "center",
  },
  userInfoLabel: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  userInfo: {
    fontSize: 18,
    color: "#333",
    fontWeight: "500",
    textAlign: "center",
  },
  buttonsContainer: {
    width: "100%",
    maxWidth: 300,
    alignItems: "center",
  },
  logoutButton: {
    backgroundColor: "#e74c3c",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 10,
    width: "100%",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  bottomSection: {
    marginTop: "auto",
    alignItems: "center",
    width: "100%",
  },
  deleteButton: {
    backgroundColor: "transparent",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#c0392b",
    marginBottom: 20,
  },
  deleteButtonText: {
    color: "#c0392b",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  contactContainer: {
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    width: "100%",
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  contactText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
  },
  contactDetails: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
    marginBottom: 5,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  reauthContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  reauthHeader: {
    marginBottom: 24,
  },
  reauthTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  reauthSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  passwordInput: {
    backgroundColor: "#f5f5f5",
    width: "100%",
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  reauthButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  reauthButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
  },
  confirmButton: {
    backgroundColor: "#c0392b",
  },
  reauthButtonText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  cancelButtonText: {
    color: "#333",
  },
  confirmButtonText: {
    color: "#fff",
  },
});

export default LogoutScreen;