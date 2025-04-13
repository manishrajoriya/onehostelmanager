import type React from "react"
import { useEffect, useState } from "react"
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Modal,
  Alert,
  Linking,
  TextInput,
  
  Platform,
} from "react-native"
import { Picker } from "@react-native-picker/picker";
import { useRouter, useLocalSearchParams } from "expo-router"
import { AntDesign, MaterialIcons } from "@expo/vector-icons"
import { getMemberById, fetchSeatByMemberId, fetchAttendanceByMemberId, deleteMember, getMemberPlanHistory, extendMemberPlan, getPlans } from "@/firebase/functions"
import Toast from "react-native-toast-message"
import WhatsAppModal from "@/component/member/WhatsappMessage"
import { generateAndShareInvoice } from "@/firebase/helper"
import DateTimePicker from "@react-native-community/datetimepicker"
import useStore from "@/hooks/store"


interface MemberDetails {
  id: string
  fullName: string
  address: string
  contactNumber: string
  email: string
  addmissionDate: Date
  expiryDate: Date
  status: string
  seatNumber: string
  profileImage: string
  document: string
  dueAmount: number
  totalAmount: number
  paidAmount: number
  discount: number
  advanceAmount: number
  planId: string
  plan: string
}

interface DetailRowProps {
  label: string
  value: string | number
  icon?: React.ReactNode
}

interface Attendance {
  id: string
  date: string
  status: boolean
}

interface Seat {
  id: string
  seatId: string
  isAllocated: boolean
  allocatedTo: string
  memberName: string
  memberExpiryDate: Date
}

interface PlanHistory {
  id: string;
  name: string;
  description: string;
  duration: string;
  amount: string;
  createdAt: Date;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  duration: string;
  amount: string;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, icon }) => (
  <View style={styles.detailRow}>
    {icon && <View style={styles.detailIcon}>{icon}</View>}
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value || "NA"}</Text>
  </View>
)

const MemberDetails: React.FC = () => {
  const router = useRouter()
  const params = useLocalSearchParams()
  const memberId = params.id as string | undefined
  const [member, setMember] = useState<MemberDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAttendance, setShowAttendance] = useState(false)
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([])
  const [seat, setSeat] = useState<Seat | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [modalImage, setModalImage] = useState<string | null>(null)
  const [isImageLoading, setIsImageLoading] = useState(false)
  const [imageLoadError, setImageLoadError] = useState(false)
  const [isWhatsAppModalVisible, setIsWhatsAppModalVisible] = useState(false)
  const [messageTemplates, setMessageTemplates] = useState<string[]>([])
  const [planHistory, setPlanHistory] = useState<PlanHistory[]>([])
  const [showPlanHistory, setShowPlanHistory] = useState(false)
  const [showPlanPicker, setShowPlanPicker] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string>("")
  const [selectedPlanId, setSelectedPlanId] = useState<string>("")
  const [newExpiryDate, setNewExpiryDate] = useState<Date>(new Date())
  const [plans, setPlans] = useState<Plan[]>([])
  const [isExtending, setIsExtending] = useState(false)
  const currentUser = useStore((state: any) => state.currentUser)
  const activeLibrary = useStore((state: any) => state.activeLibrary)
  const [discount, setDiscount] = useState<string>("0")
  const [paidAmount, setPaidAmount] = useState<string>("0")

  const fetchMemberData = async () => {
    try {
      if (memberId) {
        const fetchedMember = await getMemberById({ id: memberId })
        setMember(fetchedMember)

        const fetchedAttendance = await fetchAttendanceByMemberId(memberId)
        setAttendanceData(fetchedAttendance)

        const fetchedSeat = await fetchSeatByMemberId(memberId)
        setSeat(fetchedSeat[0])

        const fetchedPlanHistory = await getMemberPlanHistory({ memberId })
        setPlanHistory(fetchedPlanHistory)
      }
    } catch (error) {
      console.error("Error fetching member data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMemberData()
  }, [memberId])

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const fetchedPlans = await getPlans({ currentUser, libraryId: activeLibrary.id })
        setPlans(fetchedPlans)
      } catch (error) {
        console.error("Error fetching plans:", error)
      }
    }
    fetchPlans()
  }, [currentUser, activeLibrary.id])

  const handleMemberDelete = async () => {
    try {
      Alert.alert(
        "Delete Member",
        "Are you sure you want to delete this member?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            onPress: async () => {
              await deleteMember({ id: member?.id! })
              Toast.show({
                type: "success",
                text1: "Member deleted successfully",
              })
              // Navigation
              setTimeout(() => {
                router.back()
              }, 500)
            },
            style: "destructive",
          },
        ],
        { cancelable: true },
      )
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: error.message,
      })
    }
  }

  const handleMemberUpdate = () => {
    router.push(`/editMember?id=${memberId}`)
  }


  const handleSendWhatsAppMessage = (message: string) => {
    const whatsappUrl = `whatsapp://send?phone=${91}${member?.contactNumber}&text=${encodeURIComponent(message)}`
    Linking.openURL(whatsappUrl).catch((err) => console.error("An error occurred", err))
    setIsWhatsAppModalVisible(false)
  }



   const handlePrintInvoice = async () => {
    if (!member) return

    try {
      await generateAndShareInvoice({
        invoiceNumber: "INV1", // You might want to generate this dynamically
        date: new Date().toLocaleDateString(),
        memberName: member.fullName,
        membershipId: member.id,
        planName: member.plan,
        amount: member.paidAmount,
        // Additional member details
        address: member.address,
        contactNumber: member.contactNumber,
        email: member.email,
        admissionDate: member.addmissionDate.toDateString(),
        expiryDate: member.expiryDate.toDateString(),
        totalAmount: member.totalAmount,
        paidAmount: member.paidAmount,
        dueAmount: member.dueAmount,
        discount: member.discount,
        advanceAmount: member.advanceAmount,
        planHistory: planHistory.map(plan => ({
          id: plan.id,
          name: plan.name,
          description: plan.description,
          duration: plan.duration,
          amount: plan.amount,
          createdAt: plan.createdAt
        }))
      })
    } catch (error) {
      console.error("Error handling invoice print:", error)
      Toast.show({
        type: "error",
        text1: "Failed to generate invoice",
        text2: "Please try again later",
      })
    }
  }

  const handleExtendPlan = async () => {
    if (!selectedPlan || !selectedPlanId) {
      Toast.show({
        type: "error",
        text1: "Please select a plan",
      })
      return
    }

    try {
      setIsExtending(true)
      const selectedPlanData = plans.find(plan => plan.id === selectedPlanId)
      const planAmount = Number(selectedPlanData?.amount || "0")
      const discountAmount = Number(discount || "0")
      const paidAmountValue = Number(paidAmount || "0")
      const totalAmount = planAmount - discountAmount
      const dueAmount = totalAmount - paidAmountValue
      
      await extendMemberPlan({
        memberId: member?.id!,
        newPlanId: selectedPlanId,
        newPlan: selectedPlan,
        newExpiryDate,
        additionalAmount: totalAmount,
        discount: discountAmount,
        paidAmount: paidAmountValue,
        dueAmount: dueAmount
      })

      Toast.show({
        type: "success",
        text1: "Plan extended successfully",
      })

      // Refresh member data
      await fetchMemberData()
      
      // Reset form
      setSelectedPlan("")
      setSelectedPlanId("")
      setNewExpiryDate(new Date())
      setDiscount("0")
      setPaidAmount("0")
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: error.message || "Failed to extend plan",
      })
    } finally {
      setIsExtending(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#02c39a" />
      </View>
    )
  }

  if (!member) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>No data available</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      {/* Gradient Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            setModalImage(member.profileImage)
            setIsModalVisible(true)
          }}
        >
          {
            member.profileImage ? <Image source={{ uri: member.profileImage }} style={styles.avatar} /> : <View style={styles.avatar} />
          }
        </TouchableOpacity>
        <View style={styles.profileInfo}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.headerValue}>{member.fullName}</Text>
          <Text style={styles.label}>Address</Text>
          <Text style={styles.headerValue}>{member.address}</Text>
          <Text style={styles.label}>Contact Number:</Text>
          <Text style={styles.headerValue}>{member.contactNumber}</Text>
        </View>
      </View>

      {/* Member Details Card */}
      <View style={styles.card}>
        <DetailRow
          label="Membership ID"
          value={member.id}
          icon={<MaterialIcons name="perm-identity" size={16} color="#02c39a" />}
        />
        <DetailRow
          label="Admission Date"
          value={member.addmissionDate.toDateString()}
          icon={<MaterialIcons name="event" size={16} color="#02c39a" />}
        />
        <DetailRow label="Email" value={member.email} icon={<MaterialIcons name="email" size={16} color="#02c39a" />} />
        {seat ? (
          <DetailRow
            label="Seat Number"
            value={seat.seatId}
            icon={<MaterialIcons name="chair" size={16} color="#02c39a" />}
          />
        ) : (
          <DetailRow label="Seat Number" value="N/A" icon={<MaterialIcons name="chair" size={16} color="#02c39a" />} />
        )}
      </View>

      {/* Attendance Report */}
      <TouchableOpacity style={styles.card} onPress={() => setShowAttendance(!showAttendance)}>
        <View style={styles.reportHeader}>
          <Text style={styles.reportTitle}>Attendance Report</Text>
          <AntDesign name={showAttendance ? "up" : "down"} size={20} color="#02c39a" />
        </View>
        {showAttendance && (
          <View style={styles.attendanceContainer}>
            {attendanceData.length > 0 ? (
              attendanceData.map((attendance) => (
                <View key={attendance.id} style={styles.attendanceRow}>
                  <Text style={styles.attendanceDate}>{attendance.date}</Text>
                  <Text style={styles.attendanceStatus}>{attendance.status ? "Present" : "Absent"}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No attendance records found</Text>
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* Documents Section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Documents:</Text>
        {member.document ? (
          <TouchableOpacity
            onPress={() => {
              setModalImage(member.document)
              setIsModalVisible(true)
            }}
          >
            <Image style={styles.documentImage} source={{ uri: member.document }} />
          </TouchableOpacity>
        ) : (
          <Text style={styles.noDataText}>:( Not Found</Text>
        )}
      </View>

      {/* Plan History Section */}
      <TouchableOpacity style={styles.card} onPress={() => setShowPlanHistory(!showPlanHistory)}>
        <View style={styles.reportHeader}>
          <Text style={styles.reportTitle}>Plan History</Text>
          <AntDesign name={showPlanHistory ? "up" : "down"} size={20} color="#02c39a" />
        </View>
        {showPlanHistory && (
          <View style={styles.planHistoryContainer}>
            {planHistory.length > 0 ? (
              planHistory.map((plan, index) => (
                <View key={`${plan.id}-${plan.createdAt.getTime()}`} style={styles.planHistoryItem}>
                  <View style={styles.planHistoryHeader}>
                    <Text style={styles.planHistoryName}>{plan.name}</Text>
                    <Text style={styles.planHistoryDate}>
                      {plan.createdAt.toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.planHistoryDescription}>{plan.description}</Text>
                  <View style={styles.planHistoryDetails}>
                    <Text style={styles.planHistoryDetail}>Duration: {plan.duration}</Text>
                    <Text style={styles.planHistoryDetail}>Amount: ₹{plan.amount}</Text>
                  </View>
                  {index < planHistory.length - 1 && <View style={styles.planHistoryDivider} />}
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No plan history available</Text>
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.addOnPlanButton} onPress={handleMemberDelete}>
          <Text style={styles.addOnPlanButtonText}>Delete Member</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addOnPlanButton} onPress={() => setIsWhatsAppModalVisible(true)}>
          <Text style={styles.addOnPlanButtonText}>Message</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.gymPlanButton} onPress={handleMemberUpdate}>
          <Text style={styles.gymPlanButtonText}>Update Member</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.gymPlanButton} onPress={() => setShowPlanPicker(true)}>
          <Text style={styles.gymPlanButtonText}>Extend Plan</Text>
        </TouchableOpacity>
        </View>

      {/* Plan Details */}
      <View style={styles.card}>
        <Text style={styles.planName}>{member.plan}</Text>
        <View style={styles.planGrid}>
          <View style={styles.planColumn}>
            <Text style={styles.planLabel}>Start Date</Text>
            <Text style={styles.planValue}>{member.addmissionDate.toDateString()}</Text>
            <Text style={styles.planLabel}>Plan Amount</Text>
            <Text style={styles.planValue}>{member.totalAmount}</Text>
            <Text style={styles.planLabel}>Final Amount</Text>
            <Text style={styles.planValue}>{member.totalAmount}</Text>
            <Text style={styles.planLabel}>Paid Amount</Text>
            <Text style={styles.planValue}>{member.paidAmount}</Text>
          </View>
          <View style={styles.planColumn}>
            <Text style={styles.planLabel}>End Date</Text>
            <Text style={styles.planValue}>{member.expiryDate.toDateString()}</Text>
            <Text style={styles.planLabel}>Discount</Text>
            <Text style={styles.planValue}>{member.discount || "00"}</Text>
            <Text style={styles.planLabel}>Advance Amount</Text>
            <Text style={styles.planValue}>{member.advanceAmount || "00"}</Text>
            <Text style={[styles.planLabel, styles.dueAmount]}>Due Amount</Text>
            <Text style={[styles.planValue, styles.dueAmount]}>{member.dueAmount}</Text>
          </View>
        </View>
      </View>

      {/* Bill Table */}
      <View style={styles.card}>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderCell}>Bill Date</Text>
            <Text style={styles.tableHeaderCell}>Invoice No.</Text>
            <Text style={styles.tableHeaderCell}>Paid Amount</Text>
            <Text style={styles.tableHeaderCell}>Print Bill</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>{member.addmissionDate.toDateString()}</Text>
            <Text style={styles.tableCell}>INV1</Text>
            <Text style={styles.tableCell}>{member.paidAmount}</Text>
            <TouchableOpacity onPress={handlePrintInvoice}>
              <Text style={[styles.tableCell, styles.printButton]}>Print</Text>
            </TouchableOpacity>
          </View> 
        </View>
      </View>
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setIsModalVisible(false)
              setImageLoadError(false)
            }}
          >
            <AntDesign name="closecircleo" size={24} color="white" />
          </TouchableOpacity>
          {modalImage && (
            <>
              {isImageLoading && <ActivityIndicator size="large" color="#ffffff" />}
              {imageLoadError ? (
                <Text style={styles.errorText}>Failed to load image</Text>
              ) : (
                <Image
                  source={{ uri: modalImage }}
                  style={styles.fullSizeImage}
                  resizeMode="contain"
                  onLoadStart={() => setIsImageLoading(true)}
                  onLoadEnd={() => setIsImageLoading(false)}
                  onError={() => {
                    setIsImageLoading(false)
                    setImageLoadError(true)
                  }}
                />
              )}
            </>
          )}
        </View>
      </Modal>
      <WhatsAppModal
        isVisible={isWhatsAppModalVisible}
        onClose={() => setIsWhatsAppModalVisible(false)}
        onSend={handleSendWhatsAppMessage}
        contactNumber={member?.contactNumber || ""}
      />
      <Modal
        visible={showPlanPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPlanPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Extend Plan</Text>
            
            {/* Plan Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Select Plan</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedPlan}
                  onValueChange={(itemValue: string, itemIndex: number) => {
                    setSelectedPlan(itemValue)
                    setSelectedPlanId(plans[itemIndex - 1]?.id || "")
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Plan" value="" />
                  {plans.map((plan) => (
                    <Picker.Item key={plan.id} label={plan.name} value={plan.name} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Amount Section */}
            <View style={styles.amountSection}>
              <View style={styles.amountRow}>
                <View style={[styles.inputGroup, styles.flex1, styles.marginRight]}>
                  <Text style={styles.amountLabel}>Plan Amount</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    keyboardType="numeric"
                    editable={false}
                    value={selectedPlanId ? plans.find(p => p.id === selectedPlanId)?.amount || "0" : "0"}
                  />
                </View>

                <View style={[styles.inputGroup, styles.flex1]}>
                  <Text style={styles.amountLabel}>Discount</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="00"
                    keyboardType="numeric"
                    value={discount}
                    onChangeText={(value) => setDiscount(value)}
                  />
                </View>
              </View>

              <View style={styles.amountRow}>
                <View style={[styles.inputGroup, styles.flex1]}>
                  <Text style={styles.amountLabel}>Paid Amount</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="00"
                    keyboardType="numeric"
                    value={paidAmount}
                    onChangeText={(value) => setPaidAmount(value)}
                  />
                </View>

                <View style={[styles.inputGroup, styles.flex1]}>
                  <Text style={[styles.amountLabel, styles.dueAmount]}>Due Amount</Text>
                  <TextInput
                    style={[styles.amountInput, styles.dueAmount]}
                    placeholder="00"
                    keyboardType="numeric"
                    editable={false}
                    value={(
                      Number(selectedPlanId ? plans.find(p => p.id === selectedPlanId)?.amount || "0" : "0") -
                      Number(discount || "0") -
                      Number(paidAmount || "0")
                    ).toString()}
                  />
                </View>
              </View>
            </View>

            {/* Expiry Date Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Expiry Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text>{newExpiryDate.toLocaleDateString()}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={newExpiryDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false)
                    if (selectedDate) {
                      setNewExpiryDate(selectedDate)
                    }
                  }}
                />
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowPlanPicker(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleExtendPlan}
                disabled={isExtending}
              >
                {isExtending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Extend Plan</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Toast />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#02c39a",
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#02c39a",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileInfo: {
    marginLeft: 20,
    flex: 1,
  },
  headerValue: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500",
  },
  label: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    marginBottom: 2,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    margin: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailIcon: {
    marginRight: 10,
  },
  detailLabel: {
    color: "#666",
    flex: 1,
    fontSize: 14,
  },
  detailValue: {
    color: "#333",
    fontSize: 14,
    fontWeight: "500",
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reportTitle: {
    color: "#02c39a",
    fontSize: 16,
    fontWeight: "500",
  },
  attendanceContainer: {
    marginTop: 10,
  },
  attendanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  attendanceDate: {
    color: "#666",
    fontSize: 14,
  },
  attendanceStatus: {
    color: "#333",
    fontSize: 14,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
    color: "#333",
  },
  noDataText: {
    color: "#666",
    fontStyle: "italic",
  },
  documentImage: {
    width: "100%",
    height: 200,
    resizeMode: "contain",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    margin: 10,
  },
  gymPlanButton: {
    backgroundColor: "#02c39a",
    padding: 15,
    borderRadius: 12,
    flex: 1,
    marginRight: 5,
    alignItems: "center",
  },
  addOnPlanButton: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    flex: 1,
    marginLeft: 5,
    borderWidth: 1,
    borderColor: "#02c39a",
    alignItems: "center",
  },
  gymPlanButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  addOnPlanButtonText: {
    color: "#02c39a",
    fontSize: 16,
    fontWeight: "500",
  },
  planName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    color: "#333",
  },
  planGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  planColumn: {
    flex: 1,
  },
  planLabel: {
    color: "#666",
    marginBottom: 5,
    fontSize: 14,
  },
  planValue: {
    color: "#333",
    marginBottom: 15,
    fontSize: 14,
    fontWeight: "500",
  },
  dueAmount: {
    color: "#ff0000",
  },
  table: {
    borderRadius: 8,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
  },
  tableHeaderCell: {
    flex: 1,
    padding: 12,
    fontWeight: "500",
    textAlign: "center",
    fontSize: 14,
    color: "#333",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
  },
  tableCell: {
    flex: 1,
    padding: 12,
    textAlign: "center",
    fontSize: 14,
    color: "#666",
  },
  printButton: {
    color: "#02c39a",
    fontWeight: "500",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  inputGroup: {
    marginBottom: 20,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  picker: {
    height: 50,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
  },
  confirmButton: {
    backgroundColor: "#02c39a",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  fullSizeImage: {
    width: "100%",
    height: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 1,
  },
  errorText: {
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
  },
  planHistoryContainer: {
    marginTop: 10,
  },
  planHistoryItem: {
    paddingVertical: 12,
  },
  planHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planHistoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  planHistoryDate: {
    fontSize: 14,
    color: '#666',
  },
  planHistoryDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  planHistoryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  planHistoryDetail: {
    fontSize: 14,
    color: '#666',
  },
  planHistoryDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
  amountSection: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4b5563",
    marginBottom: 4,
  },
  amountInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
  },
  marginRight: {
    marginRight: 10,
  },
  flex1: {
    flex: 1,
  },
})

export default MemberDetails

