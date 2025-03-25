import { useState } from "react"
import { Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native"
import RazorpayCheckout from "react-native-razorpay"

const razorpay_key = "rzp_test_lhWJ5AoswKGJwh"

interface PricingPlan {
  id: string
  name: string
  price: number
  features: string[]
}

const pricingPlans: PricingPlan[] = [
  {
    id: "basic",
    name: "Basic Plan",
    price: 999,
    features: ["Feature 1", "Feature 2", "Feature 3"],
  },
  {
    id: "pro",
    name: "Pro Plan",
    price: 1999,
    features: ["All Basic Features", "Feature 4", "Feature 5"],
  },
  {
    id: "enterprise",
    name: "Enterprise Plan",
    price: 4999,
    features: ["All Pro Features", "Feature 6", "Feature 7", "Priority Support"],
  },
]

const Pricing = () => {
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null)

  const handleSelectPlan = (plan: PricingPlan) => {
    setSelectedPlan(plan)
  }

  const handlePayment = async (plan: PricingPlan) => {
    const options = {
      description: `${plan.name} - Credits towards consultation`,
      image: "https://i.imgur.com/3g7nmJC.jpg",
      currency: "INR",
      key: razorpay_key,
      amount: plan.price * 100,
      name: "Acme Corp",
      order_id: "",
      prefill: {
        email: "gaurav.kumar@example.com",
        contact: "8764296129",
        name: "Gaurav Kumar",
      },
      theme: { color: "#53a20e" },
    }

    try {
      const data = await RazorpayCheckout.open(options)
      alert(`Success: ${data.razorpay_payment_id}`)
     
      // Call Firebase function to store payment data
      await storePaymentData(data.razorpay_payment_id, plan)
    } catch (error: any) {
      alert(`Error: ${error.code} | ${error.description}`)
    }
  }

  const storePaymentData = async (paymentId: string, plan: PricingPlan) => {
    try {
      const response = await fetch("https://your-firebase-function-url.com/storePayment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId,
          planId: plan.id,
          planName: plan.name,
          amount: plan.price,
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to store payment data")
      }

      console.log("Payment data stored successfully")
    } catch (error) {
      console.error("Error storing payment data:", error)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Choose a Plan</Text>
      {pricingPlans.map((plan) => (
        <TouchableOpacity
          key={plan.id}
          style={[styles.planContainer, selectedPlan?.id === plan.id && styles.selectedPlan]}
          onPress={() => handleSelectPlan(plan)}
        >
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planPrice}>₹{plan.price}</Text>
          {plan.features.map((feature, index) => (
            <Text key={index} style={styles.featureText}>
              • {feature}
            </Text>
          ))}
        </TouchableOpacity>
      ))}
      {selectedPlan && (
        <TouchableOpacity style={styles.button} onPress={() => handlePayment(selectedPlan)}>
          <Text style={styles.buttonText}>Pay Now</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  planContainer: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  selectedPlan: {
    backgroundColor: "#e0e0e0",
    borderColor: "#007bff",
    borderWidth: 2,
  },
  planName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007bff",
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    marginBottom: 4,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    backgroundColor: "#007bff",
    marginTop: 16,
  },
  buttonText: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "bold",
    letterSpacing: 0.25,
    color: "white",
  },
})

export default Pricing

