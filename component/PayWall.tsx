import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert
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
    "Unlimited downloads",
    "Ad-free experience",
    "Early access to new features",
    "Priority customer support"
  ];

  return (
    <SafeAreaView style={styles.container}>
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

        <Text style={styles.termsText}>
          By subscribing, you agree to our Terms of Service and Privacy Policy.
          Subscriptions will automatically renew unless canceled at least 24 hours before the end of the current period.
        </Text>
      </View>
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
});

export default SubscriptionScreen;