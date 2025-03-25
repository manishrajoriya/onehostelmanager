import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import { auth } from "@/utils/firebaseConfig";
import useStore from "@/hooks/store";

export default function Index() {
  const router = useRouter();
  const initializeStore = useStore((state: any) => state.initializeStore);


  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        router.replace("/(tabs)"); 
      }else {
        router.replace("/onbording"); 
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    initializeStore(); 
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6B46C1" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
