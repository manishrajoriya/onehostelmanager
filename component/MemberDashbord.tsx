import React, { useEffect, useState, useCallback } from "react"
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import {
  totalMemberCount,
  liveMemberCount,
  InactiveMemberCount,
  paidAmountCount,
  totalAmountCount,
  dueAmountCount,
  
} from "@/firebase/functions"
import { useRouter } from "expo-router"
import useStore from "@/hooks/store"

import { useLibrarySelection } from "@/hooks/useLibrarySelect"



const StatCard = ({
  icon,
  title,
  value,
  color,
  style,
  onPress,
}: {
  icon: any
  title: string
  value: string
  color: string
  style: any
  onPress: () => void
}) => (
  <TouchableOpacity onPress={onPress} style={[styles.card, style]}>
    <View style={[styles.iconContainer, { backgroundColor: `${color}10` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardValue}>{value}</Text>
  </TouchableOpacity>
)

export default function MembersDashboard() {
  const [member, setMember] = useState<number>(0)
  const [liveMember, setLiveMember] = useState<number>(0)
  const [inactiveMember, setInactiveMember] = useState<number>(0)
  const [paidAmount, setPaidAmount] = useState<number>(0)
  const [totalAmount, setTotalAmount] = useState<number>(0)
  const [dueAmount, setDueAmount] = useState<number>(0)
  const [refreshing, setRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const router = useRouter()

  const currentUser = useStore((state: any) => state.currentUser)

  
  const { activeLibrary } = useLibrarySelection()


  const fetchStats = useCallback(async () => {
    if (!activeLibrary) return

    try {
      const total = await totalMemberCount({ currentUser, libraryId: activeLibrary.id })
      const live = await liveMemberCount({ currentUser, libraryId: activeLibrary.id })
      const inactive = await InactiveMemberCount({ currentUser, libraryId: activeLibrary.id })
      const paidAmount = await paidAmountCount({ currentUser, libraryId: activeLibrary.id })
      const totalAmount = await totalAmountCount({ currentUser, libraryId: activeLibrary.id })
      const dueAmount = await dueAmountCount({ currentUser, libraryId: activeLibrary.id })

      setMember(total)
      setLiveMember(live)
      setInactiveMember(inactive)
      setPaidAmount(paidAmount)
      setTotalAmount(totalAmount)
      setDueAmount(dueAmount)
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }, [currentUser, activeLibrary])

  useEffect(() => {
    if (activeLibrary) {
      fetchStats()
      setIsLoading(false)
    } else {
      setIsLoading(true)
    }
  }, [activeLibrary, fetchStats])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchStats()
    setRefreshing(false)
  }

  const stats = [
    {
      icon: "people",
      title: "Members",
      value: member.toString(),
      color: "#4285F4",
      style: { backgroundColor: "#fff" },
      onPress: () => router.push("/memberProfileCard"),
    },
    {
      icon: "people",
      title: "Live Members",
      value: liveMember.toString(),
      color: "#34A853",
      style: { backgroundColor: "#fff" },
      onPress: () => router.push("/memberProfileCard"),
    },
    {
      icon: "person-remove",
      title: "Inactive Members",
      value: inactiveMember.toString(),
      color: "#EA4335",
      style: { backgroundColor: "#fff" },
      onPress: () => router.push("/memberProfileCard"),
    },
    {
      icon: "card",
      title: "Total Amount",
      value: totalAmount.toString(),
      color: "#4285F4",
      style: { backgroundColor: "#fff" },
      onPress: () => router.push("/memberPaymemt"),
    },
    {
      icon: "cash",
      title: "Paid Amount",
      value: paidAmount.toString(),
      color: "#9C27B0",
      style: { backgroundColor: "#fff" },
      onPress: () => router.push("/memberPaymemt"),
    },
    {
      icon: "time",
      title: "Due Amount",
      value: dueAmount.toString(),
      color: "#FB8C00",
      style: { backgroundColor: "#fff" },
      onPress: () => router.push("/memberPaymemt"),
    },
    {
      icon: "trending-up",
      title: "Finance",
      value: "",
      color: "#34A853",
      style: { backgroundColor: "#fff" },
      onPress: () => router.push("/finance"),
    },
     {
      icon: "people",
      title: "Allot Room",
      value: "",
      color: "#02c39a",
      style: { backgroundColor: "#fff" },
      onPress: () => router.push("/allotseats"),
    }
  ]

   if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#02c39a" />
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Gradient Header */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <TouchableOpacity onPress={() => router.push("/addLibrary")}>
              <Ionicons name="chevron-down" size={24} color="#34A853" />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{activeLibrary ? activeLibrary.name : "First add hostel"}</Text>
        </View>
       {/* Chevron Down */}
      
      </View>

      {/* Add Member Button */}
      <TouchableOpacity style={styles.addMemberButton} onPress={() => router.push("/addMemberForm")}>
        <View style={styles.addIcon}>
          <Ionicons name="add" size={24} color="#666" />
        </View>
        <Text style={styles.addMemberText}>Add Member</Text>
      </TouchableOpacity>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#02c39a",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e0f2e9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  addMemberButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 25,
  },
  addIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  addMemberText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    margin: 8,
    width: "45%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
 loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
})

