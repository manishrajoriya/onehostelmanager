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
     
      advanceAmount: "",
      profileImage: "",
      document: "",
      admissionDate: new Date(),
      profession: "",
    },
  })

  const [showAdmissionDate, setShowAdmissionDate] = useState(false)
  const [showExpiryDate, setShowExpiryDate] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [plans, setPlans] = useState<PlanData[]>([])
  const [selectedPlan, setSelectedPlan] = useState<PlanData | null>(null)

  const currentUser = useStore((state: any) => state.currentUser);
  const activeLibrary = useStore((state: any) => state.activeLibrary);

  useEffect(() => {
    const fetchPlans = async () => {
      const plansData = await getPlans({libraryId: activeLibrary.id, currentUser})
      setPlans(plansData)
    }
    fetchPlans()
  }, [])



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

