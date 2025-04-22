import React, { useState } from "react";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  interpolate,
  useAnimatedScrollHandler,
  runOnJS,
  withSequence,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

interface OnboardingItem {
  id: number;
  title: string;
  description: string;
  image: any;
  backgroundColor: readonly [string, string, ...string[]];
  textColor: string;
}

const onboardingData: OnboardingItem[] = [
  {
    id: 1,
    title: "Welcome to One Hostel",
    description: "Your all-in-one solution for hostel management",
    image: require("../assets/images/home.png"),
    backgroundColor: ["#4A90E2", "#357ABD"] as const,
    textColor: "#fff",
  },
  {
    id: 2,
    title: "Smart Room Management",
    description: "Easily manage room allocations, check-ins, and check-outs",
    image: require("../assets/images/home.png"),
    backgroundColor: ["#2ECC71", "#27AE60"] as const,
    textColor: "#fff",
  },
  {
    id: 3,
    title: "Track Everything",
    description: "Monitor expenses, maintenance, and student records in one place",
    image: require("../assets/images/home.png"),
    backgroundColor: ["#E74C3C", "#C0392B"] as const,
    textColor: "#fff",
  },
];

const OnboardingSlide = ({ item, index, scrollX }: { item: OnboardingItem; index: number; scrollX: Animated.SharedValue<number> }) => {
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

  const imageStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.8, 1, 0.8],
      'clamp'
    );
    return {
      transform: [{ scale: withSpring(scale, { damping: 20, stiffness: 90 }) }],
    };
  });

  const textStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0, 1, 0],
      'clamp'
    );
    return {
      opacity: withTiming(opacity, { duration: 300 }),
    };
  });

  return (
    <LinearGradient colors={item.backgroundColor} style={styles.slide}>
      <Animated.View style={[styles.imageContainer, imageStyle]}>
        <Image source={item.image} style={styles.image} />
      </Animated.View>

      <Animated.Text style={[styles.title, { color: item.textColor }, textStyle]}>
        {item.title}
      </Animated.Text>

      <Animated.Text style={[styles.description, { color: item.textColor }, textStyle]}>
        {item.description}
      </Animated.Text>
    </LinearGradient>
  );
};

const Pagination = ({ data, scrollX }: { data: OnboardingItem[]; scrollX: Animated.SharedValue<number> }) => {
  return (
    <View style={styles.paginationContainer}>
      {data.map((_, index) => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
        
        const dotStyle = useAnimatedStyle(() => {
          const width = interpolate(
            scrollX.value,
            inputRange,
            [8, 24, 8],
            'clamp'
          );
          const opacity = interpolate(
            scrollX.value,
            inputRange,
            [0.5, 1, 0.5],
            'clamp'
          );
          return {
            width: withSpring(width, { damping: 20, stiffness: 90 }),
            opacity: withTiming(opacity, { duration: 300 }),
          };
        });

        return (
          <Animated.View
            key={index}
            style={[styles.dot, dotStyle]}
          />
        );
      })}
    </View>
  );
};

const Onboarding = () => {
  const router = useRouter();
  const scrollX = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const buttonScale = useSharedValue(1);

  const updateIndex = (index: number) => {
    setCurrentIndex(index);
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
    onMomentumEnd: (event) => {
      const index = Math.round(event.contentOffset.x / width);
      runOnJS(updateIndex)(index);
    },
  });

  const buttonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(buttonScale.value, { damping: 15, stiffness: 150 }) }],
    };
  });

  const handleGetStarted = () => {
    buttonScale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withTiming(1, { duration: 100 }, () => {
        runOnJS(router.push)("/auth");
      })
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        decelerationRate="fast"
        bounces={false}
      >
        {onboardingData.map((item, index) => (
          <OnboardingSlide key={item.id} item={item} index={index} scrollX={scrollX} />
        ))}
      </Animated.ScrollView>

      <View style={styles.bottomContainer}>
        <Pagination data={onboardingData} scrollX={scrollX} />
        <Animated.View style={[buttonStyle]}>
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <Text style={styles.getStartedText}>
              {currentIndex === onboardingData.length - 1 ? "Get Started" : "Skip"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
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
    paddingHorizontal: 20,
  },
  imageContainer: {
    width: width * 0.8,
    height: width * 0.8,
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
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
    paddingHorizontal: 20,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
    marginHorizontal: 4,
  },
  getStartedButton: {
    backgroundColor: "#fff",
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  getStartedText: {
    color: onboardingData[0].backgroundColor[0],
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default Onboarding;