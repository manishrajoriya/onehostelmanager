import React from "react"
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { ActionButtons } from "./MemberCardActionButton"
import type { MemberDetails } from "@/types/MemberProfile"

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

const formatDate = (date: Date | string): string => {
  const parsedDate = new Date(date)

  if (isNaN(parsedDate.getTime())) {
    return "Invalid Date"
  }

  return parsedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

const MemberCard: React.FC<{ member: MemberDetails, onPress: () => void }> = React.memo(
  ({ member, onPress }) => {
    return (
      <TouchableOpacity style={styles.container} onPress={onPress}>
        <View style={styles.header}>
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              {member.profileImage ? (
                <Image source={{ uri: member.profileImage }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{getInitials(member.fullName)}</Text>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{member.fullName}</Text>
              <View style={styles.locationRow}>
                <MaterialIcons name="location-on" size={16} color="#02c39a" />
                <Text style={styles.locationText}>{member.address}</Text>
              </View>
              <View style={styles.phoneRow}>
                <MaterialIcons name="phone" size={16} color="#02c39a" />
                <Text style={styles.phoneText}>{member.contactNumber}</Text>
              </View>
            </View>
          </View>
          <View style={styles.statusSection}>
            <View style={[styles.statusBadge, { backgroundColor: member.expiryDate > new Date() ? "#E9D5FF" : "#FEE2E2" }]}>
              <Text style={[styles.statusText, { color: member.expiryDate > new Date() ? "#02c39a" : "#DC2626" }]}>
                {
                  member.expiryDate > new Date() ? "Active" : "Expired"
                }
              </Text>
            </View>
            {/* <Text style={styles.seatText}>Seat: {member.seatNumber}</Text> */}
          </View>
        </View>

        <View style={styles.planSection}>
          {[
            { label: "Plan", value: member.plan || "N/A" },
            { label: "Join Date", value: formatDate(member.addmissionDate) },
            { label: "End Date", value: formatDate(member.expiryDate) },
          ].map(({ label, value }) => (
            <View key={`plan-${label}`} style={styles.planItem}>
              <Text style={styles.planLabel}>{label}</Text>
              <Text style={styles.planValue}>{value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.amountSection}>
          {[
            { label: "Final Amount", value: member.totalAmount, style: styles.finalAmount },
            { label: "Paid Amount", value: member.paidAmount, style: styles.paidAmount },
            { label: "Due Amount", value: member.dueAmount, style: styles.dueAmount },
          ].map(({ label, value, style }) => (
            <View key={`amount-${label}`} style={styles.amountItem}>
              <Text style={styles.amountLabel}>{label}</Text>
              <Text style={style}>₹{value}</Text>
            </View>
          ))}
        </View>

        {/* <ActionButtons memberId={member.id} /> */}
      </TouchableOpacity>
    )
  },
  (prevProps, nextProps) => {
    // Custom comparison function
    return JSON.stringify(prevProps.member) === JSON.stringify(nextProps.member)
  },
)

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  avatarSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#02c39a",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  profileInfo: {
    justifyContent: "center",
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 14,
    color: "#4B5563",
    marginLeft: 6,
  },
  phoneText: {
    fontSize: 14,
    color: "#4B5563",
    marginLeft: 6,
  },
  statusSection: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 6,
  },
  statusText: {
    fontWeight: "600",
    fontSize: 12,
  },
  seatText: {
    color: "#4B5563",
    fontSize: 14,
  },
  planSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  planItem: {
    alignItems: "center",
  },
  planLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 6,
  },
  planValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  amountSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  amountItem: {
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 6,
  },
  finalAmount: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  paidAmount: {
    fontSize: 18,
    fontWeight: "600",
    color: "#059669",
  },
  dueAmount: {
    fontSize: 18,
    fontWeight: "600",
    color: "#DC2626",
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
})

export default MemberCard