import React from "react"
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native"
import { createDrawerNavigator, DrawerContentScrollView } from "@react-navigation/drawer"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import MembersDashboard from "./MemberDashbord"
import MemberProfileCard from "./member/MemberProfileCard"
import ShiftForm from "./ShiftForm"
import AddMemberForm from "./member/AddMemberForm"
import ShiftDetails from "./ShiftDetails"
import Finance from "./Finance"
import AddSeatsPage from "./Seat"
import AttendancePage from "./member/Attendance"
import AttendanceReport from "./member/AttendaceReport"
import AllocateSeatsPage from "./member/AllotSeat"
import LogoutScreen from "./Logout"
import AddLibraryScreen from "./library/AddLibrary"
import DownloadMembersPage from "./download/MemberData"
import MemberPaymentList from "./member/MemberPaymentList"

type DrawerParamList = {
  Home: undefined
  AddLibrary: undefined
  AddSeats: undefined
  AddMember: undefined
  AllotSeat: undefined
  Profile: undefined
  MemberPayment: undefined
  ShiftForm: undefined
  ShiftDetails: undefined
  Finance: undefined
  Attendance: undefined
  AttendanceReport: undefined
  DownloadMembers: undefined
  Logout: undefined
}

const Drawer = createDrawerNavigator<DrawerParamList>()

const CustomDrawerContent = (props: any) => {
  const { state } = props
  const activeRoute = state.routes[state.index].name

  const fadeAnim = React.useRef(new Animated.Value(0)).current

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start()
  }, [fadeAnim])

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        {/* Drawer Header */}
        <LinearGradient
          colors={["#02c39a", "#02c39a"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.drawerHeader}
        >
          <Text style={styles.headerText}>One Hostel</Text>
        </LinearGradient>

        {/* Main Navigation */}
        <DrawerItem
          label="Home"
          icon="home"
          onPress={() => props.navigation.navigate("Home")}
          isActive={activeRoute === "Home"}
        />

        {/* Hostel Management Section */}
        <Text style={styles.sectionTitle}>Hostel Management</Text>
        <DrawerItem
          label="Add Hostel"
          icon="business"
          onPress={() => props.navigation.navigate("AddLibrary")}
          isActive={activeRoute === "AddLibrary"}
        />
        <DrawerItem
          label="Add Room"
          icon="bed"
          onPress={() => props.navigation.navigate("AddSeats")}
          isActive={activeRoute === "AddSeats"}
        />
        <DrawerItem
          label="Allot Room"
          icon="people"
          onPress={() => props.navigation.navigate("AllotSeat")}
          isActive={activeRoute === "AllotSeat"}
        />

        {/* Members Section */}
        <Text style={styles.sectionTitle}>Members</Text>
        <DrawerItem
          label="Add Member"
          icon="person-add"
          onPress={() => props.navigation.navigate("AddMember")}
          isActive={activeRoute === "AddMember"}
        />
        <DrawerItem
          label="Profile"
          icon="person"
          onPress={() => props.navigation.navigate("Profile")}
          isActive={activeRoute === "Profile"}
        />
        <DrawerItem
          label="Member Payment"
          icon="wallet"
          onPress={() => props.navigation.navigate("MemberPayment")}
          isActive={activeRoute === "MemberPayment"}
        />

        {/* Room Plan Section */}
        <Text style={styles.sectionTitle}>Room Plan</Text>
        <DrawerItem
          label="Add Plan"
          icon="calendar"
          onPress={() => props.navigation.navigate("ShiftForm")}
          isActive={activeRoute === "ShiftForm"}
        />
        <DrawerItem
          label="Plan Details"
          icon="list"
          onPress={() => props.navigation.navigate("ShiftDetails")}
          isActive={activeRoute === "ShiftDetails"}
        />

        {/* Finance Section */}
        <Text style={styles.sectionTitle}>Finance</Text>
        <DrawerItem
          label="Finance"
          icon="cash"
          onPress={() => props.navigation.navigate("Finance")}
          isActive={activeRoute === "Finance"}
        />

        {/* Attendance Section */}
        <Text style={styles.sectionTitle}>Attendance</Text>
        <DrawerItem
          label="Attendance"
          icon="checkmark-circle"
          onPress={() => props.navigation.navigate("Attendance")}
          isActive={activeRoute === "Attendance"}
        />
        <DrawerItem
          label="Attendance Report"
          icon="bar-chart"
          onPress={() => props.navigation.navigate("AttendanceReport")}
          isActive={activeRoute === "AttendanceReport"}
        />

        {/* Others Section */}
        <Text style={styles.sectionTitle}>Others</Text>
        <DrawerItem
          label="Download Members"
          icon="download"
          onPress={() => props.navigation.navigate("DownloadMembers")}
          isActive={activeRoute === "DownloadMembers"}
        />
        <DrawerItem
          label="Logout"
          icon="log-out"
          onPress={() => props.navigation.navigate("Logout")}
          isActive={activeRoute === "Logout"}
        />
      </DrawerContentScrollView>
    </Animated.View>
  )
}

// Drawer Item Component
const DrawerItem = React.memo(
  ({
    label,
    icon,
    onPress,
    isActive,
  }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void; isActive: boolean }) => {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[styles.drawerItem, isActive && styles.activeDrawerItem]}
        activeOpacity={0.7}
      >
        <Ionicons name={icon} size={24} color={isActive ? "#02c39a" : "#555"} />
        <Text style={[styles.drawerLabel, isActive && styles.activeDrawerLabel]}>{label}</Text>
      </TouchableOpacity>
    )
  },
)

const Sidebar = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: {
          backgroundColor: "#f8f9fa",
          width: 280,
        },
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: "500",
          color: "#555",
          marginLeft: 10,
        },
        drawerActiveBackgroundColor: "#6B46C110",
        drawerActiveTintColor: "#02c39a",
        drawerInactiveTintColor: "#555",
        drawerItemStyle: {
          borderRadius: 8,
          marginHorizontal: 8,
          marginVertical: 4,
        },
        drawerContentStyle: {
          paddingTop: 0,
        },
        drawerContentContainerStyle: {
          paddingTop: 0,
        },
      }}
    >
      <Drawer.Screen name="Home" component={MembersDashboard} />
      <Drawer.Screen name="AddLibrary" component={AddLibraryScreen} options={{ title: "Add Hostel" }}/>
      <Drawer.Screen name="AddSeats" component={AddSeatsPage}  options={{ title: "Add Room" }}/>
      <Drawer.Screen name="AddMember" component={AddMemberForm} options={{ title: "Add Member" }}/>
      <Drawer.Screen name="AllotSeat" component={AllocateSeatsPage} options={{ title: "Allot Room" }}/>
      <Drawer.Screen name="Profile" component={MemberProfileCard} options={{ title: "Profile" }}/>
      <Drawer.Screen name="MemberPayment" component={MemberPaymentList} options={{ title: "Member Payment" }}/>
      <Drawer.Screen name="ShiftForm" component={ShiftForm} options={{ title: "Add Plan" }}/>
      <Drawer.Screen name="ShiftDetails" component={ShiftDetails} options={{ title: "Plan Details" }}/>
      <Drawer.Screen name="Finance" component={Finance} options={{ title: "Finance" }}/>
      {/* Removed Pricing Screen */}
      <Drawer.Screen name="Attendance" component={AttendancePage} options={{ title: "Attendance" }}/>
      <Drawer.Screen name="AttendanceReport" component={AttendanceReport} options={{ title: "Attendance Report" }}/>
      <Drawer.Screen name="DownloadMembers" component={DownloadMembersPage} options={{ title: "Download Members" }}/>
      <Drawer.Screen name="Logout" component={LogoutScreen} options={{ title: "Logout" }}/>
    </Drawer.Navigator>
  )
}

const styles = StyleSheet.create({
  drawerHeader: {
    padding: 24,
    marginTop: 40,
    marginBottom: 16,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  headerText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#02c39a",
    marginLeft: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginVertical: 2,
  },
  activeDrawerItem: {
    backgroundColor: "#6B46C110",
    borderRadius: 8,
  },
  drawerLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#555",
    marginLeft: 16,
  },
  activeDrawerLabel: {
    color: "#02c39a",
    fontWeight: "600",
  },
  separator: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 16,
    marginHorizontal: 16,
  },
})

export default Sidebar

