import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { auth } from "@/utils/firebaseConfig";
import useStore from "@/hooks/store";
import Toast from "react-native-toast-message";

export default function Index() {
  const router = useRouter();
  const initializeStore = useStore((state: any) => state.initializeStore);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeApp = async () => {
      try {
        // Initialize store first
        await initializeStore();

        // Then set up auth state listener
        unsubscribe = auth.onAuthStateChanged((user) => {
          try {
            // Handle navigation based on auth state
            if (user) {
              router.replace("/(tabs)");
            } else {
              router.replace("/onbording");
            }
          } catch (err) {
            setError("Navigation error occurred");
            Toast.show({
              type: 'error',
              text1: 'Navigation Error',
              text2: 'Failed to navigate. Please try again.'
            });
          } finally {
            setLoading(false);
          }
        });
      } catch (err) {
        setError("Failed to initialize app");
        Toast.show({
          type: 'error',
          text1: 'Initialization Error',
          text2: 'Failed to initialize app. Please try again.'
        });
        setLoading(false);
      }
    };

    initializeApp();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setLoading(true);
            initializeStore();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#43C6AC" />
      {loading && <Text style={styles.loadingText}>Initializing app...</Text>}
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f2f5",
  },
  errorContainer: {
    padding: 20,
  },
  errorText: {
    color: "#c62828",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: "#43C6AC",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});
