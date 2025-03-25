import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert, Image, TouchableOpacity, ScrollView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/utils/firebaseConfig";
import { updateMember } from "@/firebase/functions";
import Toast from "react-native-toast-message";
import { useAddMemberForm } from "@/hooks/useAddMemberForm";
import useStore from "@/hooks/store";
import { pickImage, pickImageSource } from "@/component/member/ImageUpload";
import { uploadImageToFirebase } from "@/firebase/helper";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker"

const UpdateMemberScreen = () => {
  const { id: memberId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
 
   const {
    control,
    handleSubmit,
    setValue,
    watch,
    showAdmissionDate,
    setShowAdmissionDate,
    showExpiryDate,
    setShowExpiryDate,
    isLoading,
    setIsLoading,
    plans,
  } = useAddMemberForm()
  const currentUser = useStore((state: any) => state.currentUser)
  const activeLibrary = useStore((state: any) => state.activeLibrary)

  useEffect(() => {
    async function fetchMemberData() {
      try {
        const docRef = doc(db, "members", memberId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setValue("fullName", data.fullName || "");
          setValue("contactNumber", data.contactNumber || "");
          setValue("email", data.email || "");
          setValue("totalAmount", data.totalAmount || "");
          setValue("paidAmount", data.paidAmount || "");
          setValue("discount", data.discount || "");
          setValue("dueAmount", data.dueAmount || "");
          setValue("address", data.address || "");
          setValue("profileImage", data.profileImage || "");
          setValue("document", data.document || "");
          setValue("admissionDate", data.addmissionDate.toDate() || "");
          setValue("expiryDate", data.expiryDate.toDate() || "");
          setValue("plan", data.plan || "");

        } else {
          Alert.alert("Error", "Member not found");
          router.back();
        }
      } catch (error) {
        console.error("Error fetching member:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMemberData();
  }, [memberId]);

  const onSubmit = async (formData: any) => {
    try {
      await updateMember({ memberId, data: formData });
       Toast.show({
        type: "success",
        text1: "Member added successfully",
      })
      router.back();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: error.message,
      })
    }
  };

    const handleImagePick = async (field: "profileImage" | "document") => {
    try {
      const source = await pickImageSource()
      const uri = await pickImage(source)
      if (uri) {
        setIsLoading(true)
        const uploadedUrl = await uploadImageToFirebase(uri)
        setValue(field, uploadedUrl)
      }
    } catch (error) {
      console.error("Upload failed", error)
    } finally {
      setIsLoading(false)
    }
  }

const formatDate = (date: any) => {
  if (date && typeof date.seconds === "number") {
    date = new Date(date.seconds * 1000); // Convert Firestore timestamp to JavaScript Date
  }

  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.error("Invalid date:", date);
    return "Invalid Date";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};



  const watchProfileImage = watch("profileImage")
  const watchDocument = watch("document")

  if (loading) return <ActivityIndicator size="large" color="#6B46C1" style={styles.loading} />;

  return (
   <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        {/* Name */}
        <Controller
          control={control}
          rules={{ required: "Name is required" }}
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="Full Name"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
              {error && <Text style={styles.errorText}>{error.message}</Text>}
            </View>
          )}
          name="fullName"
        />

        {/* Address */}
        <Controller
          control={control}
          rules={{ required: "Address is required" }}
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="Address"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
              {error && <Text style={styles.errorText}>{error.message}</Text>}
            </View>
          )}
          name="address"
        />

        {/* Contact Number */}
        <Controller
          control={control}
          rules={{ required: "Contact number is required" }}
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Number</Text>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="Contact Number"
                keyboardType="phone-pad"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
              {error && <Text style={styles.errorText}>{error.message}</Text>}
            </View>
          )}
          name="contactNumber"
        />

        {/* Email */}
        <Controller
          control={control}
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
              {error && <Text style={styles.errorText}>{error.message}</Text>}
            </View>
          )}
          name="email"
        />

        {/* Plan Selection */}
        <Controller
          control={control}
          rules={{ required: "Shift is required" }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Shift</Text>
              <View style={[styles.pickerContainer, error && styles.inputError]}>
                <Picker
                  selectedValue={value}
                  onValueChange={(itemValue, itemIndex) => {
                    onChange(itemValue)
                    setValue("planId", plans[itemIndex - 1]?.id || "")
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Shift" value="" />
                  {plans.map((plan) => (
                    <Picker.Item key={plan.id} label={plan.name} value={plan.name} />
                  ))}
                </Picker>
              </View>
              {error && <Text style={styles.errorText}>{error.message}</Text>}
            </View>
          )}
          name="plan"
        />

        {/* Total, Paid, and Due Amount */}
        <View style={styles.amountSection}>
          <View style={styles.amountRow}>
            <Controller
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputGroup, styles.flex1, styles.marginRight]}>
                  <Text style={styles.label}>Total Amount</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    keyboardType="numeric"
                    editable={false}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                </View>
              )}
              name="totalAmount"
            />

            <Controller
              control={control}
              rules={{ required: "Paid amount is required" }}
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <View style={[styles.inputGroup, styles.flex1]}>
                  <Text style={styles.label}>Paid Amount</Text>
                  <TextInput
                    style={[styles.input, error && styles.inputError]}
                    placeholder="00"
                    keyboardType="numeric"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                  {error && <Text style={styles.errorText}>{error.message}</Text>}
                </View>
              )}
              name="paidAmount"
            />
          </View>

          <View style={styles.amountRow}>
            <Controller
              control={control}
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <View style={[styles.inputGroup, styles.flex1, styles.marginRight]}>
                  <Text style={styles.label}>Discount</Text>
                  <TextInput
                    style={[styles.input, error && styles.inputError]}
                    placeholder="00"
                    keyboardType="numeric"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                  {error && <Text style={styles.errorText}>{error.message}</Text>}
                </View>
              )}
              name="discount"
            />

            <Controller
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputGroup, styles.flex1]}>
                  <Text style={styles.label}>Due Amount</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="00"
                    editable={false}
                    keyboardType="numeric"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                </View>
              )}
              name="dueAmount"
            />
          </View>
        </View>

        {/* Admission Date */}
        <Controller
          control={control}
          rules={{ required: "Admission date is required" }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Admission Date</Text>
              <TouchableOpacity
                style={[styles.dateButton, error && styles.inputError]}
                onPress={() => setShowAdmissionDate(true)}
              >
                <Text>{formatDate(value)}</Text>
              </TouchableOpacity>
              {showAdmissionDate && (
                <DateTimePicker
                  value={value}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, selectedDate) => {
                    setShowAdmissionDate(false)
                    if (selectedDate) {
                      onChange(selectedDate)
                    }
                  }}
                />
              )}
              {error && <Text style={styles.errorText}>{error.message}</Text>}
            </View>
          )}
          name="admissionDate"
        />

        {/* Expiry Date */}
        <Controller
          control={control}
          rules={{ required: "Expiry date is required" }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Expiry Date</Text>
              <TouchableOpacity
                style={[styles.dateButton, error && styles.inputError]}
                onPress={() => setShowExpiryDate(true)}
              >
                <Text>{formatDate(value)}</Text>
              </TouchableOpacity>
              {showExpiryDate && (
                <DateTimePicker
                  value={value}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, selectedDate) => {
                    setShowExpiryDate(false)
                    if (selectedDate) {
                      onChange(selectedDate)
                    }
                  }}
                />
              )}
              {error && <Text style={styles.errorText}>{error.message}</Text>}
            </View>
          )}
          name="expiryDate"
        />

        {/* Upload Buttons */}
        <View style={styles.uploadButtonsContainer}>
          <TouchableOpacity onPress={() => handleImagePick("profileImage")} disabled={isLoading}>
            <Text style={styles.uploadButtonText}>Upload Profile Image</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleImagePick("document")} disabled={isLoading}>
            <Text style={styles.uploadButtonText}>Upload Document</Text>
          </TouchableOpacity>
        </View>

        {/* Display Uploaded Files */}
        {isLoading && <ActivityIndicator size="large" color="#6d28d9" />}
        {watchProfileImage && (
          <View style={styles.uploadedFileContainer}>
            <Text style={styles.uploadedFileText}>Profile Image:</Text>
            <Image source={{ uri: watchProfileImage }} style={styles.uploadedImage} />
          </View>
        )}
        {watchDocument && (
          <View style={styles.uploadedFileContainer}>
            <Text style={styles.uploadedFileText}>Document:</Text>
            <Image source={{ uri: watchDocument }} style={styles.uploadedImage} />
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity onPress={handleSubmit(onSubmit)} disabled={isLoading} style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Update Member</Text>
        </TouchableOpacity>
      </View>
      <Toast />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffff", // Light purple background
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: "#6d28d9", // Dark purple button
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  uploadButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  uploadButtonText: {
    color: "#000",
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: "#000",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  inputError: {
    borderColor: "#ef4444",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  picker: {
    height: 50,
  },
  amountSection: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  amountItem: {
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
  dateButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  uploadedFileContainer: {
    marginTop: 10,
  },
  uploadedFileText: {
    fontSize: 14,
    color: "#6b7280",
  },
  uploadedFileLink: {
    fontSize: 14,
    color: "#6d28d9", // Dark purple link
    textDecorationLine: "underline",
  },
  uploadedImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginTop: 8,
  },
 
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  marginRight: {
    marginRight: 10,
  },
  flex1: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
})

export default UpdateMemberScreen;
