import React, { useEffect, useState } from "react"
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { ActionButtons } from "./MemberCardActionButton"
import type { MemberDetails } from "@/types/MemberProfile"
import { fetchSeats } from "@/firebase/functions"
import useStore from "@/hooks/store"
import { formatDate } from "./AddMemberForm"

interface RentDetails {
  startDate: string;
  endDate: string;
  paidAmount: number;
  dueAmount: number;
  paymentDate: Date;
}

interface SeatDetails {
  roomNumber: string;
  roomType: string;
  rent: number;
}

interface MemberCardProps {
  member: MemberDetails;
  onPress: () => void;
  rentDetails?: RentDetails;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

const safeFormatDate = (dateString: string | Date | { seconds: number; nanoseconds: number }): string => {
  try {
    let date: Date;
    
    if (typeof dateString === 'object' && 'seconds' in dateString) {
      // Handle Firebase Timestamp
      date = new Date(dateString.seconds * 1000);
    } else {
      date = new Date(dateString);
    }

    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }
    return formatDate(date);
  } catch (error) {
    return "Invalid Date";
  }
}

const MemberCard: React.FC<MemberCardProps> = React.memo(
  ({ member, onPress, rentDetails }) => {
    const [seatDetails, setSeatDetails] = useState<SeatDetails | null>(null);
    const currentUser = useStore((state: any) => state.currentUser);
    const activeLibrary = useStore((state: any) => state.activeLibrary);

    useEffect(() => {
      const fetchSeatDetails = async () => {
        try {
          const seats = await fetchSeats({ currentUser, libraryId: activeLibrary.id });
          const memberSeat = seats.find(seat => seat.allocatedTo === member.id);
          if (memberSeat) {
            setSeatDetails({
              roomNumber: memberSeat.roomNumber,
              roomType: memberSeat.roomType,
              rent: memberSeat.rent
            });
          }
        } catch (error) {
          console.error("Error fetching seat details:", error);
        }
      };

      fetchSeatDetails();
    }, [member.id, currentUser, activeLibrary.id]);

    const calculateStatus = () => {
      if (!rentDetails) {
        return { 
          status: "Pending", 
          style: styles.dueAmount, 
          badgeColor: "#FEF3C7", 
          textColor: "#D97706" 
        };
      }
      
      const today = new Date();
      
      // Parse the date string in DD/MM/YYYY format
      const [day, month, year] = rentDetails.endDate.split('/').map(Number);
      const endDate = new Date(year, month - 1, day); // month is 0-based in JavaScript
      
      const isActive = endDate > today;
      const isPaid = rentDetails.dueAmount === 0;

      if (!isActive) {
        return { 
          status: "Expired", 
          style: styles.expiredAmount, 
          badgeColor: "#FEE2E2", 
          textColor: "#DC2626" 
        };
      }

      if (isPaid) {
        return { 
          status: "Paid", 
          style: styles.paidAmount, 
          badgeColor: "#DCFCE7", 
          textColor: "#16A34A" 
        };
      }

      return { 
        status: "Pending", 
        style: styles.dueAmount, 
        badgeColor: "#FEF3C7", 
        textColor: "#D97706" 
      };
    };

    const { status, style, badgeColor, textColor } = calculateStatus();

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
            <View style={[styles.statusBadge, { backgroundColor: badgeColor }]}>
              <Text style={[styles.statusText, { color: textColor }]}>
                {status}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.planSection}>
          {rentDetails ? (
            <>
              <View style={styles.planItem}>
                <Text style={styles.planLabel}>Joining Date</Text>
                <Text style={styles.planValue}>{safeFormatDate(member.addmissionDate)}</Text>
              </View>
              <View style={styles.planItem}>
                <Text style={styles.planLabel}>Last Payment</Text>
                <Text style={styles.planValue}>{safeFormatDate(rentDetails.paymentDate)}</Text>
              </View>
              <View style={styles.planItem}>
                <Text style={styles.planLabel}>End Payment</Text>
                <Text style={styles.planValue}>{(rentDetails.endDate)}</Text>
              </View>
            </>
          ) : (
            <View style={styles.planItem}>
              <Text style={styles.planLabel}>Joining Date</Text>
              <Text style={styles.planValue}>{safeFormatDate(member.addmissionDate)}</Text>
            </View>
          )}
        </View>

        <View style={styles.amountSection}>
          {seatDetails ? (
            [
              { 
                label: "Room Rent", 
                value: seatDetails.rent, 
                style: styles.finalAmount 
              },
              { 
                label: "Paid Amount", 
                value: rentDetails?.paidAmount || 0, 
                style: styles.paidAmount 
              },
              { 
                label: "Due Amount", 
                value: rentDetails?.dueAmount || 0, 
                style: styles.dueAmount 
              },
            ].map(({ label, value, style }) => (
              <View key={`amount-${label}`} style={styles.amountItem}>
                <Text style={styles.amountLabel}>{label}</Text>
                <Text style={style}>₹{value}</Text>
              </View>
            ))
          ) : (
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Room Rent</Text>
              <Text style={styles.finalAmount}>Not Assigned</Text>
            </View>
          )}
        </View>

        {/* <ActionButtons memberId={member.id} /> */}
      </TouchableOpacity>
    )
  },
  (prevProps, nextProps) => {
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#E9D5FF",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#02c39a",
  },
  seatText: {
    color: "#4B5563",
    fontSize: 14,
  },
  details: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: "#666",
  },
  value: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  noRent: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 8,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
    color: "#16A34A",
  },
  dueAmount: {
    color: "#D97706",
  },
  expiredAmount: {
    color: "#DC2626",
  },
})

export default MemberCard