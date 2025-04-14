// src/services/subscriptionService.ts
import { Alert, Platform } from 'react-native';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import PurchasesPaywallUI from 'react-native-purchases-ui';

// Initialize RevenueCat (call this once when your app starts)
export const initializeRevenueCat = async () => {
  try {
    const androidApiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID;
    const iosApiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS;
    
    if (!androidApiKey || !iosApiKey) {
      throw new Error('RevenueCat API keys are not properly configured');
    }
    
    const apiKey = Platform.OS === 'ios' ? iosApiKey : androidApiKey;
    
    await Purchases.configure({
      apiKey: apiKey
    });
  } catch (error) {
    console.error('Error initializing RevenueCat:', error);
  }
};

// Check if user has active subscription
export const checkSubscriptionStatus = async (): Promise<boolean> => {
  try {
    const customerInfo: CustomerInfo = await Purchases.getCustomerInfo();
    return Object.keys(customerInfo.entitlements.active).length > 0;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
};

// Show RevenueCat paywall
export const showPaywall = async (): Promise<boolean> => {
  try {
    await PurchasesPaywallUI.presentPaywall();
    // After paywall closes, check if user subscribed
    return await checkSubscriptionStatus();
  } catch (error) {
    console.error('Paywall error:', error);
    return false;
  }
};

// Get subscription details (optional)
export const getSubscriptionDetails = async () => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return {
      isSubscribed: Object.keys(customerInfo.entitlements.active).length > 0,
      activeEntitlements: customerInfo.entitlements.active,
      latestExpirationDate: customerInfo.latestExpirationDate
    };
  } catch (error) {
    console.error('Error getting subscription details:', error);
    return null;
  }
};