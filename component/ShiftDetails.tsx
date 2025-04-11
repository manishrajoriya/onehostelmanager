import React, { useEffect, useState } from "react"
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Modal, TextInput, RefreshControl, Alert } from "react-native"
import { getPlans, updatePlan, deletePlan } from "@/firebase/functions"
import useStore from "@/hooks/store"
import { MaterialIcons } from '@expo/vector-icons'

type PlanDetailsProps = {
  id: string
  name: string
  description: string
  duration: string
  amount: string
  createdAt?: string
}

interface FormErrors {
  name?: string;
  duration?: string;
  amount?: string;
}

export default function AllPlans() {
  const [plans, setPlans] = useState<PlanDetailsProps[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingPlan, setEditingPlan] = useState<PlanDetailsProps | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentUser = useStore((state: any) => state.currentUser);
  const activeLibrary = useStore((state: any) => state.activeLibrary);

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      setError(null)
      const plansData = await getPlans({libraryId: activeLibrary.id, currentUser})
      setPlans(plansData)
    } catch (err: any) {
      console.error('Error fetching plans:', err)
      setError(err.message || "Failed to fetch plans. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchPlans()
    setRefreshing(false)
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    let isValid = true

    if (!editingPlan?.name?.trim()) {
      newErrors.name = 'Plan name is required'
      isValid = false
    }

    if (!editingPlan?.duration?.trim()) {
      newErrors.duration = 'Duration is required'
      isValid = false
    } else if (isNaN(Number(editingPlan.duration)) || Number(editingPlan.duration) <= 0) {
      newErrors.duration = 'Duration must be a positive number'
      isValid = false
    }

    if (!editingPlan?.amount?.trim()) {
      newErrors.amount = 'Amount is required'
      isValid = false
    } else if (isNaN(Number(editingPlan.amount)) || Number(editingPlan.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number'
      isValid = false
    }

    setFormErrors(newErrors)
    return isValid
  }

  const handleEdit = (plan: PlanDetailsProps) => {
    setEditingPlan(plan)
    setFormErrors({})
    setIsModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    Alert.alert(
      "Delete Plan",
      "Are you sure you want to delete this plan? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePlan({ id })
              setPlans(plans.filter((plan) => plan.id !== id))
            } catch (err: any) {
              console.error('Error deleting plan:', err)
              setError(err.message || "Failed to delete plan. Please try again.")
            }
          }
        }
      ]
    )
  }

  const handleUpdate = async () => {
    if (!editingPlan) return

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await updatePlan({ id: editingPlan.id, data: editingPlan, currentUser })
      setPlans(plans.map((plan) => (plan.id === editingPlan.id ? editingPlan : plan)))
      setIsModalVisible(false)
      setEditingPlan(null)
      setFormErrors({})
    } catch (err: any) {
      console.error('Error updating plan:', err)
      setError(err.message || "Failed to update plan. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#02c39a" />
        <Text style={styles.loadingText}>Loading plans...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="error-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPlans}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (plans.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="assignment" size={48} color="#94a3b8" />
        <Text style={styles.emptyText}>No plans available</Text>
        <Text style={styles.emptySubtext}>Add your first plan to get started</Text>
      </View>
    )
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {plans.map((plan) => (
        <View key={plan.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{plan.name}</Text>
              {plan.createdAt && (
                <Text style={styles.date}>
                  Created: {new Date(plan.createdAt).toLocaleDateString()}
                </Text>
              )}
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.iconButton, styles.editButton]} 
                onPress={() => handleEdit(plan)}
              >
                <MaterialIcons name="edit" size={20} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.iconButton, styles.deleteButton]} 
                onPress={() => handleDelete(plan.id)}
              >
                <MaterialIcons name="delete" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <View style={styles.detailLabel}>
                <MaterialIcons name="schedule" size={20} color="#64748b" />
                <Text style={styles.label}>Duration</Text>
              </View>
              <View style={styles.valueContainer}>
                <Text style={styles.value}>{plan.duration} Days</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailLabel}>
                <MaterialIcons name="payments" size={20} color="#64748b" />
                <Text style={styles.label}>Amount</Text>
              </View>
              <View style={styles.valueContainer}>
                <Text style={styles.value}>₹{plan.amount}</Text>
              </View>
            </View>

            {plan.description && (
              <View style={styles.descriptionContainer}>
                <View style={styles.detailLabel}>
                  <MaterialIcons name="description" size={20} color="#64748b" />
                  <Text style={styles.label}>Description</Text>
                </View>
                <Text style={styles.description}>{plan.description}</Text>
              </View>
            )}
          </View>
        </View>
      ))}

      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Plan</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setIsModalVisible(false)
                  setEditingPlan(null)
                  setFormErrors({})
                }}
              >
                <MaterialIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Plan Name</Text>
              <TextInput
                style={[styles.input, formErrors.name && styles.inputError]}
                value={editingPlan?.name}
                onChangeText={(text) => {
                  setEditingPlan((prev) => (prev ? { ...prev, name: text } : null))
                  if (formErrors.name) {
                    setFormErrors({ ...formErrors, name: undefined })
                  }
                }}
                placeholder="Enter plan name"
                placeholderTextColor="#94a3b8"
              />
              {formErrors.name && <Text style={styles.errorText}>{formErrors.name}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editingPlan?.description}
                onChangeText={(text) => setEditingPlan((prev) => (prev ? { ...prev, description: text } : null))}
                placeholder="Enter description"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Duration (days)</Text>
              <TextInput
                style={[styles.input, formErrors.duration && styles.inputError]}
                value={editingPlan?.duration}
                onChangeText={(text) => {
                  setEditingPlan((prev) => (prev ? { ...prev, duration: text } : null))
                  if (formErrors.duration) {
                    setFormErrors({ ...formErrors, duration: undefined })
                  }
                }}
                placeholder="Enter duration"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
              />
              {formErrors.duration && <Text style={styles.errorText}>{formErrors.duration}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount</Text>
              <TextInput
                style={[styles.input, formErrors.amount && styles.inputError]}
                value={editingPlan?.amount}
                onChangeText={(text) => {
                  setEditingPlan((prev) => (prev ? { ...prev, amount: text } : null))
                  if (formErrors.amount) {
                    setFormErrors({ ...formErrors, amount: undefined })
                  }
                }}
                placeholder="Enter amount"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
              />
              {formErrors.amount && <Text style={styles.errorText}>{formErrors.amount}</Text>}
            </View>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setIsModalVisible(false)
                  setEditingPlan(null)
                  setFormErrors({})
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.updateButton, isSubmitting && styles.submitButtonDisabled]} 
                onPress={handleUpdate}
                disabled={isSubmitting}
              >
                <Text style={styles.buttonText}>
                  {isSubmitting ? 'Updating...' : 'Update'}
                </Text>
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
    backgroundColor: "#f8fafc",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 16,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#02c39a",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 18,
    color: "#1e293b",
    fontWeight: "600",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    margin: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: "#64748b",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#3b82f6",
  },
  deleteButton: {
    backgroundColor: "#ef4444",
  },
  detailsContainer: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  detailLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  valueContainer: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  value: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "600",
  },
  descriptionContainer: {
    marginTop: 8,
  },
  description: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
  },
  closeButton: {
    padding: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1e293b",
    backgroundColor: "#f8fafc",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#e2e8f0",
  },
  updateButton: {
    backgroundColor: "#02c39a",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
});
