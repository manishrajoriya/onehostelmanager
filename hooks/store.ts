import  {create, StateCreator } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const useStore = create((set) => ({
  // Current User
  currentUser: null,
  setCurrentUser: async (user: any) => {
    set(() => ({ currentUser: user })); // Update state synchronously
    try {
      await AsyncStorage.setItem("currentUser", JSON.stringify(user)); // Persist user
    } catch (error) {
      console.error("Error storing currentUser:", error);
    }
  },
  clearCurrentUser: async () => {
    set(() => ({ currentUser: null })); // Clear state synchronously
    try {
      await AsyncStorage.removeItem("currentUser"); // Remove persisted user
    } catch (error) {
      console.error("Error removing currentUser:", error);
    }
  },

  // Active Library
  activeLibrary: null,
  setActiveLibrary: async (library: any) => {
    set(() => ({ activeLibrary: library })); // Update state synchronously
    try {
      await AsyncStorage.setItem("activeLibrary", JSON.stringify(library)); // Persist library
    } catch (error) {
      console.error("Error storing activeLibrary:", error);
    }
  },
  clearActiveLibrary: async () => {
    set(() => ({ activeLibrary: null })); // Clear state synchronously
    try {
      await AsyncStorage.removeItem("activeLibrary"); // Remove persisted library
    } catch (error) {
      console.error("Error removing activeLibrary:", error);
    }
  },

  // Initialize store from AsyncStorage
  initializeStore: async () => {
    try {
      const userJson = await AsyncStorage.getItem("currentUser");
      const libraryJson = await AsyncStorage.getItem("activeLibrary");

      if (userJson) {
        set(() => ({ currentUser: JSON.parse(userJson) }));
      }
      if (libraryJson) {
        set(() => ({ activeLibrary: JSON.parse(libraryJson) }));
      }
    } catch (error) {
      console.error("Error initializing store:", error);
    }
  },
}));

export default useStore;
