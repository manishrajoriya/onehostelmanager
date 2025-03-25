import { useState, useEffect } from "react"
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { auth } from "@/utils/firebaseConfig"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user)
        await AsyncStorage.setItem("user", JSON.stringify(user))
      } else {
        setUser(null)
        await AsyncStorage.removeItem("user")
      }
    })

    // Check for stored user data on mount
    AsyncStorage.getItem("user").then((userData) => {
      if (userData) {
        setUser(JSON.parse(userData))
      }
    })

    AsyncStorage.getItem("onboardingCompleted").then((value) => {
      setOnboardingCompleted(value === "true")
    })

    return unsubscribe
  }, [])

  const signIn = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password)
  }

  const signUp = (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password)
  }

  const logOut = () => {
    return signOut(auth)
  }

  return { user, signIn, signUp, logOut, onboardingCompleted }
}

