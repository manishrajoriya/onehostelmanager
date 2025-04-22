import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView
} from 'react-native';
import Purchases, { 
  PurchasesError, 
  CustomerInfo, 
  PurchasesEntitlementInfo 
} from 'react-native-purchases';
import  PurchasesPaywallUI  from 'react-native-purchases-ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface SubscriptionState {
  isSubscribed: boolean;
  currentPlanName: string | null;
  expiryDate: string | null;
  loading: boolean;
  isRestoring: boolean;
}

const SubscriptionScreen: React.FC = () => {
  const [state, setState] = useState<SubscriptionState>({
    isSubscribed: false,
    currentPlanName: null,
    expiryDate: null,
    loading: true,
    isRestoring: false
  });

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const customerInfo: CustomerInfo = await Purchases.getCustomerInfo();
      
      // Check if user has any active subscriptions
      const entitlements = customerInfo.entitlements.active;
      if (Object.keys(entitlements).length > 0) {
        // Get the name of the current plan
        const planName = Object.keys(entitlements)[0];
        
        // Get expiry date if available
        let formattedExpiryDate: string | null = null;
        const expiryDateMs = customerInfo.latestExpirationDate;
        if (expiryDateMs) {
          const date = new Date(expiryDateMs);
          formattedExpiryDate = date.toLocaleDateString();
        }

        setState(prev => ({
          ...prev,
          isSubscribed: true,
          currentPlanName: planName,
          expiryDate: formattedExpiryDate
        }));
      } else {
        setState(prev => ({
          ...prev,
          isSubscribed: false,
          currentPlanName: null,
          expiryDate: null
        }));
      }
    } catch (error) {
      console.error("Error checking subscription status:", error);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleShowPaywall = async (): Promise<void> => {
    try {
      // This will open RevenueCat's prebuilt paywall UI
      const customerInfo  = await PurchasesPaywallUI.presentPaywall();
      
      // Check if purchase was successful
      await checkSubscriptionStatus();
    } catch (error) {
      const purchasesError = error as PurchasesError;
      console.error("Paywall error:", purchasesError);
      
      // Don't show error for user cancellation
      if (purchasesError.code !== Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        Alert.alert("Error", "There was an issue with the paywall. Please try again.");
      }
    }
  };

  const handleRestorePurchases = async (): Promise<void> => {
    setState(prev => ({ ...prev, isRestoring: true }));
    try {
      const customerInfo: CustomerInfo = await Purchases.restorePurchases();
      
      // Check if restore was successful
      await checkSubscriptionStatus();
      
      const entitlements = customerInfo.entitlements.active;
      if (Object.keys(entitlements).length > 0) {
        Alert.alert("Success", "Your purchases have been restored!");
      } else {
        Alert.alert("No Purchases", "No previous purchases were found to restore.");
      }
    } catch (error) {
      console.error("Error restoring purchases:", error);
      Alert.alert("Restore Failed", "There was an error restoring your purchases. Please try again.");
    } finally {
      setState(prev => ({ ...prev, isRestoring: false }));
    }
  };

  const handleOpenPolicy = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', 'Could not open the link');
    }
  };

  const renderCurrentSubscription = (): React.ReactNode => {
    return (
      <View style={styles.currentSubscriptionContainer}>
        <Ionicons name="shield-checkmark" size={40} color="#4CAF50" />
        <Text style={styles.subscribedTitle}>You're subscribed!</Text>
        <Text style={styles.subscribedPlan}>Current plan: {state.currentPlanName}</Text>
        {state.expiryDate && (
          <Text style={styles.subscribedExpiry}>Renews on: {state.expiryDate}</Text>
        )}
        <Text style={styles.subscribedMessage}>
          Thank you for your support. Enjoy all the premium features!
        </Text>
      </View>
    );
  };

  const renderFeatureItem = (feature: string, index: number): React.ReactNode => {
    return (
      <View key={index} style={styles.featureItem}>
        <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
        <Text style={styles.featureText}>{feature}</Text>
      </View>
    );
  };

  const renderPolicySection = () => {
    return (
      <View style={styles.policyButtonsContainer}>
        <Text style={styles.policySectionTitle}>Policies & Information</Text>
        
        <View style={styles.policyContent}>
          <Text style={styles.policyTitle}>Terms of Service</Text>
          <Text style={styles.policyText}>
            By using this application, you agree to these terms. The app is provided "as is" without any warranties. 
            We reserve the right to modify these terms at any time. Your continued use of the app constitutes acceptance of any changes.
          </Text>

          <Text style={styles.policyTitle}>Privacy Policy</Text>
          <Text style={styles.policyText}>
            We collect and process your data in accordance with applicable laws. We use your information to provide and improve our services. 
            We do not sell your personal information to third parties. You can request deletion of your data at any time.
          </Text>

          <Text style={styles.policyTitle}>Subscription Terms</Text>
          <Text style={styles.policyText}>
            • Subscriptions are billed on a recurring basis
            {'\n'}• You can choose between monthly and annual subscription plans
            {'\n'}• All subscription plans include access to all premium features
            {'\n'}• Subscription prices are subject to change with notice
          </Text>

         
          <Text style={styles.policyTitle}>Cancellation Policy</Text>
          <Text style={styles.policyText}>
            • You can cancel your subscription anytime through Google Play
            {'\n'}• Cancellation takes effect at the end of the current billing period
            {'\n'}• You will continue to have access to premium features until the end of your current period
            {'\n'}• No partial refunds for cancelled subscriptions
          </Text>

          <Text style={styles.policyTitle}>Refund Policy</Text>
          <Text style={styles.policyText}>
            • Refunds are subject to Google Play's refund policy
            {'\n'}• Refund requests must be made within 48 hours of purchase
            {'\n'}• Contact Onelibrary01@gmail.com for refund requests
          </Text>

        
        </View>
      </View>
    );
  };

  if (state.loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Checking subscription status...</Text>
      </SafeAreaView>
    );
  }

  const premiumFeatures: string[] = [
    "Access to all content",
    "Add Unlimited Members",
    "Add 20+ Hostels",
    "Always Access to stored data",
    "Priority customer support"
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.contentContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Premium Access</Text>
            <Text style={styles.headerSubtitle}>Unlock all features with a subscription</Text>
          </View>

          {state.isSubscribed ? (
            renderCurrentSubscription()
          ) : (
            <View style={styles.subscribeContainer}>
              <View style={styles.featuresContainer}>
                <Text style={styles.featuresTitle}>Premium Features</Text>
                {premiumFeatures.map(renderFeatureItem)}
              </View>

              <TouchableOpacity
                style={styles.purchaseButton}
                onPress={handleShowPaywall}
              >
                <Text style={styles.purchaseButtonText}>View Subscription Options</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
            disabled={state.isRestoring}
          >
            {state.isRestoring ? (
              <ActivityIndicator size="small" color="#666" />
            ) : (
              <Text style={styles.restoreButtonText}>Restore Purchases</Text>
            )}
          </TouchableOpacity>

          <View style={styles.policiesContainer}>
            <Text style={styles.termsText}>
              By subscribing, you agree to our Terms of Service and Privacy Policy.
            </Text>
            <Text style={styles.subscriptionTerms}>
              • You can manage your subscription in your Google Play account settings
              {'\n'}• Payment will be charged to your Google Play account at confirmation of purchase
              {'\n'}• You can cancel your subscription anytime through your Google Play account settings
              {'\n'}• Refunds are subject to Google Play's refund policy
            </Text>
          </View>

          {renderPolicySection()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  subscribeContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  featuresContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  purchaseButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  restoreButton: {
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  restoreButtonText: {
    fontSize: 16,
    color: '#666',
    textDecorationLine: 'underline',
  },
  termsText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  currentSubscriptionContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  subscribedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  subscribedPlan: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subscribedExpiry: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  subscribedMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  policyButtonsContainer: {
    marginTop: 20,
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  policySectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  policyContent: {
    padding: 10,
  },
  policyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 5,
  },
  policyText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  policiesContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  subscriptionTerms: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
    lineHeight: 18,
  },
});

export default SubscriptionScreen;