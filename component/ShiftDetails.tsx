import React, { useEffect, useState } from "react"
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Modal, TextInput } from "react-native"
import { getPlans, updatePlan, deletePlan } from "@/firebase/functions"
import useStore from "@/hooks/store"

type PlanDetailsProps = {
  id: string
  name: string
  description: string
  duration: string
  amount: string
  createdAt?: string
}

export default function AllPlans() {
  const [plans, setPlans] = useState<PlanDetailsProps[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingPlan, setEditingPlan] = useState<PlanDetailsProps | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)

  const currentUser = useStore((state: any) => state.currentUser);
  const activeLibrary = useStore((state: any) => state.activeLibrary);

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const plansData = await getPlans({libraryId: activeLibrary.id, currentUser})
      setPlans(plansData)
      setLoading(false)
    } catch (err) {
      setError("Failed to fetch plans. Please try again later.")
      setLoading(false)
    }
  }

  if (plans.length === 0 && !loading) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>No plans available. Add your first plan!</Text>
    </View>
  );
}


  const handleEdit = (plan: PlanDetailsProps) => {
    setEditingPlan(plan)
    setIsModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deletePlan({ id, })
      setPlans(plans.filter((plan) => plan.id !== id))
    } catch (err) {
      setError("Failed to delete plan. Please try again.")
    }
  }

  const handleUpdate = async () => {
    if (editingPlan) {
      try {
        await updatePlan({ id: editingPlan.id, data: editingPlan, currentUser,  })
        setPlans(plans.map((plan) => (plan.id === editingPlan.id ? editingPlan : plan)))
        setIsModalVisible(false)
        setEditingPlan(null)
      } catch (err) {
        setError("Failed to update plan. Please try again.")
      }
    }
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      {plans.map((plan) => (
        <View key={plan.id} style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{plan.name}</Text>
            {plan.createdAt && <Text style={styles.date}>{new Date(plan.createdAt).toLocaleDateString()}</Text>}
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Duration</Text>
              <View style={styles.valueContainer}>
                <Text style={styles.value}>{plan.duration} Days</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Amount</Text>
              <View style={styles.valueContainer}>
                <Text style={styles.value}>₹{plan.amount}</Text>
              </View>
            </View>

            {plan.description && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.label}>Description</Text>
                <Text style={styles.description}>{plan.description}</Text>
              </View>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(plan)}>
              <Text style={styles.buttonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(plan.id)}>
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Plan</Text>
            <TextInput
              style={styles.input}
              value={editingPlan?.name}
              onChangeText={(text) => setEditingPlan((prev) => (prev ? { ...prev, name: text } : null))}
              placeholder="Plan Name"
            />
            <TextInput
              style={styles.input}
              value={editingPlan?.description}
              onChangeText={(text) => setEditingPlan((prev) => (prev ? { ...prev, description: text } : null))}
              placeholder="Description"
              multiline
            />
            <TextInput
              style={styles.input}
              value={editingPlan?.duration}
              onChangeText={(text) => setEditingPlan((prev) => (prev ? { ...prev, duration: text } : null))}
              placeholder="Duration (days)"
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              value={editingPlan?.amount}
              onChangeText={(text) => setEditingPlan((prev) => (prev ? { ...prev, amount: text } : null))}
              placeholder="Amount"
              keyboardType="numeric"
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalButton} onPress={handleUpdate}>
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
  },
  date: {
    fontSize: 14,
    color: "#6b7280",
  },
  detailsContainer: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  label: {
    fontSize: 16,
    color: "#4b5563",
    fontWeight: "500",
  },
  valueContainer: {
    backgroundColor: "#f9fafb",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  value: {
    fontSize: 16,
    color: "#1f2937",
    fontWeight: "500",
  },
  descriptionContainer: {
    marginTop: 10,
  },
  description: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  editButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: "#dc2626",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#1f2937",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: "#1f2937",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  modalButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: "#9ca3af",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
});
