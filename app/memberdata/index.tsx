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
import { getMemberById, fetchAttendanceByMemberId, deleteMember, getMemberPlanHistory, extendMemberPlan, getPlans, fetchSeats } from "@/firebase/functions"
import { addMonthlyRent } from "@/firebase/hostel"
import Toast from "react-native-toast-message"
import WhatsAppModal from "@/component/member/WhatsappMessage"
import { generateAndShareInvoice } from "@/firebase/helper"
import DateTimePicker from "@react-native-community/datetimepicker"
import useStore from "@/hooks/store"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/utils/firebaseConfig"


interface MemberDetails {
  id: string
  fullName: string
  address: string
  contactNumber: string
  email: string
  addmissionDate: Date

  profession: string
  profileImage: string
  document: string

  advanceAmount: number

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
  roomType: string
  roomNumber: string
  rent: number
}



interface RentHistory {
  id: string;
  startDate: string;
  endDate: string;
  paidAmount: number;
  dueAmount: number;
  discount: number;
  paymentDate: Date;
  previousDueAmount: number;
  amountAppliedToDue: number;
  amountAppliedToNewRent: number;
  totalPaidAmount: number;
}

interface PaymentDetails {
  totalPaid: number;
  previousDueAmount: number;
  amountAppliedToDue: number;
  amountAppliedToNewRent: number;
  remainingDueAmount: number;
  newDueAmount: number;
  period: {
    startDate: string;
    endDate: string;
  };
}

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  memberName: string;
  membershipId: string;
  planName: string;
  amount: number;
  address: string;
  contactNumber: string;
  email: string;
  admissionDate: string;
  expiryDate: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  discount: number;
  advanceAmount: number;
  planHistory: {
    id: string;
    name: string;
    description: string;
    duration: string;
    amount: string;
    createdAt: Date;
  }[];
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
  const [showPlanHistory, setShowPlanHistory] = useState(false)

  const currentUser = useStore((state: any) => state.currentUser)
  const activeLibrary = useStore((state: any) => state.activeLibrary)
  const [discount, setDiscount] = useState<string>("0")
  const [paidAmount, setPaidAmount] = useState<string>("0")
  const [showRentModal, setShowRentModal] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [dueAmount, setDueAmount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rentHistory, setRentHistory] = useState<RentHistory[]>([])
  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)
  const [selectedStartDate, setSelectedStartDate] = useState(() => {
    return new Date(); // Today's date
  });

  const [selectedEndDate, setSelectedEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30); // 30 days from today
    return date;
  });

  const [latestRent, setLatestRent] = useState<RentHistory | null>(null)
  const [seatRent, setSeatRent] = useState<number>(0);

  const fetchRentHistory = async () => {
    try {
      if (!memberId) return
      
      const rentRef = collection(db, `tenants/${memberId}/rentPayments`)
      const q = query(rentRef, orderBy("paymentDate", "desc"))
      const querySnapshot = await getDocs(q)
      
      const history = querySnapshot.docs.map(doc => ({
        id: doc.id,
        startDate: doc.data().startDate,
        endDate: doc.data().endDate,
        paidAmount: doc.data().paidAmount,
        dueAmount: doc.data().dueAmount,
        discount: doc.data().discount || 0,
        paymentDate: doc.data().paymentDate.toDate(),
        previousDueAmount: doc.data().previousDueAmount || 0,
        amountAppliedToDue: doc.data().amountAppliedToDue || 0,
        amountAppliedToNewRent: doc.data().amountAppliedToNewRent || 0,
        totalPaidAmount: doc.data().totalPaidAmount || 0
      }))
      
      setRentHistory(history)
      // Set the latest rent payment
      if (history.length > 0) {
        setLatestRent(history[0])
      }
    } catch (error) {
      console.error("Error fetching rent history:", error)
      Toast.show({
        type: "error",
        text1: "Failed to fetch rent history",
      })
    }
  }

  const fetchSeatRent = async () => {
    try {
      const seats = await fetchSeats({ currentUser, libraryId: activeLibrary.id });
      const memberSeat = seats.find((seat: Seat) => seat.allocatedTo === memberId);
      if (memberSeat) {
        setSeatRent(memberSeat.rent);
      }
    } catch (error) {
      console.error("Error fetching seat rent:", error);
    }
  };

  const fetchMemberData = async () => {
    try {
      if (memberId) {
        const fetchedMember = await getMemberById({ id: memberId })
        setMember(fetchedMember)

        const fetchedAttendance = await fetchAttendanceByMemberId(memberId)
        setAttendanceData(fetchedAttendance)

        const seats = await fetchSeats({ currentUser, libraryId: activeLibrary.id });
        const memberSeat = seats.find(seat => seat.allocatedTo === memberId);
        if (memberSeat) {
          setSeat(memberSeat);
        }

        await fetchRentHistory()
        await fetchSeatRent()
      }
    } catch (error) {
      console.error("Error fetching member data in MemberDetails:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMemberData()
  }, [memberId])


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



   const handlePrintInvoice = async (rent: any) => {
    try {
      if (!member) return;

      const invoiceData: InvoiceData = {
        invoiceNumber: `RENT-${rent.id.slice(-6)}`,
        date: rent.paymentDate.toLocaleDateString(),
        memberName: member.fullName,
        membershipId: member.id,
        planName: seat?.roomType || 'Standard Room',
        amount: rent.paidAmount + rent.dueAmount,
        address: member.address,
        contactNumber: member.contactNumber,
        email: member.email,
        admissionDate: member.addmissionDate.toLocaleDateString(),
        expiryDate: rent.endDate,
        totalAmount: rent.paidAmount + rent.dueAmount,
        paidAmount: rent.paidAmount,
        dueAmount: rent.dueAmount,
        discount: rent.discount || 0,
        advanceAmount: member.advanceAmount || 0,
        planHistory: [{
          id: rent.id,
          name: seat?.roomType || 'Standard Room',
          description: `Room ${seat?.roomNumber || 'N/A'}`,
          duration: `${rent.startDate} - ${rent.endDate}`,
          amount: (rent.paidAmount + rent.dueAmount).toString(),
          createdAt: rent.paymentDate
        }]
      }

      await generateAndShareInvoice(invoiceData)
    } catch (error) {
      console.error("Error handling invoice print:", error)
      Toast.show({
        type: "error",
        text1: "Failed to generate invoice",
        text2: "Please try again later",
      })
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleAddRent = async () => {
    try {
      if (!memberId) return;
      
      if (!paidAmount || Number(paidAmount) <= 0) {
        Toast.show({
          type: "error",
          text1: "Please enter a valid paid amount",
        });
        return;
      }

      // Format dates for storage
      const formattedStartDate = selectedStartDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      const formattedEndDate = selectedEndDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      setIsSubmitting(true);
      
      const result = await addMonthlyRent({
        memberId,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        paidAmount: Number(paidAmount),
        dueAmount: Number(dueAmount) || 0,
        discount: Number(discount) || 0,
      });

      if (result.success) {
        const { paymentDetails } = result;
        
        // Show payment summary alert
        Alert.alert(
          "Payment Summary",
          `Total Paid: ₹${paymentDetails.totalPaid}
Previous Due: ₹${paymentDetails.previousDueAmount}
Amount Applied to Due: ₹${paymentDetails.amountAppliedToDue}
Amount Applied to New Rent: ₹${paymentDetails.amountAppliedToNewRent}
Remaining Due: ₹${paymentDetails.remainingDueAmount}
Period: ${formattedStartDate} - ${formattedEndDate}`,
          [
            {
              text: "Print Invoice",
              onPress: () => handlePrintInvoice({
                ...paymentDetails,
                memberName: member?.fullName,
                contactNumber: member?.contactNumber,
                address: member?.address,
              }),
            },
            {
              text: "OK",
              style: "cancel",
            },
          ]
        );

        // Reset form
        setPaidAmount("0");
        setDueAmount("0");
        setDiscount("0");
        setShowRentModal(false);
        
        // Refresh rent history
        await fetchRentHistory();
        
        Toast.show({
          type: "success",
          text1: "Rent payment added successfully",
        });
      }
    } catch (error) {
      console.error("Error adding rent:", error);
      Toast.show({
        type: "error",
        text1: "Failed to add rent payment",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setSelectedStartDate(selectedDate);
      // Set end date to 30 days after the selected start date
      const newEndDate = new Date(selectedDate);
      newEndDate.setDate(newEndDate.getDate() + 30);
      setSelectedEndDate(newEndDate);
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      // Ensure end date is not before start date
      if (selectedDate < selectedStartDate) {
        Toast.show({
          type: "error",
          text1: "End date cannot be before start date",
        });
        return;
      }
      setSelectedEndDate(selectedDate);
    }
  };

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
            label="Room"
            value={[seat.roomNumber, seat.seatId].join(" - ")}
            icon={<MaterialIcons name="chair" size={16} color="#02c39a" />}
          />
          
        ) : (
          <DetailRow label="Room" value="N/A" icon={<MaterialIcons name="chair" size={16} color="#02c39a" />} />
        )}
         {seat ? (
          <DetailRow
            label="Room Rent"
            value={seat.rent}
            icon={<MaterialIcons name="chair" size={16} color="#02c39a" />}
          />
          
        ) : (
          <DetailRow label="Room Rent" value="N/A" icon={<MaterialIcons name="money" size={16} color="#02c39a" />} />
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

      {/* Rent History Section */}
      <TouchableOpacity style={styles.card} onPress={() => setShowPlanHistory(!showPlanHistory)}>
        <View style={styles.reportHeader}>
          <Text style={styles.reportTitle}>Rent History</Text>
          <AntDesign name={showPlanHistory ? "up" : "down"} size={20} color="#02c39a" />
        </View>
        {showPlanHistory && (
          <View style={styles.planHistoryContainer}>
            {rentHistory.length > 0 ? (
              rentHistory.map((rent, index) => (
                <View key={rent.id} style={styles.planHistoryItem}>
                  <View style={styles.planHistoryHeader}>
                    <Text style={styles.planHistoryName}>Rent Payment</Text>
                    <Text style={styles.planHistoryDate}>
                      {rent.paymentDate.toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.planHistoryDetails}>
                    <Text style={styles.planHistoryDetail}>Period: {rent.startDate} - {rent.endDate}</Text>
                    <Text style={styles.planHistoryDetail}>Amount: ₹{rent.paidAmount}</Text>
                  </View>
                  <View style={styles.planHistoryDetails}>
                    <Text style={styles.planHistoryDetail}>Discount: ₹{rent.discount}</Text>
                    <Text style={[styles.planHistoryDetail, styles.dueAmount]}>Due: ₹{rent.dueAmount}</Text>
                  </View>
                  {index < rentHistory.length - 1 && <View style={styles.planHistoryDivider} />}
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No rent history available</Text>
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
        <TouchableOpacity style={styles.gymPlanButton} onPress={() => setShowRentModal(true)}>
          <Text style={styles.gymPlanButtonText}>Add Rent</Text>
        </TouchableOpacity>
      </View>

      {/* Rent Modal */}
      <Modal
        visible={showRentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRentModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Monthly Rent</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Start Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text>{formatDate(selectedStartDate)}</Text>
              </TouchableOpacity>
              {showStartDatePicker && (
                <DateTimePicker
                  value={selectedStartDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleStartDateChange}
                  minimumDate={new Date()} // Can't select past dates
                />
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>End Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text>{formatDate(selectedEndDate)}</Text>
              </TouchableOpacity>
              {showEndDatePicker && (
                <DateTimePicker
                  value={selectedEndDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleEndDateChange}
                  minimumDate={selectedStartDate} // Can't select date before start date
                />
              )}
            </View>

            <View style={styles.amountSection}>
              <View style={styles.amountRow}>
                <View style={[styles.inputGroup, styles.flex1, styles.marginRight]}>
                  <Text style={styles.amountLabel}>Paid Amount *</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="Enter amount"
                    keyboardType="numeric"
                    value={paidAmount}
                    onChangeText={setPaidAmount}
                  />
                </View>

                <View style={[styles.inputGroup, styles.flex1]}>
                  <Text style={styles.amountLabel}>Discount</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="Enter discount"
                    keyboardType="numeric"
                    value={discount}
                    onChangeText={setDiscount}
                  />
                </View>
              </View>

              <View style={styles.amountRow}>
                <View style={[styles.inputGroup, styles.flex1]}>
                  <Text style={styles.amountLabel}>Due Amount</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="Enter due amount"
                    keyboardType="numeric"
                    value={dueAmount}
                    onChangeText={setDueAmount}
                  />
                </View>
              </View>
            </View>

            <Text style={styles.requiredField}>* Required fields</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowRentModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddRent}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Add Rent</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rent Details */}
      <View style={styles.card}>
        <Text style={styles.planName}>Latest Rent Payment</Text>
        <View style={styles.planGrid}>
          <View style={styles.planColumn}>
            <Text style={styles.planLabel}>Start Date</Text>
            <Text style={styles.planValue}>{latestRent?.startDate || "Not Available"}</Text>
            <Text style={styles.planLabel}>Paid Amount</Text>
            <Text style={styles.planValue}>₹{latestRent?.paidAmount || "0"}</Text>
            <Text style={styles.planLabel}>Payment Date</Text>
            <Text style={styles.planValue}>{latestRent?.paymentDate.toLocaleDateString() || "Not Available"}</Text>
          </View>
          <View style={styles.planColumn}>
            <Text style={styles.planLabel}>End Date</Text>
            <Text style={styles.planValue}>{latestRent?.endDate || "Not Available"}</Text>
            <Text style={styles.planLabel}>Discount</Text>
            <Text style={styles.planValue}>₹{latestRent?.discount || "0"}</Text>
            <Text style={[styles.planLabel, styles.dueAmount]}>Due Amount</Text>
            <Text style={[styles.planValue, styles.dueAmount]}>₹{latestRent?.dueAmount || "0"}</Text>
          </View>
        </View>
      </View>

      {/* Bill Table */}
      <View style={styles.card}>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderCell}>Payment Date</Text>
            <Text style={styles.tableHeaderCell}>Invoice No.</Text>
            <Text style={styles.tableHeaderCell}>Period</Text>
            <Text style={styles.tableHeaderCell}>Amount</Text>
            <Text style={styles.tableHeaderCell}>Print Bill</Text>
          </View>
          {rentHistory.length > 0 ? (
            rentHistory.map((rent) => (
              <View key={rent.id} style={styles.tableRow}>
                <Text style={styles.tableCell}>{rent.paymentDate.toLocaleDateString()}</Text>
                <Text style={styles.tableCell}>RENT-{rent.id.slice(-6)}</Text>
                <Text style={styles.tableCell}>{rent.startDate} - {rent.endDate}</Text>
                <Text style={styles.tableCell}>₹{rent.paidAmount}</Text>
                <TouchableOpacity onPress={() => handlePrintInvoice(rent)}>
                  <Text style={[styles.tableCell, styles.printButton]}>Print</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.noDataText]}>No rent payments found</Text>
            </View>
          )}
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
    flex: 5,
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
    marginTop: 4,
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
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  requiredField: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: -10,
    marginBottom: 10,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    padding: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
})

export default MemberDetails

