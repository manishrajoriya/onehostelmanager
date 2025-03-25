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
  title: "Welcome to One Library",
  description: "Your personal library management assistant",
  icon: "library-outline",
  backgroundColor: ["#6B46C1", "#8250E8"] as const, // Mark as readonly
  textColor: "#fff",
};

const OnboardingSlide = ({ item }: { item: OnboardingItem }) => {
  const titleOpacity = useSharedValue(0);
  const descriptionOpacity = useSharedValue(0);
  const iconOpacity = useSharedValue(0);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: withTiming(titleOpacity.value * 0, { duration: 1000 }) }],
  }));

  const descStyle = useAnimatedStyle(() => ({
    opacity: descriptionOpacity.value,
    transform: [{ translateY: withTiming(descriptionOpacity.value * 0, { duration: 1000 }) }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: withTiming(iconOpacity.value * 1, { duration: 1000 }) }],
  }));

  useEffect(() => {
    titleOpacity.value = withTiming(1, { duration: 1000, easing: Easing.ease });
    descriptionOpacity.value = withTiming(1, { duration: 1000, easing: Easing.ease,  });
    iconOpacity.value = withTiming(1, { duration: 1000, easing: Easing.ease, });
  }, []);

  return (
    <LinearGradient colors={item.backgroundColor} style={styles.slide}>
      <Animated.View style={[styles.iconContainer, iconStyle]}>
        <Ionicons name={item.icon} size={80} color={item.textColor} />
      </Animated.View>

      <Animated.View style={[styles.textContainer, titleStyle]}>
        <Text style={[styles.title, { color: item.textColor }]}>{item.title}</Text>
      </Animated.View>

      <Animated.View style={[styles.textContainer, descStyle]}>
        <Text style={[styles.description, { color: item.textColor }]}>{item.description}</Text>
      </Animated.View>
    </LinearGradient>
  );
};

const GetStartedButton = ({ onPress }: { onPress: () => void }) => {
  const buttonScale = useSharedValue(1);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <TouchableOpacity
      onPressIn={() => (buttonScale.value = withTiming(0.95, { duration: 100 }))}
      onPressOut={() => (buttonScale.value = withTiming(1, { duration: 100 }))}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Animated.View style={[styles.getStartedButton, buttonStyle]}>
        <Text style={styles.getStartedText}>Get Started</Text>
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
  iconContainer: {
    marginBottom: 30,
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: 40,
    marginVertical: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  description: {
    fontSize: 18,
    textAlign: "center",
    lineHeight: 24,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  getStartedButton: {
    backgroundColor: "#fff",
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  getStartedText: {
    color: onboardingData.backgroundColor[0],
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default Onboarding;