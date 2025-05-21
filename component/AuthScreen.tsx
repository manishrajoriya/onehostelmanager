import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from "react-native";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, type AuthError, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/utils/firebaseConfig";
import { useRouter } from "expo-router";
import useStore from "@/hooks/store";
import Purchases from 'react-native-purchases';
import { Ionicons } from '@expo/vector-icons';
import Toast from "react-native-toast-message";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { LinearGradient } from 'expo-linear-gradient';
import { addLibrary } from "@/firebase/functions";

type AuthMode = 'login' | 'signup' | 'reset';

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [libraryName, setLibraryName] = useState("");
  const [libraryAddress, setLibraryAddress] = useState("");
  const [libraryDescription, setLibraryDescription] = useState("");
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

  const handleEmailChange = (text: string) => {
    setEmail(text.toLowerCase().trim());
  };

  const handleMobileChange = (text: string) => {
    // Remove all non-digit characters and limit to 10 digits
    const cleaned = text.replace(/\D/g, '').slice(0, 10);
    setMobile(cleaned);
  };

  const validateForm = (): { isValid: boolean; message?: string } => {
    if (!email || !password) {
      return { isValid: false, message: "Please fill in all fields" };
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return { isValid: false, message: "Please enter a valid email address" };
    }
    if (mode !== 'reset' && password.length < 6) {
      return { isValid: false, message: "Password must be at least 6 characters long" };
    }
    if (mode === 'signup') {
      if (!name || !mobile || !libraryName || !libraryAddress) {
        return { isValid: false, message: "Please fill in all fields" };
      }
      // Validate mobile number format
      const mobileRegex = /^[0-9]{10}$/;
      if (!mobileRegex.test(mobile.replace(/\D/g, ''))) {
        return { isValid: false, message: "Please enter a valid 10-digit mobile number" };
      }
    }
    return { isValid: true };
  };

  const linkRevenueCatUser = async (firebaseUid: string) => {
    try {
      await Purchases.logIn(firebaseUid);
    } catch (error) {
      console.error("RevenueCat login failed:", error);
    }
  };

  const handleAuth = async (): Promise<void> => {
    const validation = validateForm();
    if (!validation.isValid) {
      setError(validation.message || "Invalid form data");
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: validation.message || "Invalid form data"
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let userCredential;
      const db = getFirestore();
      if (mode === 'login') {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Logged in successfully'
        });
      } else if (mode === 'signup') {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Save user info to Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
          uid: userCredential.user.uid,
          email,
          name,
          mobile,
          createdAt: new Date(),
        });
        await addLibrary({
          data: {
            name: libraryName,
            address: libraryAddress,
            description: libraryDescription,
            admin: userCredential.user.uid
          },
          currentUser: userCredential.user
        });
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Account created successfully'
        });
      }

      if (userCredential?.user?.uid) {
        await linkRevenueCatUser(userCredential.user.uid);
      }

      router.replace("/(tabs)");
    } catch (error) {
      const authError = error as AuthError;
      setError(authError.message);
      Toast.show({
        type: 'error',
        text1: 'Authentication Error',
        text2: authError.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError("Please enter your email address");
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter your email address'
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await sendPasswordResetEmail(auth, email);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Password reset email sent. Please check your inbox.'
      });
      setMode('login');
    } catch (error) {
      const authError = error as AuthError;
      setError(authError.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: authError.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#3a8dde", "#005fa3"]}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            {/* <Image
              source={require("../assets/images/icon.png")}
              style={styles.headerIcon}
              resizeMode="contain"
            /> */}
            <Text style={styles.title}>
              {mode === 'login' ? 'Login' : mode === 'signup' ? 'Sign Up' : 'Reset Password'}
            </Text>
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#c62828" style={{ marginRight: 6 }} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            <View style={styles.inputContainerModern}>
              <Ionicons name="mail" size={20} color="#3a8dde" style={styles.inputIcon} />
              <TextInput
                style={styles.inputModern}
                placeholder="Enter your email"
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                autoCorrect={false}
                editable={!loading}
                placeholderTextColor="#b0c4de"
              />
            </View>
            {mode === 'signup' && (
              <>
                <View style={styles.inputContainerModern}>
                  <Ionicons name="person" size={20} color="#3a8dde" style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputModern}
                    placeholder="Enter your name"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    editable={!loading}
                    placeholderTextColor="#b0c4de"
                  />
                </View>
                <View style={styles.inputContainerModern}>
                  <Ionicons name="call" size={20} color="#3a8dde" style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputModern}
                    placeholder="Enter your mobile number"
                    value={mobile}
                    onChangeText={handleMobileChange}
                    keyboardType="phone-pad"
                    maxLength={10}
                    editable={!loading}
                    placeholderTextColor="#b0c4de"
                  />
                </View>
                <View style={styles.inputContainerModern}>
                  <Ionicons name="home" size={20} color="#3a8dde" style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputModern}
                    placeholder="Enter Hostel name"
                    value={libraryName}
                    onChangeText={setLibraryName}
                    autoCapitalize="words"
                    editable={!loading}
                    placeholderTextColor="#b0c4de"
                  />
                </View>
                <View style={styles.inputContainerModern}>
                  <Ionicons name="location" size={20} color="#3a8dde" style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputModern}
                    placeholder="Enter Hostel address"
                    value={libraryAddress}
                    onChangeText={setLibraryAddress}
                    autoCapitalize="words"
                    editable={!loading}
                    placeholderTextColor="#b0c4de"
                  />
                </View>
                
              </>
            )}
            {mode !== 'reset' && (
              <View style={styles.inputContainerModern}>
                <Ionicons name="lock-closed" size={20} color="#3a8dde" style={styles.inputIcon} />
                <TextInput
                  style={styles.inputModern}
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete={mode === 'login' ? 'password' : 'new-password'}
                  textContentType={mode === 'login' ? 'password' : 'newPassword'}
                  autoCorrect={false}
                  editable={!loading}
                  placeholderTextColor="#b0c4de"
                />
                <TouchableOpacity 
                  style={styles.eyeIconModern}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off" : "eye"} 
                    size={22} 
                    color="#3a8dde" 
                  />
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity 
              style={[styles.buttonModern, loading && styles.buttonDisabledModern]} 
              onPress={mode === 'reset' ? handlePasswordReset : handleAuth}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonTextModern}>
                  {mode === 'login' ? 'Login' : mode === 'signup' ? 'Sign Up' : 'Reset Password'}
                </Text>
              )}
            </TouchableOpacity>
            <View style={styles.divider} />
            <View style={styles.linksContainerModern}>
              {mode === 'login' && (
                <>
                  <TouchableOpacity onPress={() => setMode('signup')} style={styles.linkBtn}>
                    <Text style={styles.linkTextModern}>Need an account? <Text style={{ color: '#3a8dde' }}>Sign Up</Text></Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setMode('reset')} style={styles.linkBtn}>
                    <Text style={styles.linkTextModern}>Forgot Password?</Text>
                  </TouchableOpacity>
                </>
              )}
              {mode === 'signup' && (
                <TouchableOpacity onPress={() => setMode('login')} style={styles.linkBtn}>
                  <Text style={styles.linkTextModern}>Already have an account? <Text style={{ color: '#3a8dde' }}>Login</Text></Text>
                </TouchableOpacity>
              )}
              {mode === 'reset' && (
                <TouchableOpacity onPress={() => setMode('login')} style={styles.linkBtn}>
                  <Text style={styles.linkTextModern}>Back to Login</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "white",
    padding: 28,
    borderRadius: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
    alignSelf: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    width: 64,
    height: 64,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 18,
    color: "#005fa3",
    letterSpacing: 0.5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#ffebee",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    alignSelf: 'stretch',
  },
  errorText: {
    color: "#c62828",
    textAlign: "left",
    fontSize: 14,
  },
  inputContainerModern: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f8fb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e3eaf2',
    marginBottom: 14,
    paddingHorizontal: 12,
    height: 48,
    width: '100%',
  },
  inputIcon: {
    marginRight: 8,
  },
  inputModern: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  eyeIconModern: {
    marginLeft: 8,
  },
  buttonModern: {
    backgroundColor: '#3a8dde',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
    shadowColor: '#3a8dde',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabledModern: {
    backgroundColor: '#b3d2f7',
  },
  buttonTextModern: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#e3eaf2',
    width: '100%',
    marginVertical: 18,
    borderRadius: 1,
  },
  linksContainerModern: {
    marginTop: 0,
    alignItems: 'center',
    width: '100%',
  },
  linkBtn: {
    paddingVertical: 6,
    width: '100%',
  },
  linkTextModern: {
    color: '#005fa3',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
});
