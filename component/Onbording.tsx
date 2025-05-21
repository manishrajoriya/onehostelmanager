import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

interface OnboardingItem {
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  backgroundColor: readonly [string, string, ...string[]]; // Enforce at least two colors
  textColor: string;
}

const onboardingData: OnboardingItem = {
  title: "Welcome to One Hostel",
  description: "Your personal hostel management assistant",
  icon: "home-outline",
  backgroundColor: ["#7F53AC", "#647DEE", "#43C6AC"] as const, // Updated gradient
  textColor: "#fff",
};

const OnboardingSlide = ({ item }: { item: OnboardingItem }) => {
  const titleOpacity = useSharedValue(0);
  const descriptionOpacity = useSharedValue(0);
  const iconOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: withTiming(titleOpacity.value ? 0 : 40, { duration: 800 }) }],
  }));

  const descStyle = useAnimatedStyle(() => ({
    opacity: descriptionOpacity.value,
    transform: [{ translateY: withTiming(descriptionOpacity.value ? 0 : 40, { duration: 800 }) }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: withTiming(iconOpacity.value ? 1 : 0.7, { duration: 900 }) }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: withTiming(taglineOpacity.value ? 0 : 20, { duration: 700 }) }],
  }));

  useEffect(() => {
    iconOpacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.exp) });
    titleOpacity.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.exp) });
    taglineOpacity.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.exp) });
    descriptionOpacity.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.exp) });
  }, []);

  return (
    <LinearGradient colors={item.backgroundColor} style={styles.slide}>
      <Animated.View style={[styles.iconCircle, iconStyle]}>
        <Ionicons name={item.icon} size={70} color={item.textColor} />
      </Animated.View>
      <Animated.View style={[styles.textContainer, titleStyle]}>
        <Text style={[styles.title, { color: item.textColor }]}> {item.title} </Text>
      </Animated.View>
      <Animated.View style={[styles.taglineContainer, taglineStyle]}>
        <Text style={styles.tagline}>Manage student, fees, seat, and more</Text>
      </Animated.View>
      <Animated.View style={[styles.textContainer, descStyle]}>
        <Text style={[styles.description, { color: item.textColor }]}>{item.description}</Text>
      </Animated.View>
    </LinearGradient>
  );
};

const GetStartedButton = ({ onPress }: { onPress: () => void }) => {
  const buttonScale = useSharedValue(1);
  const buttonOpacity = useSharedValue(0);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
    opacity: buttonOpacity.value,
  }));

  useEffect(() => {
    buttonOpacity.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.exp) });
  }, []);

  return (
    <TouchableOpacity
      onPressIn={() => (buttonScale.value = withTiming(0.97, { duration: 100 }))}
      onPressOut={() => (buttonScale.value = withTiming(1, { duration: 100 }))}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Animated.View style={[styles.getStartedButton, buttonStyle]}>
        <LinearGradient
          colors={["#7F53AC", "#43C6AC"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.getStartedGradient}
        >
          <Text style={styles.getStartedText}>Get Started</Text>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

const Onboarding = () => {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/auth");
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <OnboardingSlide item={onboardingData} />
      <View style={styles.bottomContainer}>
        <GetStartedButton onPress={handleGetStarted} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width,
    height,
  },
  iconCircle: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 60,
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: 40,
    marginVertical: 6,
  },
  taglineContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  tagline: {
    color: "#E0E0E0",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 1.2,
  },
  description: {
    fontSize: 18,
    textAlign: "center",
    lineHeight: 26,
    fontWeight: "400",
    opacity: 0.95,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 30,
  },
  getStartedButton: {
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#43C6AC",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  getStartedGradient: {
    paddingVertical: 16,
    alignItems: "center",
    width: "100%",
    borderRadius: 30,
  },
  getStartedText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 1.1,
  },
});

export default Onboarding;