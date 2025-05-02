import { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, type AuthError, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/utils/firebaseConfig";
import { useRouter } from "expo-router";
import useStore from "@/hooks/store";
import Purchases from 'react-native-purchases';

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setCurrentUser = useStore((state: any) => state.setCurrentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) {
        router.replace("/(tabs)");
      }
    });
    return () => unsubscribe();
  }, []);

  const validateForm = (): boolean => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return false;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return false;
    }
    return true;
  };

    // New: Link RevenueCat to Firebase UID
  const linkRevenueCatUser = async (firebaseUid: string) => {
    try {
      await Purchases.logIn(firebaseUid); // 🔑 Critical for cross-device sync
      
    } catch (error) {
      console.error("RevenueCat login failed:", error);
    }
  };

  const handleAuth = async (): Promise<void> => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      let userCredential;
      
      if (isLogin) {
       userCredential = await signInWithEmailAndPassword(auth, email, password);
       
       
        Alert.alert("Success", "Logged in successfully");
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        Alert.alert("Success", "Account created successfully");
      }

      if (userCredential.user?.uid) {
        await linkRevenueCatUser(userCredential.user.uid);
      }

      router.replace("/(tabs)");
    } catch (error) {
      const authError = error as AuthError;
      Alert.alert("Error", isLogin ? "Login failed: " : "Signup failed: " + authError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert("Success", "Password reset email sent. Please check your inbox.");
    } catch (error) {
      const authError = error as AuthError;
      Alert.alert("Error", "Failed to send reset email: " + authError.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{isLogin ? "Login" : "Sign Up"}</Text>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />
        {isLogin && (
          <TouchableOpacity onPress={handleForgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleAuth} 
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>{isLogin ? "Login" : "Sign Up"}</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.switchText}>{isLogin ? "Need an account? Sign Up" : "Already have an account? Login"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "white",
    padding: 30,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 30,
    color: "#1a1a1a",
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    color: "#2d2d2d",
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#e0e0e0",
    borderWidth: 1.5,
    marginBottom: 20,
    paddingHorizontal: 15,
    borderRadius: 12,
    backgroundColor: "#fff",
    fontSize: 15,
    color: "#333",
  },
  button: {
    backgroundColor: "#02c39a",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#02c39a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: "#a0c4ff",
    shadowOpacity: 0,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  switchText: {
    marginTop: 20,
    color: "#02c39a",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 15,
  },
  forgotPasswordText: {
    color: "#02c39a",
    textAlign: "right",
    marginBottom: 20,
    fontSize: 14,
    fontWeight: "500",
  },
});
