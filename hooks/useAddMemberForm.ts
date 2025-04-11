import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { getPlans, getPlanById } from "@/firebase/functions"
import type { FormData, PlanData } from "@/types/MemberProfile"
import useStore from "./store"

export const useAddMemberForm = () => {
  const { control, handleSubmit, setValue, watch } = useForm<FormData>({
    defaultValues: {
      fullName: "",
      address: "",
      contactNumber: "",
      email: "",
      plan: "",
      totalAmount: "",
      paidAmount: "",
      advancePayment: "",
      dueAmount: "",
      discount: "",
      profileImage: "",
      document: "",
      admissionDate: new Date(),
      expiryDate: new Date(),
      status: "active",
      seatNumber: "",
      planId: "",
    },
  })

  const [showAdmissionDate, setShowAdmissionDate] = useState(false)
  const [showExpiryDate, setShowExpiryDate] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [plans, setPlans] = useState<PlanData[]>([])
  const [selectedPlan, setSelectedPlan] = useState<PlanData | null>(null)

  const currentUser = useStore((state: any) => state.currentUser);
  const activeLibrary = useStore((state: any) => state.activeLibrary);

  // Watch for changes in relevant fields
  const watchPlan = watch("plan")
  const watchPaidAmount = watch("paidAmount")
  const watchDiscount = watch("discount")
  const watchTotalAmount = watch("totalAmount")
  const watchAdvancePayment = watch("advancePayment")

  // Calculate due amount (excluding advance payment)
  const calculateDueAmount = () => {
    const total = parseFloat(watchTotalAmount) || 0
    const paid = parseFloat(watchPaidAmount) || 0
    const discount = parseFloat(watchDiscount) || 0
    const due = total - paid - discount
    setValue("dueAmount", due.toString())
  }

  // Update due amount when relevant fields change
  useEffect(() => {
    calculateDueAmount()
  }, [watchTotalAmount, watchPaidAmount, watchDiscount])

  useEffect(() => {
    const fetchPlansData = async () => {
      try {
        const plansData = await getPlans({ libraryId: activeLibrary.id, currentUser })
        setPlans(plansData)
      } catch (error) {
        console.error("Error fetching plans:", error)
      }
    }
    fetchPlansData()
  }, [currentUser, activeLibrary.id])

  useEffect(() => {
    const planId = watch("planId")
    if (planId) {
      const fetchPlan = async () => {
        const planData = await getPlanById({ id: planId })
        setSelectedPlan(planData)
        setValue("totalAmount", planData.amount)
      }
      fetchPlan()
    }
  }, [watch("planId"), setValue]) // Added setValue to dependencies

  useEffect(() => {
    const admissionDate = watch("admissionDate")
    const planDuration = selectedPlan ? Number.parseInt(selectedPlan.duration) : 0
    if (admissionDate && planDuration) {
      const expiryDate = new Date(admissionDate)
      expiryDate.setDate(expiryDate.getDate() + planDuration)
      setValue("expiryDate", expiryDate)
    }
  }, [watch("admissionDate"), selectedPlan, setValue]) // Added setValue to dependencies

  return {
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
    selectedPlan,
  }
}

